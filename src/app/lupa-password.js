import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_URL } from "../config";

export default function LupaPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleKirimOTP = async () => {
        Keyboard.dismiss();

        setErrorMessage("");
        setSuccessMessage("");

        if (!email.trim()) {
            setErrorMessage("Email wajib diisi.");
            return;
        }

        try {
            setLoading(true);

            const emailClean = email.trim().toLowerCase();

            const response = await fetch(
                `${API_URL}/api/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: emailClean,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setErrorMessage(
                    data.message ||
                        "Gagal mengirim kode reset password."
                );
                return;
            }

            setSuccessMessage(
                data.message || "Kode reset password telah dikirim ke email."
            );

            setTimeout(() => {
                router.push({
                    pathname: "/verifikasi-otp",
                    params: {
                        email: emailClean,
                        initialOtp: data.otp || "",
                    },
                });
            }, 700);
        } catch (error) {
            console.error(
                "Forgot Password Error:",
                error
            );

            setErrorMessage(
                "Tidak dapat terhubung ke server AutoCare."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>

            {/* ICON */}
            <View style={styles.iconContainer}>
                <Ionicons
                    name="lock-open-outline"
                    size={58}
                    color="#F20D18"
                />
            </View>

            {/* TITLE */}
            <Text style={styles.title}>
                Lupa Password?
            </Text>

            <Text style={styles.subtitle}>
                Jangan khawatir. Masukkan email yang
                terdaftar untuk mendapatkan kode
                verifikasi reset password.
            </Text>

            {/* EMAIL */}
            <View style={styles.inputContainer}>
                <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#777777"
                />

                <TextInput
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        setErrorMessage("");
                    }}
                    placeholder="Masukkan email"
                    placeholderTextColor="#999999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                />
            </View>

            {/* ERROR */}
            {errorMessage ? (
                <View style={styles.messageBox}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color="#DC2626"
                    />

                    <Text style={styles.errorText}>
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
                        size={18}
                        color="#16A34A"
                    />

                    <Text style={styles.successText}>
                        {successMessage}
                    </Text>
                </View>
            ) : null}

            {/* BUTTON */}
            <TouchableOpacity
                style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                ]}
                onPress={handleKirimOTP}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.buttonText}>
                        Kirim Kode Verifikasi
                    </Text>
                )}
            </TouchableOpacity>

            {/* BACK */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/login")}
            >
                <Ionicons
                    name="arrow-back"
                    size={18}
                    color="#F20D18"
                />

                <Text style={styles.backText}>
                    Kembali ke Login
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 35,
        paddingTop: 80,
    },

    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#FFF1F2",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 25,
    },

    title: {
        textAlign: "center",
        fontSize: 24,
        fontWeight: "800",
        color: "#151515",
        marginBottom: 10,
    },

    subtitle: {
        textAlign: "center",
        fontSize: 13,
        color: "#777777",
        lineHeight: 20,
        marginBottom: 30,
    },

    inputContainer: {
        height: 52,
        borderWidth: 1,
        borderColor: "#999999",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        backgroundColor: "#FFFFFF",
        marginBottom: 15,
    },

    input: {
        flex: 1,
        height: 52,
        marginLeft: 10,
        fontSize: 12,
        color: "#222222",
    },

    messageBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 15,
    },

    errorText: {
        flex: 1,
        color: "#DC2626",
        fontSize: 12,
        marginLeft: 8,
    },

    successBox: {
        backgroundColor: "#F0FDF4",
    },

    successText: {
        flex: 1,
        color: "#16A34A",
        fontSize: 12,
        marginLeft: 8,
    },

    button: {
        height: 48,
        backgroundColor: "#c1010a",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 5,
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    buttonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
    },

    backButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 28,
    },

    backText: {
        color: "#F20D18",
        fontSize: 12,
        fontWeight: "700",
        marginLeft: 6,
    },
});