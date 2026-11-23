const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const ROOT_DIR = path.resolve(__dirname, "../src");

function getTargetFont(fw) {
    if (!fw) return "Poppins_400Regular";
    const s = String(fw).toLowerCase().trim();
    if (s === "800" || s === "900" || s === "extrabold") {
        return "Poppins_800ExtraBold";
    }
    if (s === "700" || s === "bold") {
        return "Poppins_700Bold";
    }
    if (s === "600" || s === "semibold") {
        return "Poppins_600SemiBold";
    }
    if (s === "500" || s === "medium") {
        return "Poppins_500Medium";
    }
    return "Poppins_400Regular";
}

const TEXT_NAME_REGEX = /(text|title|subtitle|subheading|heading|label|caption|badge|chip|desc|sub|placeholder|input|price|btntext|buttontext|headertext|th|td|val|link)/i;

function isTextStyle(keyName, properties) {
    let hasTextProp = false;
    let hasColor = false;
    let fw = null;

    properties.forEach((p) => {
        if (p.type === "ObjectProperty" && p.key) {
            const k = p.key.name || p.key.value;
            if (
                k === "fontSize" ||
                k === "fontWeight" ||
                k === "fontStyle" ||
                k === "letterSpacing" ||
                k === "lineHeight" ||
                k === "textAlign" ||
                k === "textTransform" ||
                k === "textDecorationLine"
            ) {
                hasTextProp = true;
                if (k === "fontWeight") {
                    fw = p.value.value || p.value.name;
                }
            }
            if (k === "color") hasColor = true;
        }
    });

    if (hasTextProp) return { isText: true, fw };

    // If key name indicates text and has color or is input
    if (TEXT_NAME_REGEX.test(keyName) && (hasColor || /input/i.test(keyName))) {
        return { isText: true, fw: null };
    }

    return { isText: false, fw: null };
}

function processFile(filePath, dryRun = true) {
    const code = fs.readFileSync(filePath, "utf8");
    let ast;
    try {
        ast = parser.parse(code, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
        });
    } catch (err) {
        console.error("Parse error in " + filePath + ":", err.message);
        return { file: filePath, changes: 0 };
    }

    const insertions = []; // { start, end, replacement }

    traverse(ast, {
        CallExpression(path) {
            if (
                path.node.callee &&
                path.node.callee.object &&
                path.node.callee.object.name === "StyleSheet" &&
                path.node.callee.property &&
                path.node.callee.property.name === "create"
            ) {
                const arg = path.node.arguments[0];
                if (arg && arg.type === "ObjectExpression") {
                    arg.properties.forEach((prop) => {
                        if (
                            prop.type === "ObjectProperty" &&
                            prop.value &&
                            prop.value.type === "ObjectExpression"
                        ) {
                            const keyName = prop.key.name || prop.key.value;
                            const styleObj = prop.value;
                            const { isText, fw } = isTextStyle(keyName, styleObj.properties);

                            if (isText) {
                                const targetFont = getTargetFont(fw);

                                // Check if fontFamily is already defined
                                const existingFontProp = styleObj.properties.find(
                                    (p) => p.type === "ObjectProperty" && (p.key.name === "fontFamily" || p.key.value === "fontFamily")
                                );

                                if (existingFontProp) {
                                    // Replace existing
                                    insertions.push({
                                        start: existingFontProp.start,
                                        end: existingFontProp.end,
                                        replacement: `fontFamily: "${targetFont}"`,
                                    });
                                } else {
                                    // Insert after '{'
                                    // Determine indentation from first property or object start
                                    let indent = "        ";
                                    if (styleObj.properties.length > 0) {
                                        const firstProp = styleObj.properties[0];
                                        const lineStart = code.lastIndexOf("\n", firstProp.start);
                                        if (lineStart !== -1) {
                                            const matchIndent = code.substring(lineStart + 1, firstProp.start).match(/^\s*/);
                                            if (matchIndent) indent = matchIndent[0];
                                        }
                                    }

                                    const openBraceIndex = code.indexOf("{", styleObj.start);
                                    if (openBraceIndex !== -1 && openBraceIndex < styleObj.end) {
                                        insertions.push({
                                            start: openBraceIndex + 1,
                                            end: openBraceIndex + 1,
                                            replacement: `\n${indent}fontFamily: "${targetFont}",`,
                                        });
                                    }
                                }
                            }
                        }
                    });
                }
            }
        },
    });

    if (insertions.length === 0) {
        return { file: filePath, changes: 0 };
    }

    // Sort insertions in reverse order so character offsets remain valid
    insertions.sort((a, b) => b.start - a.start);

    let newCode = code;
    for (const ins of insertions) {
        newCode = newCode.slice(0, ins.start) + ins.replacement + newCode.slice(ins.end);
    }

    if (!dryRun) {
        fs.writeFileSync(filePath, newCode, "utf8");
    }

    return { file: filePath, changes: insertions.length };
}

function run(dryRun = true) {
    function walk(dir) {
        let results = [];
        fs.readdirSync(dir).forEach((file) => {
            const full = path.join(dir, file);
            if (fs.statSync(full).isDirectory()) {
                results = results.concat(walk(full));
            } else if (file.endsWith(".js") || file.endsWith(".jsx")) {
                results.push(full);
            }
        });
        return results;
    }

    const files = walk(ROOT_DIR);
    console.log(`Processing ${files.length} files in ${ROOT_DIR} (dryRun: ${dryRun})...`);

    let totalChanges = 0;
    let modifiedFiles = 0;

    files.forEach((f) => {
        // Skip .bak files
        if (f.endsWith(".bak")) return;
        const res = processFile(f, dryRun);
        if (res.changes > 0) {
            modifiedFiles++;
            totalChanges += res.changes;
            console.log(`- ${path.relative(ROOT_DIR, f)}: ${res.changes} text styles updated`);
        }
    });

    console.log(`\nDone! Total ${totalChanges} font families injected across ${modifiedFiles} files.`);
}

const isLive = process.argv.includes("--apply");
run(!isLive);
