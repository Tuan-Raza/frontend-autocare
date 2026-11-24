import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { WebView } from "react-native-webview";

import { API_URL } from "../config";
import RealtimeClock from "../components/RealtimeClock";

const RED = "#B22222";

export default function BookingStep4() {
    const params = useLocalSearchParams();

    const {
        kendaraanId,
        merek,
        model,
        nomorPolisi,
        tahun,
        kilometer,
        layanan,
        totalHarga,
        totalDurasi,
        bengkelId,
        namaBengkel,
        alamatBengkel,
        tanggal,
        jam,
        jadwalId,
    } = params;

    const { width } = useWindowDimensions();

    const isDesktop = width >= 900;

    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState("");
    const [activeBookingId, setActiveBookingId] = useState(null);
    const [activeOrderId, setActiveOrderId] = useState(null);

    const [errorMessage, setErrorMessage] = useState("");

    // =========================================================
    // PARSE LAYANAN
    // =========================================================

    const layananList = useMemo(() => {
        try {
            if (!layanan) return [];

            const parsed =
                typeof layanan === "string"
                    ? JSON.parse(layanan)
                    : layanan;

            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.log("PARSE LAYANAN ERROR:", error);
            return [];
        }
    }, [layanan]);

    // =========================================================
    // FORMAT RUPIAH
    // =========================================================

    const formatRupiah = (value) => {
        const number = Number(value || 0);

        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(number);
    };

    // =========================================================
    // FORMAT TANGGAL
    // =========================================================

    const formatDateDisplay = (dateString) => {
        if (!dateString) return "-";

        const [year, month, day] =
            String(dateString).split("-");

        const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        const hari = [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
        ];

        const bulan = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
        ];

        return `${hari[date.getDay()]}, ${day} ${bulan[date.getMonth()]} ${year}`;
    };

    // =========================================================
    // LOAD USER
    // =========================================================

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            setLoadingUser(true);

            const storedUser =
                await AsyncStorage.getItem(
                    "autocare_user"
                );

            if (!storedUser) {
                router.replace("/login");
                return;
            }

            const parsedUser =
                JSON.parse(storedUser);

            console.log(
                "USER BOOKING STEP 4:",
                parsedUser
            );

            setUser(parsedUser);
        } catch (error) {
            console.log(
                "LOAD USER ERROR:",
                error
            );

            router.replace("/login");
        } finally {
            setLoadingUser(false);
        }
    };

    // =========================================================
    // SAFE BACK
    // =========================================================

    const handleBack = () => {
        if (paymentUrl) {
            setPaymentUrl("");
            if (activeBookingId) {
                router.replace({
                    pathname: "/booking-berhasil",
                    params: {
                        bookingId: String(activeBookingId),
                        orderId: String(activeOrderId || ""),
                        metode: "midtrans",
                    },
                });
            }
            return;
        }

        safeBack("/booking-step3");
    };

    // =========================================================
    // TOTAL
    // =========================================================

    const calculatedTotal = useMemo(() => {
        if (layananList.length > 0) {
            return layananList.reduce(
                (total, item) => {
                    const harga = Number(
                        item.harga ||
                            item.price ||
                            0
                    );

                    const qty = Number(
                        item.qty || 1
                    );

                    return total + harga * qty;
                },
                0
            );
        }

        return Number(totalHarga || 0);
    }, [layananList, totalHarga]);

    // =========================================================
    // KONFIRMASI BOOKING + MIDTRANS
    // =========================================================

    const handleConfirmBooking = async () => {
        setErrorMessage("");

        const resolvedKendaraanId = kendaraanId || params.kendaraan_id;
        const resolvedBengkelId = bengkelId || params.bengkel_id;
        const rawJadwalId = jadwalId || params.jadwal_id;
        const resolvedJadwalId = rawJadwalId && !isNaN(Number(rawJadwalId)) ? Number(rawJadwalId) : null;
        const resolvedTanggal = String(tanggal || params.tanggal_booking || "").trim();
        const resolvedJam = String(jam || params.jam_booking || "").trim();

        const isValidVal = (v) => v !== undefined && v !== null && String(v).trim() !== "" && String(v) !== "undefined" && String(v) !== "null";

        if (!isValidVal(user?.id)) {
            setErrorMessage("Data pengguna tidak ditemukan. Silakan login kembali.");
            return;
        }

        if (!isValidVal(resolvedKendaraanId)) {
            setErrorMessage("Kendaraan belum dipilih.");
            return;
        }

        if (!isValidVal(resolvedBengkelId)) {
            setErrorMessage("Bengkel belum dipilih.");
            return;
        }

        if (!isValidVal(resolvedTanggal)) {
            setErrorMessage("Tanggal service belum dipilih.");
            return;
        }

        if (!isValidVal(resolvedJam)) {
            setErrorMessage("Jam service belum dipilih.");
            return;
        }

        if (!layananList.length) {
            setErrorMessage("Layanan service belum dipilih.");
            return;
        }

        try {
            setSubmitting(true);

            // =================================================
            // STEP 1: BUAT BOOKING DI DATABASE MYSQL
            // =================================================
            const bookingData = {
                userId: Number(user.id),
                kendaraanId: Number(resolvedKendaraanId),
                bengkelId: Number(resolvedBengkelId),
                jadwalId: resolvedJadwalId,
                tanggalBooking: resolvedTanggal,
                jamBooking: resolvedJam,
                layanan: layananList.map((item) => ({
                    id: Number(item.id || item.layanan_id),
                    qty: Number(item.qty || 1),
                })),
                keluhan: "",
            };

            console.log("STEP 1 - CREATE BOOKING:", JSON.stringify(bookingData, null, 2));

            const bookingResponse = await fetch(`${API_URL}/api/booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bookingData),
            });

            const bookingResult = await bookingResponse.json();

            if (!bookingResponse.ok || !bookingResult.success) {
                throw new Error(
                    bookingResult.message || "Booking gagal dibuat."
                );
            }

            const booking = bookingResult.data || {};
            const bookingId = booking.bookingId;
            const kodeBooking = booking.kodeBooking;

            if (!bookingId) {
                throw new Error("Booking berhasil dibuat tetapi ID tidak ditemukan.");
            }

            setActiveBookingId(bookingId);

            // =================================================
            // STEP 2: BUAT TRANSAKSI MIDTRANS SNAP
            // =================================================
            console.log("STEP 2 - CREATE MIDTRANS SNAP TRANSACTION FOR BOOKING:", bookingId);
            const paymentResponse = await fetch(`${API_URL}/api/payment/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bookingId: Number(bookingId),
                    userId: Number(user.id),
                }),
            });

            const paymentResult = await paymentResponse.json();

            if (!paymentResponse.ok || !paymentResult.success) {
                throw new Error(
                    paymentResult.message || "Gagal membuat transaksi pembayaran Midtrans."
                );
            }

            const payment = paymentResult.data || {};
            const redirectUrl = payment.redirectUrl;
            const orderId = payment.orderId;

            setActiveOrderId(orderId);

            // Bersihkan form cache lokal
            try {
                await AsyncStorage.multiRemove([
                    "booking_kendaraan",
                    "booking_bengkel",
                    "booking_layanan",
                    "booking_jadwal",
                    "booking_catatan",
                ]);
            } catch (_) {}

            // =================================================
            // STEP 3: BUKA HALAMAN MIDTRANS SNAP
            // =================================================
            if (Platform.OS === "web") {
                if (redirectUrl && typeof window !== "undefined") {
                    window.location.href = redirectUrl;
                    return;
                }
            }

            if (redirectUrl) {
                try {
                    await WebBrowser.openBrowserAsync(redirectUrl, {
                        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                        toolbarColor: RED,
                    });
                } catch (browserErr) {
                    console.log("WebBrowser fallback:", browserErr);
                    if (await Linking.canOpenURL(redirectUrl)) {
                        await Linking.openURL(redirectUrl);
                    } else {
                        setPaymentUrl(redirectUrl);
                        return;
                    }
                }

                // Setelah browser Midtrans ditutup / selesai, alihkan ke status struk
                router.replace({
                    pathname: "/booking-berhasil",
                    params: {
                        bookingId: String(bookingId),
                        orderId: String(orderId || ""),
                        metode: "midtrans",
                    },
                });
            } else {
                router.replace({
                    pathname: "/payment",
                    params: {
                        bookingId: String(bookingId),
                    },
                });
            }
        } catch (error) {
            console.log("CREATE BOOKING/PAYMENT ERROR:", error);
            setErrorMessage(
                error?.message || "Terjadi kesalahan saat memproses booking."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // =========================================================
    // LOADING USER
    // =========================================================

    if (loadingUser) {
        return (
            <SafeAreaView
                style={styles.safe}
            >
                <View
                    style={
                        styles.loadingScreen
                    }
                >
                    <ActivityIndicator
                        size="large"
                        color={RED}
                    />

                    <Text
                        style={
                            styles.loadingScreenText
                        }
                    >
                        Memuat data...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // =========================================================
    // MIDTRANS PAYMENT SCREEN
    // =========================================================

    if (paymentUrl) {
        return (
            <SafeAreaView
                style={
                    styles.paymentScreen
                }
            >
                <View
                    style={
                        styles.paymentHeader
                    }
                >
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={
                            styles.paymentBackButton
                        }
                        onPress={
                            handleBack
                        }
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#222"
                        />
                    </TouchableOpacity>

                    <View
                        style={
                            styles.paymentHeaderText
                        }
                    >
                        <Text
                            style={
                                styles.paymentHeaderTitle
                            }
                        >
                            Pembayaran
                        </Text>

                        <Text
                            style={
                                styles.paymentHeaderSubtitle
                            }
                        >
                            Selesaikan pembayaran
                            melalui Midtrans
                        </Text>
                    </View>
                </View>

                <View
                    style={
                        styles.webViewContainer
                    }
                >
                    <WebView
                        source={{
                            uri: paymentUrl,
                        }}
                        startInLoadingState
                        javaScriptEnabled
                        domStorageEnabled
                        setSupportMultipleWindows={false}
                        onNavigationStateChange={(navState) => {
                            const url = navState.url || "";
                            if (
                                url.includes("status_code=200") ||
                                url.includes("status_code=201") ||
                                url.includes("transaction_status=settlement") ||
                                url.includes("/finish") ||
                                url.includes("booking-berhasil")
                            ) {
                                setPaymentUrl("");
                                router.replace({
                                    pathname: "/booking-berhasil",
                                    params: {
                                        bookingId: String(activeBookingId || ""),
                                        orderId: String(activeOrderId || ""),
                                        metode: "midtrans",
                                    },
                                });
                            }
                        }}
                        renderLoading={() => (
                            <View
                                style={
                                    styles.webViewLoading
                                }
                            >
                                <ActivityIndicator
                                    size="large"
                                    color={
                                        RED
                                    }
                                />

                                <Text
                                    style={
                                        styles.webViewLoadingText
                                    }
                                >
                                    Membuka
                                    pembayaran
                                    Midtrans...
                                </Text>
                            </View>
                        )}
                    />
                </View>
            </SafeAreaView>
        );
    }

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <SafeAreaView
            style={styles.safe}
        >
            <View
                style={[
                    styles.container,
                    isDesktop &&
                        styles.containerDesktop,
                ]}
            >
                {/* HEADER */}

                <View
                    style={[
                        styles.header,
                        isDesktop &&
                            styles.headerDesktop,
                    ]}
                >
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={
                            styles.backButton
                        }
                        onPress={
                            handleBack
                        }
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#222"
                        />
                    </TouchableOpacity>

                    <View
                        style={
                            styles.headerText
                        }
                    >
                        <Text
                            style={
                                styles.headerTitle
                            }
                        >
                            Konfirmasi Booking
                        </Text>

                        <Text
                            style={
                                styles.headerSubtitle
                            }
                        >
                            Periksa kembali pesanan
                            Anda
                        </Text>
                    </View>

                    <RealtimeClock compact={!isDesktop} isDesktop={isDesktop} />
                </View>

                {/* CONTENT */}

                <ScrollView
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={[
                        styles.scrollContent,
                        isDesktop &&
                            styles.scrollContentDesktop,
                    ]}
                >
                    {/* STEPPER */}

                    <View
                        style={
                            styles.stepContainer
                        }
                    >
                        {[
                            "Kendaraan",
                            "Layanan",
                            "Jadwal",
                            "Konfirmasi",
                        ].map(
                            (
                                label,
                                index
                            ) => {
                                const number =
                                    index + 1;

                                return (
                                    <View
                                        key={
                                            label
                                        }
                                        style={
                                            styles.stepItem
                                        }
                                    >
                                        <View
                                            style={
                                                styles.stepTop
                                            }
                                        >
                                            <View
                                                style={[
                                                    styles.stepCircle,
                                                    styles.stepCircleActive,
                                                ]}
                                            >
                                                {number <
                                                4 ? (
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={
                                                            16
                                                        }
                                                        color="#fff"
                                                    />
                                                ) : (
                                                    <Text
                                                        style={
                                                            styles.stepNumberActive
                                                        }
                                                    >
                                                        4
                                                    </Text>
                                                )}
                                            </View>

                                            {index <
                                                3 && (
                                                <View
                                                    style={[
                                                        styles.stepLine,
                                                        styles.stepLineActive,
                                                    ]}
                                                />
                                            )}
                                        </View>

                                        <Text
                                            style={[
                                                styles.stepLabel,
                                                number ===
                                                    4 &&
                                                    styles.stepLabelActive,
                                            ]}
                                        >
                                            {
                                                label
                                            }
                                        </Text>
                                    </View>
                                );
                            }
                        )}
                    </View>

                    {/* WRAPPER */}

                    <View
                        style={[
                            styles.contentWrapper,
                            isDesktop &&
                                styles.contentWrapperDesktop,
                        ]}
                    >
                        {/* TITLE */}

                        <View
                            style={
                                styles.pageIntro
                            }
                        >
                            <View
                                style={
                                    styles.pageIntroIcon
                                }
                            >
                                <Ionicons
                                    name="checkmark-done"
                                    size={28}
                                    color={
                                        RED
                                    }
                                />
                            </View>

                            <View
                                style={{
                                    flex: 1,
                                }}
                            >
                                <Text
                                    style={
                                        styles.pageTitle
                                    }
                                >
                                    Cek Detail Booking
                                </Text>

                                <Text
                                    style={
                                        styles.pageDescription
                                    }
                                >
                                    Pastikan semua
                                    informasi sudah
                                    benar sebelum
                                    melakukan booking.
                                </Text>
                            </View>
                        </View>

                        {/* KENDARAAN */}

                        <View
                            style={
                                styles.card
                            }
                        >
                            <View
                                style={
                                    styles.cardHeader
                                }
                            >
                                <View
                                    style={
                                        styles.cardHeaderIcon
                                    }
                                >
                                    <Ionicons
                                        name="car-sport"
                                        size={21}
                                        color={
                                            RED
                                        }
                                    />
                                </View>

                                <Text
                                    style={
                                        styles.cardTitle
                                    }
                                >
                                    Kendaraan
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.vehicleBox
                                }
                            >
                                <View
                                    style={
                                        styles.vehicleLargeIcon
                                    }
                                >
                                    <Ionicons
                                        name="car-sport-outline"
                                        size={34}
                                        color={
                                            RED
                                        }
                                    />
                                </View>

                                <View
                                    style={{
                                        flex: 1,
                                    }}
                                >
                                    <Text
                                        style={
                                            styles.vehicleName
                                        }
                                    >
                                        {merek ||
                                            "-"}{" "}
                                        {model ||
                                            ""}
                                    </Text>

                                    <Text
                                        style={
                                            styles.vehiclePlate
                                        }
                                    >
                                        {nomorPolisi ||
                                            "-"}
                                    </Text>

                                    <View
                                        style={
                                            styles.vehicleInfoRow
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.vehicleInfo
                                            }
                                        >
                                            Tahun{" "}
                                            {tahun ||
                                                "-"}
                                        </Text>

                                        <Text
                                            style={
                                                styles.dot
                                            }
                                        >
                                            •
                                        </Text>

                                        <Text
                                            style={
                                                styles.vehicleInfo
                                            }
                                        >
                                            {kilometer ||
                                                "0"}{" "}
                                            km
                                        </Text>
                                    </View>
                                </View>

                                <Ionicons
                                    name="checkmark-circle"
                                    size={25}
                                    color="#36A269"
                                />
                            </View>
                        </View>

                        {/* LAYANAN */}

                        <View
                            style={
                                styles.card
                            }
                        >
                            <View
                                style={
                                    styles.cardHeader
                                }
                            >
                                <View
                                    style={
                                        styles.cardHeaderIcon
                                    }
                                >
                                    <Ionicons
                                        name="construct"
                                        size={21}
                                        color={
                                            RED
                                        }
                                    />
                                </View>

                                <Text
                                    style={
                                        styles.cardTitle
                                    }
                                >
                                    Layanan Service
                                </Text>
                            </View>

                            {layananList.length ===
                            0 ? (
                                <Text
                                    style={
                                        styles.emptyService
                                    }
                                >
                                    Tidak ada layanan
                                    dipilih.
                                </Text>
                            ) : (
                                layananList.map(
                                    (
                                        item,
                                        index
                                    ) => (
                                        <View
                                            key={
                                                item.id ||
                                                index
                                            }
                                            style={[
                                                styles.serviceRow,
                                                index ===
                                                    layananList.length -
                                                        1 &&
                                                    styles.serviceRowLast,
                                            ]}
                                        >
                                            <View
                                                style={
                                                    styles.serviceNumber
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.serviceNumberText
                                                    }
                                                >
                                                    {index +
                                                        1}
                                                </Text>
                                            </View>

                                            <Text
                                                style={
                                                    styles.serviceName
                                                }
                                            >
                                                {item.nama ||
                                                    item.nama_layanan ||
                                                    item.name ||
                                                    "Layanan"}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.servicePrice
                                                }
                                            >
                                                {formatRupiah(
                                                    Number(
                                                        item.harga ||
                                                            item.price ||
                                                            0
                                                    ) *
                                                        Number(
                                                            item.qty ||
                                                                1
                                                        )
                                                )}
                                            </Text>
                                        </View>
                                    )
                                )
                            )}

                            <View
                                style={
                                    styles.totalRow
                                }
                            >
                                <Text
                                    style={
                                        styles.totalLabel
                                    }
                                >
                                    Total Layanan
                                </Text>

                                <Text
                                    style={
                                        styles.totalValue
                                    }
                                >
                                    {formatRupiah(
                                        calculatedTotal
                                    )}
                                </Text>
                            </View>
                        </View>

                        {/* BENGKEL */}

                        <View
                            style={
                                styles.card
                            }
                        >
                            <View
                                style={
                                    styles.cardHeader
                                }
                            >
                                <View
                                    style={
                                        styles.cardHeaderIcon
                                    }
                                >
                                    <Ionicons
                                        name="business"
                                        size={21}
                                        color={
                                            RED
                                        }
                                    />
                                </View>

                                <Text
                                    style={
                                        styles.cardTitle
                                    }
                                >
                                    Bengkel
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.detailRow
                                }
                            >
                                <Ionicons
                                    name="business-outline"
                                    size={20}
                                    color="#888"
                                />

                                <View
                                    style={
                                        styles.detailContent
                                    }
                                >
                                    <Text
                                        style={
                                            styles.detailLabel
                                        }
                                    >
                                        Nama Bengkel
                                    </Text>

                                    <Text
                                        style={
                                            styles.detailValue
                                        }
                                    >
                                        {namaBengkel ||
                                            "-"}
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={
                                    styles.detailRow
                                }
                            >
                                <Ionicons
                                    name="location-outline"
                                    size={20}
                                    color="#888"
                                />

                                <View
                                    style={
                                        styles.detailContent
                                    }
                                >
                                    <Text
                                        style={
                                            styles.detailLabel
                                        }
                                    >
                                        Alamat
                                    </Text>

                                    <Text
                                        style={
                                            styles.detailValue
                                        }
                                    >
                                        {alamatBengkel ||
                                            "-"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* JADWAL */}

                        <View
                            style={
                                styles.card
                            }
                        >
                            <View
                                style={
                                    styles.cardHeader
                                }
                            >
                                <View
                                    style={
                                        styles.cardHeaderIcon
                                    }
                                >
                                    <Ionicons
                                        name="calendar"
                                        size={21}
                                        color={
                                            RED
                                        }
                                    />
                                </View>

                                <Text
                                    style={
                                        styles.cardTitle
                                    }
                                >
                                    Jadwal Service
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.scheduleGrid
                                }
                            >
                                <View
                                    style={
                                        styles.scheduleBox
                                    }
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={22}
                                        color={
                                            RED
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.scheduleLabel
                                        }
                                    >
                                        Tanggal
                                    </Text>

                                    <Text
                                        style={
                                            styles.scheduleValue
                                        }
                                    >
                                        {formatDateDisplay(
                                            tanggal
                                        )}
                                    </Text>
                                </View>

                                <View
                                    style={
                                        styles.scheduleBox
                                    }
                                >
                                    <Ionicons
                                        name="time-outline"
                                        size={22}
                                        color={
                                            RED
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.scheduleLabel
                                        }
                                    >
                                        Jam
                                    </Text>

                                    <Text
                                        style={
                                            styles.scheduleValue
                                        }
                                    >
                                        {jam ||
                                            "-"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* PAYMENT INFO */}

                        <View
                            style={
                                styles.paymentInfo
                            }
                        >
                            <View
                                style={
                                    styles.paymentIcon
                                }
                            >
                                <Ionicons
                                    name="shield-checkmark-outline"
                                    size={22}
                                    color={
                                        RED
                                    }
                                />
                            </View>

                            <View
                                style={{
                                    flex: 1,
                                }}
                            >
                                <Text
                                    style={
                                        styles.paymentTitle
                                    }
                                >
                                    Pembayaran Aman
                                </Text>

                                <Text
                                    style={
                                        styles.paymentText
                                    }
                                >
                                    Setelah konfirmasi,
                                    Anda akan diarahkan
                                    ke payment gateway
                                    Midtrans untuk
                                    menyelesaikan pembayaran.
                                </Text>
                            </View>
                        </View>

                        {/* ERROR */}

                        {Boolean(errorMessage) ? (
                            <View
                                style={
                                    styles.errorBox
                                }
                            >
                                <Ionicons
                                    name="alert-circle"
                                    size={21}
                                    color={
                                        RED
                                    }
                                />

                                <Text
                                    style={
                                        styles.errorText
                                    }
                                >
                                    {
                                        errorMessage
                                    }
                                </Text>
                            </View>
                        ) : null}

                        {/* DESKTOP BOTTOM */}

                        {isDesktop && (
                            <View
                                style={
                                    styles.desktopBottomCard
                                }
                            >
                                <View>
                                    <Text
                                        style={
                                            styles.desktopTotalLabel
                                        }
                                    >
                                        Total Pembayaran
                                    </Text>

                                    <Text
                                        style={
                                            styles.desktopTotalValue
                                        }
                                    >
                                        {formatRupiah(
                                            calculatedTotal
                                        )}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={
                                        submitting
                                            ? 1
                                            : 0.85
                                    }
                                    disabled={
                                        submitting
                                    }
                                    onPress={
                                        handleConfirmBooking
                                    }
                                    style={[
                                        styles.confirmButtonDesktop,
                                        submitting &&
                                            styles.confirmButtonDisabled,
                                    ]}
                                >
                                    {submitting ? (
                                        <ActivityIndicator
                                            color="#fff"
                                        />
                                    ) : (
                                        <>
                                            <Text
                                                style={
                                                    styles.confirmButtonText
                                                }
                                            >
                                                Lanjut ke Pembayaran
                                            </Text>

                                            <Ionicons
                                                name="arrow-forward"
                                                size={
                                                    21
                                                }
                                                color="#fff"
                                            />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* MOBILE BOTTOM */}

                {!isDesktop && (
                    <View
                        style={
                            styles.bottomBar
                        }
                    >
                        <View
                            style={
                                styles.bottomPrice
                            }
                        >
                            <Text
                                style={
                                    styles.bottomLabel
                                }
                            >
                                Total Pembayaran
                            </Text>

                            <Text
                                style={
                                    styles.bottomValue
                                }
                            >
                                {formatRupiah(
                                    calculatedTotal
                                )}
                            </Text>
                        </View>

                        <TouchableOpacity
                            activeOpacity={
                                submitting
                                    ? 1
                                    : 0.85
                            }
                            disabled={
                                submitting
                            }
                            onPress={
                                handleConfirmBooking
                            }
                            style={[
                                styles.confirmButton,
                                submitting &&
                                    styles.confirmButtonDisabled,
                            ]}
                        >
                            {submitting ? (
                                <ActivityIndicator
                                    color="#fff"
                                />
                            ) : (
                                <>
                                    <Text
                                        style={
                                            styles.confirmButtonText
                                        }
                                    >
                                        Lanjut Bayar
                                    </Text>

                                    <Ionicons
                                        name="arrow-forward"
                                        size={
                                            21
                                        }
                                        color="#fff"
                                    />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F7F7F7",
    },

    container: {
        flex: 1,
    },

    containerDesktop: {
        backgroundColor: "#F5F6F8",
    },

    loadingScreen: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingScreenText: {
        fontFamily: "Poppins_400Regular",
        marginTop: 10,
        fontSize: 13,
        color: "#888",
    },

    // =========================================================
    // HEADER
    // =========================================================

    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 13,
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },

    headerDesktop: {
        paddingHorizontal: 32,
        paddingVertical: 16,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F3F3F3",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    headerText: {
        flex: 1,
    },

    headerTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "900",
        color: "#1C1C1C",
    },

    headerSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#888",
        marginTop: 2,
    },

    // =========================================================
    // SCROLL
    // =========================================================

    scrollContent: {
        paddingBottom: 125,
    },

    scrollContentDesktop: {
        paddingHorizontal: 30,
        paddingBottom: 40,
    },

    // =========================================================
    // STEPPER
    // =========================================================

    stepContainer: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 14,
        paddingTop: 18,
        paddingBottom: 16,
    },

    stepItem: {
        flex: 1,
        alignItems: "center",
    },

    stepTop: {
        width: "100%",
        alignItems: "center",
        position: "relative",
    },

    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        backgroundColor: "#E5E5E5",
    },

    stepCircleActive: {
        backgroundColor: RED,
    },

    stepNumberActive: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },

    stepLine: {
        position: "absolute",
        height: 2,
        width: "70%",
        left: "65%",
        top: 14,
        zIndex: 1,
    },

    stepLineActive: {
        backgroundColor: RED,
    },

    stepLabel: {
        fontFamily: "Poppins_600SemiBold",
        marginTop: 6,
        fontSize: 10,
        color: "#888",
        fontWeight: "600",
        textAlign: "center",
    },

    stepLabelActive: {
        fontFamily: "Poppins_800ExtraBold",
        color: RED,
        fontWeight: "900",
    },

    // =========================================================
    // CONTENT
    // =========================================================

    contentWrapper: {
        width: "100%",
    },

    contentWrapperDesktop: {
        width: "100%",
        maxWidth: 1050,
        alignSelf: "center",
    },

    pageIntro: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 5,
        flexDirection: "row",
        alignItems: "center",
    },

    pageIntroIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#FCEDED",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 13,
    },

    pageTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "900",
        color: "#202020",
    },

    pageDescription: {
        fontFamily: "Poppins_400Regular",
        marginTop: 3,
        fontSize: 12,
        color: "#888",
        lineHeight: 18,
    },

    // =========================================================
    // CARD
    // =========================================================

    card: {
        marginHorizontal: 20,
        marginTop: 15,
        padding: 16,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },

    cardHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#FCEDED",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    cardTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 15,
        fontWeight: "900",
        color: "#222",
    },

    // =========================================================
    // VEHICLE
    // =========================================================

    vehicleBox: {
        flexDirection: "row",
        alignItems: "center",
        padding: 13,
        borderRadius: 15,
        backgroundColor: "#FAFAFA",
        borderWidth: 1,
        borderColor: "#EEEEEE",
    },

    vehicleLargeIcon: {
        width: 57,
        height: 57,
        borderRadius: 16,
        backgroundColor: "#FFF0F0",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 13,
    },

    vehicleName: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 16,
        fontWeight: "900",
        color: "#222",
    },

    vehiclePlate: {
        fontFamily: "Poppins_800ExtraBold",
        marginTop: 3,
        fontSize: 14,
        fontWeight: "800",
        color: RED,
    },

    vehicleInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },

    vehicleInfo: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#888",
    },

    dot: {
        marginHorizontal: 7,
        color: "#AAA",
    },

    // =========================================================
    // SERVICE
    // =========================================================

    serviceRow: {
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },

    serviceRowLast: {
        borderBottomWidth: 0,
    },

    serviceNumber: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: "#FCEDED",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    serviceNumberText: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 12,
        fontWeight: "900",
        color: RED,
    },

    serviceName: {
        fontFamily: "Poppins_700Bold",
        flex: 1,
        fontSize: 13,
        color: "#444",
        fontWeight: "700",
    },

    servicePrice: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 13,
        color: "#222",
        fontWeight: "900",
        marginLeft: 10,
    },

    emptyService: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#999",
        textAlign: "center",
        paddingVertical: 10,
    },

    totalRow: {
        marginTop: 13,
        paddingTop: 13,
        borderTopWidth: 1,
        borderTopColor: "#E7E7E7",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    totalLabel: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        color: "#777",
        fontWeight: "700",
    },

    totalValue: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        color: RED,
        fontWeight: "900",
    },

    // =========================================================
    // DETAIL
    // =========================================================

    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 14,
    },

    detailContent: {
        flex: 1,
        marginLeft: 10,
    },

    detailLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#999",
        marginBottom: 2,
    },

    detailValue: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        color: "#333",
        fontWeight: "700",
        lineHeight: 20,
    },

    // =========================================================
    // SCHEDULE
    // =========================================================

    scheduleGrid: {
        flexDirection: "row",
        gap: 10,
    },

    scheduleBox: {
        flex: 1,
        padding: 14,
        borderRadius: 15,
        backgroundColor: "#FFF8F8",
        borderWidth: 1,
        borderColor: "#F2DADA",
    },

    scheduleLabel: {
        fontFamily: "Poppins_400Regular",
        marginTop: 8,
        fontSize: 11,
        color: "#999",
    },

    scheduleValue: {
        fontFamily: "Poppins_800ExtraBold",
        marginTop: 3,
        fontSize: 14,
        color: "#222",
        fontWeight: "900",
    },

    // =========================================================
    // PAYMENT INFO
    // =========================================================

    paymentInfo: {
        marginHorizontal: 20,
        marginTop: 15,
        padding: 14,
        borderRadius: 16,
        backgroundColor: "#FFF8F8",
        borderWidth: 1,
        borderColor: "#F0D8D8",
        flexDirection: "row",
        alignItems: "center",
    },

    paymentIcon: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: "#FCEDED",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
    },

    paymentTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 13,
        fontWeight: "900",
        color: "#333",
    },

    paymentText: {
        fontFamily: "Poppins_400Regular",
        marginTop: 3,
        fontSize: 11,
        color: "#888",
        lineHeight: 17,
    },

    // =========================================================
    // ERROR
    // =========================================================

    errorBox: {
        marginHorizontal: 20,
        marginTop: 15,
        padding: 13,
        borderRadius: 13,
        backgroundColor: "#FFF0F0",
        flexDirection: "row",
        alignItems: "center",
    },

    errorText: {
        fontFamily: "Poppins_700Bold",
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        color: RED,
        fontWeight: "700",
        lineHeight: 18,
    },

    // =========================================================
    // MOBILE
    // =========================================================

    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 18,
        paddingVertical: 11,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },

    bottomPrice: {
        flex: 1,
    },

    bottomLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#999",
    },

    bottomValue: {
        fontFamily: "Poppins_800ExtraBold",
        marginTop: 2,
        fontSize: 17,
        color: RED,
        fontWeight: "900",
    },

    confirmButton: {
        minWidth: 145,
        height: 52,
        paddingHorizontal: 18,
        borderRadius: 15,
        backgroundColor: RED,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },

    confirmButtonText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },

    confirmButtonDisabled: {
        opacity: 0.6,
    },

    // =========================================================
    // DESKTOP
    // =========================================================

    desktopBottomCard: {
        marginHorizontal: 20,
        marginTop: 18,
        marginBottom: 20,
        padding: 18,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E4E4E4",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    desktopTotalLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#888",
    },

    desktopTotalValue: {
        fontFamily: "Poppins_800ExtraBold",
        marginTop: 3,
        fontSize: 24,
        color: RED,
        fontWeight: "900",
    },

    confirmButtonDesktop: {
        minWidth: 230,
        height: 55,
        paddingHorizontal: 24,
        borderRadius: 16,
        backgroundColor: RED,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
    },

    // =========================================================
    // MIDTRANS WEBVIEW
    // =========================================================

    paymentScreen: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    paymentHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 13,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },

    paymentBackButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F3F3F3",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    paymentHeaderText: {
        flex: 1,
    },

    paymentHeaderTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "900",
        color: "#222",
    },

    paymentHeaderSubtitle: {
        fontFamily: "Poppins_400Regular",
        marginTop: 2,
        fontSize: 11,
        color: "#888",
    },

    webViewContainer: {
        flex: 1,
    },

    webViewLoading: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
    },

    webViewLoadingText: {
        fontFamily: "Poppins_400Regular",
        marginTop: 12,
        fontSize: 13,
        color: "#888",
    },
});