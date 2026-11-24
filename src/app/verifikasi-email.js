import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_URL } from "../config";

export default function VerifikasiEmail() {
    const { email, mode } = useLocalSearchParams();

    const [kode, setKode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const inputRef = useRef(null);

    // =====================================================
    // CEK APAKAH INI OTP UBAH EMAIL
    // =====================================================
    const isEmailChange = mode === "email-change";

    // Timer countdown untuk kirim ulang kode (cooldown 60 detik)
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleVerifikasi = async () => {
        Keyboard.dismiss();

        setErrorMessage("");
        setSuccessMessage("");

        if (kode.length !== 6) {
            setErrorMessage("Masukkan kode verifikasi 6 digit.");
            return;
        }

        try {
            setLoading(true);

            // =================================================
            // MODE UBAH EMAIL
            // =================================================
            if (isEmailChange) {
                const storedUser = await AsyncStorage.getItem("autocare_user");

                if (!storedUser) {
                    setErrorMessage(
                        "Sesi login tidak ditemukan. Silakan login kembali."
                    );
                    return;
                }

                const user = JSON.parse(storedUser);

                const response = await fetch(
                    `${API_URL}/api/email-change/verify`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            userId: Number(user.id),
                            kode: kode,
                        }),
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    setErrorMessage(
                        data.message || "Kode verifikasi tidak valid."
                    );
                    return;
                }

                // UPDATE DATA USER DI ASYNC STORAGE
                const updatedUser = {
                    ...user,
                    email: data.data.email,
                };

                await AsyncStorage.setItem(
                    "autocare_user",
                    JSON.stringify(updatedUser)
                );

                setSuccessMessage("Email berhasil diubah!");

                setTimeout(() => {
                    router.replace("/profil");
                }, 1200);

                return;
            }

            // =================================================
            // MODE REGISTER
            // =================================================
            const response = await fetch(
                `${API_URL}/api/auth/verify-email`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                        kode: kode,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setErrorMessage(
                    data.message || "Kode verifikasi tidak valid."
                );
                return;
            }

            setSuccessMessage("Email berhasil diverifikasi! Pendaftaran selesai.");

            setTimeout(() => {
                router.replace("/login");
            }, 1200);
        } catch (error) {
            console.error("Verify Email Error:", error);

            setErrorMessage(
                "Tidak dapat terhubung ke server AutoCare."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0 || resending) return;

        try {
            setResending(true);
            setErrorMessage("");
            setSuccessMessage("");

            if (isEmailChange) {
                setSuccessMessage("Silakan kembali ke menu ubah email untuk meminta kode baru.");
                return;
            }

            const response = await fetch(
                `${API_URL}/api/auth/resend-verification`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setErrorMessage(
                    data.message || "Gagal mengirim ulang kode verifikasi."
                );
                if (data.retryAfter) {
                    setCountdown(data.retryAfter);
                }
                return;
            }

            setSuccessMessage("Kode verifikasi baru telah dikirim ke email Anda!");
            setCountdown(60);
        } catch (err) {
            console.error("Resend OTP Error:", err);
            setErrorMessage("Tidak dapat terhubung ke server.");
        } finally {
            setResending(false);
        }
    };

    const handleOtpChange = (text) => {
        const cleanText = text
            .replace(/[^0-9]/g, "")
            .slice(0, 6);

        setKode(cleanText);
        setErrorMessage("");
    };

    const isOtpComplete = kode.length === 6;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER MERAH DENGAN AKSEN LINGKARAN (PEMBEDA DARI DAFTAR) */}
                <View style={styles.heroHeader}>
                    <View style={styles.headerDecorCircle} />

                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() =>
                                isEmailChange
                                    ? safeBack("/ubah-email")
                                    : router.replace("/daftar")
                            }
                            activeOpacity={0.75}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>
                            {isEmailChange
                                ? "Verifikasi Email Baru"
                                : "Verifikasi Email"}
                        </Text>

                        <View style={styles.topBarSpacer} />
                    </View>

                    <Text style={styles.heroSubtitle}>
                        {isEmailChange
                            ? "Konfirmasi perubahan alamat email akun AutoCare Anda"
                            : "Satu langkah lagi untuk mengaktifkan akun AutoCare Anda"}
                    </Text>
                </View>

                {/* BADGE AMPLOP & LOGO DI PERBATASAN HEADER DAN KONTEN */}
                <View style={styles.badgeRow}>
                    <View style={styles.logoCircle}>
                        <Image
                            source={require("../../assets/images/autocare-logo.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.mailBadge}>
                        <Ionicons name="mail-open-outline" size={24} color="#A80000" />
                    </View>
                </View>

                {/* KONTEN UTAMA */}
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>
                        {isEmailChange
                            ? "Verifikasi Email Baru"
                            : "Verifikasi Pendaftaran"}
                    </Text>

                    <Text style={styles.subtitle}>
                        {isEmailChange
                            ? "Kami telah mengirimkan kode verifikasi 6 digit ke:"
                            : "Masukkan kode verifikasi 6 digit yang dikirimkan ke:"}
                    </Text>

                    {/* PILL ALAMAT EMAIL */}
                    <View style={styles.emailContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={16}
                            color="#A80000"
                        />

                        <Text
                            style={styles.email}
                            numberOfLines={1}
                        >
                            {email || "-"}
                        </Text>
                    </View>

                    {/* OTP LABEL */}
                    <Text style={styles.otpLabel}>
                        Masukkan 6 digit kode verifikasi:
                    </Text>

                    {/* OTP BOXES */}
                    <Pressable
                        onPress={() => inputRef.current?.focus()}
                        style={styles.otpWrapper}
                    >
                        {Array.from({ length: 6 }).map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.otpBox,
                                    kode[index] ? styles.otpBoxActive : null,
                                ]}
                            >
                                <Text style={styles.otpText}>
                                    {kode[index] || ""}
                                </Text>
                            </View>
                        ))}

                        {/* HIDDEN INPUT */}
                        <TextInput
                            ref={inputRef}
                            value={kode}
                            onChangeText={handleOtpChange}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus={false}
                            style={styles.hiddenInput}
                        />
                    </Pressable>

                    {/* ERROR */}
                    {errorMessage ? (
                        <View style={styles.messageBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={18}
                                color="#B30000"
                            />
                            <Text style={styles.errorText}>
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    {/* SUCCESS */}
                    {successMessage ? (
                        <View style={[styles.messageBox, styles.successBox]}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={18}
                                color="#15803D"
                            />
                            <Text style={styles.successText}>
                                {successMessage}
                            </Text>
                        </View>
                    ) : null}

                    {/* BUTTON VERIFIKASI */}
                    <TouchableOpacity
                        style={[
                            styles.button,
                            isOtpComplete && styles.buttonActive,
                            loading && styles.buttonDisabled,
                        ]}
                        onPress={handleVerifikasi}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>
                                Verifikasi Sekarang
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* RESEND OTP */}
                    {!isEmailChange && (
                        <View style={styles.resendContainer}>
                            <Text style={styles.resendLabel}>
                                Belum menerima kode?
                            </Text>
                            <TouchableOpacity
                                onPress={handleResendOtp}
                                disabled={countdown > 0 || resending}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.resendLink,
                                        (countdown > 0 || resending) &&
                                            styles.resendLinkDisabled,
                                    ]}
                                >
                                    {resending
                                        ? "Mengirim..."
                                        : countdown > 0
                                        ? `Kirim Ulang (${countdown}s)`
                                        : "Kirim Ulang Kode"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* INFO */}
                    <View style={styles.infoContainer}>
                        <Ionicons
                            name="information-circle-outline"
                            size={16}
                            color="#636B78"
                        />
                        <Text style={styles.infoText}>
                            Periksa folder Inbox atau Spam email Anda.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    scrollContent: {
        flexGrow: 1,
        backgroundColor: "#FFFFFF",
        paddingBottom: 36,
    },

    heroHeader: {
        backgroundColor: "#A80000",
        paddingTop: Platform.OS === "ios" ? 54 : 36,
        paddingBottom: 42,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: "hidden",
    },

    headerDecorCircle: {
        position: "absolute",
        width: 190,
        height: 190,
        borderRadius: 95,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        top: -55,
        right: -45,
    },

    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    backBtn: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "flex-start",
    },

    headerTitle: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },

    topBarSpacer: {
        width: 32,
    },

    heroSubtitle: {
        color: "rgba(255, 255, 255, 0.88)",
        fontSize: 12.5,
        textAlign: "center",
        marginTop: 10,
        paddingHorizontal: 14,
    },

    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: -28,
        marginBottom: 8,
        gap: 12,
    },

    logoCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 5,
    },

    logo: {
        width: 40,
        height: 40,
    },

    mailBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#FFF5F5",
        borderWidth: 1.8,
        borderColor: "#A80000",
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 5,
    },

    contentContainer: {
        paddingHorizontal: 26,
        paddingTop: 6,
    },

    title: {
        fontSize: 21,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
        marginBottom: 4,
    },

    subtitle: {
        fontSize: 13,
        color: "#5C6370",
        textAlign: "center",
        marginBottom: 14,
        lineHeight: 19,
    },

    emailContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF5F5",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#F3C6C6",
        alignSelf: "center",
        maxWidth: "100%",
    },

    email: {
        color: "#A80000",
        fontSize: 12.5,
        fontWeight: "700",
        marginLeft: 6,
        flexShrink: 1,
    },

    otpLabel: {
        color: "#4B5563",
        fontSize: 12.5,
        fontWeight: "600",
        marginBottom: 10,
        textAlign: "center",
    },

    otpWrapper: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 6,
        marginBottom: 22,
    },

    otpBox: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.2,
        borderColor: "#636B78",
        justifyContent: "center",
        alignItems: "center",
    },

    otpBoxActive: {
        borderColor: "#A80000",
        backgroundColor: "#FFFDFD",
    },

    otpText: {
        color: "#111827",
        fontSize: 20,
        fontWeight: "700",
    },

    hiddenInput: {
        position: "absolute",
        width: 1,
        height: 1,
        opacity: 0,
    },

    messageBox: {
        minHeight: 40,
        backgroundColor: "#FFF0F0",
        borderWidth: 1,
        borderColor: "#FFCCCC",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    errorText: {
        flex: 1,
        color: "#B30000",
        fontSize: 12.5,
        fontWeight: "600",
    },

    successBox: {
        backgroundColor: "#F0FDF4",
        borderColor: "#BBF7D0",
    },

    successText: {
        flex: 1,
        color: "#15803D",
        fontSize: 12.5,
        fontWeight: "600",
    },

    button: {
        height: 46,
        borderRadius: 8,
        backgroundColor: "#A9A9A9",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 4,
        elevation: 3,
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.16,
        shadowRadius: 3,
    },

    buttonActive: {
        backgroundColor: "#A80000",
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    buttonText: {
        color: "#FFFFFF",
        fontSize: 14.5,
        fontWeight: "700",
    },

    resendContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
        flexWrap: "wrap",
    },

    resendLabel: {
        color: "#5C6370",
        fontSize: 12.5,
        fontWeight: "500",
    },

    resendLink: {
        color: "#A80000",
        fontSize: 12.5,
        fontWeight: "700",
        marginLeft: 6,
    },

    resendLinkDisabled: {
        color: "#8E96A4",
        fontWeight: "600",
    },

    infoContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 14,
        paddingHorizontal: 6,
        gap: 6,
    },

    infoText: {
        color: "#636B78",
        fontSize: 12,
        textAlign: "center",
    },
});