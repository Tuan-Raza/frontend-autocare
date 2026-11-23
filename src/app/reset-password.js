import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_URL } from "../config";

const RED = "#F20D18";

export default function ResetPassword() {
    const params = useLocalSearchParams();

    const emailParam = Array.isArray(params.email)
        ? params.email[0]
        : params.email;

    const [email, setEmail] = useState(emailParam || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [emailParam]);

    const handleResetPassword = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        const emailClean = email.trim().toLowerCase();

        if (!emailClean) {
            setErrorMessage("Email tidak ditemukan.");
            return;
        }

        if (!password) {
            setErrorMessage("Password baru wajib diisi.");
            return;
        }

        if (password.length < 8) {
            setErrorMessage(
                "Password minimal 8 karakter."
            );
            return;
        }

        if (!/\d/.test(password)) {
            setErrorMessage(
                "Password harus mengandung minimal 1 angka."
            );
            return;
        }

        if (!confirmPassword) {
            setErrorMessage(
                "Konfirmasi password wajib diisi."
            );
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage(
                "Konfirmasi password tidak cocok."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/auth/reset-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        email: emailClean,
                        password: password,
                        confirmPassword: confirmPassword,
                    }),
                }
            );

            const text = await response.text();

            let data;

            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(
                    "Response server tidak valid."
                );
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                        "Gagal mengubah password."
                );
            }

            setSuccessMessage(
                data.message ||
                    "Password berhasil diubah."
            );

            // Hapus email reset sementara
            await AsyncStorage.removeItem(
                "autocare_reset_email"
            );

            // Beri waktu agar user melihat notifikasi
            setTimeout(() => {
                router.replace("/login");
            }, 1200);
        } catch (error) {
            console.error(
                "RESET PASSWORD ERROR:",
                error
            );

            setErrorMessage(
                error.message ||
                    "Tidak dapat terhubung ke server AutoCare."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ICON */}
                <View style={styles.iconContainer}>
                    <Ionicons
                        name="lock-closed-outline"
                        size={58}
                        color={RED}
                    />
                </View>

                {/* TITLE */}
                <Text style={styles.title}>
                    Reset Password
                </Text>

                <Text style={styles.subtitle}>
                    Buat password baru untuk akun AutoCare
                    Anda.
                </Text>

                {/* EMAIL */}
                <Text style={styles.label}>
                    Email
                </Text>

                <View style={styles.inputContainer}>
                    <Ionicons
                        name="mail-outline"
                        size={20}
                        color="#777777"
                    />

                    <Text
                        style={styles.emailText}
                        numberOfLines={1}
                    >
                        {email || "Email tidak ditemukan"}
                    </Text>
                </View>

                {/* ERROR */}
                {errorMessage ? (
                    <View style={styles.messageBox}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={19}
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
                            size={19}
                            color="#16A34A"
                        />

                        <Text
                            style={styles.successText}
                        >
                            {successMessage}
                        </Text>
                    </View>
                ) : null}

                {/* PASSWORD BARU */}
                <Text style={styles.label}>
                    Password Baru
                </Text>

                <View style={styles.inputContainer}>
                    <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#777777"
                    />

                    <TextInput
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            setErrorMessage("");
                        }}
                        placeholder="Masukkan password baru"
                        placeholderTextColor="#999999"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                    />

                    <TouchableOpacity
                        onPress={() =>
                            setShowPassword(
                                !showPassword
                            )
                        }
                    >
                        <Ionicons
                            name={
                                showPassword
                                    ? "eye-off-outline"
                                    : "eye-outline"
                            }
                            size={20}
                            color="#777777"
                        />
                    </TouchableOpacity>
                </View>

                {/* PASSWORD CONFIRM */}
                <Text style={styles.label}>
                    Konfirmasi Password
                </Text>

                <View style={styles.inputContainer}>
                    <Ionicons
                        name="shield-checkmark-outline"
                        size={20}
                        color="#777777"
                    />

                    <TextInput
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            setErrorMessage("");
                        }}
                        placeholder="Ulangi password baru"
                        placeholderTextColor="#999999"
                        secureTextEntry={
                            !showConfirmPassword
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                    />

                    <TouchableOpacity
                        onPress={() =>
                            setShowConfirmPassword(
                                !showConfirmPassword
                            )
                        }
                    >
                        <Ionicons
                            name={
                                showConfirmPassword
                                    ? "eye-off-outline"
                                    : "eye-outline"
                            }
                            size={20}
                            color="#777777"
                        />
                    </TouchableOpacity>
                </View>

                {/* PASSWORD RULE */}
                <View style={styles.ruleBox}>
                    <Text style={styles.ruleTitle}>
                        Password harus:
                    </Text>

                    <View style={styles.ruleRow}>
                        <Ionicons
                            name={
                                password.length >= 8
                                    ? "checkmark-circle"
                                    : "ellipse-outline"
                            }
                            size={16}
                            color={
                                password.length >= 8
                                    ? "#16A34A"
                                    : "#999999"
                            }
                        />

                        <Text style={styles.ruleText}>
                            Minimal 8 karakter
                        </Text>
                    </View>

                    <View style={styles.ruleRow}>
                        <Ionicons
                            name={
                                /\d/.test(password)
                                    ? "checkmark-circle"
                                    : "ellipse-outline"
                            }
                            size={16}
                            color={
                                /\d/.test(password)
                                    ? "#16A34A"
                                    : "#999999"
                            }
                        />

                        <Text style={styles.ruleText}>
                            Mengandung minimal 1 angka
                        </Text>
                    </View>
                </View>

                {/* BUTTON */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        loading &&
                            styles.buttonDisabled,
                    ]}
                    onPress={handleResetPassword}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator
                            color="#FFFFFF"
                        />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>
                                Simpan Password Baru
                            </Text>

                            <Ionicons
                                name="checkmark-circle-outline"
                                size={21}
                                color="#FFFFFF"
                            />
                        </>
                    )}
                </TouchableOpacity>

                {/* BACK */}
                <TouchableOpacity
                    style={styles.backButton}
                    disabled={loading}
                    onPress={() =>
                        router.replace("/login")
                    }
                >
                    <Ionicons
                        name="arrow-back"
                        size={18}
                        color={RED}
                    />

                    <Text style={styles.backText}>
                        Kembali ke Login
                    </Text>
                </TouchableOpacity>
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
        paddingHorizontal: 35,
        paddingTop: 70,
        paddingBottom: 35,
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
        fontFamily: "Poppins_800ExtraBold",
        textAlign: "center",
        fontSize: 24,
        fontWeight: "800",
        color: "#151515",
        marginBottom: 10,
    },

    subtitle: {
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        fontSize: 13,
        color: "#777777",
        lineHeight: 20,
        marginBottom: 27,
    },

    label: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12,
        fontWeight: "700",
        color: "#333333",
        marginBottom: 8,
    },

    inputContainer: {
        fontFamily: "Poppins_400Regular",
        minHeight: 52,
        borderWidth: 1,
        borderColor: "#999999",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        backgroundColor: "#FFFFFF",
        marginBottom: 15,
    },

    emailText: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        marginLeft: 10,
        fontSize: 12,
        color: "#666666",
    },

    input: {
        fontFamily: "Poppins_400Regular",
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
        fontFamily: "Poppins_400Regular",
        flex: 1,
        color: "#DC2626",
        fontSize: 12,
        lineHeight: 18,
        marginLeft: 8,
    },

    successBox: {
        backgroundColor: "#F0FDF4",
    },

    successText: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        color: "#16A34A",
        fontSize: 12,
        lineHeight: 18,
        marginLeft: 8,
    },

    ruleBox: {
        backgroundColor: "#F8F8F8",
        borderRadius: 12,
        padding: 13,
        marginTop: 1,
        marginBottom: 22,
    },

    ruleTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12,
        fontWeight: "700",
        color: "#444444",
        marginBottom: 8,
    },

    ruleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },

    ruleText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#777777",
        marginLeft: 7,
    },

    button: {
        height: 48,
        backgroundColor: "#C1010A",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
        marginTop: 3,
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    buttonText: {
        fontFamily: "Poppins_800ExtraBold",
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
        fontFamily: "Poppins_700Bold",
        color: RED,
        fontSize: 12,
        fontWeight: "700",
        marginLeft: 6,
    },
});