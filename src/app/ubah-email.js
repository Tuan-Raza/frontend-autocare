import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useState } from "react";
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

export default function UbahEmail() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = "error") => {
        setNotification({
            message,
            type,
        });

        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const handleSendOTP = async () => {
        try {
            setNotification(null);

            if (!email.trim()) {
                showNotification(
                    "Email baru wajib diisi"
                );
                return;
            }

            if (!password) {
                showNotification(
                    "Password saat ini wajib diisi"
                );
                return;
            }

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email.trim())) {
                showNotification(
                    "Format email tidak valid"
                );
                return;
            }

            const storedUser =
                await AsyncStorage.getItem(
                    "autocare_user"
                );

            if (!storedUser) {
                showNotification(
                    "Sesi login tidak ditemukan"
                );
                return;
            }

            const user = JSON.parse(storedUser);

            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/email-change/request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        userId: Number(user.id),
                        newEmail:
                            email.trim().toLowerCase(),
                        password,
                    }),
                }
            );

            const result =
                await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                        "Gagal mengirim OTP"
                );
            }

            showNotification(
                "OTP berhasil dikirim ke email baru",
                "success"
            );

            setTimeout(() => {
                router.push({
                    pathname: "/verifikasi-email",
                    params: {
                        email:
                            email.trim().toLowerCase(),
                        mode: "email-change",
                    },
                });
            }, 800);
        } catch (error) {
            console.error(
                "Ubah Email Error:",
                error
            );

            showNotification(
                error.message ||
                    "Terjadi kesalahan"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScrollView
                    contentContainerStyle={
                        styles.scrollContent
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    {/* HEADER */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() =>
                                safeBack("/profil")
                            }
                            style={styles.backButton}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={25}
                                color="#222"
                            />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>
                            Ubah Email
                        </Text>

                        <View
                            style={{
                                width: 40,
                            }}
                        />
                    </View>

                    {/* ICON */}
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name="mail-outline"
                            size={38}
                            color="#B22222"
                        />
                    </View>

                    <Text style={styles.title}>
                        Ganti Email
                    </Text>

                    <Text style={styles.subtitle}>
                        Masukkan email baru dan
                        password akun kamu. Kami akan
                        mengirim kode OTP ke email baru
                        untuk verifikasi.
                    </Text>

                    {/* EMAIL */}
                    <Text style={styles.label}>
                        Email Baru
                    </Text>

                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="mail-outline"
                            size={21}
                            color="#999"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Masukkan email baru"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* PASSWORD */}
                    <Text style={styles.label}>
                        Password Saat Ini
                    </Text>

                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={21}
                            color="#999"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Masukkan password saat ini"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={
                                !showPassword
                            }
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
                                        ? "eye-outline"
                                        : "eye-off-outline"
                                }
                                size={21}
                                color="#888"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* INFO */}
                    <View style={styles.infoBox}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={20}
                            color="#B22222"
                        />

                        <Text style={styles.infoText}>
                            Untuk keamanan, email baru
                            harus diverifikasi dengan
                            kode OTP.
                        </Text>
                    </View>

                    {/* BUTTON */}
                    <TouchableOpacity
                        style={[
                            styles.button,
                            loading &&
                                styles.buttonDisabled,
                        ]}
                        onPress={handleSendOTP}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator
                                color="#fff"
                            />
                        ) : (
                            <>
                                <Ionicons
                                    name="paper-plane-outline"
                                    size={19}
                                    color="#fff"
                                />

                                <Text
                                    style={
                                        styles.buttonText
                                    }
                                >
                                    Kirim Kode OTP
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>

                {/* NOTIFICATION */}
                {notification && (
                    <View
                        style={[
                            styles.notification,
                            notification.type ===
                                "success" &&
                                styles.notificationSuccess,
                        ]}
                    >
                        <Ionicons
                            name={
                                notification.type ===
                                "success"
                                    ? "checkmark-circle"
                                    : "alert-circle"
                            }
                            size={21}
                            color="#fff"
                        />

                        <Text
                            style={
                                styles.notificationText
                            }
                        >
                            {notification.message}
                        </Text>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },

    scrollContent: {
        paddingBottom: 40,
    },

    header: {
        height: 65,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },

    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },

    headerTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 20,
        fontWeight: "700",
        color: "#222",
    },

    iconCircle: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: "#FFF1F1",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginTop: 35,
    },

    title: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 26,
        fontWeight: "800",
        color: "#222",
        textAlign: "center",
        marginTop: 18,
    },

    subtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 14,
        lineHeight: 21,
        color: "#777",
        textAlign: "center",
        paddingHorizontal: 35,
        marginTop: 8,
        marginBottom: 30,
    },

    label: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        fontWeight: "700",
        color: "#333",
        marginLeft: 25,
        marginBottom: 8,
        marginTop: 10,
    },

    inputWrapper: {
        fontFamily: "Poppins_400Regular",
        height: 54,
        marginHorizontal: 25,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        backgroundColor: "#FAFAFA",
    },

    input: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        fontSize: 15,
        color: "#222",
        marginLeft: 10,
    },

    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginHorizontal: 25,
        marginTop: 20,
        padding: 14,
        borderRadius: 12,
        backgroundColor: "#FFF5F5",
    },

    infoText: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        lineHeight: 19,
        color: "#666",
    },

    button: {
        height: 54,
        marginHorizontal: 25,
        marginTop: 25,
        borderRadius: 14,
        backgroundColor: "#B22222",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    buttonText: {
        fontFamily: "Poppins_700Bold",
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    notification: {
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 25,
        backgroundColor: "#B22222",
        borderRadius: 13,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        elevation: 6,
    },

    notificationSuccess: {
        backgroundColor: "#16803C",
    },

    notificationText: {
        fontFamily: "Poppins_600SemiBold",
        flex: 1,
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 10,
    },
});