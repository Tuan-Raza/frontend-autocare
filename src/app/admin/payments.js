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
import { API_URL } from "../../config";
import { adminApi } from "../../services/adminApi";

const RED = "#C8102E";

const FILTER_TABS = [
    { key: "semua", label: "Semua" },
    { key: "menunggu_verifikasi", label: "Menunggu Verifikasi" },
    { key: "belum_dibayar", label: "Belum Dibayar (COD)" },
    { key: "terverifikasi", label: "Lunas" },
    { key: "ditolak", label: "Ditolak" },
];

export default function AdminPaymentsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payments, setPayments] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("semua");

    // Verify modal state
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [verifyNote, setVerifyNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [isProofZoomed, setIsProofZoomed] = useState(false);

    const loadPayments = useCallback(async () => {
        try {
            const params = {};
            if (searchQuery.trim()) params.q = searchQuery.trim();
            if (activeTab && activeTab !== "semua") params.status = activeTab;

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
    }, [searchQuery, activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPayments();
        }, 250);
        return () => clearTimeout(timer);
    }, [loadPayments]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadPayments();
    };

    const handleVerify = async (status) => {
        if (!selectedPayment) return;
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
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getProofUri = (bukti) => {
        if (!bukti) return null;
        if (bukti.startsWith("http") || bukti.startsWith("data:image")) return bukti;
        return `${API_URL}${bukti}`;
    };

    return (
        <AdminLayout
            title="Kelola Transaksi Pembayaran"
            subtitle="Verifikasi pembayaran QRIS dan konfirmasi transaksi COD (Bayar di Tempat)"
            onRefresh={handleRefresh}
            refreshing={refreshing}
        >
            <View style={styles.container}>
                {/* FILTER TABS */}
                <View style={styles.tabContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.tabWrapper}>
                            {FILTER_TABS.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <TouchableOpacity
                                        key={tab.key}
                                        style={[styles.tabButton, isActive && styles.tabButtonActive]}
                                        onPress={() => setActiveTab(tab.key)}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                {/* TOP BAR / SEARCH */}
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
                        <ActivityIndicator size="large" color={RED} />
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
                                        <Text style={[styles.th, { width: 150 }]}>ORDER ID</Text>
                                        <Text style={[styles.th, { width: 130 }]}>KODE BOOKING</Text>
                                        <Text style={[styles.th, { width: 160 }]}>PELANGGAN</Text>
                                        <Text style={[styles.th, { width: 120 }]}>NOMINAL</Text>
                                        <Text style={[styles.th, { width: 120 }]}>METODE</Text>
                                        <Text style={[styles.th, { width: 140 }]}>STATUS</Text>
                                        <Text style={[styles.th, { width: 120, textAlign: "center" }]}>
                                            AKSI
                                        </Text>
                                    </View>

                                    {payments.length === 0 ? (
                                        <View style={styles.emptyContainer}>
                                            <Ionicons name="receipt-outline" size={38} color="#D1D5DB" />
                                            <Text style={styles.emptyText}>Tidak ada data pembayaran.</Text>
                                        </View>
                                    ) : (
                                        payments.map((p) => {
                                            const methodClean = String(p.metode_pembayaran || "").toLowerCase();
                                            const isCod = methodClean === "cod" || methodClean === "bayar_di_tempat";
                                            const isPendingQris = p.status_verifikasi === "menunggu_verifikasi";
                                            const isUnpaidCod = isCod && (p.status_verifikasi === "belum_dibayar" || p.status_verifikasi === "menunggu_pembayaran");

                                            return (
                                                <View key={p.id} style={styles.tableRow}>
                                                    <View style={{ width: 150 }}>
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

                                                    <View style={{ width: 120 }}>
                                                        <AdminStatusBadge
                                                            status={p.metode_pembayaran}
                                                            type="method"
                                                        />
                                                    </View>

                                                    <View style={{ width: 140 }}>
                                                        <AdminStatusBadge
                                                            status={p.status_verifikasi || p.transaction_status}
                                                            type="payment"
                                                        />
                                                    </View>

                                                    <View style={[styles.actionCell, { width: 120 }]}>
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.actionBtn,
                                                                isPendingQris && styles.actionBtnPending,
                                                                isUnpaidCod && styles.actionBtnCod,
                                                            ]}
                                                            onPress={() => {
                                                                setSelectedPayment(p);
                                                                setVerifyNote("");
                                                            }}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.actionBtnText,
                                                                    (isPendingQris || isUnpaidCod) && styles.actionBtnTextActive,
                                                                ]}
                                                            >
                                                                {isPendingQris
                                                                    ? "Verifikasi"
                                                                    : isUnpaidCod
                                                                    ? "Konfirmasi"
                                                                    : "Detail"}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            );
                                        })
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* DETAIL & VERIFIKASI MODAL */}
            <Modal
                visible={!!selectedPayment}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedPayment(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Detail Transaksi Pembayaran</Text>
                                <Text style={styles.modalSubtitle}>
                                    Order ID: {selectedPayment?.order_id || "-"}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedPayment(null)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {selectedPayment ? (
                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Kode Booking:</Text>
                                    <Text style={styles.detailValBold}>#{selectedPayment.kode_booking}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Pelanggan:</Text>
                                    <Text style={styles.detailVal}>
                                        {selectedPayment.nama_pelanggan || "-"} ({selectedPayment.no_hp_pelanggan || "-"})
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Total Nominal:</Text>
                                    <Text style={[styles.detailVal, { color: RED, fontSize: 16, fontWeight: "700" }]}>
                                        {formatCurrency(selectedPayment.gross_amount)}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Metode Pembayaran:</Text>
                                    <AdminStatusBadge status={selectedPayment.metode_pembayaran} type="method" />
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Status Pembayaran:</Text>
                                    <AdminStatusBadge
                                        status={selectedPayment.status_verifikasi || selectedPayment.transaction_status}
                                        type="payment"
                                    />
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Waktu Transaksi:</Text>
                                    <Text style={styles.detailVal}>{formatDate(selectedPayment.created_at)}</Text>
                                </View>

                                {/* INFORMASI COD ATAU QRIS */}
                                {String(selectedPayment.metode_pembayaran).toLowerCase() === "cod" ||
                                String(selectedPayment.metode_pembayaran).toLowerCase() === "bayar_di_tempat" ? (
                                    <View style={styles.codNoticeBox}>
                                        <Ionicons name="information-circle" size={22} color="#15803D" />
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Text style={styles.codNoticeTitle}>Metode Bayar di Tempat (COD)</Text>
                                            <Text style={styles.codNoticeDesc}>
                                                Pelanggan memilih bayar tunai/debit langsung di bengkel. Setelah pelanggan membayar ke kasir, klik tombol "Konfirmasi Lunas (COD)" di bawah.
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    /* FOTO BUKTI QRIS */
                                    selectedPayment.bukti_transfer ? (
                                        <View style={styles.proofContainer}>
                                            <View style={styles.proofHeaderRow}>
                                                <Text style={styles.proofLabel}>Bukti Pembayaran QRIS:</Text>
                                                <TouchableOpacity
                                                    style={styles.zoomProofBtn}
                                                    onPress={() => setIsProofZoomed(true)}
                                                >
                                                    <Ionicons name="expand-outline" size={14} color={RED} />
                                                    <Text style={styles.zoomProofBtnText}>Perbesar</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.proofImageWrapper}
                                                onPress={() => setIsProofZoomed(true)}
                                                activeOpacity={0.85}
                                            >
                                                <Image
                                                    source={{ uri: getProofUri(selectedPayment.bukti_transfer) }}
                                                    style={styles.proofImage}
                                                    resizeMode="contain"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.noProofBox}>
                                            <Ionicons name="alert-circle-outline" size={20} color="#9CA3AF" />
                                            <Text style={styles.noProofText}>Belum ada foto bukti pembayaran yang diunggah.</Text>
                                        </View>
                                    )
                                )}

                                {selectedPayment.catatan ? (
                                    <View style={styles.detailBlock}>
                                        <Text style={styles.detailLabel}>Catatan Pengirim:</Text>
                                        <Text style={styles.detailValBlock}>{selectedPayment.catatan}</Text>
                                    </View>
                                ) : null}

                                {selectedPayment.catatan_penolakan ? (
                                    <View style={styles.rejectNoticeBox}>
                                        <Text style={styles.rejectNoticeTitle}>Alasan Penolakan Sebelumnya:</Text>
                                        <Text style={styles.rejectNoticeText}>{selectedPayment.catatan_penolakan}</Text>
                                    </View>
                                ) : null}

                                {selectedPayment.verified_at ? (
                                    <View style={styles.verifiedMetaBox}>
                                        <Ionicons name="checkmark-done" size={16} color="#15803D" />
                                        <Text style={styles.verifiedMetaText}>
                                            Diverifikasi oleh: {selectedPayment.verified_by_nama || "Administrator"} pada {formatDate(selectedPayment.verified_at)}
                                        </Text>
                                    </View>
                                ) : null}

                                {/* INPUT CATATAN VERIFIKASI / ALASAN TOLAK */}
                                {selectedPayment.status_verifikasi === "menunggu_verifikasi" ||
                                selectedPayment.status_verifikasi === "belum_dibayar" ? (
                                    <View style={styles.noteGroup}>
                                        <Text style={styles.noteInputLabel}>
                                            Catatan / Alasan (Opsional untuk Setuju, Wajib jika Ditolak):
                                        </Text>
                                        <TextInput
                                            style={styles.noteInput}
                                            placeholder="Contoh: Bukti transfer valid / Bukti transfer buram"
                                            placeholderTextColor="#9CA3AF"
                                            value={verifyNote}
                                            onChangeText={setVerifyNote}
                                        />
                                    </View>
                                ) : null}
                            </ScrollView>
                        ) : null}

                        {/* FOOTER ACTIONS */}
                        <View style={styles.modalFooter}>
                            {selectedPayment && selectedPayment.status_verifikasi === "menunggu_verifikasi" ? (
                                <>
                                    <TouchableOpacity
                                        style={styles.rejectBtn}
                                        onPress={() => handleVerify("ditolak")}
                                        disabled={actionLoading}
                                    >
                                        <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
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
                                            <>
                                                <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                                                <Text style={styles.approveBtnText}>Setujui (Lunas)</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            ) : selectedPayment && selectedPayment.status_verifikasi === "belum_dibayar" ? (
                                <TouchableOpacity
                                    style={[styles.approveBtn, { backgroundColor: "#15803D" }]}
                                    onPress={() => handleVerify("terverifikasi")}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
                                            <Text style={styles.approveBtnText}>Konfirmasi Lunas (COD)</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.closeBtn}
                                    onPress={() => setSelectedPayment(null)}
                                >
                                    <Text style={styles.closeBtnText}>Tutup</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL ZOOM PROOF IMAGE */}
            <Modal
                visible={isProofZoomed}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsProofZoomed(false)}
            >
                <View style={styles.zoomModalOverlay}>
                    <View style={styles.zoomCard}>
                        <View style={styles.zoomHeader}>
                            <Text style={styles.zoomTitle}>Foto Bukti Pembayaran</Text>
                            <TouchableOpacity onPress={() => setIsProofZoomed(false)}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.zoomBody}>
                            {selectedPayment?.bukti_transfer ? (
                                <Image
                                    source={{ uri: getProofUri(selectedPayment.bukti_transfer) }}
                                    style={styles.zoomImg}
                                    resizeMode="contain"
                                />
                            ) : null}
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
    tabContainer: {
        marginBottom: 16,
    },
    tabWrapper: {
        flexDirection: "row",
        gap: 8,
    },
    tabButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    tabButtonActive: {
        backgroundColor: RED,
        borderColor: RED,
    },
    tabText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#4B5563",
    },
    tabTextActive: {
        color: "#FFFFFF",
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
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    countBadgeText: {
        fontFamily: "Poppins_700Bold",
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
        paddingVertical: 40,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    table: {
        minWidth: 950,
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
    orderIdText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#111827",
    },
    td: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#4B5563",
    },
    tdBold: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#111827",
    },
    tdSub: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#9CA3AF",
        marginTop: 2,
    },
    actionCell: {
        alignItems: "center",
        justifyContent: "center",
    },
    actionBtn: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    actionBtnPending: {
        backgroundColor: "#FEF3C7",
        borderColor: "#FDE68A",
    },
    actionBtnCod: {
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
    },
    actionBtnText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#4B5563",
    },
    actionBtnTextActive: {
        color: "#92400E",
        fontWeight: "700",
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 36,
    },
    emptyText: {
        fontFamily: "Poppins_500Medium",
        color: "#9CA3AF",
        fontSize: 14,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        width: "100%",
        maxWidth: 540,
        maxHeight: "90%",
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    modalTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 16,
        color: "#111827",
    },
    modalSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    modalBody: {
        padding: 18,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: "#F9FAFB",
    },
    detailLabel: {
        fontFamily: "Poppins_500Medium",
        fontSize: 13,
        color: "#6B7280",
    },
    detailVal: {
        fontFamily: "Poppins_500Medium",
        fontSize: 13,
        color: "#111827",
    },
    detailValBold: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        color: "#111827",
    },
    detailBlock: {
        marginTop: 10,
    },
    detailValBlock: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#111827",
        backgroundColor: "#F9FAFB",
        padding: 8,
        borderRadius: 6,
        marginTop: 4,
    },
    codNoticeBox: {
        flexDirection: "row",
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
        alignItems: "flex-start",
    },
    codNoticeTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        color: "#166534",
    },
    codNoticeDesc: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#166534",
        lineHeight: 18,
        marginTop: 2,
    },
    proofContainer: {
        marginTop: 14,
    },
    proofHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    proofLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#374151",
    },
    zoomProofBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FEF2F2",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    zoomProofBtnText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 11,
        color: RED,
    },
    proofImageWrapper: {
        backgroundColor: "#F9FAFB",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 8,
        alignItems: "center",
    },
    proofImage: {
        width: "100%",
        height: 200,
        borderRadius: 6,
    },
    noProofBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    noProofText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#6B7280",
    },
    rejectNoticeBox: {
        backgroundColor: "#FEF2F2",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    rejectNoticeTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#991B1B",
    },
    rejectNoticeText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#B91C1C",
        marginTop: 2,
    },
    verifiedMetaBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#F0FDF4",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    verifiedMetaText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 12,
        color: "#166534",
    },
    noteGroup: {
        marginTop: 14,
    },
    noteInputLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#374151",
        marginBottom: 6,
    },
    noteInput: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: "#111827",
        fontFamily: "Poppins_400Regular",
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        gap: 10,
    },
    rejectBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FEF2F2",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FCA5A5",
    },
    rejectBtnText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#DC2626",
    },
    approveBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#16A34A",
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    approveBtnText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#FFFFFF",
    },
    closeBtn: {
        backgroundColor: "#F3F4F6",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    closeBtnText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#374151",
    },
    zoomModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    zoomCard: {
        width: "100%",
        maxWidth: 600,
        height: "80%",
    },
    zoomHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 12,
    },
    zoomTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 16,
        color: "#FFFFFF",
    },
    zoomBody: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    zoomImg: {
        width: "100%",
        height: "100%",
    },
});
