import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AdminLayout from "../../components/admin/AdminLayout";
import { adminApi } from "../../services/adminApi";

export default function AdminSettingsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [adminName, setAdminName] = useState("");
    const [adminPhone, setAdminPhone] = useState("");
    const [workshopName, setWorkshopName] = useState("");
    const [workshopAddress, setWorkshopAddress] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const loadSettings = useCallback(async () => {
        try {
            const res = await adminApi.getSettings();
            if (res.success && res.data) {
                setAdminName(res.data.nama_admin || "");
                setAdminPhone(res.data.kontak_admin || "");
                setWorkshopName(res.data.nama_autocare || "AutoCare Service Center");
                setWorkshopAddress(res.data.alamat_autocare || "");
            }
        } catch (err) {
            console.error("Load settings error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadSettings();
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSuccessMessage("");
            const res = await adminApi.updateSettings({
                nama_admin: adminName.trim(),
                kontak_admin: adminPhone.trim(),
                nama_autocare: workshopName.trim(),
                alamat_autocare: workshopAddress.trim(),
            });

            if (res.success) {
                setSuccessMessage("Pengaturan sistem berhasil disimpan!");
                setTimeout(() => setSuccessMessage(""), 4000);
            } else {
                alert(res.message || "Gagal menyimpan pengaturan");
            }
        } catch (err) {
            alert(err.message || "Terjadi kesalahan saat menyimpan");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout
            title="Pengaturan Sistem"
            subtitle="Konfigurasi data operasional pusat bengkel dan profil administrator"
            onRefresh={handleRefresh}
            refreshing={refreshing}
        >
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#C8102E" />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollArea}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                    >
                        {successMessage ? (
                            <View style={styles.successAlert}>
                                <Ionicons name="checkmark-circle" size={18} color="#065F46" />
                                <Text style={styles.successText}>{successMessage}</Text>
                            </View>
                        ) : null}

                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Profil Pusat Servis AutoCare</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Nama Bengkel / Service Center</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="AutoCare Service Center"
                                    placeholderTextColor="#9CA3AF"
                                    value={workshopName}
                                    onChangeText={setWorkshopName}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Alamat Lengkap Bengkel</Text>
                                <TextInput
                                    style={[styles.input, { height: 70, textAlignVertical: "top" }]}
                                    placeholder="Jl. Raya Otomotif No. 123, Jakarta"
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    value={workshopAddress}
                                    onChangeText={setWorkshopAddress}
                                />
                            </View>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Kontak & Administrator Default</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Nama Administrator</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Administrator AutoCare"
                                    placeholderTextColor="#9CA3AF"
                                    value={adminName}
                                    onChangeText={setAdminName}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Nomor Kontak Layanan (WhatsApp / Telepon)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="081234567890"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                    value={adminPhone}
                                    onChangeText={setAdminPhone}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                disabled={saving}
                                activeOpacity={0.8}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                                        <Text style={styles.saveBtnText}>Simpan Pengaturan</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </View>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
        maxWidth: 700,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    successAlert: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D1FAE5",
        borderWidth: 1,
        borderColor: "#A7F3D0",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    successText: {
        fontFamily: "Poppins_600SemiBold",
        color: "#065F46",
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 8,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
    },
    input: {
        fontFamily: "Poppins_400Regular",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 42,
        fontSize: 13,
        color: "#111827",
        backgroundColor: "#F9FAFB",
    },
    saveBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#C8102E",
        paddingVertical: 11,
        borderRadius: 8,
        marginTop: 8,
        gap: 6,
    },
    saveBtnText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
});
