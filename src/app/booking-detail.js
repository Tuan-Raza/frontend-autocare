import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../config";
import { getCarImage } from "./carImages";
import AnimatedModalCard from "../components/AnimatedModalCard";

const RED = "#B22222";
const GREEN = "#2E9D59";

export default function BookingDetail() {
    const { id } = useLocalSearchParams();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ── CRUD Action States ──────────────────────────────────
    const [actionLoading, setActionLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditKeluhanModal, setShowEditKeluhanModal] = useState(false);
    const [editKeluhanText, setEditKeluhanText] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            setError("");

            if (!id) {
                setError("ID booking tidak ditemukan.");
                return;
            }

            const response = await fetch(
                `${API_URL}/api/booking/${id}`
            );

            const data = await response.json();

            console.log("DETAIL BOOKING:", data);

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Gagal mengambil detail booking"
                );
            }

            setBooking(data.data);
        } catch (err) {
            console.error("Booking Detail Error:", err);

            setError(
                err.message ||
                    "Terjadi kesalahan saat mengambil detail booking."
            );
        } finally {
            setLoading(false);
        }
    };

    // ── Cancel Booking ──────────────────────────────────────
    const handleCancelBooking = async () => {
        try {
            setActionLoading(true);
            const response = await fetch(`${API_URL}/api/booking/${id}/cancel`, {
                method: "PUT",
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Gagal membatalkan booking");
            }

            setShowCancelModal(false);
            await fetchDetail();
        } catch (err) {
            console.error("Cancel Booking Error:", err);
            Alert.alert("Gagal Membatalkan", err.message || "Terjadi kesalahan saat membatalkan booking.");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Delete Booking ──────────────────────────────────────
    const handleDeleteBooking = async () => {
        try {
            setActionLoading(true);
            const response = await fetch(`${API_URL}/api/booking/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Gagal menghapus booking");
            }

            setShowDeleteModal(false);
            router.replace("/riwayat-servis");
        } catch (err) {
            console.error("Delete Booking Error:", err);
            Alert.alert("Gagal Menghapus", err.message || "Terjadi kesalahan saat menghapus booking.");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Edit Keluhan / Notes ────────────────────────────────
    const handleOpenEditKeluhan = (currentKeluhan) => {
        setEditKeluhanText(currentKeluhan || "");
        setShowEditKeluhanModal(true);
    };

    const handleSaveKeluhan = async () => {
        try {
            setEditLoading(true);
            const response = await fetch(`${API_URL}/api/booking/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    keluhan: editKeluhanText.trim(),
                }),
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Gagal memperbarui catatan");
            }

            setShowEditKeluhanModal(false);
            await fetchDetail();
        } catch (err) {
            console.error("Save Keluhan Error:", err);
            Alert.alert("Gagal Memperbarui", err.message || "Gagal memperbarui catatan keluhan.");
        } finally {
            setEditLoading(false);
        }
    };

    const formatTanggal = (tanggal) => {
        if (!tanggal) return "-";

        const date = new Date(tanggal);

        if (Number.isNaN(date.getTime())) {
            return tanggal;
        }

        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatJam = (jam) => {
        if (!jam) return "-";

        return String(jam).substring(0, 5);
    };

    const formatRupiah = (value) => {
        const number = Number(value || 0);

        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number);
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "menunggu":
                return "Menunggu";

            case "dikonfirmasi":
                return "Dikonfirmasi";

            case "diproses":
                return "Sedang Diproses";

            case "selesai":
                return "Selesai";

            case "dibatalkan":
                return "Dibatalkan";

            default:
                return status || "-";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "selesai":
                return GREEN;

            case "dibatalkan":
                return "#D32F2F";

            case "diproses":
                return "#1976D2";

            case "dikonfirmasi":
                return "#F57C00";

            default:
                return "#777";
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color={RED}
                    />

                    <Text style={styles.loadingText}>
                        Memuat detail booking...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !booking) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => safeBack("/riwayat-servis")}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#222"
                        />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        Detail Booking
                    </Text>

                    <View style={styles.headerSpace} />
                </View>

                <View style={styles.errorContainer}>
                    <View style={styles.errorIcon}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={42}
                            color={RED}
                        />
                    </View>

                    <Text style={styles.errorTitle}>
                        Gagal Memuat Data
                    </Text>

                    <Text style={styles.errorText}>
                        {error || "Detail booking tidak ditemukan."}
                    </Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchDetail}
                    >
                        <Ionicons
                            name="refresh"
                            size={18}
                            color="#fff"
                        />

                        <Text style={styles.retryText}>
                            Coba Lagi
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    /*
     * Antisipasi beberapa kemungkinan nama field
     * dari response backend.
     */
    const b = booking?.booking || booking || {};

    const kodeBooking =
        b.kode_booking ||
        b.kodeBooking ||
        "-";

    const namaBengkel =
        b.nama_bengkel ||
        b.namaBengkel ||
        "-";

    const alamatBengkel =
        b.alamat_bengkel ||
        b.alamatBengkel ||
        b.alamat ||
        "";

    const merek = b.merek || "-";

    const model = b.model || "-";

    const nomorPolisi =
        b.nomor_polisi ||
        b.nomorPolisi ||
        "-";

    const tahun = b.tahun || "-";

    const kilometer = b.kilometer ?? "-";

    const tanggal =
        b.tanggal_booking ||
        b.tanggalBooking;

    const jam =
        b.jam_booking ||
        b.jamBooking;

    const status = b.status || "menunggu";

    const totalHarga =
        b.total_harga ??
        b.totalHarga ??
        0;

    const keluhan = b.keluhan || "";

    const layanan =
        booking?.layanan ||
        b.layanan ||
        b.detail_layanan ||
        b.details ||
        [];

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={["top", "bottom"]}
        >
            {/* HEADER */}

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => safeBack("/riwayat-servis")}
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#222"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Detail Booking
                </Text>

                <View style={styles.headerSpace} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* STATUS */}

                <View style={styles.statusCard}>
                    <View style={styles.successIcon}>
                        <Ionicons
                            name={
                                status === "dibatalkan"
                                    ? "close"
                                    : status === "selesai"
                                    ? "checkmark"
                                    : "calendar-outline"
                            }
                            size={28}
                            color="#fff"
                        />
                    </View>

                    <View style={styles.statusInfo}>
                        <Text style={styles.statusTitle}>
                            Status Booking
                        </Text>

                        <Text
                            style={[
                                styles.statusValue,
                                {
                                    color: getStatusColor(
                                        status
                                    ),
                                },
                            ]}
                        >
                            {getStatusLabel(status)}
                        </Text>
                    </View>
                </View>

                {/* KODE BOOKING */}

                <View style={styles.bookingCodeCard}>
                    <View>
                        <Text style={styles.smallLabel}>
                            Kode Booking
                        </Text>

                        <Text style={styles.bookingCode}>
                            {kodeBooking}
                        </Text>
                    </View>

                    <Ionicons
                        name="receipt-outline"
                        size={30}
                        color={RED}
                    />
                </View>

                {/* KENDARAAN */}

                <Text style={styles.sectionTitle}>
                    Kendaraan
                </Text>

                <View style={styles.card}>
                    <View style={styles.vehicleHeaderRow}>
                        <View style={styles.vehicleIcon}>
                            <Ionicons
                                name="car-sport-outline"
                                size={30}
                                color={RED}
                            />
                        </View>

                        <View style={styles.vehicleImageWrap}>
                            <Image
                                source={getCarImage(merek)}
                                style={styles.vehicleCarImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleName}>
                            {merek} {model}
                        </Text>

                        <View style={styles.vehicleRow}>
                            <Ionicons
                                name="card-outline"
                                size={15}
                                color="#777"
                            />

                            <Text style={styles.vehicleText}>
                                {nomorPolisi}
                            </Text>
                        </View>

                        <View style={styles.vehicleRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={15}
                                color="#777"
                            />

                            <Text style={styles.vehicleText}>
                                Tahun {tahun}
                            </Text>
                        </View>

                        <View style={styles.vehicleRow}>
                            <Ionicons
                                name="speedometer-outline"
                                size={15}
                                color="#777"
                            />

                            <Text style={styles.vehicleText}>
                                {kilometer} km
                            </Text>
                        </View>
                    </View>
                </View>

                {/* BENGKEL */}

                <Text style={styles.sectionTitle}>
                    Bengkel
                </Text>

                <View style={styles.card}>
                    <View style={styles.infoIcon}>
                        <Ionicons
                            name="business-outline"
                            size={27}
                            color={RED}
                        />
                    </View>

                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>
                            {namaBengkel}
                        </Text>

                        {alamatBengkel ? (
                            <View style={styles.detailRow}>
                                <Ionicons
                                    name="location-outline"
                                    size={16}
                                    color="#777"
                                />

                                <Text style={styles.detailText}>
                                    {alamatBengkel}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* JADWAL */}

                <Text style={styles.sectionTitle}>
                    Jadwal Service
                </Text>

                <View style={styles.card}>
                    <View style={styles.scheduleRow}>
                        <View style={styles.scheduleItem}>
                            <View style={styles.scheduleIcon}>
                                <Ionicons
                                    name="calendar-outline"
                                    size={21}
                                    color={RED}
                                />
                            </View>

                            <View>
                                <Text style={styles.smallLabel}>
                                    Tanggal
                                </Text>

                                <Text style={styles.scheduleText}>
                                    {formatTanggal(tanggal)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.scheduleItem}>
                            <View style={styles.scheduleIcon}>
                                <Ionicons
                                    name="time-outline"
                                    size={21}
                                    color={RED}
                                />
                            </View>

                            <View>
                                <Text style={styles.smallLabel}>
                                    Jam
                                </Text>

                                <Text style={styles.scheduleText}>
                                    {formatJam(jam)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* LAYANAN */}

                <Text style={styles.sectionTitle}>
                    Layanan Service
                </Text>

                <View style={styles.card}>
                    {Array.isArray(layanan) &&
                    layanan.length > 0 ? (
                        layanan.map((item, index) => {
                            const namaLayanan =
                                item.nama_layanan ||
                                item.namaLayanan ||
                                item.nama ||
                                "Layanan";

                            const qty =
                                Number(item.qty || 1);

                            const harga =
                                Number(
                                    item.harga || 0
                                );

                            const subtotal =
                                Number(
                                    item.subtotal ??
                                        harga * qty
                                );

                            return (
                                <View
                                    key={
                                        item.id ||
                                        item.layanan_id ||
                                        index
                                    }
                                    style={[
                                        styles.serviceRow,
                                        index <
                                        layanan.length - 1
                                            ? styles.serviceBorder
                                            : null,
                                    ]}
                                >
                                    <View
                                        style={
                                            styles.serviceLeft
                                        }
                                    >
                                        <View
                                            style={
                                                styles.serviceIcon
                                            }
                                        >
                                            <Ionicons
                                                name="construct-outline"
                                                size={19}
                                                color={
                                                    RED
                                                }
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.serviceNameWrap
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.serviceName
                                                }
                                            >
                                                {
                                                    namaLayanan
                                                }
                                            </Text>

                                            <Text
                                                style={
                                                    styles.serviceQty
                                                }
                                            >
                                                {qty} x{" "}
                                                {formatRupiah(
                                                    harga
                                                )}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text
                                        style={
                                            styles.servicePrice
                                        }
                                    >
                                        {formatRupiah(
                                            subtotal
                                        )}
                                    </Text>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyText}>
                            Tidak ada detail layanan.
                        </Text>
                    )}

                    {/* TOTAL */}

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                            Total Pembayaran
                        </Text>

                        <Text style={styles.totalValue}>
                            {formatRupiah(totalHarga)}
                        </Text>
                    </View>
                </View>

                {/* KELUHAN / CATATAN */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                        Keluhan & Catatan
                    </Text>
                    {status !== "selesai" && status !== "dibatalkan" && (
                        <TouchableOpacity
                            style={styles.editKeluhanBtn}
                            onPress={() => handleOpenEditKeluhan(keluhan)}
                        >
                            <Ionicons name="pencil-outline" size={14} color="#1E88E5" />
                            <Text style={styles.editKeluhanText}>
                                {keluhan ? "Ubah Catatan" : "Tambah Catatan"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.card}>
                    <View style={styles.complaintHeader}>
                        <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={20}
                            color={RED}
                        />

                        <Text style={styles.complaintTitle}>
                            Keluhan Kendaraan
                        </Text>
                    </View>

                    <Text style={styles.complaintText}>
                        {keluhan || "Tidak ada catatan keluhan khusus."}
                    </Text>
                </View>

                {/* BOOKING INFO */}

                <Text style={styles.sectionTitle}>
                    Informasi Booking
                </Text>

                <View style={styles.card}>
                    <InfoRow
                        icon="document-text-outline"
                        label="Kode Booking"
                        value={kodeBooking}
                    />

                    <InfoRow
                        icon="calendar-outline"
                        label="Tanggal"
                        value={formatTanggal(tanggal)}
                    />

                    <InfoRow
                        icon="time-outline"
                        label="Jam"
                        value={formatJam(jam)}
                    />

                    <InfoRow
                        icon="information-circle-outline"
                        label="Status"
                        value={getStatusLabel(status)}
                    />
                </View>

                {/* ACTION BUTTONS (CRUD) */}
                <View style={styles.actionSection}>
                    {/* CANCEL BOOKING */}
                    {(status === "menunggu" || status === "dikonfirmasi") && (
                        <TouchableOpacity
                            style={styles.cancelBookingButton}
                            activeOpacity={0.85}
                            onPress={() => setShowCancelModal(true)}
                        >
                            <Ionicons
                                name="close-circle-outline"
                                size={19}
                                color="#C8102E"
                            />
                            <Text style={styles.cancelBookingText}>
                                Batalkan Booking
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* DELETE BOOKING */}
                    {(status === "dibatalkan" || status === "selesai") && (
                        <TouchableOpacity
                            style={styles.deleteBookingButton}
                            activeOpacity={0.85}
                            onPress={() => setShowDeleteModal(true)}
                        >
                            <Ionicons
                                name="trash-outline"
                                size={19}
                                color="#C8102E"
                            />
                            <Text style={styles.deleteBookingText}>
                                Hapus Riwayat Booking
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* BACK BUTTON */}
                    <TouchableOpacity
                        style={styles.backHomeButton}
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push("/riwayat-servis")
                        }
                    >
                        <Ionicons
                            name="arrow-back"
                            size={19}
                            color="#fff"
                        />

                        <Text style={styles.backHomeText}>
                            Kembali ke Riwayat Service
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* MODAL BATALKAN BOOKING */}
                <Modal
                    visible={showCancelModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowCancelModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <AnimatedModalCard style={styles.modalCard} visible={showCancelModal}>
                            <View style={[styles.modalIconWrap, { backgroundColor: "#FFF1F2" }]}>
                                <Ionicons name="alert-circle-outline" size={28} color="#C8102E" />
                            </View>
                            <Text style={styles.modalTitle}>Batalkan Booking?</Text>
                            <Text style={styles.modalSubtitle}>
                                Anda yakin ingin membatalkan jadwal booking ({kodeBooking})? Slot waktu di bengkel akan dikembalikan.
                            </Text>

                            <View style={styles.modalBtnRow}>
                                <Pressable
                                    style={[styles.modalBtn, styles.modalBtnCancel]}
                                    onPress={() => setShowCancelModal(false)}
                                    disabled={actionLoading}
                                >
                                    <Text style={styles.modalBtnCancelText}>Tutup</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalBtn, styles.modalBtnDanger]}
                                    onPress={handleCancelBooking}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.modalBtnDangerText}>Ya, Batalkan</Text>
                                    )}
                                </Pressable>
                            </View>
                        </AnimatedModalCard>
                    </View>
                </Modal>

                {/* MODAL HAPUS RIWAYAT BOOKING */}
                <Modal
                    visible={showDeleteModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDeleteModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <AnimatedModalCard style={styles.modalCard} visible={showDeleteModal}>
                            <View style={[styles.modalIconWrap, { backgroundColor: "#FFF1F2" }]}>
                                <Ionicons name="trash-outline" size={28} color="#C8102E" />
                            </View>
                            <Text style={styles.modalTitle}>Hapus Riwayat Booking?</Text>
                            <Text style={styles.modalSubtitle}>
                                Data booking ({kodeBooking}) ini akan dihapus secara permanen dari riwayat Anda.
                            </Text>

                            <View style={styles.modalBtnRow}>
                                <Pressable
                                    style={[styles.modalBtn, styles.modalBtnCancel]}
                                    onPress={() => setShowDeleteModal(false)}
                                    disabled={actionLoading}
                                >
                                    <Text style={styles.modalBtnCancelText}>Batal</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalBtn, styles.modalBtnDanger]}
                                    onPress={handleDeleteBooking}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.modalBtnDangerText}>Hapus</Text>
                                    )}
                                </Pressable>
                            </View>
                        </AnimatedModalCard>
                    </View>
                </Modal>

                {/* MODAL EDIT KELUHAN */}
                <Modal
                    visible={showEditKeluhanModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowEditKeluhanModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <AnimatedModalCard style={styles.modalCard} visible={showEditKeluhanModal}>
                            <View style={[styles.modalIconWrap, { backgroundColor: "#E3F2FD" }]}>
                                <Ionicons name="pencil-outline" size={26} color="#1E88E5" />
                            </View>
                            <Text style={styles.modalTitle}>Catatan Keluhan</Text>
                            <Text style={styles.modalSubtitle}>
                                Tuliskan detail keluhan atau instruksi tambahan untuk teknisi
                            </Text>

                            <TextInput
                                style={styles.modalTextInput}
                                value={editKeluhanText}
                                onChangeText={setEditKeluhanText}
                                placeholder="Tuliskan keluhan kendaraan Anda..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
                            />

                            <View style={styles.modalBtnRow}>
                                <Pressable
                                    style={[styles.modalBtn, styles.modalBtnCancel]}
                                    onPress={() => setShowEditKeluhanModal(false)}
                                    disabled={editLoading}
                                >
                                    <Text style={styles.modalBtnCancelText}>Batal</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalBtn, styles.modalBtnPrimary]}
                                    onPress={handleSaveKeluhan}
                                    disabled={editLoading}
                                >
                                    {editLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.modalBtnPrimaryText}>Simpan</Text>
                                    )}
                                </Pressable>
                            </View>
                        </AnimatedModalCard>
                    </View>
                </Modal>

                <View style={{ height: 35 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

/* =====================================================
   COMPONENT INFO ROW
===================================================== */

function InfoRow({
    icon,
    label,
    value,
}) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoRowIcon}>
                <Ionicons
                    name={icon}
                    size={19}
                    color={RED}
                />
            </View>

            <View style={styles.infoRowContent}>
                <Text style={styles.infoRowLabel}>
                    {label}
                </Text>

                <Text style={styles.infoRowValue}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

/* =====================================================
   STYLE
===================================================== */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },

    header: {
        height: 66,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },

    headerTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "800",
        color: "#222222",
    },

    headerSpace: {
        width: 40,
    },

    content: {
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 30,
    },

    /* LOADING */

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        fontFamily: "Poppins_400Regular",
        marginTop: 12,
        fontSize: 14,
        color: "#777777",
    },

    /* ERROR */

    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 30,
    },

    errorIcon: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#FDEAEA",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
    },

    errorTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 19,
        fontWeight: "800",
        color: "#222222",
        marginBottom: 7,
    },

    errorText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#777777",
        textAlign: "center",
        lineHeight: 20,
    },

    retryButton: {
        marginTop: 20,
        height: 48,
        paddingHorizontal: 22,
        borderRadius: 14,
        backgroundColor: RED,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    retryText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },

    /* STATUS */

    statusCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EEEEEE",
        marginBottom: 12,
    },

    successIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: GREEN,
        alignItems: "center",
        justifyContent: "center",
    },

    statusInfo: {
        marginLeft: 13,
        flex: 1,
    },

    statusTitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#888888",
        marginBottom: 4,
    },

    statusValue: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 17,
        fontWeight: "800",
    },

    /* BOOKING CODE */

    bookingCodeCard: {
        backgroundColor: "#FFF5F5",
        borderRadius: 17,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#F4DCDC",
        marginBottom: 20,
    },

    smallLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#888888",
        marginBottom: 4,
    },

    bookingCode: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "800",
        color: RED,
        letterSpacing: 0.5,
    },

    /* SECTION */

    sectionTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "800",
        color: "#222222",
        marginBottom: 10,
        marginTop: 2,
    },

    /* CARD */

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        padding: 15,
        borderWidth: 1,
        borderColor: "#EEEEEE",
        marginBottom: 18,
    },

    /* VEHICLE */

    vehicleHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    vehicleIcon: {
        width: 54,
        height: 54,
        borderRadius: 15,
        backgroundColor: "#FFF2F2",
        alignItems: "center",
        justifyContent: "center",
    },

    vehicleImageWrap: {
        width: 100,
        height: 54,
        justifyContent: "center",
        alignItems: "flex-end",
    },

    vehicleCarImage: {
        width: 95,
        height: 50,
    },

    vehicleInfo: {
        flex: 1,
    },

    vehicleName: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 17,
        fontWeight: "800",
        color: "#222222",
        marginBottom: 8,
    },

    vehicleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },

    vehicleText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#666666",
        marginLeft: 7,
    },

    /* BENGKEL */

    infoIcon: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: "#FFF2F2",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 11,
    },

    infoContent: {
        flex: 1,
    },

    infoTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 16,
        fontWeight: "800",
        color: "#222222",
        marginBottom: 8,
    },

    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    detailText: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        fontSize: 12,
        color: "#777777",
        lineHeight: 18,
        marginLeft: 7,
    },

    /* SCHEDULE */

    scheduleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    scheduleItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },

    scheduleItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },

    scheduleIcon: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: "#FFF2F2",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    scheduleText: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#222222",
        maxWidth: 120,
    },

    /* SERVICE */

    serviceRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 11,
    },

    serviceBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },

    serviceLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },

    serviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#FFF2F2",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    serviceNameWrap: {
        flex: 1,
    },

    serviceName: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#222222",
    },

    serviceQty: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#888888",
        marginTop: 3,
    },

    servicePrice: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#222222",
        marginLeft: 10,
    },

    totalRow: {
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        marginTop: 8,
        paddingTop: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    totalLabel: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        fontWeight: "700",
        color: "#555555",
    },

    totalValue: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 17,
        fontWeight: "800",
        color: RED,
    },

    emptyText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#888888",
        textAlign: "center",
        paddingVertical: 10,
    },

    /* COMPLAINT */

    complaintHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },

    complaintTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        fontWeight: "700",
        color: "#333333",
        marginLeft: 8,
    },

    complaintText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#666666",
        lineHeight: 21,
    },

    /* INFO */

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },

    infoRowIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: "#FFF2F2",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
    },

    infoRowContent: {
        flex: 1,
    },

    infoRowLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#888888",
        marginBottom: 3,
    },

    infoRowValue: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#333333",
    },

    /* BACK */

    backHomeButton: {
        height: 50,
        borderRadius: 15,
        backgroundColor: "#222222",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        marginTop: 6,
    },

    backHomeText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    /* CRUD ACTIONS & MODALS */
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },

    editKeluhanBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: "#E3F2FD",
    },

    editKeluhanText: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12,
        fontWeight: "700",
        color: "#1E88E5",
    },

    actionSection: {
        gap: 10,
        marginTop: 10,
    },

    cancelBookingButton: {
        height: 50,
        borderRadius: 15,
        backgroundColor: "#FFF1F2",
        borderWidth: 1,
        borderColor: "#FECDD3",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },

    cancelBookingText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#C8102E",
        fontSize: 13,
        fontWeight: "800",
    },

    deleteBookingButton: {
        height: 50,
        borderRadius: 15,
        backgroundColor: "#FFF1F2",
        borderWidth: 1,
        borderColor: "#FECDD3",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },

    deleteBookingText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#C8102E",
        fontSize: 13,
        fontWeight: "800",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    modalCard: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 22,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },

    modalIconWrap: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },

    modalTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 17,
        fontWeight: "800",
        color: "#222222",
        textAlign: "center",
        marginBottom: 6,
    },

    modalSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#666666",
        textAlign: "center",
        lineHeight: 18,
        marginBottom: 16,
    },

    modalTextInput: {
        fontFamily: "Poppins_400Regular",
        width: "100%",
        minHeight: 88,
        borderRadius: 12,
        backgroundColor: "#F8F9FA",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 12,
        fontSize: 13,
        color: "#222222",
        textAlignVertical: "top",
        marginBottom: 18,
    },

    modalBtnRow: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
    },

    modalBtn: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },

    modalBtnCancel: {
        backgroundColor: "#F2F2F2",
    },

    modalBtnCancelText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#555555",
        fontSize: 13,
        fontWeight: "800",
    },

    modalBtnDanger: {
        backgroundColor: "#C8102E",
    },

    modalBtnDangerText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    modalBtnPrimary: {
        backgroundColor: "#1E88E5",
    },

    modalBtnPrimaryText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

});