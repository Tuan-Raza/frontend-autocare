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

export default function AdminUsersScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    // Edit form states
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editStatus, setEditStatus] = useState("aktif");
    const [saving, setSaving] = useState(false);

    const loadUsers = useCallback(async () => {
        try {
            const params = {};
            if (searchQuery.trim()) params.q = searchQuery.trim();
            const res = await adminApi.getUsers(params);
            if (res.success) {
                setUsers(res.data);
            }
        } catch (err) {
            console.error("Load users error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadUsers]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadUsers();
    };

    const openDetailModal = async (user) => {
        setSelectedUser(user);
        setDetailModalVisible(true);
        setDetailLoading(true);
        try {
            const res = await adminApi.getUserDetail(user.id);
            if (res.success) {
                setSelectedUser(res.data);
            }
        } catch (err) {
            console.error("Failed to load user detail:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setEditName(user.nama || user.nama_lengkap || "");
        setEditEmail(user.email || "");
        setEditPhone(user.no_hp || user.kontak || "");
        setEditStatus(user.status || "aktif");
        setEditModalVisible(true);
    };

    const handleSaveUser = async () => {
        if (!editName.trim() || !editEmail.trim()) {
            alert("Nama dan email tidak boleh kosong");
            return;
        }

        try {
            setSaving(true);
            const res = await adminApi.updateUser(selectedUser.id, {
                nama: editName.trim(),
                email: editEmail.trim(),
                no_hp: editPhone.trim(),
                status: editStatus,
            });
            if (res.success) {
                setEditModalVisible(false);
                loadUsers();
            } else {
                alert(res.message || "Gagal menyimpan perubahan");
            }
        } catch (err) {
            alert(err.message || "Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (user) => {
        const actionLabel = user.status === "aktif" ? "menonaktifkan" : "mengaktifkan";
        const confirmMsg = `Apakah Anda yakin ingin ${actionLabel} akun pengguna ${user.nama}?`;

        const execute = async () => {
            try {
                if (user.status === "aktif") {
                    await adminApi.deleteUser(user.id);
                } else {
                    await adminApi.updateUser(user.id, { status: "aktif" });
                }
                loadUsers();
            } catch (err) {
                alert(err.message || "Gagal mengubah status pengguna");
            }
        };

        if (Platform.OS === "web") {
            if (window.confirm(confirmMsg)) execute();
        } else {
            Alert.alert("Konfirmasi", confirmMsg, [
                { text: "Batal", style: "cancel" },
                { text: "Ya, Lanjutkan", onPress: execute },
            ]);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <AdminLayout
            title="Kelola Data Pelanggan"
            subtitle="Daftar seluruh akun pelanggan yang terdaftar di AutoCare"
            onRefresh={handleRefresh}
            refreshing={refreshing}
        >
            <View style={styles.container}>
                {/* SEARCH & FILTERS HEADER */}
                <View style={styles.topBar}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari nama, email, atau nomor HP..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{users.length} Pelanggan</Text>
                    </View>
                </View>

                {/* USERS TABLE */}
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
                                        <Text style={[styles.th, { width: 180 }]}>PELANGGAN</Text>
                                        <Text style={[styles.th, { width: 140 }]}>KONTAK</Text>
                                        <Text style={[styles.th, { width: 100 }]}>KENDARAAN</Text>
                                        <Text style={[styles.th, { width: 90 }]}>BOOKING</Text>
                                        <Text style={[styles.th, { width: 100 }]}>STATUS</Text>
                                        <Text style={[styles.th, { width: 110 }]}>TERDAFTAR</Text>
                                        <Text style={[styles.th, { width: 120, textAlign: "center" }]}>
                                            AKSI
                                        </Text>
                                    </View>

                                    {users.length === 0 ? (
                                        <Text style={styles.emptyText}>Tidak ada data pelanggan.</Text>
                                    ) : (
                                        users.map((u) => (
                                            <View key={u.id} style={styles.tableRow}>
                                                <View style={{ width: 180 }}>
                                                    <Text style={styles.userName} numberOfLines={1}>
                                                        {u.nama || u.nama_lengkap}
                                                    </Text>
                                                    <Text style={styles.userEmail} numberOfLines={1}>
                                                        {u.email}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.td, { width: 140 }]} numberOfLines={1}>
                                                    {u.no_hp || u.kontak || "-"}
                                                </Text>
                                                <Text style={[styles.tdCenter, { width: 100 }]}>
                                                    {u.total_kendaraan} unit
                                                </Text>
                                                <Text style={[styles.tdCenter, { width: 90 }]}>
                                                    {u.total_booking} kali
                                                </Text>
                                                <View style={{ width: 100 }}>
                                                    <AdminStatusBadge status={u.status} type="status" />
                                                </View>
                                                <Text style={[styles.td, { width: 110 }]}>
                                                    {formatDate(u.created_at)}
                                                </Text>
                                                <View style={[styles.actionCell, { width: 120 }]}>
                                                    <TouchableOpacity
                                                        style={styles.iconBtn}
                                                        onPress={() => openDetailModal(u)}
                                                        title="Lihat Detail"
                                                    >
                                                        <Ionicons name="eye-outline" size={17} color="#2563EB" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.iconBtn}
                                                        onPress={() => openEditModal(u)}
                                                        title="Edit Data"
                                                    >
                                                        <Ionicons name="pencil-outline" size={17} color="#D97706" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.iconBtn}
                                                        onPress={() => handleToggleStatus(u)}
                                                        title="Ubah Status"
                                                    >
                                                        <Ionicons
                                                            name={u.status === "aktif" ? "ban-outline" : "checkmark-circle-outline"}
                                                            size={17}
                                                            color={u.status === "aktif" ? "#DC2626" : "#059669"}
                                                        />
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

            {/* DETAIL MODAL */}
            <Modal
                visible={detailModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detail Pengguna</Text>
                            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        {detailLoading ? (
                            <ActivityIndicator size="small" color="#C8102E" style={{ padding: 30 }} />
                        ) : selectedUser ? (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Nama Lengkap:</Text>
                                    <Text style={styles.detailVal}>
                                        {selectedUser.nama || selectedUser.nama_lengkap}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Email:</Text>
                                    <Text style={styles.detailVal}>{selectedUser.email}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Nomor Kontak:</Text>
                                    <Text style={styles.detailVal}>{selectedUser.no_hp || "-"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Status:</Text>
                                    <AdminStatusBadge status={selectedUser.status} type="status" />
                                </View>

                                {/* VEHICLES LIST */}
                                <Text style={styles.sectionSubtitle}>
                                    Kendaraan Terdaftar ({selectedUser.kendaraan?.length || 0})
                                </Text>
                                {(!selectedUser.kendaraan || selectedUser.kendaraan.length === 0) ? (
                                    <Text style={styles.emptySubText}>Belum mendaftarkan kendaraan.</Text>
                                ) : (
                                    selectedUser.kendaraan.map((k) => (
                                        <View key={k.id} style={styles.itemBox}>
                                            <Ionicons name="car-outline" size={20} color="#C8102E" />
                                            <View style={{ marginLeft: 10 }}>
                                                <Text style={styles.itemTitle}>
                                                    {k.merek} {k.model} ({k.nomor_polisi})
                                                </Text>
                                                <Text style={styles.itemSub}>
                                                    Tahun: {k.tahun} | KM: {k.kilometer || "-"}
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                )}

                                {/* BOOKING HISTORY */}
                                <Text style={styles.sectionSubtitle}>
                                    Riwayat Booking ({selectedUser.booking?.length || 0})
                                </Text>
                                {(!selectedUser.booking || selectedUser.booking.length === 0) ? (
                                    <Text style={styles.emptySubText}>Belum pernah melakukan booking.</Text>
                                ) : (
                                    selectedUser.booking.map((b) => (
                                        <View key={b.id} style={styles.itemBox}>
                                            <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                                            <View style={{ marginLeft: 10, flex: 1 }}>
                                                <Text style={styles.itemTitle}>#{b.kode_booking}</Text>
                                                <Text style={styles.itemSub}>
                                                    {formatDate(b.tanggal_booking)} | {b.keluhan || "Servis berkala"}
                                                </Text>
                                            </View>
                                            <AdminStatusBadge status={b.status} type="booking" />
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* EDIT USER MODAL */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Data Pelanggan</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Nama Pelanggan</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={editName}
                                    onChangeText={setEditName}
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Email</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={editEmail}
                                    onChangeText={setEditEmail}
                                    keyboardType="email-address"
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Nomor Kontak</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Status Akun</Text>
                                <View style={styles.statusSelectRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            editStatus === "aktif" && styles.statusOptionActive,
                                        ]}
                                        onPress={() => setEditStatus("aktif")}
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                editStatus === "aktif" && styles.statusOptionTextActive,
                                            ]}
                                        >
                                            Aktif
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            editStatus === "nonaktif" && styles.statusOptionActive,
                                        ]}
                                        onPress={() => setEditStatus("nonaktif")}
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                editStatus === "nonaktif" && styles.statusOptionTextActive,
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
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSaveUser}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
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
    countBadge: {
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    countBadgeText: {
        fontFamily: "Poppins_700Bold",
        color: "#C8102E",
        fontWeight: "700",
        fontSize: 13,
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
        minWidth: 850,
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
    userName: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    userEmail: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
    },
    td: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#374151",
    },
    tdCenter: {
        fontFamily: "Poppins_500Medium",
        fontSize: 13,
        color: "#374151",
        fontWeight: "500",
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
        maxWidth: 500,
        maxHeight: "85%",
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
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    detailLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#6B7280",
    },
    detailVal: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    sectionSubtitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
        marginTop: 18,
        marginBottom: 10,
    },
    emptySubText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#9CA3AF",
        fontStyle: "italic",
    },
    itemBox: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    itemTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    itemSub: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
    },
    formGroup: {
        marginBottom: 14,
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
