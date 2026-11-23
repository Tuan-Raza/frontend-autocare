import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "../utils/navigation";
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
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_URL } from "../config";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isDesktop = Platform.OS === "web" && SCREEN_WIDTH >= 768;

export default function Payment() {
    const { bookingId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // Data booking & payment dari server
    const [bookingData, setBookingData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);

    // Form manual payment
    const [selectedMethod, setSelectedMethod] = useState("qris"); // 'qris' | 'dana' | 'seabank' | 'cod'
    const [proofImage, setProofImage] = useState(null); // base64 / uri
    const [catatan, setCatatan] = useState("");
    const [copiedKey, setCopiedKey] = useState("");

    // Message feedback
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        loadData();
    }, [bookingId]);

    // Polling status pembayaran jika statusnya sedang menunggu verifikasi
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

            const response = await fetch(`${API_URL}/api/payment/booking/${bookingId}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal memuat detail pembayaran");
            }

            setBookingData(result.data.booking);
            if (result.data.payment) {
                setPaymentData(result.data.payment);
                if (result.data.payment.metode_pembayaran) {
                    setSelectedMethod(result.data.payment.metode_pembayaran);
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

    const handleCopy = (text, key) => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(text);
        }
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(""), 2500);
    };

    const pickProofImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Izin Ditolak",
                    "AutoCare membutuhkan izin akses galeri untuk mengunggah bukti pembayaran."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
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
            Alert.alert("Error", "Gagal memilih foto bukti transfer.");
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

            // Validasi bukti transfer jika bukan COD
            if (selectedMethod !== "cod" && !proofImage) {
                setErrorMessage("Harap unggah foto bukti transfer terlebih dahulu.");
                return;
            }

            const response = await fetch(`${API_URL}/api/payment/manual`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bookingId: Number(bookingId),
                    userId: Number(user.id),
                    metodePembayaran: selectedMethod,
                    buktiTransfer: proofImage || null,
                    catatan: catatan.trim() || null,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal mengirim pembayaran");
            }

            setStatusMessage(result.message);
            await loadData(true);

            // Alihkan langsung ke tampilan struk & status setelah pembayaran
            setTimeout(() => {
                router.replace({
                    pathname: "/booking-berhasil",
                    params: {
                        bookingId: String(bookingId),
                        orderId: result.data?.orderId || "",
                        metode: selectedMethod,
                    },
                });
            }, 600);
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
                    alasan: newStatus === "diterima" ? "Pembayaran valid & sesuai" : "Bukti buram / transfer tidak masuk",
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal memverifikasi");
            }

            Alert.alert("Hasil Verifikasi", result.message);
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
                <ActivityIndicator size="large" color="#F20D18" />
                <Text style={styles.loadingText}>Memuat rincian pembayaran...</Text>
            </SafeAreaView>
        );
    }

    const totalHarga = bookingData?.total_harga || 0;
    const kodeBooking = bookingData?.kode_booking || "-";
    const statusVerifikasi = paymentData?.status_verifikasi; // 'menunggu_verifikasi' | 'diterima' | 'ditolak'
    const isApproved = statusVerifikasi === "diterima";
    const isRejected = statusVerifikasi === "ditolak";
    const isPendingVerif = statusVerifikasi === "menunggu_verifikasi";

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
                                <Text style={styles.bookingBadgeText}>{kodeBooking}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Ionicons name="business-outline" size={16} color="#666" />
                            <Text style={styles.infoText}>{bookingData?.nama_bengkel || "Bengkel AutoCare"}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={16} color="#666" />
                            <Text style={styles.infoText}>
                                {bookingData?.tanggal_booking ? String(bookingData.tanggal_booking).split("T")[0] : "-"} | Jam {bookingData?.jam_booking?.substring(0, 5) || "-"}
                            </Text>
                        </View>

                        {bookingData?.nama_kendaraan ? (
                            <View style={styles.infoRow}>
                                <Ionicons name="car-outline" size={16} color="#666" />
                                <Text style={styles.infoText}>
                                    {bookingData.nama_kendaraan} ({bookingData.nomor_polisi || "-"})
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* STATUS VERIFIKASI ACC JIKA SUDAH DISUBMIT */}
                    {statusVerifikasi ? (
                        <View
                            style={[
                                styles.statusCard,
                                isApproved && styles.statusCardApproved,
                                isRejected && styles.statusCardRejected,
                                isPendingVerif && styles.statusCardPending,
                            ]}
                        >
                            <View style={styles.statusHeaderRow}>
                                <Ionicons
                                    name={
                                        isApproved
                                            ? "checkmark-circle"
                                            : isRejected
                                            ? "close-circle"
                                            : "time"
                                    }
                                    size={24}
                                    color={isApproved ? "#2E7D32" : isRejected ? "#C62828" : "#E65100"}
                                />
                                <Text
                                    style={[
                                        styles.statusTitle,
                                        isApproved && { color: "#2E7D32" },
                                        isRejected && { color: "#C62828" },
                                        isPendingVerif && { color: "#E65100" },
                                    ]}
                                >
                                    {isApproved
                                        ? "Pembayaran Disetujui (ACC)"
                                        : isRejected
                                        ? "Pembayaran Ditolak"
                                        : "Menunggu Verifikasi Admin"}
                                </Text>
                            </View>

                            <Text style={styles.statusDescription}>
                                {isApproved
                                    ? "Bukti pembayaran Anda telah diverifikasi dan disetujui (ACC). Booking servis Anda telah DIKONFIRMASI!"
                                    : isRejected
                                    ? `Bukti transfer tidak sesuai atau belum masuk. ${paymentData?.catatan || "Silakan lakukan transfer ulang dan unggah bukti baru."}`
                                    : "Bukti transfer Anda telah tersimpan dan sedang dalam antrean verifikasi oleh admin AutoCare. Status akan otomatis berubah saat di-ACC."}
                            </Text>

                            {/* SIMULASI ACC UNTUK TESTING QA */}
                            <View style={styles.qaAccSection}>
                                <Text style={styles.qaAccLabel}>🧪 Panel Pengujian Status ACC:</Text>
                                <View style={styles.qaBtnRow}>
                                    <TouchableOpacity
                                        style={[styles.qaBtn, styles.qaBtnAccept]}
                                        onPress={() => handleSimulasiAcc("diterima")}
                                        disabled={verifying}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                                        <Text style={styles.qaBtnText}>Setujui (ACC)</Text>
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
                        </View>
                    ) : null}

                    {/* PILIHAN 4 METODE PEMBAYARAN */}
                    <Text style={styles.sectionTitle}>Pilih Metode Pembayaran</Text>

                    {/* 1. QRIS */}
                    <TouchableOpacity
                        style={[styles.methodCard, selectedMethod === "qris" && styles.methodCardActive]}
                        onPress={() => setSelectedMethod("qris")}
                        activeOpacity={0.8}
                    >
                        <View style={styles.methodHeader}>
                            <View style={styles.methodIconBadge}>
                                <Ionicons name="qr-code-outline" size={22} color="#F20D18" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.methodName}>QRIS (Semua Bank & E-Wallet)</Text>
                                <Text style={styles.methodDesc}>BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, dll</Text>
                            </View>
                            <View style={[styles.radioCircle, selectedMethod === "qris" && styles.radioCircleActive]}>
                                {selectedMethod === "qris" && <View style={styles.radioInner} />}
                            </View>
                        </View>

                        {selectedMethod === "qris" && (
                            <View style={styles.methodDetailBox}>
                                <Text style={styles.detailTitle}>Scan QRIS AutoCare</Text>
                                <View style={styles.qrisImageContainer}>
                                    <Image
                                        source={require("../../assets/images/qris-autocare.png")}
                                        style={styles.qrisImage}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={styles.qrisNmidText}>
                                    <Text style={{ fontFamily: "Poppins_700Bold", fontWeight: "700" }}>Azaadesigns ID</Text> • NMID: ID1026511776878 (A01)
                                </Text>
                                <Text style={styles.qrisInstructions}>
                                    Buka aplikasi M-Banking atau E-Wallet pilihan Anda, pilih menu Scan QRIS, lalu arahkan ke kode di atas.
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* 2. DANA */}
                    <TouchableOpacity
                        style={[styles.methodCard, selectedMethod === "dana" && styles.methodCardActive]}
                        onPress={() => setSelectedMethod("dana")}
                        activeOpacity={0.8}
                    >
                        <View style={styles.methodHeader}>
                            <View style={[styles.methodIconBadge, { backgroundColor: "rgba(17, 142, 234, 0.12)" }]}>
                                <Ionicons name="wallet-outline" size={22} color="#118EEA" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.methodName}>DANA</Text>
                                <Text style={styles.methodDesc}>Transfer sesama DANA atau via nomor HP</Text>
                            </View>
                            <View style={[styles.radioCircle, selectedMethod === "dana" && styles.radioCircleActive]}>
                                {selectedMethod === "dana" && <View style={styles.radioInner} />}
                            </View>
                        </View>

                        {selectedMethod === "dana" && (
                            <View style={styles.methodDetailBox}>
                                <View style={styles.accountCard}>
                                    <View>
                                        <Text style={styles.accountLabel}>Nomor DANA AutoCare:</Text>
                                        <Text style={styles.accountNumber}>0812 9998 9695</Text>
                                        <Text style={styles.accountName}>a.n Raza ikhsan Al fitrah</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.copyBtn}
                                        onPress={() => handleCopy("081299989695", "dana")}
                                    >
                                        <Ionicons
                                            name={copiedKey === "dana" ? "checkmark" : "copy-outline"}
                                            size={16}
                                            color="#118EEA"
                                        />
                                        <Text style={styles.copyBtnText}>
                                            {copiedKey === "dana" ? "Tersalin!" : "Salin"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* 3. SEABANK */}
                    <TouchableOpacity
                        style={[styles.methodCard, selectedMethod === "seabank" && styles.methodCardActive]}
                        onPress={() => setSelectedMethod("seabank")}
                        activeOpacity={0.8}
                    >
                        <View style={styles.methodHeader}>
                            <View style={[styles.methodIconBadge, { backgroundColor: "rgba(255, 122, 0, 0.12)" }]}>
                                <Ionicons name="card-outline" size={22} color="#FF7A00" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.methodName}>SeaBank</Text>
                                <Text style={styles.methodDesc}>Transfer Virtual/Rekening Bank (Bebas Biaya Transfer)</Text>
                            </View>
                            <View style={[styles.radioCircle, selectedMethod === "seabank" && styles.radioCircleActive]}>
                                {selectedMethod === "seabank" && <View style={styles.radioInner} />}
                            </View>
                        </View>

                        {selectedMethod === "seabank" && (
                            <View style={styles.methodDetailBox}>
                                <View style={styles.accountCard}>
                                    <View>
                                        <Text style={styles.accountLabel}>Nomor Rekening SeaBank:</Text>
                                        <Text style={styles.accountNumber}>901180017388</Text>
                                        <Text style={styles.accountName}>a.n Raza ikhsan Al fitrah</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.copyBtn}
                                        onPress={() => handleCopy("901180017388", "seabank")}
                                    >
                                        <Ionicons
                                            name={copiedKey === "seabank" ? "checkmark" : "copy-outline"}
                                            size={16}
                                            color="#FF7A00"
                                        />
                                        <Text style={[styles.copyBtnText, { color: "#FF7A00" }]}>
                                            {copiedKey === "seabank" ? "Tersalin!" : "Salin"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* 4. BAYAR DI TEMPAT (COD) */}
                    <TouchableOpacity
                        style={[styles.methodCard, selectedMethod === "cod" && styles.methodCardActive]}
                        onPress={() => setSelectedMethod("cod")}
                        activeOpacity={0.8}
                    >
                        <View style={styles.methodHeader}>
                            <View style={[styles.methodIconBadge, { backgroundColor: "rgba(46, 125, 50, 0.12)" }]}>
                                <Ionicons name="cash-outline" size={22} color="#2E7D32" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.methodName}>Bayar di Tempat (Tunai di Bengkel)</Text>
                                <Text style={styles.methodDesc}>Bayar langsung di lokasi setelah servis kendaraan selesai</Text>
                            </View>
                            <View style={[styles.radioCircle, selectedMethod === "cod" && styles.radioCircleActive]}>
                                {selectedMethod === "cod" && <View style={styles.radioInner} />}
                            </View>
                        </View>

                        {selectedMethod === "cod" && (
                            <View style={styles.methodDetailBox}>
                                <View style={styles.codAlertBox}>
                                    <Ionicons name="information-circle" size={20} color="#2E7D32" />
                                    <Text style={styles.codAlertText}>
                                        Anda dapat membayar langsung secara tunai atau debit saat tiba di bengkel. Tidak perlu mengunggah bukti pembayaran sekarang.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* FORM UPLOAD BUKTI TRANSFER (JIKA TRANSFER) */}
                    {selectedMethod !== "cod" ? (
                        <View style={styles.uploadSection}>
                            <Text style={styles.uploadSectionTitle}>Unggah Bukti Transfer</Text>
                            <Text style={styles.uploadSectionSubtitle}>
                                Foto struk ATM, bukti transfer M-Banking, atau screenshot pembayaran DANA/QRIS
                            </Text>

                            {proofImage ? (
                                <View style={styles.previewContainer}>
                                    <Image source={{ uri: proofImage }} style={styles.previewImage} resizeMode="contain" />
                                    <TouchableOpacity
                                        style={styles.changeImageBtn}
                                        onPress={pickProofImage}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="camera-reverse-outline" size={18} color="#FFFFFF" />
                                        <Text style={styles.changeImageBtnText}>Ganti Foto Bukti</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.uploadDropzone}
                                    onPress={pickProofImage}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="cloud-upload-outline" size={42} color="#F20D18" />
                                    <Text style={styles.uploadDropzoneText}>Ketuk untuk Pilih Foto Bukti Transfer</Text>
                                    <Text style={styles.uploadDropzoneHint}>Format JPG, PNG, atau Screenshot HP</Text>
                                </TouchableOpacity>
                            )}

                            {/* CATATAN PENGIRIM */}
                            <Text style={styles.inputLabel}>Catatan Pengirim (Opsional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Contoh: Transfer atas nama Budi via BCA"
                                placeholderTextColor="#999"
                                value={catatan}
                                onChangeText={setCatatan}
                            />
                        </View>
                    ) : null}

                    {/* ERROR / SUCCESS FEEDBACK */}
                    {errorMessage ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={18} color="#D32F2F" />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    {statusMessage ? (
                        <View style={styles.successBox}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#2E7D32" />
                            <Text style={styles.successText}>{statusMessage}</Text>
                        </View>
                    ) : null}

                    {/* TOMBOL KONFIRMASI PEMBAYARAN */}
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
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
                                        ? "Konfirmasi Bayar di Tempat"
                                        : "Kirim Bukti Pembayaran"}
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
                        <Text style={styles.historyBtnText}>Lihat Riwayat Booking & Servis</Text>
                    </TouchableOpacity>
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
        backgroundColor: "#F0F0F0",
    },

    headerTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 16,
        fontWeight: "800",
        color: "#1A1A1A",
    },

    scrollContent: {
        paddingVertical: 18,
        paddingHorizontal: 14,
        alignItems: "center",
    },

    contentCard: {
        width: "100%",
        maxWidth: 520,
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
        borderColor: "#EAEAEA",
    },

    billTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    billLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#777777",
        fontWeight: "600",
    },

    billAmount: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 22,
        fontWeight: "900",
        color: "#F20D18",
        marginTop: 3,
    },

    bookingBadge: {
        backgroundColor: "rgba(242, 13, 24, 0.08)",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(242, 13, 24, 0.2)",
    },

    bookingBadgeText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#F20D18",
        fontWeight: "800",
        fontSize: 11,
    },

    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginVertical: 12,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },

    infoText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 12,
        color: "#444444",
        marginLeft: 8,
        fontWeight: "500",
    },

    statusCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.2,
    },

    statusCardPending: {
        backgroundColor: "rgba(255, 152, 0, 0.08)",
        borderColor: "rgba(255, 152, 0, 0.4)",
    },

    statusCardApproved: {
        backgroundColor: "rgba(46, 125, 50, 0.08)",
        borderColor: "rgba(46, 125, 50, 0.4)",
    },

    statusCardRejected: {
        backgroundColor: "rgba(198, 40, 40, 0.08)",
        borderColor: "rgba(198, 40, 40, 0.4)",
    },

    statusHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },

    statusTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 14.5,
        fontWeight: "800",
        marginLeft: 8,
    },

    statusDescription: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#444444",
        lineHeight: 18,
    },

    qaAccSection: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.06)",
    },

    qaAccLabel: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11,
        fontWeight: "700",
        color: "#555",
        marginBottom: 6,
    },

    qaBtnRow: {
        flexDirection: "row",
        gap: 8,
    },

    qaBtn: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 7,
        borderRadius: 8,
        gap: 4,
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
        fontSize: 11,
        fontWeight: "700",
    },

    sectionTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 14.5,
        fontWeight: "800",
        color: "#222222",
        marginBottom: 10,
    },

    methodCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1.2,
        borderColor: "#EAEAEA",
    },

    methodCardActive: {
        borderColor: "#F20D18",
        backgroundColor: "rgba(242, 13, 24, 0.02)",
    },

    methodHeader: {
        flexDirection: "row",
        alignItems: "center",
    },

    methodIconBadge: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "rgba(242, 13, 24, 0.08)",
        justifyContent: "center",
        alignItems: "center",
    },

    methodName: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 13,
        fontWeight: "800",
        color: "#222222",
    },

    methodDesc: {
        fontFamily: "Poppins_400Regular",
        fontSize: 10.5,
        color: "#777777",
        marginTop: 2,
    },

    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: "#CCCCCC",
        justifyContent: "center",
        alignItems: "center",
    },

    radioCircleActive: {
        borderColor: "#F20D18",
    },

    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#F20D18",
    },

    methodDetailBox: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
    },

    detailTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12.5,
        fontWeight: "700",
        color: "#333333",
        textAlign: "center",
        marginBottom: 8,
    },

    qrisImageContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        marginVertical: 6,
    },

    qrisImage: {
        width: 260,
        height: 360,
        borderRadius: 8,
    },

    qrisNmidText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#555555",
        textAlign: "center",
        marginTop: 6,
    },

    qrisInstructions: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#777777",
        textAlign: "center",
        marginTop: 6,
        lineHeight: 16,
    },

    accountCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },

    accountLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 11,
        color: "#666666",
        fontWeight: "600",
    },

    accountNumber: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 17,
        fontWeight: "900",
        color: "#222222",
        letterSpacing: 0.5,
        marginTop: 2,
    },

    accountName: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 11,
        color: "#444444",
        fontWeight: "600",
        marginTop: 2,
    },

    copyBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#DDDDDD",
        gap: 4,
    },

    copyBtnText: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11,
        fontWeight: "700",
        color: "#118EEA",
    },

    codAlertBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "rgba(46, 125, 50, 0.08)",
        borderRadius: 10,
        padding: 10,
        gap: 8,
    },

    codAlertText: {
        fontFamily: "Poppins_500Medium",
        flex: 1,
        fontSize: 11.5,
        color: "#2E7D32",
        lineHeight: 16,
        fontWeight: "500",
    },

    uploadSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },

    uploadSectionTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 13.5,
        fontWeight: "800",
        color: "#222222",
    },

    uploadSectionSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#777777",
        marginTop: 2,
        marginBottom: 12,
    },

    uploadDropzone: {
        height: 130,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "rgba(242, 13, 24, 0.35)",
        borderStyle: "dashed",
        backgroundColor: "rgba(242, 13, 24, 0.02)",
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
    },

    uploadDropzoneText: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12,
        fontWeight: "700",
        color: "#F20D18",
        marginTop: 6,
    },

    uploadDropzoneHint: {
        fontFamily: "Poppins_400Regular",
        fontSize: 10,
        color: "#999999",
        marginTop: 2,
    },

    previewContainer: {
        alignItems: "center",
        justifyContent: "center",
    },

    previewImage: {
        width: "100%",
        height: 220,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },

    changeImageBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#333333",
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginTop: 8,
        gap: 6,
    },

    changeImageBtnText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "700",
    },

    inputLabel: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11.5,
        fontWeight: "700",
        color: "#444444",
        marginTop: 12,
        marginBottom: 4,
    },

    textInput: {
        fontFamily: "Poppins_400Regular",
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#DDDDDD",
        paddingHorizontal: 12,
        fontSize: 12,
        color: "#222222",
        backgroundColor: "#FAFAFA",
    },

    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(211, 47, 47, 0.08)",
        padding: 10,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(211, 47, 47, 0.25)",
        gap: 6,
    },

    errorText: {
        fontFamily: "Poppins_600SemiBold",
        flex: 1,
        color: "#D32F2F",
        fontSize: 11.5,
        fontWeight: "600",
    },

    successBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(46, 125, 50, 0.08)",
        padding: 10,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(46, 125, 50, 0.25)",
        gap: 6,
    },

    successText: {
        fontFamily: "Poppins_600SemiBold",
        flex: 1,
        color: "#2E7D32",
        fontSize: 11.5,
        fontWeight: "600",
    },

    submitButton: {
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
        elevation: 4,
    },

    submitButtonDisabled: {
        opacity: 0.65,
    },

    submitButtonText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 13.5,
        fontWeight: "800",
    },

    historyBtn: {
        alignItems: "center",
        paddingVertical: 14,
        marginTop: 4,
    },

    historyBtnText: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12,
        fontWeight: "700",
        color: "#666666",
    },
});
