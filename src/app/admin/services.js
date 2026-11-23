import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
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
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { adminApi } from "../../services/adminApi";

export default function AdminServicesScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [services, setServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal Form State (Add / Edit)
    const [modalVisible, setModalVisible] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formMinutes, setFormMinutes] = useState("60");
    const [formStatus, setFormStatus] = useState("aktif");
    const [saving, setSaving] = useState(false);

    const loadServices = useCallback(async () => {
        try {
            const res = await adminApi.getServices();
            if (res.success) {
                setServices(res.data);
            }
        } catch (err) {
            console.error("Load services error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadServices();
    }, [loadServices]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadServices();
    };

    const openAddModal = () => {
        setEditingService(null);
        setFormName("");
        setFormDesc("");
        setFormPrice("");
        setFormMinutes("60");
        setFormStatus("aktif");
        setModalVisible(true);
    };

    const openEditModal = (svc) => {
        setEditingService(svc);
        setFormName(svc.nama_layanan);
        setFormDesc(svc.deskripsi || "");
        setFormPrice(String(Math.round(svc.harga || 0)));
        setFormMinutes(String(svc.estimasi_menit || 60));
        setFormStatus(svc.status || "aktif");
        setModalVisible(true);
    };

    const handleSaveService = async () => {
        if (!formName.trim() || !formPrice.trim()) {
            alert("Nama layanan dan harga wajib diisi");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                nama_layanan: formName.trim(),
                deskripsi: formDesc.trim(),
                harga: Number(formPrice),
                estimasi_menit: Number(formMinutes) || 60,
                status: formStatus,
            };

            if (editingService) {
                await adminApi.updateService(editingService.id, payload);
            } else {
                await adminApi.createService(payload);
            }

            setModalVisible(false);
            loadServices();
        } catch (err) {
            alert(err.message || "Gagal menyimpan layanan");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (svc) => {
        const confirmMsg = `Hapus atau nonaktifkan layanan "${svc.nama_layanan}"?`;

        const execute = async () => {
            try {
                await adminApi.deleteService(svc.id);
                loadServices();
            } catch (err) {
                alert(err.message || "Gagal menghapus layanan");
            }
        };

        if (Platform.OS === "web") {
            if (window.confirm(confirmMsg)) execute();
        } else {
            Alert.alert("Konfirmasi", confirmMsg, [
                { text: "Batal", style: "cancel" },
                { text: "Ya, Hapus", style: "destructive", onPress: execute },
            ]);
        }
    };

    const formatCurrency = (amount) => {
        return "Rp " + Number(amount || 0).toLocaleString("id-ID");
    };

    const filtered = services.filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.nama_layanan.toLowerCase().includes(q) ||
            (s.deskripsi && s.deskripsi.toLowerCase().includes(q))
        );
    });

    return (
        <AdminLayout
            title="Kelola Layanan Servis"
            subtitle="Master data harga paket servis, tune up, dan pergantian suku cadang"
            onRefresh={handleRefresh}
            refreshing={refreshing}
        >
            <View style={styles.container}>
                {/* TOP BAR WITH ADD BUTTON */}
                <View style={styles.topBar}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari nama layanan..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={openAddModal}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.addBtnText}>Tambah Layanan</Text>
                    </TouchableOpacity>
                </View>

                {/* SERVICES TABLE */}
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
                        <View style={styles.card}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.table}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.th, { width: 220 }]}>NAMA LAYANAN</Text>
                                        <Text style={[styles.th, { width: 140 }]}>HARGA</Text>
                                        <Text style={[styles.th, { width: 120 }]}>ESTIMASI WAKTU</Text>
                                        <Text style={[styles.th, { width: 110 }]}>DIPAKAI</Text>
                                        <Text style={[styles.th, { width: 100 }]}>STATUS</Text>
                                        <Text style={[styles.th, { width: 120, textAlign: "center" }]}>
                                            AKSI
                                        </Text>
                                    </View>

                                    {filtered.length === 0 ? (
                                        <Text style={styles.emptyText}>Tidak ada data layanan.</Text>
                                    ) : (
                                        filtered.map((s) => (
                                            <View key={s.id} style={styles.tableRow}>
                                                <View style={{ width: 220 }}>
                                                    <Text style={styles.serviceTitle} numberOfLines={1}>
                                                        {s.nama_layanan}
                                                    </Text>
                                                    <Text style={styles.serviceDesc} numberOfLines={1}>
                                                        {s.deskripsi || "Tidak ada deskripsi"}
                                                    </Text>
                                                </View>

                                                <Text style={[styles.priceText, { width: 140 }]}>
                                                    {formatCurrency(s.harga)}
                                                </Text>

                                                <Text style={[styles.td, { width: 120 }]}>
                                                    {s.estimasi_menit || 60} menit
                                                </Text>

                                                <Text style={[styles.tdBold, { width: 110 }]}>
                                                    {s.total_dipakai || 0} order
                                                </Text>

                                                <View style={{ width: 100 }}>
                                                    <AdminStatusBadge status={s.status} type="status" />
                                                </View>

                                                <View style={[styles.actionCell, { width: 120 }]}>
                                                    <TouchableOpacity
                                                        style={styles.iconBtn}
                                                        onPress={() => openEditModal(s)}
                                                    >
                                                        <Ionicons name="pencil-outline" size={17} color="#2563EB" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.iconBtn}
                                                        onPress={() => handleDelete(s)}
                                                    >
                                                        <Ionicons name="trash-outline" size={17} color="#EF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* ADD / EDIT MODAL */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingService ? "Edit Layanan Servis" : "Tambah Layanan Baru"}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Nama Layanan</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Contoh: Tune Up Mesin Motor"
                                    placeholderTextColor="#9CA3AF"
                                    value={formName}
                                    onChangeText={setFormName}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Deskripsi Singkat</Text>
                                <TextInput
                                    style={[styles.formInput, { height: 64, textAlignVertical: "top" }]}
                                    placeholder="Penjelasan pengerjaan paket servis..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    value={formDesc}
                                    onChangeText={setFormDesc}
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.formLabel}>Harga (Rp)</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="150000"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={formPrice}
                                        onChangeText={setFormPrice}
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.formLabel}>Estimasi (Menit)</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="60"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        value={formMinutes}
                                        onChangeText={setFormMinutes}
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Status Layanan</Text>
                                <View style={styles.statusSelectRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            formStatus === "aktif" && styles.statusOptionActive,
                                        ]}
                                        onPress={() => setFormStatus("aktif")}
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                formStatus === "aktif" && styles.statusOptionTextActive,
                                            ]}
                                        >
                                            Aktif
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            formStatus === "nonaktif" && styles.statusOptionActive,
                                        ]}
                                        onPress={() => setFormStatus("nonaktif")}
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                formStatus === "nonaktif" && styles.statusOptionTextActive,
                                            ]}
                                        >
                                            Nonaktif
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSaveService}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Simpan Layanan</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 12,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 42,
    },
    searchInput: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: "#111827",
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#C8102E",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
    addBtnText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
        marginLeft: 6,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    table: {
        minWidth: 810,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#F9FAFB",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    th: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11,
        fontWeight: "700",
        color: "#6B7280",
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    serviceTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
    },
    serviceDesc: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
    },
    priceText: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#C8102E",
    },
    td: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#374151",
    },
    tdBold: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    actionCell: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    iconBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: "#F3F4F6",
    },
    emptyText: {
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        padding: 30,
        color: "#9CA3AF",
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        maxWidth: 480,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    modalTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    modalBody: {
        padding: 18,
    },
    formGroup: {
        marginBottom: 14,
    },
    formRow: {
        flexDirection: "row",
        gap: 12,
    },
    formLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
    },
    formInput: {
        fontFamily: "Poppins_400Regular",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 42,
        fontSize: 13,
        color: "#111827",
    },
    statusSelectRow: {
        flexDirection: "row",
        gap: 10,
    },
    statusOption: {
        flex: 1,
        paddingVertical: 9,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        alignItems: "center",
        backgroundColor: "#F9FAFB",
    },
    statusOptionActive: {
        borderColor: "#C8102E",
        backgroundColor: "#FEF2F2",
    },
    statusOptionText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 13,
        fontWeight: "500",
        color: "#4B5563",
    },
    statusOptionTextActive: {
        fontFamily: "Poppins_700Bold",
        color: "#C8102E",
        fontWeight: "700",
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "flex-end",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        gap: 10,
    },
    cancelBtn: {
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#D1D5DB",
    },
    cancelBtnText: {
        fontFamily: "Poppins_600SemiBold",
        color: "#4B5563",
        fontSize: 13,
        fontWeight: "600",
    },
    saveBtn: {
        backgroundColor: "#C8102E",
        paddingVertical: 9,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    saveBtnText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },
});
