import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_URL } from "../config";

const RED = "#B22222";

export default function VerifikasiOTP() {
    const params = useLocalSearchParams();

    const emailParam = Array.isArray(params.email)
        ? params.email[0]
        : params.email;

    const [email, setEmail] = useState(emailParam || "");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const otpRef = useRef(null);

    useEffect(() => {
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [emailParam]);

    // Timer countdown untuk kirim ulang OTP (cooldown 60 detik)
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleVerify = async () => {
        setMessage("");
        setError("");

        const cleanEmail = email.trim().toLowerCase();
        const cleanOtp = otp.replace(/\D/g, "");

        if (!cleanEmail) {
            setError("Email tidak ditemukan.");
            return;
        }

        if (cleanOtp.length !== 6) {
            setError("Masukkan kode OTP 6 digit.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/auth/verify-reset-otp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        email: cleanEmail,
                        kode: cleanOtp,
                    }),
                }
            );

            const text = await response.text();

            let data;

            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Response server tidak valid.");
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Kode OTP tidak valid atau sudah expired."
                );
            }

            /*
             * Simpan email sementara untuk halaman reset password.
             * Jangan menyimpan password atau OTP.
             */
            await AsyncStorage.setItem(
                "autocare_reset_email",
                cleanEmail
            );

            setMessage(
                data.message || "OTP berhasil diverifikasi."
            );

            setTimeout(() => {
                router.replace({
                    pathname: "/reset-password",
                    params: {
                        email: cleanEmail,
                    },
                });
            }, 700);
        } catch (error) {
            console.error("VERIFY OTP ERROR:", error);

            setError(
                error.message ||
                    "Terjadi kesalahan saat memverifikasi OTP."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || resendLoading) return;

        setMessage("");
        setError("");

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            setError("Email tidak ditemukan.");
            return;
        }

        try {
            setResendLoading(true);

            const response = await fetch(
                `${API_URL}/api/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        email: cleanEmail,
                    }),
                }
            );

            const text = await response.text();

            let data;

            try {
                data = JSON.parse(text);
            } catch {
                throw new Error("Response server tidak valid.");
            }

            if (!response.ok || !data.success) {
                if (data.retryAfter) {
                    setCountdown(data.retryAfter);
                }
                throw new Error(
                    data.message || "Gagal mengirim ulang OTP."
                );
            }

            setMessage(
                data.message || "OTP baru berhasil dikirim ke email Anda."
            );
            setCountdown(60);

            setTimeout(() => {
                otpRef.current?.focus();
            }, 300);
        } catch (error) {
            console.error("RESEND OTP ERROR:", error);

            setError(
                error.message || "Gagal mengirim ulang OTP."
            );
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboard}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* BACK */}
                    <TouchableOpacity
                        style={styles.backButton}
                        activeOpacity={0.7}
                        onPress={() => safeBack("/lupa-password")}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={22}
                            color="#222"
                        />
                    </TouchableOpacity>

                    {/* ICON */}
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name="mail-open-outline"
                            size={46}
                            color={RED}
                        />
                    </View>

                    {/* TITLE */}
                    <Text style={styles.title}>
                        Verifikasi OTP
                    </Text>

                    <Text style={styles.subtitle}>
                        Masukkan kode OTP 6 digit yang telah
                        dikirim ke email Anda.
                    </Text>

                    {/* EMAIL */}
                    <View style={styles.emailBox}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#777"
                        />

                        <Text
                            style={styles.emailText}
                            numberOfLines={1}
                        >
                            {email || "Email tidak ditemukan"}
                        </Text>
                    </View>

                    {/* NOTIFICATION */}
                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={20}
                                color="#C62828"
                            />

                            <Text style={styles.errorText}>
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    {message ? (
                        <View style={styles.successBox}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color="#2E7D32"
                            />

                            <Text style={styles.successText}>
                                {message}
                            </Text>
                        </View>
                    ) : null}

                    {/* OTP */}
                    <Text style={styles.label}>
                        Kode OTP
                    </Text>

                    <TextInput
                        ref={otpRef}
                        style={styles.otpInput}
                        value={otp}
                        onChangeText={(value) => {
                            setOtp(
                                value
                                    .replace(/\D/g, "")
                                    .slice(0, 6)
                            );

                            setError("");
                            setMessage("");
                        }}
                        placeholder="000000"
                        placeholderTextColor="#B5B5B5"
                        keyboardType="number-pad"
                        maxLength={6}
                        textAlign="center"
                        autoFocus
                    />

                    <Text style={styles.helperText}>
                        Kode OTP berlaku selama 5 menit.
                    </Text>

                    {/* VERIFY */}
                    <TouchableOpacity
                        style={[
                            styles.verifyButton,
                            loading && styles.disabledButton,
                        ]}
                        activeOpacity={0.85}
                        disabled={loading}
                        onPress={handleVerify}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.verifyText}>
                                    Verifikasi OTP
                                </Text>

                                <Ionicons
                                    name="arrow-forward"
                                    size={21}
                                    color="#FFFFFF"
                                />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* RESEND */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendLabel}>
                            Tidak menerima kode?
                        </Text>

                        <TouchableOpacity
                            disabled={resendLoading || countdown > 0}
                            activeOpacity={0.7}
                            onPress={handleResend}
                        >
                            {resendLoading ? (
                                <ActivityIndicator
                                    size="small"
                                    color={RED}
                                />
                            ) : (
                                <Text
                                    style={[
                                        styles.resendText,
                                        countdown > 0 && styles.resendTextDisabled,
                                    ]}
                                >
                                    {countdown > 0
                                        ? `Kirim Ulang OTP (${countdown}s)`
                                        : "Kirim Ulang OTP"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* CHANGE EMAIL */}
                    <TouchableOpacity
                        style={styles.changeEmailButton}
                        activeOpacity={0.7}
                        onPress={() =>
                            router.replace("/lupa-password")
                        }
                    >
                        <Ionicons
                            name="create-outline"
                            size={17}
                            color="#777"
                        />

                        <Text style={styles.changeEmailText}>
                            Gunakan email lain
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    keyboard: {
        flex: 1,
    },

    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 35,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F5F5F5",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 28,
    },

    iconContainer: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: "#FFF1F1",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: 22,
    },

    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1C1C1C",
        textAlign: "center",
        marginBottom: 9,
    },

    subtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: "#777",
        textAlign: "center",
        paddingHorizontal: 15,
        marginBottom: 25,
    },

    emailBox: {
        minHeight: 52,
        borderRadius: 13,
        backgroundColor: "#F7F7F7",
        borderWidth: 1,
        borderColor: "#EAEAEA",
        paddingHorizontal: 15,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },

    emailText: {
        flex: 1,
        fontSize: 14,
        color: "#555",
        marginLeft: 10,
    },

    errorBox: {
        minHeight: 46,
        borderRadius: 11,
        backgroundColor: "#FFF1F1",
        borderWidth: 1,
        borderColor: "#FFD1D1",
        paddingHorizontal: 13,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },

    errorText: {
        flex: 1,
        color: "#C62828",
        fontSize: 13,
        lineHeight: 19,
        marginLeft: 8,
    },

    successBox: {
        minHeight: 46,
        borderRadius: 11,
        backgroundColor: "#EFF9F0",
        borderWidth: 1,
        borderColor: "#C9E8CB",
        paddingHorizontal: 13,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },

    successText: {
        flex: 1,
        color: "#2E7D32",
        fontSize: 13,
        lineHeight: 19,
        marginLeft: 8,
    },

    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#333",
        marginBottom: 9,
    },

    otpInput: {
        height: 62,
        borderWidth: 1.5,
        borderColor: "#D9D9D9",
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        fontSize: 27,
        fontWeight: "800",
        color: "#222",
        letterSpacing: 10,
        paddingLeft: 15,
    },

    helperText: {
        fontSize: 12,
        color: "#999",
        textAlign: "center",
        marginTop: 10,
        marginBottom: 23,
    },

    verifyButton: {
        height: 55,
        borderRadius: 13,
        backgroundColor: RED,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
    },

    disabledButton: {
        opacity: 0.7,
    },

    verifyText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    resendContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 23,
        gap: 5,
    },

    resendLabel: {
        color: "#777",
        fontSize: 13,
    },

    resendText: {
        color: RED,
        fontSize: 13,
        fontWeight: "800",
    },

    resendTextDisabled: {
        color: "rgba(178, 34, 34, 0.4)",
    },

    changeEmailButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 22,
    },

    changeEmailText: {
        color: "#777",
        fontSize: 13,
        marginLeft: 6,
    },
});
