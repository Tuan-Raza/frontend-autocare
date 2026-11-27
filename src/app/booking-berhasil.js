import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { API_URL } from "../config";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isDesktop = Platform.OS === "web" && SCREEN_WIDTH >= 768;
const RED = "#B22222";

export default function BookingBerhasil() {
    const { bookingId, orderId, metode } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [bookingData, setBookingData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        loadData();
    }, [bookingId]);

    // Polling status verifikasi jika masih menunggu
    useEffect(() => {
        if (!bookingId) return;
        const interval = setInterval(() => {
            if (paymentData?.status_verifikasi === "menunggu_verifikasi") {
                loadData(true);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [bookingId, paymentData?.status_verifikasi]);

    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            if (!bookingId) return;

            const userData = await AsyncStorage.getItem("autocare_user");
            const token = await AsyncStorage.getItem("autocare_token");
            const user = userData ? JSON.parse(userData) : null;
            const userParam = user?.id ? `?userId=${user.id}` : "";

            const res = await fetch(`${API_URL}/api/payment/booking/${bookingId}${userParam}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const result = await res.json();

            if (res.ok && result.success) {
                setBookingData(result.data.booking);
                setPaymentData(result.data.payment);
            }
        } catch (err) {
            console.error("Load Booking Berhasil Error:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Simulasi ACC Admin langsung untuk pengujian QA
    const handleSimulasiAcc = async (newStatus) => {
        try {
            setVerifying(true);
            const targetOrderId = paymentData?.order_id || orderId;
            if (!targetOrderId) {
                Alert.alert("Perhatian", "Data pembayaran belum tersedia.");
                return;
            }

            const response = await fetch(`${API_URL}/api/payment/${targetOrderId}/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: newStatus,
                    alasan:
                        newStatus === "terverifikasi" || newStatus === "diterima"
                            ? "Pembayaran valid & telah masuk"
                            : "Bukti buram / transfer tidak sesuai",
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal memverifikasi status pembayaran");
            }

            Alert.alert("Hasil Verifikasi Status", result.message);
            await loadData(true);
        } catch (err) {
            Alert.alert("Error", err.message || "Gagal memproses verifikasi");
        } finally {
            setVerifying(false);
        }
    };

    const formatRupiah = (val) => {
        const num = Number(val) || 0;
        return `Rp ${num.toLocaleString("id-ID")}`;
    };

    const paymentMethod = paymentData?.metode_pembayaran || metode || "qris";
    const isCod =
        paymentMethod.toLowerCase() === "cod" ||
        paymentMethod.toLowerCase() === "bayar_di_tempat";
    const txStatus = paymentData?.transaction_status || "pending";
    const statusVerifikasi =
        paymentData?.status_verifikasi || (isCod ? "belum_dibayar" : "menunggu_verifikasi");

    const isApproved =
        statusVerifikasi === "terverifikasi" ||
        statusVerifikasi === "diterima" ||
        txStatus === "settlement";
    const isRejected =
        statusVerifikasi === "ditolak" ||
        txStatus === "deny" ||
        txStatus === "cancel";
    const isUnpaidCod =
        isCod &&
        (statusVerifikasi === "belum_dibayar" ||
            statusVerifikasi === "menunggu_pembayaran");
    const isPendingVerif = !isApproved && !isRejected && !isUnpaidCod;

    const getMetodeName = (method) => {
        switch (String(method).toLowerCase()) {
            case "qris":
                return "QRIS (Semua Bank & E-Wallet)";
            case "cod":
            case "bayar_di_tempat":
                return "Bayar di Tempat (Tunai di Bengkel)";
            default:
                return String(method).toUpperCase();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* TOP HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerBackBtn}
                    onPress={() => router.replace("/home")}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close" size={22} color="#111111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Status Pembayaran</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.mainCard, isDesktop && styles.desktopMainCard]}>
                    {/* ICON & TITLE HERO */}
                    <View style={styles.heroSection}>
                        <View
                            style={[
                                styles.heroIconCircle,
                                isApproved && styles.heroIconApproved,
                                isPendingVerif && styles.heroIconPending,
                                isRejected && styles.heroIconRejected,
                            ]}
                        >
                            <Ionicons
                                name={
                                    isApproved
                                        ? "checkmark-circle"
                                        : isPendingVerif
                                        ? "hourglass-outline"
                                        : "close-circle"
                                }
                                size={54}
                                color={
                                    isApproved
                                        ? "#2E7D32"
                                        : isPendingVerif
                                        ? "#F57C00"
                                        : "#C62828"
                                }
                            />
                        </View>

                        <Text style={styles.heroTitle}>
                            {isApproved
                                ? "Pembayaran Berhasil Diverifikasi!"
                                : isRejected
                                ? "Bukti Pembayaran Ditolak"
                                : isUnpaidCod
                                ? "Booking Berhasil Didaftarkan!"
                                : "Bukti Pembayaran Berhasil Dikirim!"}
                        </Text>

                        <Text style={styles.heroSubtitle}>
                            {isApproved
                                ? "Pembayaran transaksi Anda telah diverifikasi oleh admin. Booking servis Anda sudah aktif dan terkonfirmasi di sistem AutoCare."
                                : isRejected
                                ? "Bukti transfer ditolak oleh admin. Silakan buka detail pembayaran untuk mengunggah ulang bukti transfer yang benar."
                                : isUnpaidCod
                                ? "Metode Bayar di Tempat (COD) berhasil dipilih. Silakan lakukan pembayaran tunai atau debit saat tiba di bengkel."
                                : "Bukti transfer QRIS Anda telah masuk ke antrean verifikasi admin AutoCare. Status akan otomatis berubah menjadi Lunas setelah di-ACC."}
                        </Text>

                        {/* STATUS BADGE ACC */}
                        <View
                            style={[
                                styles.statusBadge,
                                isApproved && styles.statusBadgeApproved,
                                isPendingVerif && styles.statusBadgePending,
                                isRejected && styles.statusBadgeRejected,
                                isUnpaidCod && styles.statusBadgeCod,
                            ]}
                        >
                            <Ionicons
                                name={
                                    isApproved
                                        ? "shield-checkmark"
                                        : isPendingVerif
                                        ? "time-outline"
                                        : isUnpaidCod
                                        ? "cash-outline"
                                        : "alert-circle"
                                }
                                size={15}
                                color={
                                    isApproved
                                        ? "#2E7D32"
                                        : isPendingVerif
                                        ? "#E65100"
                                        : isUnpaidCod
                                        ? "#1E40AF"
                                        : "#C62828"
                                }
                            />
                            <Text
                                style={[
                                    styles.statusBadgeText,
                                    isApproved && { color: "#2E7D32" },
                                    isPendingVerif && { color: "#E65100" },
                                    isRejected && { color: "#C62828" },
                                    isUnpaidCod && { color: "#1E40AF" },
                                ]}
                            >
                                {isApproved
                                    ? "STATUS: LUNAS & DIKONFIRMASI"
                                    : isRejected
                                    ? "STATUS: BUKTI DITOLAK"
                                    : isUnpaidCod
                                    ? "STATUS: BELUM DIBAYAR (COD)"
                                    : "STATUS: MENUNGGU VERIFIKASI ADMIN"}
                            </Text>
                        </View>
                    </View>

                    {/* PANEL PENGUJIAN ACC ADMIN LIVE */}
                    {!isCod && isPendingVerif ? (
                        <View style={styles.qaCard}>
                            <View style={styles.qaHeader}>
                                <Ionicons name="construct-outline" size={17} color="#555" />
                                <Text style={styles.qaTitle}>Panel Pengujian Status ACC (Testing QA):</Text>
                            </View>
                            <Text style={styles.qaDesc}>
                                Tekan tombol di bawah untuk menguji respon status saat di-ACC atau ditolak oleh admin secara langsung:
                            </Text>
                            <View style={styles.qaBtnRow}>
                                <TouchableOpacity
                                    style={[styles.qaBtn, styles.qaBtnAccept]}
                                    onPress={() => handleSimulasiAcc("terverifikasi")}
                                    disabled={verifying}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                                    <Text style={styles.qaBtnText}>Setujui (Lunas)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.qaBtn, styles.qaBtnReject]}
                                    onPress={() => handleSimulasiAcc("ditolak")}
                                    disabled={verifying}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="close" size={16} color="#FFFFFF" />
                                    <Text style={styles.qaBtnText}>Tolak</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : null}

                    {/* TOMBOL LIHAT DETAIL PEMBAYARAN JIKA BELUM LUNAS */}
                    {!isApproved && (
                        <View style={{ width: "100%", marginBottom: 16 }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: RED,
                                    paddingVertical: 13,
                                    borderRadius: 12,
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 8,
                                    shadowColor: RED,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}
                                onPress={() =>
                                    router.replace({
                                        pathname: "/payment",
                                        params: { bookingId: String(bookingId) },
                                    })
                                }
                                activeOpacity={0.85}
                            >
                                <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
                                <Text
                                    style={{
                                        fontFamily: "Poppins_600SemiBold",
                                        color: "#FFFFFF",
                                        fontSize: 14,
                                    }}
                                >
                                    {isRejected
                                        ? "Unggah Ulang Bukti Pembayaran"
                                        : "Buka Halaman Pembayaran"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* STRUK / RECEIPT CARD */}
                    <View style={styles.receiptCard}>
                        {/* HEADER STRUK */}
                        <View style={styles.receiptTop}>
                            <Image
                                source={require("../../assets/images/autocare-logo.png")}
                                style={styles.receiptLogo}
                                resizeMode="contain"
                            />
                            <View style={styles.receiptMeta}>
                                <Text style={styles.receiptType}>STRUK TRANSAKSI RESMI</Text>
                                <Text style={styles.receiptId}>
                                    {paymentData?.order_id || orderId || `AC-BOOK-${bookingId}`}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.receiptDividerDashed} />

                        {/* TOTAL TAGIHAN */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Pembayaran</Text>
                            <Text style={styles.totalValue}>
                                {formatRupiah(paymentData?.gross_amount || bookingData?.total_harga || 0)}
                            </Text>
                        </View>

                        <View style={styles.receiptDivider} />

                        {/* DETAIL INFORMASI */}
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Kode Booking</Text>
                            <Text style={styles.detailValueBold}>{bookingData?.kode_booking || `#${bookingId}`}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Metode Pembayaran</Text>
                            <Text style={styles.detailValue}>{getMetodeName(paymentMethod)}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Nama Pemesan</Text>
                            <Text style={styles.detailValue}>{bookingData?.user_nama || "Pelanggan AutoCare"}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Bengkel Tujuan</Text>
                            <Text style={styles.detailValue}>{bookingData?.nama_bengkel || "-"}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Waktu Servis</Text>
                            <Text style={styles.detailValue}>
                                {bookingData?.tanggal_booking ? String(bookingData.tanggal_booking).split("T")[0] : "-"} | Jam {bookingData?.jam_booking?.substring(0, 5) || "-"}
                            </Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Kendaraan</Text>
                            <Text style={styles.detailValue}>
                                {bookingData?.nama_kendaraan || `${bookingData?.merek || ""} ${bookingData?.model || ""}`.trim() || "-"} ({bookingData?.nomor_polisi || "-"})
                            </Text>
                        </View>

                        {/* FOTO BUKTI TRANSFER JIKA ADA */}
                        {paymentData?.bukti_transfer ? (
                            <View style={styles.proofPreviewSection}>
                                <Text style={styles.proofTitle}>Foto Bukti Pembayaran Terlampir:</Text>
                                <View style={styles.proofImageBox}>
                                    <Image
                                        source={{
                                            uri: paymentData.bukti_transfer.startsWith("http")
                                                ? paymentData.bukti_transfer
                                                : `${API_URL}${paymentData.bukti_transfer}`,
                                        }}
                                        style={styles.proofImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>
                        ) : null}
                    </View>

                    {/* ACTION BUTTONS */}
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.replace("/riwayat-servis")}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>Lihat Riwayat Servis</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.replace("/home")}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="home-outline" size={18} color="#F20D18" />
                            <Text style={styles.secondaryButtonText}>Kembali ke Beranda</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F8FA",
    },

    header: {
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },

    headerBackBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
    },

    headerTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 16,
        fontWeight: "800",
        color: "#1A1A1A",
    },

    scrollContent: {
        paddingVertical: 20,
        paddingHorizontal: 14,
        alignItems: "center",
    },

    mainCard: {
        width: "100%",
        maxWidth: 520,
    },

    desktopMainCard: {
        backgroundColor: "#FFFFFF",
        padding: 24,
        borderRadius: 22,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
    },

    heroSection: {
        alignItems: "center",
        marginBottom: 18,
        paddingHorizontal: 8,
    },

    heroIconCircle: {
        width: 86,
        height: 86,
        borderRadius: 43,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },

    heroIconApproved: {
        backgroundColor: "rgba(46, 125, 50, 0.12)",
    },

    heroIconPending: {
        backgroundColor: "rgba(255, 152, 0, 0.12)",
    },

    heroIconRejected: {
        backgroundColor: "rgba(198, 40, 40, 0.12)",
    },

    heroTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 20,
        fontWeight: "900",
        color: "#1A1A1A",
        textAlign: "center",
        marginBottom: 6,
    },

    heroSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12.5,
        color: "#666666",
        textAlign: "center",
        lineHeight: 18,
        marginBottom: 12,
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },

    statusBadgeApproved: {
        backgroundColor: "rgba(46, 125, 50, 0.1)",
        borderColor: "rgba(46, 125, 50, 0.35)",
    },

    statusBadgePending: {
        backgroundColor: "rgba(255, 152, 0, 0.1)",
        borderColor: "rgba(255, 152, 0, 0.35)",
    },

    statusBadgeRejected: {
        backgroundColor: "rgba(198, 40, 40, 0.1)",
        borderColor: "rgba(198, 40, 40, 0.35)",
    },

    statusBadgeCod: {
        backgroundColor: "rgba(30, 64, 175, 0.1)",
        borderColor: "rgba(30, 64, 175, 0.35)",
    },

    statusBadgeText: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.3,
    },

    qaCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },

    qaHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },

    qaTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 12,
        fontWeight: "800",
        color: "#333333",
    },

    qaDesc: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#666666",
        lineHeight: 16,
        marginBottom: 10,
    },

    qaBtnRow: {
        flexDirection: "row",
        gap: 10,
    },

    qaBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 8,
        gap: 5,
    },

    qaBtnAccept: {
        backgroundColor: "#2E7D32",
    },

    qaBtnReject: {
        backgroundColor: "#C62828",
    },

    qaBtnText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontSize: 11.5,
        fontWeight: "700",
    },

    receiptCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    receiptTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 8,
    },

    receiptLogo: {
        width: 100,
        height: 40,
    },

    receiptMeta: {
        alignItems: "flex-end",
    },

    receiptType: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 9.5,
        fontWeight: "800",
        color: "#F20D18",
        letterSpacing: 0.5,
    },

    receiptId: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 10,
        color: "#888888",
        fontWeight: "600",
        marginTop: 2,
    },

    receiptDividerDashed: {
        height: 1,
        borderWidth: 1,
        borderColor: "#E8E8E8",
        borderStyle: "dashed",
        marginVertical: 12,
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 4,
    },

    totalLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#666666",
        fontWeight: "600",
    },

    totalValue: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 22,
        fontWeight: "900",
        color: "#F20D18",
    },

    receiptDivider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginVertical: 12,
    },

    detailItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 9,
    },

    detailLabel: {
        fontFamily: "Poppins_500Medium",
        fontSize: 12,
        color: "#777777",
        fontWeight: "500",
    },

    detailValue: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#222222",
        fontWeight: "600",
        textAlign: "right",
        flex: 1,
        marginLeft: 14,
    },

    detailValueBold: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 12.5,
        color: "#111111",
        fontWeight: "800",
    },

    proofPreviewSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
    },

    proofTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11.5,
        fontWeight: "700",
        color: "#444444",
        marginBottom: 8,
    },

    proofImageBox: {
        backgroundColor: "#F8F8F8",
        borderRadius: 10,
        padding: 6,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },

    proofImage: {
        width: "100%",
        height: 180,
        borderRadius: 8,
    },

    buttonGroup: {
        gap: 10,
        marginBottom: 10,
    },

    primaryButton: {
        height: 48,
        backgroundColor: "#F20D18",
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        shadowColor: "#F20D18",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },

    primaryButtonText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 13.5,
        fontWeight: "800",
    },

    secondaryButton: {
        height: 48,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#F20D18",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },

    secondaryButtonText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#F20D18",
        fontSize: 13.5,
        fontWeight: "800",
    },
});
