import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";

import {
    ActivityIndicator,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import { API_URL } from "../config";

export default function Login() {
    const { width, height } = useWindowDimensions();

    // Desktop mulai dari 900px
    const isDesktop = Platform.OS === "web" && width >= 900;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [ingatSaya, setIngatSaya] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let isMounted = true;
        AsyncStorage.getItem("autocare_user").then((userData) => {
            if (!isMounted) return;
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    if (parsed && (parsed.id || parsed.email)) {
                        if (parsed.role === "admin") {
                            router.replace("/admin");
                        } else {
                            router.replace("/home");
                        }
                    }
                } catch (_) {}
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogin = async () => {
        setErrorMessage("");

        if (!email.trim() || !password) {
            setErrorMessage("Email/no HP dan password wajib diisi.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password: password,
                }),
            });

            const text = await response.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch {
                setErrorMessage("Server mengembalikan response yang tidak valid.");
                return;
            }

            if (!response.ok || !data.success) {
                setErrorMessage(data.message || "Email atau password salah.");
                return;
            }

            if (!data.user) {
                setErrorMessage("Data pengguna tidak ditemukan.");
                return;
            }

            await AsyncStorage.setItem("autocare_user", JSON.stringify(data.user));

            if (data.user.foto) {
                await AsyncStorage.setItem("autocare_profile_photo", data.user.foto);
            } else {
                await AsyncStorage.removeItem("autocare_profile_photo");
            }

            if (data.user.role === "admin") {
                router.replace("/admin");
            } else {
                router.replace("/home");
            }
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMessage("Tidak dapat terhubung ke server.");
        } finally {
            setLoading(false);
        }
    };

    /*
    ============================================================
    DESKTOP (Tetap seperti kode awal kamu)
    ============================================================
    */
    if (isDesktop) {
        return (
            <KeyboardAvoidingView
                style={styles.desktopContainer}
                behavior={undefined}
            >
                <Stack.Screen options={{ headerShown: false }} />

                <ImageBackground
                    source={require("../../assets/images/autocare-login-desktop.png")}
                    style={styles.desktopLeft}
                    imageStyle={styles.desktopLeftImage}
                >
                    <View style={styles.leftCircleOne} />
                    <View style={styles.leftCircleTwo} />
                    <View style={styles.leftCircleThree} />

                    <View style={styles.leftGrid}>
                        {Array.from({ length: 9 }).map((_, index) => (
                            <View
                                key={`left-v-${index}`}
                                style={[
                                    styles.gridVertical,
                                    { left: `${index * 12.5}%` },
                                ]}
                            />
                        ))}
                        {Array.from({ length: 7 }).map((_, index) => (
                            <View
                                key={`left-h-${index}`}
                                style={[
                                    styles.gridHorizontal,
                                    { top: `${index * 16}%` },
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.leftOverlay} />

                    <ScrollView
                        style={styles.desktopLeftScroll}
                        contentContainerStyle={[
                            styles.desktopLeftContent,
                            { minHeight: height },
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <BlurView
                            intensity={55}
                            tint="dark"
                            style={styles.desktopLoginCard}
                        >
                            <View style={styles.desktopGlassInner}>
                                <View style={styles.desktopLogoBox}>
                                    <Image
                                        source={require("../../assets/images/autocare-logo.png")}
                                        style={styles.desktopLogo}
                                        resizeMode="contain"
                                    />
                                </View>

                                <Text style={styles.desktopTitle}>Selamat Datang</Text>
                                <Text style={styles.desktopSubtitle}>
                                    Masuk ke akun AutoCare Anda
                                </Text>

                                {errorMessage ? (
                                    <View style={styles.desktopErrorBox}>
                                        <Ionicons
                                            name="alert-circle-outline"
                                            size={18}
                                            color="#B00000"
                                        />
                                        <Text style={styles.desktopErrorText}>
                                            {errorMessage}
                                        </Text>
                                    </View>
                                ) : null}

                                <Text style={styles.desktopInputLabel}>Email / No. HP</Text>
                                <View style={styles.desktopInputContainer}>
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color="#777777"
                                    />
                                    <TextInput
                                        style={styles.desktopInput}
                                        placeholder="Masukkan Email atau no. HP"
                                        placeholderTextColor="#999999"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                        returnKeyType="next"
                                        onSubmitEditing={() => {
                                            if (password) handleLogin();
                                        }}
                                    />
                                </View>

                                <Text
                                    style={[
                                        styles.desktopInputLabel,
                                        { marginTop: 15 },
                                    ]}
                                >
                                    Password
                                </Text>
                                <View style={styles.desktopInputContainer}>
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color="#777777"
                                    />
                                    <TextInput
                                        style={styles.desktopInput}
                                        placeholder="Masukkan password"
                                        placeholderTextColor="#999999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="go"
                                        onSubmitEditing={handleLogin}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.passwordEye}
                                    >
                                        <Ionicons
                                            name={
                                                showPassword
                                                    ? "eye-outline"
                                                    : "eye-off-outline"
                                            }
                                            size={20}
                                            color="#777777"
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.desktopOptionRow}>
                                    <Pressable
                                        style={styles.rememberContainer}
                                        onPress={() => setIngatSaya(!ingatSaya)}
                                    >
                                        <View
                                            style={[
                                                styles.checkbox,
                                                ingatSaya && styles.checkboxActive,
                                            ]}
                                        >
                                            {ingatSaya && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </View>
                                        <Text style={styles.rememberText}>Ingat saya</Text>
                                    </Pressable>

                                    <TouchableOpacity
                                        onPress={() => router.push("/lupa-password")}
                                    >
                                        <Text style={styles.desktopForgot}>
                                            Lupa password?
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.desktopLoginButton,
                                        loading && styles.loginButtonDisabled,
                                    ]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.desktopLoginText}>
                                                Masuk
                                            </Text>
                                            <Ionicons
                                                name="arrow-forward"
                                                size={19}
                                                color="#FFFFFF"
                                            />
                                        </>
                                    )}
                                </TouchableOpacity>

                                <View style={styles.desktopOrContainer}>
                                    <View style={styles.desktopOrLine} />
                                    <Text style={styles.desktopOrText}>atau</Text>
                                    <View style={styles.desktopOrLine} />
                                </View>

                                <TouchableOpacity
                                    style={styles.desktopGoogleButton}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.googleG}>G</Text>
                                    <Text style={styles.googleText}>
                                        Masuk dengan Google
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.desktopRegister}>
                                    <Text style={styles.desktopRegisterText}>
                                        Belum punya akun?
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => router.push("/daftar")}
                                    >
                                        <Text style={styles.desktopRegisterLink}>
                                            Daftar
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.desktopFooter}>
                                    AutoCare • Vehicle Service
                                </Text>
                            </View>
                        </BlurView>
                    </ScrollView>
                </ImageBackground>

                <ImageBackground
                    source={require("../../assets/images/autocare-banner.png")}
                    style={styles.desktopRight}
                    imageStyle={styles.desktopRightImage}
                >
                    <View style={styles.rightOverlay} />
                    <View style={styles.rightCircleOne} />
                    <View style={styles.rightCircleTwo} />

                    <View style={styles.rightContent}>
                        <View style={styles.brandLogoBox}>
                            <Image
                                source={require("../../assets/images/autocare-logo.png")}
                                style={styles.brandLogo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.brandTitle}>AutoCare</Text>
                        <Text style={styles.brandSubtitle}>
                            Solusi Service Kendaraan
                        </Text>
                        <Text style={styles.brandSubtitle}>
                            Lebih Mudah & Terpercaya
                        </Text>
                        <View style={styles.brandLine} />
                        <Text style={styles.brandDescription}>
                            Kelola kendaraan, booking service, dan pantau riwayat
                            perawatan kendaraan Anda dalam satu aplikasi.
                        </Text>
                    </View>

                    <Text style={styles.brandCopyright}>© 2026 AutoCare</Text>
                </ImageBackground>
            </KeyboardAvoidingView>
        );
    }

    /*
    ============================================================
    MOBILE (Disesuaikan dengan Desain Gambar)
    ============================================================
    */
    const isFormFilled = email.trim().length > 0 && password.length > 0;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Dekorasi Lingkaran Merah Besar di Pojok Kanan Atas */}
                <View style={styles.topRedCircle} />

                {/* Lingkaran Putih Logo dengan Shadow */}
                <View style={styles.logoWrapper}>
                    <Image
                        source={require("../../assets/images/autocare-logo.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Form Area */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Selamat Datang</Text>
                    <Text style={styles.subtitle}>
                        Masuk ke akun anda untuk melanjutkan
                    </Text>

                    {/* Pesan Error */}
                    {errorMessage ? (
                        <View style={styles.errorBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={18}
                                color="#B30000"
                            />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    {/* Input Email / No. Handphone */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#8E96A4"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email/No. Handphone"
                            placeholderTextColor="#8E96A4"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            returnKeyType="next"
                        />
                    </View>

                    {/* Input Password */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#8E96A4"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#8E96A4"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="go"
                            onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color="#8E96A4"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Lupa Password */}
                    <TouchableOpacity
                        style={styles.forgotWrapper}
                        onPress={() => router.push("/lupa-password")}
                    >
                        <Text style={styles.forgotText}>Lupa password?</Text>
                    </TouchableOpacity>

                    {/* Tombol Masuk (Abu-abu saat kosong, Merah saat terisi) */}
                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            isFormFilled && styles.loginButtonActive,
                            loading && styles.loginButtonDisabled,
                        ]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>Masuk</Text>
                        )}
                    </TouchableOpacity>

                    {/* Footer Daftar */}
                    <View style={styles.registerRow}>
                        <Text style={styles.registerText}>Belum punya akun? </Text>
                        <TouchableOpacity onPress={() => router.push("/daftar")}>
                            <Text style={styles.registerLink}>Daftar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    /* ================= MOBILE STYLES (SESUAI GAMBAR) ================= */
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        flexGrow: 1,
        backgroundColor: "#FFFFFF",
        paddingBottom: 40,
    },
    topRedCircle: {
        position: "absolute",
        top: -155,
        right: -95,
        width: 390,
        height: 390,
        borderRadius: 195,
        backgroundColor: "#B30000", // Merah marun AutoCare
    },
    logoWrapper: {
        width: 118,
        height: 118,
        borderRadius: 59,
        backgroundColor: "#FFFFFF",
        alignSelf: "center",
        marginTop: 120,
        justifyContent: "center",
        alignItems: "center",
        // Shadow lembut untuk Android & iOS
        elevation: 6,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
    },
    logo: {
        width: 92,
        height: 92,
    },
    formContainer: {
        paddingHorizontal: 28,
        marginTop: 52,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#000000",
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 13.5,
        color: "#5C6370",
        marginTop: 4,
        marginBottom: 28,
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF0F0",
        borderWidth: 1,
        borderColor: "#FFCCCC",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        color: "#B30000",
        fontSize: 13,
        flex: 1,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 50,
        borderWidth: 1.2,
        borderColor: "#636B78",
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 16,
        backgroundColor: "#FFFFFF",
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 14.5,
        color: "#1F2937",
        height: "100%",
    },
    forgotWrapper: {
        alignSelf: "flex-end",
        marginTop: -6,
        marginBottom: 42,
    },
    forgotText: {
        color: "#B30000",
        fontSize: 12,
        fontWeight: "500",
    },
    loginButton: {
        height: 48,
        borderRadius: 10,
        backgroundColor: "#B3B3B3", // Abu-abu default seperti di gambar
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
    },
    loginButtonActive: {
        backgroundColor: "#B30000", // Berubah merah saat form diisi
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 15.5,
        fontWeight: "600",
    },
    registerRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 48,
    },
    registerText: {
        fontSize: 13.5,
        color: "#4B5563",
    },
    registerLink: {
        fontSize: 13.5,
        fontWeight: "700",
        color: "#B30000",
    },

    /* ================= DESKTOP STYLES ================= */
    desktopContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
    },
    desktopLeft: {
        flex: 1,
    },
    desktopLeftImage: {
        resizeMode: "cover",
    },
    leftCircleOne: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: "rgba(179,0,0,0.18)",
        top: -80,
        left: -80,
    },
    leftCircleTwo: {
        position: "absolute",
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: "rgba(255,255,255,0.06)",
        bottom: -60,
        right: -40,
    },
    leftCircleThree: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(179,0,0,0.14)",
        top: "45%",
        right: 40,
    },
    leftGrid: {
        ...StyleSheet.absoluteFillObject,
    },
    gridVertical: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    gridHorizontal: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    leftOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(15,15,18,0.55)",
    },
    desktopLeftScroll: {
        flex: 1,
    },
    desktopLeftContent: {
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    desktopLoginCard: {
        width: "100%",
        maxWidth: 430,
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.22)",
    },
    desktopGlassInner: {
        padding: 32,
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    desktopLogoBox: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 16,
    },
    desktopLogo: {
        width: 54,
        height: 54,
    },
    desktopTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
    },
    desktopSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        marginTop: 4,
        marginBottom: 22,
    },
    desktopErrorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFEBEB",
        padding: 10,
        borderRadius: 10,
        marginBottom: 14,
        gap: 8,
    },
    desktopErrorText: {
        color: "#B00000",
        fontSize: 13,
        flex: 1,
    },
    desktopInputLabel: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 6,
    },
    desktopInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        gap: 10,
    },
    desktopInput: {
        flex: 1,
        fontSize: 14,
        color: "#222222",
    },
    passwordEye: {
        padding: 4,
    },
    desktopOptionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 14,
        marginBottom: 20,
    },
    rememberContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxActive: {
        backgroundColor: "#B30000",
        borderColor: "#B30000",
    },
    checkmark: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    rememberText: {
        color: "#FFFFFF",
        fontSize: 13,
    },
    desktopForgot: {
        color: "#FFD6D6",
        fontSize: 13,
        fontWeight: "600",
    },
    desktopLoginButton: {
        height: 48,
        borderRadius: 12,
        backgroundColor: "#B30000",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    desktopLoginText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    desktopOrContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 18,
        gap: 10,
    },
    desktopOrLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.25)",
    },
    desktopOrText: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 13,
    },
    desktopGoogleButton: {
        height: 46,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    googleG: {
        fontSize: 18,
        fontWeight: "800",
        color: "#DB4437",
    },
    googleText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#222222",
    },
    desktopRegister: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 5,
        marginTop: 20,
    },
    desktopRegisterText: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
    },
    desktopRegisterLink: {
        color: "#FFD6D6",
        fontSize: 13,
        fontWeight: "700",
    },
    desktopFooter: {
        textAlign: "center",
        color: "rgba(255,255,255,0.55)",
        fontSize: 12,
        marginTop: 18,
    },
    desktopRight: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    desktopRightImage: {
        resizeMode: "cover",
    },
    rightOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(130,0,0,0.82)",
    },
    rightCircleOne: {
        position: "absolute",
        width: 340,
        height: 340,
        borderRadius: 170,
        backgroundColor: "rgba(255,255,255,0.06)",
        top: -90,
        right: -90,
    },
    rightCircleTwo: {
        position: "absolute",
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: "rgba(0,0,0,0.18)",
        bottom: -70,
        left: -70,
    },
    rightContent: {
        alignItems: "center",
        maxWidth: 420,
    },
    brandLogoBox: {
        width: 96,
        height: 96,
        borderRadius: 28,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    brandLogo: {
        width: 72,
        height: 72,
    },
    brandTitle: {
        fontSize: 36,
        fontWeight: "800",
        color: "#FFFFFF",
        marginBottom: 8,
    },
    brandSubtitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "rgba(255,255,255,0.92)",
        textAlign: "center",
    },
    brandLine: {
        width: 60,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#FFFFFF",
        marginVertical: 20,
    },
    brandDescription: {
        fontSize: 15,
        color: "rgba(255,255,255,0.85)",
        textAlign: "center",
        lineHeight: 22,
    },
    brandFeatures: {
        marginTop: 20,
    },
    brandCopyright: {
        position: "absolute",
        bottom: 24,
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
    },
});