/**
 * Centralized Typography System for AutoCare
 * Primary Font: Poppins (via @expo-google-fonts/poppins)
 */

export const FONTS = {
    regular: "Poppins_400Regular",     // Teks biasa (400)
    medium: "Poppins_500Medium",       // Label dan menu (500)
    semiBold: "Poppins_600SemiBold",   // Tombol dan subjudul (600)
    bold: "Poppins_700Bold",           // Judul halaman (700)
    extraBold: "Poppins_800ExtraBold", // Heading khusus (800)
};

/**
 * Returns the appropriate Poppins font family based on weight or style intent
 */
export function getFontFamily(weight = "400") {
    switch (String(weight).toLowerCase()) {
        case "800":
        case "900":
        case "extrabold":
        case "heavy":
            return FONTS.extraBold;
        case "700":
        case "bold":
            return FONTS.bold;
        case "600":
        case "semibold":
            return FONTS.semiBold;
        case "500":
        case "medium":
            return FONTS.medium;
        case "400":
        case "normal":
        case "regular":
        default:
            return FONTS.regular;
    }
}

/**
 * Reusable Typography Presets for Consistent UI
 */
export const typography = {
    // 1. Heading Khusus (Poppins_800ExtraBold)
    headingHero: {
        fontFamily: FONTS.extraBold,
        fontWeight: "800",
        fontSize: 26,
        lineHeight: 34,
    },
    headingLarge: {
        fontFamily: FONTS.extraBold,
        fontWeight: "800",
        fontSize: 22,
        lineHeight: 30,
    },

    // 2. Judul Halaman (Poppins_700Bold)
    headingPage: {
        fontFamily: FONTS.bold,
        fontWeight: "700",
        fontSize: 18,
        lineHeight: 26,
    },
    headingSection: {
        fontFamily: FONTS.bold,
        fontWeight: "700",
        fontSize: 16,
        lineHeight: 24,
    },

    // 3. Tombol dan Subjudul (Poppins_600SemiBold)
    subheading: {
        fontFamily: FONTS.semiBold,
        fontWeight: "600",
        fontSize: 15,
        lineHeight: 22,
    },
    subheadingSmall: {
        fontFamily: FONTS.semiBold,
        fontWeight: "600",
        fontSize: 13,
        lineHeight: 18,
    },
    buttonText: {
        fontFamily: FONTS.semiBold,
        fontWeight: "600",
        fontSize: 14,
        lineHeight: 20,
    },
    buttonTextSmall: {
        fontFamily: FONTS.semiBold,
        fontWeight: "600",
        fontSize: 12,
        lineHeight: 16,
    },

    // 4. Label dan Menu (Poppins_500Medium)
    label: {
        fontFamily: FONTS.medium,
        fontWeight: "500",
        fontSize: 13,
        lineHeight: 18,
    },
    menuItem: {
        fontFamily: FONTS.medium,
        fontWeight: "500",
        fontSize: 14,
        lineHeight: 20,
    },
    tabItem: {
        fontFamily: FONTS.medium,
        fontWeight: "500",
        fontSize: 11,
        lineHeight: 15,
    },

    // 5. Teks Biasa (Poppins_400Regular)
    body: {
        fontFamily: FONTS.regular,
        fontWeight: "400",
        fontSize: 14,
        lineHeight: 20,
    },
    bodySmall: {
        fontFamily: FONTS.regular,
        fontWeight: "400",
        fontSize: 12,
        lineHeight: 17,
    },
    input: {
        fontFamily: FONTS.regular,
        fontWeight: "400",
        fontSize: 14,
        lineHeight: 20,
    },
    caption: {
        fontFamily: FONTS.regular,
        fontWeight: "400",
        fontSize: 11,
        lineHeight: 15,
    },
    badge: {
        fontFamily: FONTS.semiBold,
        fontWeight: "600",
        fontSize: 11,
        lineHeight: 15,
    },
};

export default {
    FONTS,
    getFontFamily,
    typography,
};
