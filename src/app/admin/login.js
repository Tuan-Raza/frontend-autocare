import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { adminApi } from "../../services/adminApi";

export default function AdminLoginScreen() {
    const [email, setEmail] = useState("admin@autocare.com");
    const [password, setPassword] = useState("admin123");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async () => {
        setErrorMessage("");
        if (!email.trim() || !password) {
            setErrorMessage("Email dan password wajib diisi");
            return;
        }

        try {
            setLoading(true);
            const res = await adminApi.login(email.trim().toLowerCase(), password);
            if (res.success) {
                router.replace("/admin/dashboard");
            } else {
                setErrorMessage(res.message || "Gagal masuk ke portal admin");
            }
        } catch (err) {
            setErrorMessage(err.message || "Terjadi kesalahan saat menghubungi server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        {/* BRAND LOGO & HEADER */}
                        <View style={styles.brandHeader}>
                            <Image
                                source={require("../../../assets/images/autocare-logo.png")}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={styles.brandTitle}>AutoCare</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>PORTAL ADMINISTRATOR</Text>
                            </View>
                            <Text style={styles.subtitle}>
                                Masuk untuk mengelola seluruh operasional servis bengkel
                            </Text>
                        </View>

                        {/* ERROR ALERT */}
                        {errorMessage ? (
                            <View style={styles.errorAlert}>
                                <Ionicons name="alert-circle" size={18} color="#B91C1C" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        ) : null}

                        {/* FORM INPUTS */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email Administrator</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color="#9CA3AF"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="admin@autocare.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Kata Sandi</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#9CA3AF"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeBtn}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* SUBMIT BUTTON */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Masuk ke Dashboard</Text>
                                    <Ionicons
                                        name="arrow-forward"
                                        size={18}
                                        color="#FFFFFF"
                                        style={{ marginLeft: 8 }}
                                    />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* USER APP LINK */}
                        <TouchableOpacity
                            style={styles.backLink}
                            onPress={() => router.replace("/login")}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back-outline" size={16} color="#4B5563" />
                            <Text style={styles.backLinkText}>Kembali ke Aplikasi Pelanggan</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    card: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    brandHeader: {
        alignItems: "center",
        marginBottom: 24,
    },
    logo: {
        width: 60,
        height: 60,
        marginBottom: 10,
    },
    brandTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 22,
        fontWeight: "800",
        color: "#4A0404",
        letterSpacing: 0.5,
    },
    badge: {
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 6,
    },
    badgeText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#C8102E",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.8,
    },
    subtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 10,
        lineHeight: 18,
    },
    errorAlert: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FCA5A5",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    errorText: {
        fontFamily: "Poppins_500Medium",
        color: "#991B1B",
        fontSize: 13,
        marginLeft: 8,
        flex: 1,
        fontWeight: "500",
    },
    formGroup: {
        marginBottom: 18,
    },
    label: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
    },
    inputWrapper: {
        fontFamily: "Poppins_400Regular",
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 12,
        height: 46,
    },
    inputIcon: {
        fontFamily: "Poppins_400Regular",
        marginRight: 10,
    },
    input: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        height: "100%",
        fontSize: 14,
        color: "#111827",
    },
    eyeBtn: {
        padding: 6,
    },
    submitButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#C8102E",
        borderRadius: 8,
        height: 46,
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    backLink: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        paddingVertical: 6,
    },
    backLinkText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 13,
        color: "#4B5563",
        fontWeight: "500",
        marginLeft: 6,
    },
});
