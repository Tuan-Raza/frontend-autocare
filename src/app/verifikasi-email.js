import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    Image,
    ImageBackground,
    Keyboard,
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
    const { email, mode, initialOtp } = useLocalSearchParams();

    const [kode, setKode] = useState(initialOtp ? String(initialOtp) : "");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState(
        initialOtp ? `Kode verifikasi Anda adalah ${initialOtp}` : ""
    );

    const inputRef = useRef(null);

    // =====================================================
    // CEK APAKAH INI OTP UBAH EMAIL
    // =====================================================
    const isEmailChange = mode === "email-change";

    // Timer countdown untuk kirim ulang kode
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
                return;
            }

            if (data.otp) {
                setKode(String(data.otp));
            }

            setSuccessMessage(data.message || "Kode verifikasi baru telah dikirim!");
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
                    style={styles.card}
                >
                    {/* BACK BUTTON */}
                    <TouchableOpacity
                        style={styles.topBackBtn}
                        onPress={() =>
                            isEmailChange
                                ? safeBack("/ubah-email")
                                : router.replace("/daftar")
                        }
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
                        <Text style={styles.topBackText}>
                            {isEmailChange ? "Kembali" : "Kembali ke Daftar"}
                        </Text>
                    </TouchableOpacity>

                    {/* LOGO */}
                    <Image
                        source={require("../../assets/images/autocare-logo.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    {/* EMAIL ICON */}
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name="mail-open-outline"
                            size={38}
                            color="#FFFFFF"
                        />
                    </View>

                    {/* TITLE */}
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

                    {/* EMAIL */}
                    <View style={styles.emailContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={16}
                            color="#FFFFFF"
                        />

                        <Text
                            style={styles.email}
                            numberOfLines={1}
                        >
                            {email || "-"}
                        </Text>
                    </View>

                    {/* QUICK OTP NOTICE (IF PROVIDED) */}
                    {initialOtp ? (
                        <TouchableOpacity
                            style={styles.otpNoticeBox}
                            onPress={() => setKode(String(initialOtp))}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="key-outline" size={16} color="#FFD700" />
                            <Text style={styles.otpNoticeText}>
                                Kode OTP Anda: <Text style={styles.otpBold}>{initialOtp}</Text> (Ketuk untuk isi)
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    {/* OTP LABEL */}
                    <Text style={styles.otpLabel}>
                        Masukkan 6 digit kode verifikasi:
                    </Text>

                    {/* OTP BOXES */}
                    <Pressable
                        onPress={() =>
                            inputRef.current?.focus()
                        }
                        style={styles.otpWrapper}
                    >
                        {Array.from({
                            length: 6,
                        }).map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.otpBox,
                                    kode[index]
                                        ? styles.otpBoxActive
                                        : null,
                                ]}
                            >
                                <Text
                                    style={
                                        styles.otpText
                                    }
                                >
                                    {kode[index] || ""}
                                </Text>
                            </View>
                        ))}

                        {/* HIDDEN INPUT */}
                        <TextInput
                            ref={inputRef}
                            value={kode}
                            onChangeText={
                                handleOtpChange
                            }
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus={false}
                            style={
                                styles.hiddenInput
                            }
                        />
                    </Pressable>

                    {/* ERROR */}
                    {errorMessage ? (
                        <View style={styles.messageBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={17}
                                color="#FF6B6B"
                            />

                            <Text
                                style={
                                    styles.errorText
                                }
                            >
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    {/* SUCCESS */}
                    {successMessage ? (
                        <View
                            style={[
                                styles.messageBox,
                                styles.successBox,
                            ]}
                        >
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={17}
                                color="#5BE37B"
                            />

                            <Text
                                style={
                                    styles.successText
                                }
                            >
                                {successMessage}
                            </Text>
                        </View>
                    ) : null}

                    {/* BUTTON VERIFIKASI */}
                    <TouchableOpacity
                        style={[
                            styles.button,
                            loading &&
                                styles.buttonDisabled,
                        ]}
                        onPress={
                            handleVerifikasi
                        }
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator
                                color="#FFFFFF"
                            />
                        ) : (
                            <>
                                <Text
                                    style={
                                        styles.buttonText
                                    }
                                >
                                    Verifikasi Sekarang
                                </Text>

                                <Ionicons
                                    name="arrow-forward"
                                    size={18}
                                    color="#FFFFFF"
                                />
                            </>
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
                    <View
                        style={
                            styles.infoContainer
                        }
                    >
                        <Ionicons
                            name="information-circle-outline"
                            size={15}
                            color="rgba(255,255,255,0.65)"
                        />

                        <Text
                            style={
                                styles.infoText
                            }
                        >
                            Periksa folder Inbox atau Spam email Anda.
                        </Text>
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

    card: {
        width: "100%",
        maxWidth: 440,

        backgroundColor:
            "rgba(255, 255, 255, 0.14)",

        borderRadius: 24,

        borderWidth: 1.2,
        borderColor:
            "rgba(255, 255, 255, 0.45)",

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
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 5,
    },

    logo: {
        width: 140,
        height: 75,
        alignSelf: "center",
        marginBottom: 2,
    },

    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignSelf: "center",
        backgroundColor: "rgba(242, 13, 24, 0.8)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        shadowColor: "#F20D18",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },

    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 4,
    },

    subtitle: {
        fontSize: 11.5,
        color: "rgba(235, 235, 235, 0.85)",
        textAlign: "center",
        marginBottom: 12,
        fontWeight: "500",
    },

    emailContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.25)",
    },

    email: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
        marginLeft: 7,
    },

    otpNoticeBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 215, 0, 0.15)",
        borderWidth: 1,
        borderColor: "rgba(255, 215, 0, 0.45)",
        borderRadius: 10,
        paddingVertical: 7,
        paddingHorizontal: 10,
        marginBottom: 14,
    },

    otpNoticeText: {
        color: "#FFEB3B",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 6,
    },

    otpBold: {
        fontWeight: "900",
        letterSpacing: 2,
        color: "#FFFFFF",
    },

    otpLabel: {
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: 11.5,
        fontWeight: "600",
        marginBottom: 10,
        textAlign: "center",
    },

    otpWrapper: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        paddingHorizontal: 4,
    },

    otpBox: {
        width: 44,
        height: 52,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.3)",
        justifyContent: "center",
        alignItems: "center",
    },

    otpBoxActive: {
        borderColor: "#F20D18",
        backgroundColor: "rgba(242, 13, 24, 0.18)",
    },

    otpText: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "800",
    },

    hiddenInput: {
        position: "absolute",
        width: 1,
        height: 1,
        opacity: 0,
    },

    messageBox: {
        minHeight: 38,
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
        flex: 1,
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 8,
    },

    successBox: {
        backgroundColor: "rgba(60, 220, 110, 0.22)",
        borderColor: "rgba(90, 240, 130, 0.5)",
    },

    successText: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 8,
    },

    button: {
        height: 48,
        borderRadius: 13,
        backgroundColor: "#F20D18",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginTop: 4,
        shadowColor: "#F20D18",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    buttonText: {
        color: "#FFFFFF",
        fontSize: 13.5,
        fontWeight: "800",
        marginRight: 8,
    },

    resendContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
    },

    resendLabel: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 11.5,
        fontWeight: "500",
    },

    resendLink: {
        color: "#FF4D4D",
        fontSize: 12,
        fontWeight: "800",
        marginLeft: 6,
    },

    resendLinkDisabled: {
        color: "rgba(255, 255, 255, 0.4)",
    },

    infoContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 14,
        paddingHorizontal: 5,
    },

    infoText: {
        color: "rgba(255, 255, 255, 0.65)",
        fontSize: 10,
        fontWeight: "500",
        marginLeft: 5,
        textAlign: "center",
    },
});
