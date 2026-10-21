import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useState } from "react";
import {
    Alert,
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../config";

const RED = "#B22222";

export default function Keamanan() {
    const [passwordLama, setPasswordLama] = useState("");
    const [passwordBaru, setPasswordBaru] = useState("");
    const [konfirmasi, setKonfirmasi] = useState("");

    const [showLama, setShowLama] = useState(false);
    const [showBaru, setShowBaru] = useState(false);
    const [showKonfirmasi, setShowKonfirmasi] =
        useState(false);

    const [saving, setSaving] = useState(false);

    const handleChangePassword = async () => {
        if (
            !passwordLama ||
            !passwordBaru ||
            !konfirmasi
        ) {
            Alert.alert(
                "Data Belum Lengkap",
                "Semua password wajib diisi."
            );
            return;
        }

        if (passwordBaru.length < 8) {
            Alert.alert(
                "Password Tidak Valid",
                "Password baru minimal 8 karakter."
            );
            return;
        }

        if (passwordBaru !== konfirmasi) {
            Alert.alert(
                "Password Tidak Sama",
                "Konfirmasi password tidak sesuai."
            );
            return;
        }

        try {
            setSaving(true);
            const savedUser = await AsyncStorage.getItem("autocare_user");
            if (!savedUser) {
                Alert.alert("Sesi Berakhir", "Silakan login kembali.");
                router.replace("/login");
                return;
            }

            const user = JSON.parse(savedUser);

            const response = await fetch(
                `${API_URL}/api/user/change-password/${user.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        passwordLama,
                        passwordBaru,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Gagal mengubah password.");
            }

            Alert.alert(
                "Berhasil",
                "Kata sandi Anda berhasil diperbarui."
            );

            setPasswordLama("");
            setPasswordBaru("");
            setKonfirmasi("");
        } catch (error) {
            console.error("Change Password Error:", error);
            Alert.alert(
                "Gagal",
                error.message || "Terjadi kesalahan saat mengubah password."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={["top", "bottom"]}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => safeBack("/profil")}
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#222"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Keamanan
                </Text>

                <View style={styles.headerSpace} />
            </View>

            <View style={styles.content}>
                <View style={styles.securityIcon}>
                    <Ionicons
                        name="shield-checkmark-outline"
                        size={42}
                        color={RED}
                    />
                </View>

                <Text style={styles.title}>
                    Ubah Password
                </Text>

                <Text style={styles.subtitle}>
                    Gunakan password yang kuat untuk menjaga
                    keamanan akun AutoCare Anda.
                </Text>

                <PasswordInput
                    label="Password Lama"
                    value={passwordLama}
                    onChangeText={setPasswordLama}
                    visible={showLama}
                    setVisible={setShowLama}
                />

                <PasswordInput
                    label="Password Baru"
                    value={passwordBaru}
                    onChangeText={setPasswordBaru}
                    visible={showBaru}
                    setVisible={setShowBaru}
                />

                <PasswordInput
                    label="Konfirmasi Password Baru"
                    value={konfirmasi}
                    onChangeText={setKonfirmasi}
                    visible={showKonfirmasi}
                    setVisible={setShowKonfirmasi}
                />

                <TouchableOpacity
                    style={[
                        styles.button,
                        saving && {
                            opacity: 0.7,
                        },
                    ]}
                    activeOpacity={0.85}
                    onPress={handleChangePassword}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons
                                name="lock-closed-outline"
                                size={19}
                                color="#fff"
                            />

                            <Text style={styles.buttonText}>
                                Ubah Password
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function PasswordInput({
    label,
    value,
    onChangeText,
    visible,
    setVisible,
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.inputContainer}>
                <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color="#888"
                />

                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!visible}
                    placeholder={label}
                    placeholderTextColor="#AAA"
                />

                <TouchableOpacity
                    onPress={() =>
                        setVisible(!visible)
                    }
                >
                    <Ionicons
                        name={
                            visible
                                ? "eye-off-outline"
                                : "eye-outline"
                        }
                        size={20}
                        color="#888"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },

    header: {
        height: 66,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
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
        fontSize: 18,
        fontWeight: "800",
        color: "#222",
    },

    headerSpace: {
        width: 40,
    },

    content: {
        padding: 20,
    },

    securityIcon: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: "#FFF1F1",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginTop: 15,
    },

    title: {
        textAlign: "center",
        fontSize: 21,
        fontWeight: "800",
        color: "#222",
        marginTop: 18,
    },

    subtitle: {
        textAlign: "center",
        color: "#777",
        fontSize: 12,
        lineHeight: 19,
        marginTop: 7,
        marginBottom: 22,
    },

    field: {
        marginBottom: 14,
    },

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#333",
        marginBottom: 8,
    },

    inputContainer: {
        height: 52,
        backgroundColor: "#fff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
    },

    input: {
        flex: 1,
        marginHorizontal: 10,
        fontSize: 14,
        color: "#222",
    },

    button: {
        height: 52,
        borderRadius: 15,
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
    },

    buttonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "800",
    },
});