import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
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

export default function AdminServiceHistoryScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);

    const loadHistory = useCallback(async () => {
        try {
            const params = {};
            if (searchQuery.trim()) params.q = searchQuery.trim();
            const res = await adminApi.getServiceHistory(params);
            if (res.success) {
                setHistory(res.data);
            }
        } catch (err) {
            console.error("Load service history error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadHistory();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadHistory]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const formatCurrency = (amount) => {
        return "Rp " + Number(amount || 0).toLocaleString("id-ID");
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
            title="Riwayat Servis Selesai"
            subtitle="Arsip data seluruh pengerjaan servis kendaraan yang telah diselesaikan"
            onRefresh={handleRefresh}
            refreshing={refreshing}
        >
            <View style={styles.container}>
                {/* SEARCH BAR */}
                <View style={styles.topBar}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari kode booking, nama pelanggan, atau plat nomor..."
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
                        <Text style={styles.countBadgeText}>{history.length} Servis Selesai</Text>
                    </View>
                </View>

                {/* HISTORY TABLE */}
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
                                        <Text style={[styles.th, { width: 140 }]}>KODE BOOKING</Text>
                                        <Text style={[styles.th, { width: 160 }]}>PELANGGAN</Text>
                                        <Text style={[styles.th, { width: 150 }]}>KENDARAAN</Text>
                                        <Text style={[styles.th, { width: 140 }]}>BENGKEL</Text>
                                        <Text style={[styles.th, { width: 120 }]}>TANGGAL SERVIS</Text>
                                        <Text style={[styles.th, { width: 120 }]}>BIAYA AKHIR</Text>
                                        <Text style={[styles.th, { width: 80, textAlign: "center" }]}>
                                            DETAIL
                                        </Text>
                                    </View>

                                    {history.length === 0 ? (
                                        <Text style={styles.emptyText}>Belum ada riwayat servis selesai.</Text>
                                    ) : (
                                        history.map((h) => (
                                            <View key={h.id} style={styles.tableRow}>
                                                <View style={{ width: 140 }}>
                                                    <Text style={styles.codeText}>#{h.kode_booking}</Text>
                                                    <View style={styles.doneBadge}>
                                                        <Text style={styles.doneBadgeText}>Selesai</Text>
                                                    </View>
                                                </View>

                                                <View style={{ width: 160 }}>
                                                    <Text style={styles.tdBold} numberOfLines={1}>
                                                        {h.nama_pelanggan || "-"}
                                                    </Text>
                                                    <Text style={styles.tdSub} numberOfLines={1}>
                                                        {h.no_hp_pelanggan || h.email_pelanggan || "-"}
                                                    </Text>
                                                </View>

                                                <View style={{ width: 150 }}>
                                                    <Text style={styles.tdBold} numberOfLines={1}>
                                                        {h.merek} {h.model}
                                                    </Text>
                                                    <Text style={styles.tdSub} numberOfLines={1}>
                                                        {h.nomor_polisi}
                                                    </Text>
                                                </View>

                                                <Text style={[styles.td, { width: 140 }]} numberOfLines={1}>
                                                    {h.nama_bengkel || "AutoCare"}
                                                </Text>

                                                <Text style={[styles.td, { width: 120 }]}>
                                                    {formatDate(h.tanggal_booking)}
                                                </Text>

                                                <Text style={[styles.tdBold, { width: 120, color: "#059669" }]}>
                                                    {formatCurrency(h.total_harga)}
                                                </Text>

                                                <View style={[styles.actionCell, { width: 80 }]}>
                                                    <TouchableOpacity
                                                        style={styles.iconBtn}
                                                        onPress={() => setSelectedItem(h)}
                                                    >
                                                        <Ionicons name="eye-outline" size={17} color="#2563EB" />
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
                visible={!!selectedItem}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Riwayat Servis #{selectedItem?.kode_booking}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedItem(null)}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        {selectedItem ? (
                            <View style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Pelanggan:</Text>
                                    <Text style={styles.detailVal}>{selectedItem.nama_pelanggan || "-"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Kontak Pelanggan:</Text>
                                    <Text style={styles.detailVal}>
                                        {selectedItem.no_hp_pelanggan || selectedItem.email_pelanggan || "-"}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Kendaraan:</Text>
                                    <Text style={styles.detailVal}>
                                        {selectedItem.merek} {selectedItem.model} ({selectedItem.nomor_polisi})
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Bengkel Pelaksana:</Text>
                                    <Text style={styles.detailVal}>{selectedItem.nama_bengkel || "AutoCare"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Tanggal Servis:</Text>
                                    <Text style={styles.detailVal}>
                                        {formatDate(selectedItem.tanggal_booking)}, {selectedItem.jam_booking || "-"} WIB
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Total Biaya Servis:</Text>
                                    <Text style={[styles.detailVal, { color: "#059669", fontWeight: "800" }]}>
                                        {formatCurrency(selectedItem.total_harga)}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Keluhan Awal:</Text>
                                    <Text style={[styles.detailVal, { flex: 1, textAlign: "right" }]}>
                                        {selectedItem.keluhan || "Servis rutin"}
                                    </Text>
                                </View>
                                {selectedItem.catatan_admin ? (
                                    <View style={styles.noteBox}>
                                        <Text style={styles.noteLabel}>Catatan Teknisi / Admin:</Text>
                                        <Text style={styles.noteText}>{selectedItem.catatan_admin}</Text>
                                    </View>
                                ) : null}
                            </View>
                        ) : null}
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
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: "#111827",
    },
    countBadge: {
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    countBadgeText: {
        color: "#065F46",
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
        minWidth: 910,
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
    codeText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
    },
    doneBadge: {
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: "flex-start",
        marginTop: 4,
    },
    doneBadgeText: {
        color: "#065F46",
        fontSize: 10,
        fontWeight: "700",
    },
    td: {
        fontSize: 13,
        color: "#374151",
    },
    tdBold: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    tdSub: {
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
    },
    actionCell: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    iconBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: "#EFF6FF",
    },
    emptyText: {
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
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    detailLabel: {
        fontSize: 13,
        color: "#6B7280",
    },
    detailVal: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    noteBox: {
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    noteLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 2,
    },
    noteText: {
        fontSize: 12,
        color: "#6B7280",
    },
});
