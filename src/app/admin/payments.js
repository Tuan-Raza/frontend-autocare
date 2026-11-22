import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
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

export default function AdminPaymentsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payments, setPayments] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Verify modal state
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [verifyNote, setVerifyNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const loadPayments = useCallback(async () => {
        try {
            const params = {};
            if (searchQuery.trim()) params.q = searchQuery.trim();
            const res = await adminApi.getPayments(params);
            if (res.success) {
                setPayments(res.data);
            }
        } catch (err) {
            console.error("Load payments error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPayments();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadPayments]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadPayments();
    };

    const handleVerify = async (status) => {
        try {
            setActionLoading(true);
            const res = await adminApi.verifyPayment(selectedPayment.id, status, verifyNote);
            if (res.success) {
                setSelectedPayment(null);
                setVerifyNote("");
                loadPayments();
            } else {
                alert(res.message || "Gagal memverifikasi pembayaran");
            }
        } catch (err) {
            alert(err.message || "Terjadi kesalahan verifikasi");
        } finally {
            setActionLoading(false);
        }
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
            title="Kelola Transaksi Pembayaran"
            subtitle="Daftar pembayaran online Midtrans dan verifikasi transfer manual"
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
                            placeholder="Cari order ID, kode booking, atau nama pelanggan..."
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
                        <Text style={styles.countBadgeText}>{payments.length} Transaksi</Text>
                    </View>
                </View>

                {/* PAYMENTS TABLE */}
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
                                        <Text style={[styles.th, { width: 140 }]}>ORDER ID</Text>
                                        <Text style={[styles.th, { width: 130 }]}>KODE BOOKING</Text>
                                        <Text style={[styles.th, { width: 160 }]}>PELANGGAN</Text>
                                        <Text style={[styles.th, { width: 120 }]}>NOMINAL</Text>
                                        <Text style={[styles.th, { width: 120 }]}>METODE</Text>
                                        <Text style={[styles.th, { width: 120 }]}>STATUS</Text>
                                        <Text style={[styles.th, { width: 110, textAlign: "center" }]}>
                                            AKSI
                                        </Text>
                                    </View>

                                    {payments.length === 0 ? (
                                        <Text style={styles.emptyText}>Tidak ada data pembayaran.</Text>
                                    ) : (
                                        payments.map((p) => (
                                            <View key={p.id} style={styles.tableRow}>
                                                <View style={{ width: 140 }}>
                                                    <Text style={styles.orderIdText} numberOfLines={1}>
                                                        {p.order_id || `#PAY-${p.id}`}
                                                    </Text>
                                                    <Text style={styles.tdSub}>
                                                        {formatDate(p.created_at)}
                                                    </Text>
                                                </View>

                                                <Text style={[styles.tdBold, { width: 130 }]}>
                                                    #{p.kode_booking || "-"}
                                                </Text>

                                                <View style={{ width: 160 }}>
                                                    <Text style={styles.tdBold} numberOfLines={1}>
                                                        {p.nama_pelanggan || "-"}
                                                    </Text>
                                                    <Text style={styles.tdSub} numberOfLines={1}>
                                                        {p.no_hp_pelanggan || p.email_pelanggan || "-"}
                                                    </Text>
                                                </View>

                                                <Text style={[styles.tdBold, { width: 120, color: "#111827" }]}>
                                                    {formatCurrency(p.gross_amount)}
                                                </Text>

                                                <Text style={[styles.td, { width: 120 }]}>
                                                    {p.metode_pembayaran || p.payment_type || "Transfer Bank"}
                                                </Text>

                                                <View style={{ width: 120 }}>
                                                    <AdminStatusBadge
                                                        status={p.status_verifikasi || p.transaction_status}
                                                        type="payment"
                                                    />
                                                </View>

                                                <View style={[styles.actionCell, { width: 110 }]}>
                                                    <TouchableOpacity
                                                        style={styles.verifyBtn}
                                                        onPress={() => setSelectedPayment(p)}
                                                    >
                                                        <Text style={styles.verifyBtnText}>
                                                            {p.bukti_transfer ? "Verifikasi" : "Detail"}
                                                        </Text>
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

            {/* PAYMENT VERIFICATION / DETAIL MODAL */}
            <Modal
                visible={!!selectedPayment}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedPayment(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detail Pembayaran</Text>
                            <TouchableOpacity onPress={() => setSelectedPayment(null)}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedPayment ? (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Order ID:</Text>
                                    <Text style={styles.detailVal}>{selectedPayment.order_id}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Kode Booking:</Text>
                                    <Text style={styles.detailVal}>#{selectedPayment.kode_booking}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Pelanggan:</Text>
                                    <Text style={styles.detailVal}>{selectedPayment.nama_pelanggan || "-"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Total Nominal:</Text>
                                    <Text style={[styles.detailVal, { color: "#C8102E", fontSize: 15 }]}>
                                        {formatCurrency(selectedPayment.gross_amount)}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Metode Pembayaran:</Text>
                                    <Text style={styles.detailVal}>
                                        {selectedPayment.metode_pembayaran || selectedPayment.payment_type || "-"}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Status Pembayaran:</Text>
                                    <AdminStatusBadge
                                        status={selectedPayment.status_verifikasi || selectedPayment.transaction_status}
                                        type="payment"
                                    />
                                </View>

                                {/* BUKTI TRANSFER IMAGE IF AVAILABLE */}
                                {selectedPayment.bukti_transfer ? (
                                    <View style={styles.proofContainer}>
                                        <Text style={styles.proofLabel}>Bukti Transfer Manual:</Text>
                                        <Image
                                            source={{ uri: selectedPayment.bukti_transfer }}
                                            style={styles.proofImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : null}

                                <View style={styles.noteGroup}>
                                    <Text style={styles.noteInputLabel}>Catatan Verifikasi (Opsional):</Text>
                                    <TextInput
                                        style={styles.noteInput}
                                        placeholder="Catatan untuk pelanggan..."
                                        placeholderTextColor="#9CA3AF"
                                        value={verifyNote}
                                        onChangeText={setVerifyNote}
                                    />
                                </View>
                            </ScrollView>
                        ) : null}

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => handleVerify("ditolak")}
                                disabled={actionLoading}
                            >
                                <Text style={styles.rejectBtnText}>Tolak Pembayaran</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.approveBtn}
                                onPress={() => handleVerify("terverifikasi")}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.approveBtnText}>Setujui / Verifikasi</Text>
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
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: "#111827",
    },
    countBadge: {
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    countBadgeText: {
        color: "#92400E",
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
        minWidth: 900,
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
    orderIdText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
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
    verifyBtn: {
        backgroundColor: "#FEF2F2",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    verifyBtnText: {
        color: "#C8102E",
        fontSize: 12,
        fontWeight: "700",
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
    proofContainer: {
        marginTop: 14,
        padding: 12,
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    proofLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    proofImage: {
        width: "100%",
        height: 180,
        backgroundColor: "#E5E7EB",
        borderRadius: 6,
    },
    noteGroup: {
        marginTop: 14,
    },
    noteInputLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
    },
    noteInput: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        fontSize: 13,
        color: "#111827",
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "flex-end",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        gap: 10,
    },
    rejectBtn: {
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#EF4444",
        backgroundColor: "#FEF2F2",
    },
    rejectBtnText: {
        color: "#EF4444",
        fontSize: 13,
        fontWeight: "700",
    },
    approveBtn: {
        backgroundColor: "#059669",
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    approveBtnText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },
});
