import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";

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
                            router.replace("/admin/dashboard");
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

            // Simpan token autentikasi jika tersedia dari server
            if (data.token) {
                await AsyncStorage.setItem("autocare_token", data.token);
            }

            await AsyncStorage.setItem("autocare_user", JSON.stringify(data.user));

            if (data.user.foto) {
                await AsyncStorage.setItem("autocare_profile_photo", data.user.foto);
            } else {
                await AsyncStorage.removeItem("autocare_profile_photo");
            }

            // Pengalihan berdasarkan role akun yang terverifikasi backend
            if (data.user.role === "admin") {
                if (data.token) {
                    await AsyncStorage.setItem("autocare_admin_token", data.token);
                }
                await AsyncStorage.setItem("autocare_admin_user", JSON.stringify(data.user));
                router.replace("/admin/dashboard");
            } else {
                // Bersihkan sesi admin lama jika login sebagai user biasa
                await AsyncStorage.multiRemove(["autocare_admin_token", "autocare_admin_user"]);
                router.replace("/home");
            }
        } catch (error) {
            console.error("Login Error:", error);
            setErrorMessage("Tidak dapat terhubung ke server.");
        } finally {
            setLoading(false);
        }
    };

    const isFormFilled = email.trim().length > 0 && password.length > 0;

    /*
    ============================================================
    DESKTOP (Panel Kiri Putih Polos & Form Bergaya Mobile)
    ============================================================
    */
    if (isDesktop) {
        return (
            <KeyboardAvoidingView
                style={styles.desktopContainer}
                behavior={undefined}
            >
                <Stack.Screen options={{ headerShown: false }} />

                {/* PANEL KIRI: Putih Polos (#FFFFFF), Bersih, Modern & Form Bergaya Mobile */}
                <View style={styles.desktopLeft}>
                    <ScrollView
                        style={styles.desktopLeftScroll}
                        contentContainerStyle={[
                            styles.desktopLeftContent,
                            { minHeight: height },
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.desktopFormWrapper}>
                            {/* Logo */}
                            <View style={styles.desktopLogoWrapper}>
                                <Image
                                    source={require("../../assets/images/autocare-logo.png")}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Judul dan Deskripsi */}
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
                                    onSubmitEditing={() => {
                                        if (password) handleLogin();
                                    }}
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

                            {/* Checkbox Ingat Saya & Link Lupa Password */}
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
                                    <Text style={styles.forgotText}>Lupa password?</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Tombol Login */}
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

                            {/* Pemisah "atau" */}
                            <View style={styles.desktopOrContainer}>
                                <View style={styles.desktopOrLine} />
                                <Text style={styles.desktopOrText}>atau</Text>
                                <View style={styles.desktopOrLine} />
                            </View>

                            {/* Link Daftar */}
                            <View style={styles.desktopRegisterRow}>
                                <Text style={styles.registerText}>Belum punya akun? </Text>
                                <TouchableOpacity onPress={() => router.push("/daftar")}>
                                    <Text style={styles.registerLink}>Daftar</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Footer AutoCare */}
                            <Text style={styles.desktopFooter}>
                                AutoCare • Vehicle Service
                            </Text>
                        </View>
                    </ScrollView>
                </View>

                {/* PANEL KANAN DESKTOP */}
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

                        {/* BADGE KEUNGGULAN / PROMOSI */}
                        <View style={styles.brandFeatures}>
                            <View style={styles.brandBadgeItem}>
                                <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                                <Text style={styles.brandBadgeText}>Booking Servis Cepat & Praktis</Text>
                            </View>
                            <View style={styles.brandBadgeItem}>
                                <Ionicons name="shield-checkmark" size={17} color="#FFFFFF" />
                                <Text style={styles.brandBadgeText}>Bengkel Rekanan Terverifikasi</Text>
                            </View>
                            <View style={styles.brandBadgeItem}>
                                <Ionicons name="pricetag" size={17} color="#FFFFFF" />
                                <Text style={styles.brandBadgeText}>Estimasi Biaya Transparan</Text>
                            </View>
                        </View>
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
        backgroundColor: "#FFFFFF",
    },
    desktopLeftScroll: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    desktopLeftContent: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 48,
        paddingHorizontal: 36,
    },
    desktopFormWrapper: {
        width: "100%",
        maxWidth: 420,
    },
    desktopLogoWrapper: {
        width: 108,
        height: 108,
        borderRadius: 54,
        backgroundColor: "#FFFFFF",
        alignSelf: "center",
        marginBottom: 28,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    desktopOptionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 26,
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
        borderColor: "#8E96A4",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
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
        color: "#4B5563",
        fontSize: 13,
    },
    desktopOrContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 26,
        marginBottom: 20,
        gap: 12,
    },
    desktopOrLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E7EB",
    },
    desktopOrText: {
        color: "#8E96A4",
        fontSize: 13,
    },
    desktopRegisterRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    desktopFooter: {
        textAlign: "center",
        color: "#9CA3AF",
        fontSize: 12,
        marginTop: 28,
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
        marginTop: 24,
        gap: 12,
        width: "100%",
        paddingHorizontal: 10,
    },
    brandBadgeItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
    },
    brandBadgeText: {
        color: "#FFFFFF",
        fontSize: 13.5,
        fontWeight: "600",
    },
    brandCopyright: {
        position: "absolute",
        bottom: 24,
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
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
});