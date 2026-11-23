import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../config";
import { getPhotoUrl } from "../utils/photo";
import RealtimeClock from "../components/RealtimeClock";

const RED = "#B22222";

export default function EditProfil() {
    const [user, setUser] = useState(null);

    const [nama, setNama] = useState("");
    const [email, setEmail] = useState("");
    const [noHp, setNoHp] = useState("");

    const [profilePhoto, setProfilePhoto] = useState(null);
    const [imageError, setImageError] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);

    // ── Safe back navigation ─────────────────────────
    const goBack = () => {
        safeBack("/profil");
    };

    useEffect(() => {
        loadUser();
    }, []);

    // =================================================
    // LOAD DATA
    // =================================================

    const loadUser = async () => {
        try {
            const savedUser =
                await AsyncStorage.getItem("autocare_user");

            if (!savedUser) {
                router.replace("/login");
                return;
            }

            const data = JSON.parse(savedUser);

            setUser(data);
            setNama(data.nama || "");
            setEmail(data.email || "");
            setNoHp(data.no_hp || data.noHp || "");

            // ── Load foto profil ──────────────────────────
            if (data.foto && (Platform.OS !== "web" || !data.foto.startsWith("blob:"))) {
                setProfilePhoto(data.foto);
                setImageError(false);
            } else {
                setProfilePhoto(null);
                await AsyncStorage.removeItem("autocare_profile_photo");
            }
        } catch (error) {
            console.error("Load Profile Error:", error);

            Alert.alert(
                "Error",
                "Gagal mengambil data profil."
            );
        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // GANTI FOTO PROFIL
    // =================================================

    const handleChoosePhoto = async () => {
        try {
            // WEB: Gunakan input file native browser
            if (Platform.OS === "web") {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (event) => {
                    const file = event.target.files && event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (readerEvent) => {
                        const finalUri = readerEvent.target.result;
                        setProfilePhoto(finalUri);
                        setImageError(false);
                        await AsyncStorage.setItem("autocare_profile_photo", finalUri);
                    };
                    reader.readAsDataURL(file);
                };
                input.click();
                return;
            }

            // MOBILE
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    "Izin Diperlukan",
                    "Izinkan AutoCare mengakses galeri foto Anda."
                );
                return;
            }

            setPhotoLoading(true);

            const result =
                await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                    base64: true,
                });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                let finalUri = asset.uri;

                if (asset.base64) {
                    finalUri = asset.base64.startsWith("data:")
                        ? asset.base64
                        : `data:image/jpeg;base64,${asset.base64}`;
                }

                setProfilePhoto(finalUri);
                setImageError(false);

                await AsyncStorage.setItem(
                    "autocare_profile_photo",
                    finalUri
                );
            }
        } catch (error) {
            console.log("Photo Error:", error);

            Alert.alert(
                "Gagal",
                "Tidak dapat memilih foto profil."
            );
        } finally {
            setPhotoLoading(false);
        }
    };

    // =================================================
    // SIMPAN PROFIL
    // =================================================

    const handleSave = async () => {
        if (!nama.trim()) {
            Alert.alert(
                "Data Belum Lengkap",
                "Nama lengkap wajib diisi."
            );
            return;
        }

        if (!email.trim()) {
            Alert.alert(
                "Data Belum Lengkap",
                "Email wajib diisi."
            );
            return;
        }

        try {
            setSaving(true);

            let savedPhotoResult = profilePhoto;

            // ── Simpan ke Database MySQL & Folder Uploads Backend ──
            if (user?.id) {
                try {
                    const response = await fetch(
                        `${API_URL}/api/user/profile/${user.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                nama: nama.trim(),
                                email: email.trim().toLowerCase(),
                                noHp: noHp.trim(),
                                foto: profilePhoto || null,
                            }),
                        }
                    );

                    const result = await response.json();
                    if (response.ok && result.success && result.user) {
                        if (result.user.foto) {
                            savedPhotoResult = getPhotoUrl(result.user.foto);
                        }
                    }
                } catch (apiErr) {
                    console.log("Sync profile with server error:", apiErr);
                }
            }

            const updatedUser = {
                ...user,
                nama: nama.trim(),
                email: email.trim().toLowerCase(),
                no_hp: noHp.trim(),
                noHp: noHp.trim(),
                foto: savedPhotoResult || null,
            };

            await AsyncStorage.setItem(
                "autocare_user",
                JSON.stringify(updatedUser)
            );

            if (savedPhotoResult) {
                await AsyncStorage.setItem(
                    "autocare_profile_photo",
                    savedPhotoResult
                );
            }

            Alert.alert(
                "Berhasil",
                "Data profil dan foto berhasil disimpan.",
                [
                    {
                        text: "OK",
                        onPress: () => goBack(),
                    },
                ]
            );
        } catch (error) {
            console.error("Save Profile Error:", error);

            Alert.alert(
                "Gagal",
                "Data profil gagal diperbarui."
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================================
    // LOADING
    // =================================================

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loading}>
                    <ActivityIndicator
                        size="large"
                        color={RED}
                    />

                    <Text style={styles.loadingText}>
                        Memuat profil...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // =================================================
    // RENDER
    // =================================================

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={["top", "bottom"]}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => goBack()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#222"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Edit Profil
                </Text>

                <RealtimeClock compact />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    {/* ── AVATAR FOTO PROFIL ── */}
                    <TouchableOpacity
                        style={styles.avatarWrapper}
                        activeOpacity={0.85}
                        onPress={handleChoosePhoto}
                        disabled={photoLoading}
                    >
                        {/* Foto atau Inisial */}
                        <View style={styles.avatar}>
                            {profilePhoto && !imageError ? (
                                <Image
                                    source={{ uri: getPhotoUrl(profilePhoto) }}
                                    style={styles.avatarImage}
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {nama
                                        ? nama
                                              .trim()
                                              .charAt(0)
                                              .toUpperCase()
                                        : "A"}
                                </Text>
                            )}
                        </View>

                        {/* Tombol Kamera */}
                        <View style={styles.cameraButton}>
                            {photoLoading ? (
                                <ActivityIndicator
                                    size={12}
                                    color="#FFFFFF"
                                />
                            ) : (
                                <Ionicons
                                    name="camera"
                                    size={15}
                                    color="#FFFFFF"
                                />
                            )}
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.avatarHint}>
                        Ketuk foto untuk mengubah
                    </Text>

                    {/* NAMA */}

                    <Text style={styles.label}>
                        Nama Lengkap
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="person-outline"
                            size={20}
                            color="#888"
                        />

                        <TextInput
                            style={styles.input}
                            value={nama}
                            onChangeText={setNama}
                            placeholder="Masukkan nama lengkap"
                            placeholderTextColor="#AAA"
                        />
                    </View>

                    {/* EMAIL */}

                    <Text style={styles.label}>
                        Email
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#888"
                        />

                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Masukkan email"
                            placeholderTextColor="#AAA"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* NO HP */}

                    <Text style={styles.label}>
                        Nomor HP
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="call-outline"
                            size={20}
                            color="#888"
                        />

                        <TextInput
                            style={styles.input}
                            value={noHp}
                            onChangeText={setNoHp}
                            placeholder="Masukkan nomor HP"
                            placeholderTextColor="#AAA"
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* SIMPAN */}

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            saving && { opacity: 0.7 },
                        ]}
                        activeOpacity={0.85}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons
                                    name="checkmark"
                                    size={20}
                                    color="#fff"
                                />

                                <Text
                                    style={
                                        styles.saveButtonText
                                    }
                                >
                                    Simpan Perubahan
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "800",
        color: "#222",
    },

    headerSpace: {
        width: 40,
    },

    content: {
        paddingHorizontal: 16,
        paddingTop: 28,
        paddingBottom: 40,
    },

    // ── AVATAR ──────────────────────────────────────

    avatarWrapper: {
        alignSelf: "center",
        position: "relative",
        marginBottom: 0,
    },

    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: 3,
        borderColor: "rgba(178,34,34,0.18)",
    },

    avatarImage: {
        width: 88,
        height: 88,
        borderRadius: 44,
    },

    avatarText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#fff",
        fontSize: 34,
        fontWeight: "800",
    },

    cameraButton: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },

    avatarHint: {
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        fontSize: 12,
        color: "#888",
        marginTop: 10,
        marginBottom: 25,
    },

    // ── FORM ────────────────────────────────────────

    label: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#333",
        marginBottom: 8,
        marginTop: 12,
    },

    inputContainer: {
        fontFamily: "Poppins_400Regular",
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
        fontFamily: "Poppins_400Regular",
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: "#222",
    },

    // ── TOMBOL SIMPAN ────────────────────────────────

    saveButton: {
        height: 52,
        backgroundColor: RED,
        borderRadius: 15,
        marginTop: 28,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    saveButtonText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#fff",
        fontSize: 14,
        fontWeight: "800",
    },

    // ── LOADING ──────────────────────────────────────

    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        fontFamily: "Poppins_400Regular",
        marginTop: 10,
        color: "#777",
        fontSize: 13,
    },
});