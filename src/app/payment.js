import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_URL } from "../config";
import { safeBack } from "../utils/navigation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RED = "#B22222";

export default function Payment() {
    const { bookingId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // Data booking & payment dari server
    const [bookingData, setBookingData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);

    // Form pembayaran
    const [selectedMethod, setSelectedMethod] = useState("qris"); // 'qris' | 'cod'
    const [proofImage, setProofImage] = useState(null); // base64 / uri
    const [catatan, setCatatan] = useState("");
    const [isQrZoomed, setIsQrZoomed] = useState(false);

    // Feedback message
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const isDesktop = Platform.OS === "web" && SCREEN_WIDTH >= 768;

    useEffect(() => {
        loadData();
    }, [bookingId]);

    // Polling status jika sedang menunggu verifikasi
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
            setErrorMessage("");

            if (!bookingId) {
                setErrorMessage("ID Booking tidak ditemukan.");
                return;
            }

            const userData = await AsyncStorage.getItem("autocare_user");
            const token = await AsyncStorage.getItem("autocare_token");
            const user = userData ? JSON.parse(userData) : null;
            const userParam = user?.id ? `?userId=${user.id}` : "";

            const response = await fetch(`${API_URL}/api/payment/booking/${bookingId}${userParam}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal memuat detail pembayaran");
            }

            setBookingData(result.data.booking);
            if (result.data.payment) {
                setPaymentData(result.data.payment);
                const method = result.data.payment.metode_pembayaran?.toLowerCase();
                if (method === "cod" || method === "bayar_di_tempat") {
                    setSelectedMethod("cod");
                } else {
                    setSelectedMethod("qris");
                }
            }
        } catch (err) {
            console.error("Load Payment Error:", err);
            if (!silent) {
                setErrorMessage(err.message || "Tidak dapat terhubung ke server AutoCare.");
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const pickProofImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Izin Ditolak",
                    "AutoCare membutuhkan izin akses galeri untuk mengunggah bukti pembayaran QRIS."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [4, 5],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (asset.base64) {
                    setProofImage(`data:image/jpeg;base64,${asset.base64}`);
                } else {
                    setProofImage(asset.uri);
                }
                setErrorMessage("");
            }
        } catch (err) {
            console.error("Pick image error:", err);
            Alert.alert("Error", "Gagal memilih foto bukti pembayaran.");
        }
    };

    const handleSubmitPayment = async () => {
        try {
            setSubmitting(true);
            setErrorMessage("");
            setStatusMessage("");

            const userData = await AsyncStorage.getItem("autocare_user");
            if (!userData) {
                router.replace("/login");
                return;
            }
            const user = JSON.parse(userData);

            // Validasi bukti transfer jika QRIS
            if (selectedMethod === "qris" && !proofImage) {
                setErrorMessage("Harap unggah foto bukti pembayaran QRIS terlebih dahulu.");
                return;
            }

            const token = await AsyncStorage.getItem("autocare_token");

            const response = await fetch(`${API_URL}/api/payment/manual`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    bookingId: Number(bookingId),
                    userId: Number(user.id),
                    metodePembayaran: selectedMethod,
                    buktiTransfer: selectedMethod === "qris" ? proofImage : null,
                    catatan: catatan.trim() || null,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal memproses pembayaran");
            }

            setStatusMessage(result.message);
            await loadData(true);

            setTimeout(() => {
                router.replace({
                    pathname: "/booking-berhasil",
                    params: {
                        bookingId: String(bookingId),
                        orderId: result.data?.orderId || "",
                        metode: selectedMethod,
                    },
                });
            }, 700);
        } catch (err) {
            console.error("Submit Payment Error:", err);
            setErrorMessage(err.message || "Terjadi kesalahan saat memproses pembayaran.");
        } finally {
            setSubmitting(false);
        }
    };

    // Simulasi verifikasi ACC dari admin untuk keperluan pengetesan QA
    const handleSimulasiAcc = async (newStatus) => {
        try {
            setVerifying(true);
            const orderId = paymentData?.order_id;
            if (!orderId) {
                Alert.alert("Perhatian", "Belum ada transaksi pembayaran yang dapat diverifikasi.");
                return;
            }

            const response = await fetch(`${API_URL}/api/payment/${orderId}/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: newStatus,
                    alasan:
                        newStatus === "terverifikasi" || newStatus === "diterima"
                            ? "Pembayaran QRIS telah dicek & sesuai"
                            : "Foto bukti tidak jelas atau nominal tidak sesuai",
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal memverifikasi status pembayaran");
            }

            Alert.alert("Hasil Pengujian", result.message);
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

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={RED} />
                <Text style={styles.loadingText}>Memuat rincian pembayaran...</Text>
            </SafeAreaView>
        );
    }

    const totalHarga = bookingData?.total_harga || 0;
    const kodeBooking = bookingData?.kode_booking || "-";
    const statusVerifikasi = paymentData?.status_verifikasi;
    const txStatus = paymentData?.transaction_status;

    const isPaid =
        statusVerifikasi === "terverifikasi" ||
        statusVerifikasi === "diterima" ||
        txStatus === "settlement";
    const isRejected =
        statusVerifikasi === "ditolak" ||
        txStatus === "deny" ||
        txStatus === "cancel";
    const isUnpaidCod =
        statusVerifikasi === "belum_dibayar" ||
        statusVerifikasi === "menunggu_pembayaran";
    const isPendingVerif =
        statusVerifikasi === "menunggu_verifikasi" && !isPaid && !isRejected;

    return (
        <SafeAreaView style={styles.container}>
            {/* TOP HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => safeBack("/home")}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={22} color="#111111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pembayaran Booking</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.contentCard, isDesktop && styles.desktopCard]}>
                    {/* RINGKASAN TAGIHAN */}
                    <View style={styles.billCard}>
                        <View style={styles.billTopRow}>
                            <View>
                                <Text style={styles.billLabel}>Total Pembayaran</Text>
                                <Text style={styles.billAmount}>{formatRupiah(totalHarga)}</Text>
                            </View>
                            <View style={styles.bookingBadge}>
                                <Text style={styles.bookingBadgeText}>#{kodeBooking}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Ionicons name="business-outline" size={16} color="#666" />
                            <Text style={styles.infoText}>
                                {bookingData?.nama_bengkel || "Bengkel AutoCare"}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={16} color="#666" />
                            <Text style={styles.infoText}>
                                {bookingData?.tanggal_booking
                                    ? String(bookingData.tanggal_booking).split("T")[0]
                                    : "-"}{" "}
                                | Jam {bookingData?.jam_booking?.substring(0, 5) || "-"}
                            </Text>
                        </View>

                        {bookingData?.nama_kendaraan ? (
                            <View style={styles.infoRow}>
                                <Ionicons name="car-outline" size={16} color="#666" />
                                <Text style={styles.infoText}>
                                    {bookingData.nama_kendaraan} (
                                    {bookingData.nomor_polisi || "-"})
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* STATUS CARD (JIKA SUDAH DISUBMIT) */}
                    {statusVerifikasi ? (
                        <View
                            style={[
                                styles.statusCard,
                                isPaid && styles.statusCardPaid,
                                isRejected && styles.statusCardRejected,
                                isUnpaidCod && styles.statusCardCod,
                                isPendingVerif && styles.statusCardPending,
                            ]}
                        >
                            <View style={styles.statusHeaderRow}>
                                <Ionicons
                                    name={
                                        isPaid
                                            ? "checkmark-circle"
                                            : isRejected
                                            ? "close-circle"
                                            : isUnpaidCod
                                            ? "cash-outline"
                                            : "time-outline"
                                    }
                                    size={24}
                                    color={
                                        isPaid
                                            ? "#2E7D32"
                                            : isRejected
                                            ? "#C62828"
                                            : isUnpaidCod
                                            ? "#1E40AF"
                                            : "#D97706"
                                    }
                                />
                                <Text
                                    style={[
                                        styles.statusTitle,
                                        isPaid && { color: "#2E7D32" },
                                        isRejected && { color: "#C62828" },
                                        isUnpaidCod && { color: "#1E40AF" },
                                        isPendingVerif && { color: "#D97706" },
                                    ]}
                                >
                                    {isPaid
                                        ? "Pembayaran Lunas (Terverifikasi)"
                                        : isRejected
                                        ? "Bukti Pembayaran Ditolak"
                                        : isUnpaidCod
                                        ? "Belum Dibayar (Bayar di Bengkel)"
                                        : "Menunggu Verifikasi Admin"}
                                </Text>
                            </View>

                            <Text style={styles.statusDescription}>
                                {isPaid
                                    ? "Pembayaran Anda telah diverifikasi oleh admin. Booking servis Anda telah DIKONFIRMASI!"
                                    : isRejected
                                    ? `Bukti transfer ditolak oleh admin: ${
                                          paymentData?.catatan_penolakan ||
                                          paymentData?.catatan ||
                                          "Foto bukti tidak jelas atau transfer belum masuk."
                                      } Silakan unggah foto bukti pembayaran yang baru di bawah.`
                                    : isUnpaidCod
                                    ? "Metode Bayar di Tempat (COD) telah dipilih. Anda dapat melakukan pembayaran langsung secara tunai atau debit saat tiba di bengkel."
                                    : "Bukti transfer QRIS Anda telah kami terima dan sedang dalam antrean verifikasi oleh admin AutoCare. Status akan otomatis berubah menjadi Lunas setelah di-ACC."}
                            </Text>

                            {/* PANEL PENGUJIAN ACC UNTUK QA / ADMIN TESTING */}
                            <View style={styles.qaSection}>
                                <Text style={styles.qaTitle}>🧪 Panel Simulasi Verifikasi (QA):</Text>
                                <View style={styles.qaBtnRow}>
                                    <TouchableOpacity
                                        style={[styles.qaBtn, styles.qaBtnAccept]}
                                        onPress={() => handleSimulasiAcc("terverifikasi")}
                                        disabled={verifying}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="checkmark-done" size={15} color="#FFFFFF" />
                                        <Text style={styles.qaBtnText}>Setujui (Lunas)</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.qaBtn, styles.qaBtnReject]}
                                        onPress={() => handleSimulasiAcc("ditolak")}
                                        disabled={verifying}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="close" size={15} color="#FFFFFF" />
                                        <Text style={styles.qaBtnText}>Tolak</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : null}

                    {/* PILIHAN METODE PEMBAYARAN */}
                    <Text style={styles.sectionTitle}>Pilih Metode Pembayaran</Text>

                    {/* 1. METODE QRIS STATIC AUTOCARE */}
                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            selectedMethod === "qris" && styles.methodCardActive,
                        ]}
                        onPress={() => setSelectedMethod("qris")}
                        activeOpacity={0.8}
                    >
                        <View style={styles.methodHeader}>
                            <View style={styles.methodIconBadge}>
                                <Ionicons name="qr-code-outline" size={22} color={RED} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <Text style={styles.methodName}>QRIS AutoCare</Text>
                                    <View style={styles.instantBadge}>
                                        <Text style={styles.instantBadgeText}>Resmi</Text>
                                    </View>
                                </View>
                                <Text style={styles.methodDesc}>
                                    BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.radioCircle,
                                    selectedMethod === "qris" && styles.radioCircleActive,
                                ]}
                            >
                                {selectedMethod === "qris" && <View style={styles.radioInner} />}
                            </View>
                        </View>

                        {selectedMethod === "qris" && (
                            <View style={styles.methodDetailBox}>
                                <View style={styles.qrisHeaderRow}>
                                    <View>
                                        <Text style={styles.qrisMerchantTitle}>
                                            Scan QRIS Merchant Resmi
                                        </Text>
                                        <Text style={styles.qrisNmidText}>
                                            Azaadesigns ID • NMID: ID1026511776878
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.zoomPillBtn}
                                        onPress={() => setIsQrZoomed(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="expand-outline" size={15} color={RED} />
                                        <Text style={styles.zoomPillText}>Perbesar</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* GAMBAR QRIS RESMI */}
                                <TouchableOpacity
                                    style={styles.qrisImageWrapper}
                                    onPress={() => setIsQrZoomed(true)}
                                    activeOpacity={0.85}
                                >
                                    <Image
                                        source={require("../../assets/images/qris-autocare.png")}
                                        style={styles.qrisImage}
                                        resizeMode="contain"
                                    />
                                    <View style={styles.qrisTapHint}>
                                        <Ionicons name="scan-outline" size={14} color="#666" />
                                        <Text style={styles.qrisTapHintText}>
                                            Ketuk gambar untuk memperbesar QR
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* TOTAL NOMINAL TAGIHAN */}
                                <View style={styles.amountBox}>
                                    <Text style={styles.amountBoxLabel}>Nominal Pembayaran:</Text>
                                    <Text style={styles.amountBoxValue}>{formatRupiah(totalHarga)}</Text>
                                </View>

                                {/* PANDUAN LANGKAH PEMBAYARAN */}
                                <View style={styles.guideBox}>
                                    <Text style={styles.guideTitle}>Cara Pembayaran QRIS:</Text>
                                    <Text style={styles.guideStep}>
                                        1. Buka aplikasi M-Banking atau E-Wallet pilihan Anda.
                                    </Text>
                                    <Text style={styles.guideStep}>
                                        2. Pilih menu <Text style={styles.boldText}>Scan / Bayar QRIS</Text>.
                                    </Text>
                                    <Text style={styles.guideStep}>
                                        3. Arahkan kamera ke kode QR di atas.
                                    </Text>
                                    <Text style={styles.guideStep}>
                                        4. Masukkan nominal tepat{" "}
                                        <Text style={styles.boldText}>{formatRupiah(totalHarga)}</Text> lalu selesaikan pembayaran.
                                    </Text>
                                    <Text style={styles.guideStep}>
                                        5. Simpan tangkapan layar (screenshot) dan unggah pada formulir di bawah.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* 2. METODE COD (BAYAR LANGSUNG DI BENGKEL) */}
                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            selectedMethod === "cod" && styles.methodCardActive,
                        ]}
                        onPress={() => setSelectedMethod("cod")}
                        activeOpacity={0.8}
                    >
                        <View style={styles.methodHeader}>
                            <View
                                style={[
                                    styles.methodIconBadge,
                                    { backgroundColor: "rgba(46, 125, 50, 0.12)" },
                                ]}
                            >
                                <Ionicons name="cash-outline" size={22} color="#2E7D32" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <Text style={styles.methodName}>Bayar di Tempat (COD)</Text>
                                    <View
                                        style={[
                                            styles.instantBadge,
                                            { backgroundColor: "#DCFCE7" },
                                        ]}
                                    >
                                        <Text style={[styles.instantBadgeText, { color: "#166534" }]}>
                                            Tunai / Debit
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.methodDesc}>
                                    Bayar langsung di kasir bengkel saat servis kendaraan
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.radioCircle,
                                    selectedMethod === "cod" && styles.radioCircleActive,
                                ]}
                            >
                                {selectedMethod === "cod" && <View style={styles.radioInner} />}
                            </View>
                        </View>

                        {selectedMethod === "cod" && (
                            <View style={styles.methodDetailBox}>
                                <View style={styles.codAlertBox}>
                                    <Ionicons name="information-circle" size={22} color="#2E7D32" />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.codAlertTitle}>
                                            Tidak Perlu Transfer Sekarang
                                        </Text>
                                        <Text style={styles.codAlertText}>
                                            Booking Anda akan langsung didaftarkan dengan status Belum Dibayar. Anda dapat melakukan pembayaran langsung di bengkel dengan uang tunai atau kartu debit setelah pengerjaan servis selesai.
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.locationCard}>
                                    <Text style={styles.locationCardTitle}>Lokasi Pembayaran:</Text>
                                    <Text style={styles.locationWorkshopName}>
                                        {bookingData?.nama_bengkel || "Bengkel AutoCare"}
                                    </Text>
                                    <Text style={styles.locationWorkshopAddress}>
                                        {bookingData?.alamat_bengkel || "Alamat bengkel terdaftar"}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* FORM UPLOAD BUKTI PEMBAYARAN QRIS */}
                    {selectedMethod === "qris" ? (
                        <View style={styles.uploadSection}>
                            <Text style={styles.uploadSectionTitle}>
                                Unggah Bukti Pembayaran QRIS
                            </Text>
                            <Text style={styles.uploadSectionSubtitle}>
                                Unggah screenshot bukti pembayaran sukses dari aplikasi M-Banking atau E-Wallet Anda
                            </Text>

                            {proofImage ? (
                                <View style={styles.previewContainer}>
                                    <Image
                                        source={{ uri: proofImage }}
                                        style={styles.previewImage}
                                        resizeMode="contain"
                                    />
                                    <TouchableOpacity
                                        style={styles.changeImageBtn}
                                        onPress={pickProofImage}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name="camera-reverse-outline"
                                            size={18}
                                            color="#FFFFFF"
                                        />
                                        <Text style={styles.changeImageBtnText}>
                                            Ganti Foto Bukti
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.uploadDropzone}
                                    onPress={pickProofImage}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="cloud-upload-outline"
                                        size={40}
                                        color={RED}
                                    />
                                    <Text style={styles.uploadDropzoneText}>
                                        Ketuk untuk Pilih Foto Bukti Pembayaran
                                    </Text>
                                    <Text style={styles.uploadDropzoneHint}>
                                        Format JPG, PNG, atau Screenshot HP
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* CATATAN PENGIRIM */}
                            <Text style={styles.inputLabel}>
                                Catatan Pengirim (Opsional)
                            </Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Contoh: Pembayaran dari rekening Budi via BCA Mobile"
                                placeholderTextColor="#999"
                                value={catatan}
                                onChangeText={setCatatan}
                            />
                        </View>
                    ) : null}

                    {/* FEEDBACK ERROR / SUCCESS */}
                    {errorMessage ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={18} color="#D32F2F" />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    {statusMessage ? (
                        <View style={styles.successBox}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={18}
                                color="#2E7D32"
                            />
                            <Text style={styles.successText}>{statusMessage}</Text>
                        </View>
                    ) : null}

                    {/* TOMBOL KONFIRMASI PEMBAYARAN */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            submitting && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmitPayment}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>
                                    {selectedMethod === "cod"
                                        ? "Konfirmasi Bayar di Tempat (COD)"
                                        : isRejected
                                        ? "Kirim Ulang Bukti Pembayaran"
                                        : "Kirim Bukti Pembayaran QRIS"}
                                </Text>
                                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* TOMBOL LIHAT RIWAYAT SERVIS */}
                    <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={() => router.replace("/riwayat-servis")}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.historyBtnText}>
                            Lihat Riwayat Booking & Servis
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* MODAL PERBESAR QRIS */}
            <Modal
                visible={isQrZoomed}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsQrZoomed(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.zoomModalCard}>
                        <View style={styles.zoomModalHeader}>
                            <Text style={styles.zoomModalTitle}>QRIS Merchant AutoCare</Text>
                            <TouchableOpacity
                                style={styles.zoomModalCloseBtn}
                                onPress={() => setIsQrZoomed(false)}
                            >
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.zoomModalBody}>
                            <Image
                                source={require("../../assets/images/qris-autocare.png")}
                                style={styles.zoomImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.zoomNmid}>
                                Azaadesigns ID • NMID: ID1026511776878
                            </Text>
                            <Text style={styles.zoomAmount}>
                                Nominal: {formatRupiah(totalHarga)}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.zoomModalDoneBtn}
                            onPress={() => setIsQrZoomed(false)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.zoomModalDoneText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },

    loadingText: {
        fontFamily: "Poppins_600SemiBold",
        marginTop: 12,
        color: "#666666",
        fontSize: 13,
        fontWeight: "600",
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

    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
    },

    headerTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },

    scrollContent: {
        paddingVertical: 18,
        paddingHorizontal: 14,
        alignItems: "center",
    },

    contentCard: {
        width: "100%",
        maxWidth: 540,
    },

    desktopCard: {
        backgroundColor: "#FFFFFF",
        padding: 24,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    billCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    billTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    billLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },

    billAmount: {
        fontFamily: "Poppins_700Bold",
        fontSize: 22,
        fontWeight: "700",
        color: RED,
        marginTop: 2,
    },

    bookingBadge: {
        backgroundColor: "rgba(178, 34, 34, 0.08)",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(178, 34, 34, 0.2)",
    },

    bookingBadgeText: {
        fontFamily: "Poppins_700Bold",
        color: RED,
        fontWeight: "700",
        fontSize: 12,
    },

    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginVertical: 12,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 8,
    },

    infoText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#4B5563",
        flex: 1,
    },

    statusCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
    },

    statusCardPaid: {
        backgroundColor: "#F0FDF4",
        borderColor: "#BBF7D0",
    },

    statusCardRejected: {
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
    },

    statusCardCod: {
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
    },

    statusCardPending: {
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
    },

    statusHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },

    statusTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 15,
        fontWeight: "700",
    },

    statusDescription: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#4B5563",
        lineHeight: 19,
    },

    qaSection: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.06)",
    },

    qaTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 8,
    },

    qaBtnRow: {
        flexDirection: "row",
        gap: 8,
    },

    qaBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
    },

    qaBtnAccept: {
        backgroundColor: "#16A34A",
    },

    qaBtnReject: {
        backgroundColor: "#DC2626",
    },

    qaBtnText: {
        fontFamily: "Poppins_600SemiBold",
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "600",
    },

    sectionTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        marginTop: 8,
        marginBottom: 12,
    },

    methodCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
    },

    methodCardActive: {
        borderColor: RED,
        backgroundColor: "#FFFFFF",
    },

    methodHeader: {
        flexDirection: "row",
        alignItems: "center",
    },

    methodIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(178, 34, 34, 0.08)",
        justifyContent: "center",
        alignItems: "center",
    },

    methodName: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },

    instantBadge: {
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },

    instantBadgeText: {
        fontFamily: "Poppins_700Bold",
        fontSize: 10,
        fontWeight: "700",
        color: RED,
    },

    methodDesc: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },

    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#D1D5DB",
        justifyContent: "center",
        alignItems: "center",
    },

    radioCircleActive: {
        borderColor: RED,
    },

    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: RED,
    },

    methodDetailBox: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },

    qrisHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },

    qrisMerchantTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
    },

    qrisNmidText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#6B7280",
    },

    zoomPillBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },

    zoomPillText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 11,
        color: RED,
        fontWeight: "600",
    },

    qrisImageWrapper: {
        backgroundColor: "#FFFFFF",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
    },

    qrisImage: {
        width: 220,
        height: 220,
    },

    qrisTapHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 6,
    },

    qrisTapHintText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#6B7280",
    },

    amountBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 10,
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    amountBoxLabel: {
        fontFamily: "Poppins_500Medium",
        fontSize: 12,
        color: "#4B5563",
    },

    amountBoxValue: {
        fontFamily: "Poppins_700Bold",
        fontSize: 16,
        fontWeight: "700",
        color: RED,
    },

    guideBox: {
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
    },

    guideTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 4,
    },

    guideStep: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#4B5563",
        lineHeight: 18,
    },

    boldText: {
        fontFamily: "Poppins_700Bold",
        fontWeight: "700",
        color: "#111827",
    },

    codAlertBox: {
        flexDirection: "row",
        backgroundColor: "#F0FDF4",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#BBF7D0",
    },

    codAlertTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#166534",
    },

    codAlertText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#166534",
        lineHeight: 18,
        marginTop: 2,
    },

    locationCard: {
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    locationCardTitle: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 11,
        color: "#6B7280",
    },

    locationWorkshopName: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        color: "#111827",
        marginTop: 2,
    },

    locationWorkshopAddress: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#4B5563",
        marginTop: 1,
    },

    uploadSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
    },

    uploadSectionTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },

    uploadSectionSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
        marginBottom: 12,
    },

    uploadDropzone: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1.5,
        borderColor: "#D1D5DB",
        borderStyle: "dashed",
        borderRadius: 12,
        paddingVertical: 24,
        alignItems: "center",
        justifyContent: "center",
    },

    uploadDropzoneText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#111827",
        marginTop: 8,
    },

    uploadDropzoneHint: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#9CA3AF",
        marginTop: 2,
    },

    previewContainer: {
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    previewImage: {
        width: 220,
        height: 260,
        borderRadius: 8,
    },

    changeImageBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: RED,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 10,
        gap: 6,
    },

    changeImageBtnText: {
        fontFamily: "Poppins_600SemiBold",
        color: "#FFFFFF",
        fontSize: 12,
    },

    inputLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#374151",
        marginTop: 12,
        marginBottom: 4,
    },

    textInput: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: "#111827",
        fontFamily: "Poppins_400Regular",
    },

    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#FECACA",
        gap: 8,
    },

    errorText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 12,
        color: "#D32F2F",
        flex: 1,
    },

    successBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#BBF7D0",
        gap: 8,
    },

    successText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 12,
        color: "#166534",
        flex: 1,
    },

    submitButton: {
        backgroundColor: RED,
        paddingVertical: 14,
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
    },

    submitButtonDisabled: {
        opacity: 0.6,
    },

    submitButtonText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },

    historyBtn: {
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 6,
    },

    historyBtnText: {
        fontFamily: "Poppins_600SemiBold",
        color: "#6B7280",
        fontSize: 13,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    zoomModalCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        width: "100%",
        maxWidth: 380,
        alignItems: "center",
    },

    zoomModalHeader: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },

    zoomModalTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 15,
        color: "#111827",
    },

    zoomModalCloseBtn: {
        padding: 4,
    },

    zoomModalBody: {
        alignItems: "center",
        width: "100%",
    },

    zoomImage: {
        width: 280,
        height: 280,
    },

    zoomNmid: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#4B5563",
        marginTop: 10,
    },

    zoomAmount: {
        fontFamily: "Poppins_700Bold",
        fontSize: 16,
        color: RED,
        marginTop: 4,
    },

    zoomModalDoneBtn: {
        backgroundColor: RED,
        width: "100%",
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 16,
    },

    zoomModalDoneText: {
        fontFamily: "Poppins_600SemiBold",
        color: "#FFFFFF",
        fontSize: 14,
    },
});
