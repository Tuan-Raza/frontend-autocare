import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { BlurView } from "expo-blur";

import {
    ActivityIndicator,
    Image,
    ImageBackground,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StyleSheet,
} from "react-native";

import { API_URL } from "../config";

export default function Daftar() {
    const [nama, setNama] = useState("");
    const [email, setEmail] = useState("");
    const [noHp, setNoHp] = useState("");
    const [password, setPassword] = useState("");
    const [konfirmasiPassword, setKonfirmasiPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showKonfirmasiPassword, setShowKonfirmasiPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleDaftar = async () => {
        Keyboard.dismiss();

        setErrorMessage("");
        setSuccessMessage("");

        // Validasi
        if (
            !nama.trim() ||
            !email.trim() ||
            !noHp.trim() ||
            !password ||
            !konfirmasiPassword
        ) {
            setErrorMessage("Semua field wajib diisi.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim().toLowerCase())) {
            setErrorMessage("Format email tidak valid.");
            return;
        }

        if (password.length < 8) {
            setErrorMessage("Password minimal 8 karakter.");
            return;
        }

        if (!/\d/.test(password)) {
            setErrorMessage(
                "Password harus memiliki minimal 1 angka."
            );
            return;
        }

        if (password !== konfirmasiPassword) {
            setErrorMessage(
                "Konfirmasi password tidak sama."
            );
            return;
        }

        try {
            setLoading(true);

            const emailClean = email.trim().toLowerCase();

            const response = await fetch(
                `${API_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nama: nama.trim(),
                        email: emailClean,
                        noHp: noHp.trim(),
                        password: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setErrorMessage(
                    data.message ||
                        "Registrasi gagal. Silakan coba lagi."
                );
                return;
            }

            // OTP berhasil dibuat / dikirim
            setSuccessMessage(
                "Pendaftaran berhasil! Kode OTP verifikasi telah dikirimkan ke email Anda. Silakan periksa inbox/spam email Anda."
            );

            // Pindah ke halaman verifikasi dengan email & initialOtp
            setTimeout(() => {
                router.push({
                    pathname: "/verifikasi-email",
                    params: {
                        email: emailClean,
                    },
                });
            }, 700);

        } catch (error) {
            console.error("Register Error:", error);

            setErrorMessage(
                "Tidak dapat terhubung ke server AutoCare."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require("../../assets/autocare-login-bg.jpg")}
            style={styles.background}
            resizeMode="cover"
        >
            {/* DARK OVERLAY */}
            <View style={styles.overlay} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* GLASS CARD */}
                <BlurView
                    intensity={35}
                    tint="dark"
                    style={styles.registerCard}
                >
                    {/* BACK BUTTON */}
                    <TouchableOpacity
                        style={styles.topBackBtn}
                        onPress={() => router.replace("/login")}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                        <Text style={styles.topBackText}>Kembali ke Login</Text>
                    </TouchableOpacity>

                    {/* LOGO */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require("../../assets/images/autocare-logo.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* TITLE */}
                    <Text style={styles.title}>
                        Buat Akun Baru
                    </Text>

                    <Text style={styles.subtitle}>
                        Daftarkan akun Anda untuk menggunakan layanan AutoCare
                    </Text>

                    {/* ERROR */}
                    {errorMessage !== "" && (
                        <View style={styles.errorBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={16}
                                color="#FF5252"
                            />

                            <Text style={styles.errorText}>
                                {errorMessage}
                            </Text>
                        </View>
                    )}

                    {/* SUCCESS */}
                    {successMessage !== "" && (
                        <View style={styles.successBox}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={16}
                                color="#52E878"
                            />

                            <Text style={styles.successText}>
                                {successMessage}
                            </Text>
                        </View>
                    )}

                    {/* NAMA */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="person-outline"
                            size={18}
                            color="rgba(255,255,255,0.85)"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Nama Lengkap"
                            placeholderTextColor="rgba(255,255,255,0.62)"
                            value={nama}
                            onChangeText={setNama}
                            autoCapitalize="words"
                            autoComplete="off"
                        />
                    </View>

                    {/* EMAIL */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={18}
                            color="rgba(255,255,255,0.85)"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Email (contoh: user@gmail.com)"
                            placeholderTextColor="rgba(255,255,255,0.62)"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="off"
                        />
                    </View>

                    {/* NOMOR HP */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="call-outline"
                            size={18}
                            color="rgba(255,255,255,0.85)"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Nomor HP (WhatsApp)"
                            placeholderTextColor="rgba(255,255,255,0.62)"
                            value={noHp}
                            onChangeText={setNoHp}
                            keyboardType="phone-pad"
                            autoComplete="tel" textContentType="telephoneNumber"
                        />
                    </View>

                    {/* PASSWORD */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={18}
                            color="rgba(255,255,255,0.85)"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Password (min. 8 karakter, 1 angka)"
                            placeholderTextColor="rgba(255,255,255,0.62)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="new-password" textContentType="newPassword"
                        />

                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                size={18}
                                color="rgba(255,255,255,0.7)"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* KONFIRMASI PASSWORD */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={18}
                            color="rgba(255,255,255,0.85)"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Konfirmasi Password"
                            placeholderTextColor="rgba(255,255,255,0.62)"
                            value={konfirmasiPassword}
                            onChangeText={setKonfirmasiPassword}
                            secureTextEntry={!showKonfirmasiPassword}
                            autoCapitalize="none"
                            autoComplete="new-password" textContentType="newPassword"
                        />

                        <TouchableOpacity
                            onPress={() => setShowKonfirmasiPassword(!showKonfirmasiPassword)}
                            style={styles.eyeBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={showKonfirmasiPassword ? "eye-outline" : "eye-off-outline"}
                                size={18}
                                color="rgba(255,255,255,0.7)"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* BUTTON DAFTAR */}
                    <TouchableOpacity
                        style={[
                            styles.registerButton,
                            loading && styles.disabledButton,
                        ]}
                        onPress={handleDaftar}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                            />
                        ) : (
                            <>
                                <Text style={styles.registerButtonText}>
                                    Daftar Sekarang
                                </Text>

                                <Ionicons
                                    name="arrow-forward"
                                    size={18}
                                    color="#FFFFFF"
                                />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* LOGIN */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>
                            Sudah punya akun?
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.replace("/login")}
                        >
                            <Text style={styles.loginLink}>
                                Masuk di sini
                            </Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%",
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 35,
    },

    registerCard: {
        width: "100%",
        maxWidth: 450,

        backgroundColor: "rgba(255, 255, 255, 0.14)",

        borderRadius: 24,

        borderWidth: 1.2,
        borderColor: "rgba(255, 255, 255, 0.45)",

        paddingHorizontal: 26,
        paddingTop: 20,
        paddingBottom: 24,

        overflow: "hidden",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.35,
        shadowRadius: 20,

        elevation: 12,
    },

    topBackBtn: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginBottom: 8,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 8,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
    },

    topBackText: {
        fontFamily: "Poppins_600SemiBold",
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 5,
    },

    logoContainer: {
        alignItems: "center",
        marginBottom: 2,
    },

    logo: {
        width: 145,
        height: 85,
    },

    title: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 22,
        fontWeight: "800",
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 4,
    },

    subtitle: {
        fontFamily: "Poppins_500Medium",
        fontSize: 11.5,
        color: "rgba(235, 235, 235, 0.85)",
        lineHeight: 16,
        textAlign: "center",
        marginBottom: 18,
        fontWeight: "500",
    },

    errorBox: {
        minHeight: 40,
        backgroundColor: "rgba(255, 70, 70, 0.22)",
        borderWidth: 1,
        borderColor: "rgba(255, 100, 100, 0.5)",
        borderRadius: 11,
        paddingHorizontal: 12,
        marginBottom: 12,

        flexDirection: "row",
        alignItems: "center",
    },

    errorText: {
        fontFamily: "Poppins_600SemiBold",
        flex: 1,
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 8,
    },

    successBox: {
        minHeight: 40,
        backgroundColor: "rgba(60, 220, 110, 0.22)",
        borderWidth: 1,
        borderColor: "rgba(90, 240, 130, 0.5)",
        borderRadius: 11,
        paddingHorizontal: 12,
        marginBottom: 12,

        flexDirection: "row",
        alignItems: "center",
    },

    successText: {
        fontFamily: "Poppins_600SemiBold",
        flex: 1,
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 8,
    },

    inputContainer: {
        fontFamily: "Poppins_400Regular",
        height: 48,

        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.35)",

        borderRadius: 13,

        flexDirection: "row",
        alignItems: "center",

        paddingHorizontal: 14,

        marginBottom: 10,

        backgroundColor: "rgba(255, 255, 255, 0.12)",
    },

    input: {
        fontFamily: "Poppins_600SemiBold",
        flex: 1,
        height: 48,
        backgroundColor: "transparent",

        fontSize: 12,

        color: "#FFFFFF",

        marginLeft: 10,

        fontWeight: "600",

        paddingVertical: 0,
    },

    eyeBtn: {
        padding: 6,
        marginLeft: 4,
    },

    registerButton: {
        height: 48,

        borderRadius: 13,

        backgroundColor: "#F20D18",

        justifyContent: "center",
        alignItems: "center",

        flexDirection: "row",

        marginTop: 8,

        shadowColor: "#F20D18",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.35,
        shadowRadius: 8,

        elevation: 6,
    },

    disabledButton: {
        opacity: 0.7,
    },

    registerButtonText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 13.5,
        fontWeight: "800",
        marginRight: 8,
    },

    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },

    loginText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 11.5,
        color: "rgba(255,255,255,0.85)",
        fontWeight: "600",
    },

    loginLink: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 12.5,
        color: "#FF4D4D",
        fontWeight: "800",
        marginLeft: 6,
    },
});
