import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
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

const STATUS_FILTERS = [
    { label: "Semua", value: "semua" },
    { label: "Menunggu", value: "menunggu" },
    { label: "Dikonfirmasi", value: "dikonfirmasi" },
    { label: "Diproses", value: "diproses" },
    { label: "Selesai", value: "selesai" },
    { label: "Dibatalkan", value: "dibatalkan" },
];

export default function AdminBookingsScreen() {
    const params = useLocalSearchParams();
    const initialStatus = params.status || "semua";

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    // Cancel modal states
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const loadBookings = useCallback(async () => {
        try {
            const queryParams = {};
            if (statusFilter && statusFilter !== "semua") queryParams.status = statusFilter;
            if (searchQuery.trim()) queryParams.q = searchQuery.trim();

            const res = await adminApi.getBookings(queryParams);
            if (res.success) {
                setBookings(res.data);
            }
        } catch (err) {
            console.error("Load bookings error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadBookings();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadBookings]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    const handleUpdateStatus = async (bookingId, newStatus, reason = "") => {
        try {
            setActionLoading(true);
            const res = await adminApi.updateBookingStatus(bookingId, newStatus, reason);
            if (res.success) {
                setCancelModalVisible(false);
                setDetailModalVisible(false);
                setCancelReason("");
                loadBookings();
            } else {
                alert(res.message || "Gagal mengubah status booking");
            }
        } catch (err) {
            alert(err.message || "Terjadi kesalahan saat mengubah status");
        } finally {
            setActionLoading(false);
        }
    };

    const openCancelModal = (booking) => {
        setSelectedBooking(booking);
        setCancelReason("");
        setCancelModalVisible(true);
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
            title="Kelola Booking Servis"
            subtitle="Pantau dan ubah status pemesanan servis kendaraan secara real-time"
            onRefresh={handleRefresh}
            refreshing={refreshing}
        >
            <View style={styles.container}>
                {/* SEARCH & STATUS FILTER CHIPS */}
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
                </View>

                {/* STATUS FILTER PILLS */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterRow}
                >
                    {STATUS_FILTERS.map((f) => {
                        const active = statusFilter === f.value;
                        return (
                            <TouchableOpacity
                                key={f.value}
                                style={[styles.filterChip, active && styles.filterChipActive]}
                                onPress={() => setStatusFilter(f.value)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        active && styles.filterChipTextActive,
                                    ]}
                                >
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* BOOKINGS TABLE */}
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
                                        <Text style={[styles.th, { width: 130 }]}>KODE BOOKING</Text>
                                        <Text style={[styles.th, { width: 150 }]}>PELANGGAN</Text>
                                        <Text style={[styles.th, { width: 140 }]}>KENDARAAN</Text>
                                        <Text style={[styles.th, { width: 140 }]}>JADWAL SERVIS</Text>
                                        <Text style={[styles.th, { width: 110 }]}>BIAYA</Text>
                                        <Text style={[styles.th, { width: 120 }]}>STATUS</Text>
                                        <Text style={[styles.th, { width: 170, textAlign: "center" }]}>
                                            AKSI STATUS
                                        </Text>
                                    </View>

                                    {bookings.length === 0 ? (
                                        <Text style={styles.emptyText}>Tidak ada booking dengan filter ini.</Text>
                                    ) : (
                                        bookings.map((b) => (
                                            <View key={b.id} style={styles.tableRow}>
                                                <TouchableOpacity
                                                    style={{ width: 130 }}
                                                    onPress={() => {
                                                        setSelectedBooking(b);
                                                        setDetailModalVisible(true);
                                                    }}
                                                >
                                                    <Text style={styles.codeText}>#{b.kode_booking}</Text>
                                                    <Text style={styles.bengkelSub} numberOfLines={1}>
                                                        {b.nama_bengkel || "AutoCare"}
                                                    </Text>
                                                </TouchableOpacity>

                                                <View style={{ width: 150 }}>
                                                    <Text style={styles.tdBold} numberOfLines={1}>
                                                        {b.nama_pelanggan || "-"}
                                                    </Text>
                                                    <Text style={styles.tdSub} numberOfLines={1}>
                                                        {b.no_hp_pelanggan || b.email_pelanggan || "-"}
                                                    </Text>
                                                </View>

                                                <View style={{ width: 140 }}>
                                                    <Text style={styles.tdBold} numberOfLines={1}>
                                                        {b.merek} {b.model}
                                                    </Text>
                                                    <Text style={styles.tdSub} numberOfLines={1}>
                                                        {b.nomor_polisi}
                                                    </Text>
                                                </View>

                                                <View style={{ width: 140 }}>
                                                    <Text style={styles.td}>
                                                        {formatDate(b.tanggal_booking)}
                                                    </Text>
                                                    <Text style={styles.tdSub}>
                                                        {b.jam_booking ? b.jam_booking.slice(0, 5) : "09:00"} WIB
                                                    </Text>
                                                </View>

                                                <Text style={[styles.tdBold, { width: 110 }]}>
                                                    {formatCurrency(b.total_harga)}
                                                </Text>

                                                <View style={{ width: 120 }}>
                                                    <AdminStatusBadge status={b.status} type="booking" />
                                                </View>

                                                {/* ACTION BUTTONS */}
                                                <View style={[styles.actionCell, { width: 170 }]}>
                                                    {b.status === "menunggu" ? (
                                                        <TouchableOpacity
                                                            style={[styles.statusBtn, { backgroundColor: "#2563EB" }]}
                                                            onPress={() => handleUpdateStatus(b.id, "dikonfirmasi")}
                                                        >
                                                            <Text style={styles.statusBtnText}>Konfirmasi</Text>
                                                        </TouchableOpacity>
                                                    ) : null}

                                                    {b.status === "dikonfirmasi" ? (
                                                        <TouchableOpacity
                                                            style={[styles.statusBtn, { backgroundColor: "#7C3AED" }]}
                                                            onPress={() => handleUpdateStatus(b.id, "diproses")}
                                                        >
                                                            <Text style={styles.statusBtnText}>Proses</Text>
                                                        </TouchableOpacity>
                                                    ) : null}

                                                    {b.status === "diproses" ? (
                                                        <TouchableOpacity
                                                            style={[styles.statusBtn, { backgroundColor: "#059669" }]}
                                                            onPress={() => handleUpdateStatus(b.id, "selesai")}
                                                        >
                                                            <Text style={styles.statusBtnText}>Selesaikan</Text>
                                                        </TouchableOpacity>
                                                    ) : null}

                                                    {b.status !== "selesai" && b.status !== "dibatalkan" ? (
                                                        <TouchableOpacity
                                                            style={[styles.statusBtnOutline]}
                                                            onPress={() => openCancelModal(b)}
                                                        >
                                                            <Text style={styles.statusBtnOutlineText}>Tolak</Text>
                                                        </TouchableOpacity>
                                                    ) : null}

                                                    <TouchableOpacity
                                                        style={styles.detailIconBtn}
                                                        onPress={() => {
                                                            setSelectedBooking(b);
                                                            setDetailModalVisible(true);
                                                        }}
                                                    >
                                                        <Ionicons name="eye-outline" size={16} color="#4B5563" />
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
                            <Text style={styles.modalTitle}>
                                Detail Booking #{selectedBooking?.kode_booking}
                            </Text>
                            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedBooking ? (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Status Booking:</Text>
                                    <AdminStatusBadge status={selectedBooking.status} type="booking" />
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Pelanggan:</Text>
                                    <Text style={styles.detailVal}>{selectedBooking.nama_pelanggan || "-"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Kontak:</Text>
                                    <Text style={styles.detailVal}>
                                        {selectedBooking.no_hp_pelanggan || selectedBooking.email_pelanggan || "-"}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Kendaraan:</Text>
                                    <Text style={styles.detailVal}>
                                        {selectedBooking.merek} {selectedBooking.model} ({selectedBooking.nomor_polisi})
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Jadwal Servis:</Text>
                                    <Text style={styles.detailVal}>
                                        {formatDate(selectedBooking.tanggal_booking)}, {selectedBooking.jam_booking || "-"} WIB
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Bengkel Tujuan:</Text>
                                    <Text style={styles.detailVal}>{selectedBooking.nama_bengkel || "AutoCare"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Keluhan Pelanggan:</Text>
                                    <Text style={[styles.detailVal, { flex: 1, textAlign: "right" }]}>
                                        {selectedBooking.keluhan || "Tidak ada keluhan khusus"}
                                    </Text>
                                </View>

                                {selectedBooking.catatan_admin ? (
                                    <View style={styles.noteBox}>
                                        <Text style={styles.noteLabel}>Catatan Admin:</Text>
                                        <Text style={styles.noteText}>{selectedBooking.catatan_admin}</Text>
                                    </View>
                                ) : null}

                                {/* SERVICES BREAKDOWN */}
                                <Text style={styles.sectionSubtitle}>Daftar Layanan</Text>
                                {selectedBooking.layanan_list && selectedBooking.layanan_list.length > 0 ? (
                                    selectedBooking.layanan_list.map((item, idx) => (
                                        <View key={idx} style={styles.serviceItem}>
                                            <Text style={styles.serviceName}>{item.nama_layanan}</Text>
                                            <Text style={styles.servicePrice}>
                                                {formatCurrency(item.subtotal || item.harga)}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptySubText}>Paket servis standar</Text>
                                )}

                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total Pembayaran:</Text>
                                    <Text style={styles.totalVal}>{formatCurrency(selectedBooking.total_harga)}</Text>
                                </View>
                            </ScrollView>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* CANCEL / REJECT MODAL */}
            <Modal
                visible={cancelModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCancelModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tolak / Batalkan Booking</Text>
                            <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.cancelWarningText}>
                                Booking #{selectedBooking?.kode_booking} akan dibatalkan. Berikan alasan pembatalan untuk pelanggan:
                            </Text>
                            <TextInput
                                style={styles.reasonInput}
                                placeholder="Contoh: Jadwal bengkel penuh di jam tersebut..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                value={cancelReason}
                                onChangeText={setCancelReason}
                            />
                        </View>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setCancelModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Kembali</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmCancelBtn, actionLoading && { opacity: 0.6 }]}
                                onPress={() => handleUpdateStatus(selectedBooking.id, "dibatalkan", cancelReason)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmCancelBtnText}>Batalkan Booking</Text>
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
        marginBottom: 12,
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
    filterScroll: {
        marginBottom: 16,
        maxHeight: 40,
    },
    filterRow: {
        flexDirection: "row",
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    filterChipActive: {
        backgroundColor: "#C8102E",
        borderColor: "#C8102E",
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#4B5563",
    },
    filterChipTextActive: {
        color: "#FFFFFF",
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
        minWidth: 960,
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
        color: "#C8102E",
    },
    bengkelSub: {
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
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
        gap: 6,
    },
    statusBtn: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    statusBtnText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "700",
    },
    statusBtnOutline: {
        paddingVertical: 5,
        paddingHorizontal: 9,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#EF4444",
        backgroundColor: "#FEF2F2",
    },
    statusBtnOutlineText: {
        color: "#EF4444",
        fontSize: 11,
        fontWeight: "700",
    },
    detailIconBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: "#F3F4F6",
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
        fontSize: 13,
        color: "#6B7280",
    },
    detailVal: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    noteBox: {
        backgroundColor: "#FEF2F2",
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    noteLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#991B1B",
        marginBottom: 2,
    },
    noteText: {
        fontSize: 12,
        color: "#7F1D1D",
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
        marginTop: 16,
        marginBottom: 8,
    },
    serviceItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    serviceName: {
        fontSize: 13,
        color: "#374151",
    },
    servicePrice: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    emptySubText: {
        fontSize: 12,
        color: "#9CA3AF",
        fontStyle: "italic",
    },
    totalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 14,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: "#E5E7EB",
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },
    totalVal: {
        fontSize: 16,
        fontWeight: "800",
        color: "#C8102E",
    },
    cancelWarningText: {
        fontSize: 13,
        color: "#4B5563",
        marginBottom: 12,
        lineHeight: 18,
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        color: "#111827",
        minHeight: 80,
        textAlignVertical: "top",
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
        color: "#4B5563",
        fontSize: 13,
        fontWeight: "600",
    },
    confirmCancelBtn: {
        backgroundColor: "#DC2626",
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    confirmCancelBtnText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },
});
