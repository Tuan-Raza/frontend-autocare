import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ImageBackground,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../config";

const { width } = Dimensions.get("window");

export default function AdminDashboard() {
    // Current Active Tab: 'dashboard' | 'booking' | 'pelanggan' | 'kendaraan' | 'layanan' | 'bengkel' | 'laporan' | 'pengaturan'
    const [activeTab, setActiveTab] = useState("dashboard");
    const [kelolaSubTab, setKelolaSubTab] = useState("kendaraan"); // 'kendaraan' | 'layanan' | 'bengkel'

    const [adminUser, setAdminUser] = useState({
        nama: "Ahmad Paridi",
        email: "admin@gmail.com",
        role: "Admin",
    });

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // =========================================================================
    // DATA STATES
    // =========================================================================
    // Dashboard Stats
    const [stats, setStats] = useState({
        totalBooking: 248,
        bookingHariIni: 32,
        totalPelanggan: 186,
        totalPendapatan: 18750000,
        chartData: [
            { label: "16 Sep", value: 12 },
            { label: "17 Sep", value: 18 },
            { label: "18 Sep", value: 25 },
            { label: "19 Sep", value: 22 },
            { label: "20 Sep", value: 30 },
            { label: "21 Sep", value: 28 },
            { label: "22 Sep", value: 32 },
        ],
        recentBookings: [
            {
                id: 1,
                kode_booking: "#BK-20260922-001",
                merek: "Honda",
                model: "Beat",
                layanan: "Service Berkala",
                tanggal_booking: "22 Sep 2026, 14:32",
                status: "menunggu",
                total_harga: 250000,
            },
        ],
    });

    // Bookings Tab
    const [bookings, setBookings] = useState([
        {
            id: 1,
            kode_booking: "#BK-20260922-001",
            merek: "Honda",
            model: "Beat",
            layanan: "Service Berkala",
            tanggal_booking: "22 Sep 2026, 14:32",
            total_harga: 250000,
            status: "menunggu",
        },
        {
            id: 2,
            kode_booking: "#BK-20260922-002",
            merek: "Yamaha",
            model: "NMax",
            layanan: "Ganti Oli + Tune Up",
            tanggal_booking: "22 Sep 2026, 13:15",
            total_harga: 320000,
            status: "diproses",
        },
        {
            id: 3,
            kode_booking: "#BK-20260921-003",
            merek: "Toyota",
            model: "Avanza",
            layanan: "Pengecekan Rem",
            tanggal_booking: "21 Sep 2026, 16:45",
            total_harga: 190000,
            status: "selesai",
        },
        {
            id: 4,
            kode_booking: "#BK-20260920-004",
            merek: "Honda",
            model: "Brio",
            layanan: "Service Berkala",
            tanggal_booking: "21 Sep 2026, 10:20",
            total_harga: 220000,
            status: "selesai",
        },
        {
            id: 5,
            kode_booking: "#BK-20260920-005",
            merek: "Suzuki",
            model: "Address",
            layanan: "Ganti Oli",
            tanggal_booking: "20 Sep 2026, 15:10",
            total_harga: 120000,
            status: "menunggu",
        },
    ]);
    const [bookingFilter, setBookingFilter] = useState("Semua");
    const [bookingSearch, setBookingSearch] = useState("");

    // Pelanggan Tab
    const [pelanggan, setPelanggan] = useState([
        { id: 1, nama: "Budi Santoso", email: "budi@gmail.com", no_hp: "0812-3456-7890", total_booking: 12 },
        { id: 2, nama: "Siti Nurhaliza", email: "siti@gmail.com", no_hp: "0813-2222-3333", total_booking: 8 },
        { id: 3, nama: "Andi Pratama", email: "andi@gmail.com", no_hp: "0857-1111-2222", total_booking: 6 },
        { id: 4, nama: "Rina Marlina", email: "rina@gmail.com", no_hp: "0821-4444-5555", total_booking: 5 },
        { id: 5, nama: "Dedi Kurniawan", email: "dedi@gmail.com", no_hp: "0819-9999-8888", total_booking: 4 },
        { id: 6, nama: "Fitri Alamsyah", email: "fitri@gmail.com", no_hp: "0822-7777-6666", total_booking: 3 },
    ]);
    const [pelangganSearch, setPelangganSearch] = useState("");

    // Kendaraan Tab
    const [kendaraan, setKendaraan] = useState([
        { id: 1, nomor_polisi: "B 1234 KZ", merek: "Honda", model: "Beat", tipe: "Motor", service_terakhir: "22 Sep 2026" },
        { id: 2, nomor_polisi: "B 5678 ABC", merek: "Yamaha", model: "NMax", tipe: "Motor", service_terakhir: "20 Sep 2026" },
        { id: 3, nomor_polisi: "B 3210 DEF", merek: "Toyota", model: "Avanza", tipe: "Mobil", service_terakhir: "18 Sep 2026" },
        { id: 4, nomor_polisi: "B 7890 GHI", merek: "Honda", model: "Brio", tipe: "Mobil", service_terakhir: "15 Sep 2026" },
        { id: 5, nomor_polisi: "B 4567 JKL", merek: "Suzuki", model: "Address", tipe: "Motor", service_terakhir: "12 Sep 2026" },
    ]);
    const [kendaraanFilter, setKendaraanFilter] = useState("Semua");
    const [kendaraanSearch, setKendaraanSearch] = useState("");

    // Layanan Tab
    const [layanan, setLayanan] = useState([
        { id: 1, nama_layanan: "Service Berkala", harga: 250000, estimasi: "1 jam", kategori: "Service" },
        { id: 2, nama_layanan: "Ganti Oli", harga: 120000, estimasi: "30 menit", kategori: "Service" },
        { id: 3, nama_layanan: "Tune Up", harga: 350000, estimasi: "2 jam", kategori: "Service" },
        { id: 4, nama_layanan: "Pengecekan Rem", harga: 180000, estimasi: "45 menit", kategori: "Service" },
        { id: 5, nama_layanan: "Cuci Kendaraan", harga: 75000, estimasi: "30 menit", kategori: "Lainnya" },
    ]);
    const [layananFilter, setLayananFilter] = useState("Semua");
    const [layananSearch, setLayananSearch] = useState("");

    // Bengkel Tab
    const [bengkel, setBengkel] = useState([
        {
            id: 1,
            nama_bengkel: "Honda Service Center",
            alamat: "Jl. Raya Semarang No. 12, Cikarang, Bekasi",
            rating: 4.8,
            reviews: 120,
            status: "Aktif",
        },
        {
            id: 2,
            nama_bengkel: "Yamaha Service",
            alamat: "Jl. Industri No. 45, Karawang",
            rating: 4.6,
            reviews: 98,
            status: "Aktif",
        },
        {
            id: 3,
            nama_bengkel: "Toyota Auto2000",
            alamat: "Jl. Ahmad Yani No. 77, Bekasi",
            rating: 4.7,
            reviews: 110,
            status: "Aktif",
        },
        {
            id: 4,
            nama_bengkel: "Suzuki Indomobil",
            alamat: "Jl. Veteran No. 23, Karawang",
            rating: 4.5,
            reviews: 87,
            status: "Aktif",
        },
    ]);
    const [bengkelSearch, setBengkelSearch] = useState("");

    // Modals
    const [modalVisible, setModalVisible] = useState(null); // 'tambahPelanggan' | 'tambahLayanan' | 'tambahBengkel'
    const [newItemName, setNewItemName] = useState("");
    const [newItemExtra, setNewItemExtra] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");

    // =========================================================================
    // LOAD SESSION & SERVER DATA
    // =========================================================================
    const loadSession = async () => {
        try {
            const raw = await AsyncStorage.getItem("autocare_user");
            if (raw) {
                const u = JSON.parse(raw);
                if (u && u.email) {
                    setAdminUser({
                        nama: u.nama || "Ahmad Paridi",
                        email: u.email || "admin@gmail.com",
                        role: "Admin",
                    });
                }
            }
        } catch (_) {}
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch Stats
            fetch(`${API_URL}/api/admin/dashboard`)
                .then((r) => r.json())
                .then((d) => {
                    if (d.success && d.data) {
                        setStats(d.data);
                    }
                })
                .catch(() => {});

            // Fetch Bookings
            fetch(`${API_URL}/api/admin/bookings`)
                .then((r) => r.json())
                .then((d) => {
                    if (d.success && Array.isArray(d.data)) {
                        setBookings(d.data);
                    }
                })
                .catch(() => {});

            // Fetch Pelanggan
            fetch(`${API_URL}/api/admin/pelanggan`)
                .then((r) => r.json())
                .then((d) => {
                    if (d.success && Array.isArray(d.data)) {
                        setPelanggan(d.data);
                    }
                })
                .catch(() => {});

            // Fetch Kendaraan
            fetch(`${API_URL}/api/admin/kendaraan`)
                .then((r) => r.json())
                .then((d) => {
                    if (d.success && Array.isArray(d.data)) {
                        setKendaraan(d.data);
                    }
                })
                .catch(() => {});

            // Fetch Layanan
            fetch(`${API_URL}/api/admin/layanan`)
                .then((r) => r.json())
                .then((d) => {
                    if (d.success && Array.isArray(d.data)) {
                        setLayanan(d.data);
                    }
                })
                .catch(() => {});

            // Fetch Bengkel
            fetch(`${API_URL}/api/admin/bengkel`)
                .then((r) => r.json())
                .then((d) => {
                    if (d.success && Array.isArray(d.data)) {
                        setBengkel(d.data);
                    }
                })
                .catch(() => {});
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSession();
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // =========================================================================
    // HANDLERS
    // =========================================================================
    const handleLogout = async () => {
        Alert.alert("Logout", "Apakah Anda yakin ingin keluar dari akun Admin?", [
            { text: "Batal", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await AsyncStorage.removeItem("autocare_user");
                    router.replace("/login");
                },
            },
        ]);
    };

    const handleUpdateStatus = (bookingId, currentStatus) => {
        const nextStatus =
            currentStatus === "menunggu"
                ? "diproses"
                : currentStatus === "diproses"
                ? "selesai"
                : "menunggu";

        Alert.alert(
            "Ubah Status Booking",
            `Ubah status booking #${bookingId} dari '${currentStatus}' menjadi '${nextStatus}'?`,
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Ubah",
                    onPress: async () => {
                        // Optimistic update
                        setBookings((prev) =>
                            prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
                        );

                        try {
                            await fetch(`${API_URL}/api/admin/bookings/${bookingId}/status`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: nextStatus }),
                            });
                        } catch (_) {}
                    },
                },
            ]
        );
    };

    const formatCurrency = (val) => {
        return "Rp " + Number(val || 0).toLocaleString("id-ID");
    };

    // =========================================================================
    // RENDER: TOP HEADER
    // =========================================================================
    const getHeaderTitle = () => {
        switch (activeTab) {
            case "dashboard":
                return "Dashboard";
            case "booking":
                return "Booking";
            case "pelanggan":
                return "Pelanggan";
            case "kelola":
                return kelolaSubTab === "kendaraan"
                    ? "Kendaraan"
                    : kelolaSubTab === "layanan"
                    ? "Layanan"
                    : "Bengkel";
            case "laporan":
                return "Laporan";
            case "pengaturan":
                return "Pengaturan";
            default:
                return "Admin AutoCare";
        }
    };

    const renderHeader = () => (
        <View style={styles.topHeader}>
            <View style={styles.topHeaderLeft}>
                <Text style={styles.topHeaderTitle}>{getHeaderTitle()}</Text>
            </View>

            <View style={styles.topHeaderRight}>
                {/* Notification Bell */}
                <TouchableOpacity
                    style={styles.notificationBtn}
                    onPress={() => Alert.alert("Notifikasi", "Tidak ada notifikasi baru untuk Admin.")}
                >
                    <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>

                {/* Profile Pill */}
                <TouchableOpacity
                    style={styles.profileBadge}
                    onPress={() => setActiveTab("pengaturan")}
                >
                    <View style={styles.profileAvatar}>
                        <Ionicons name="person" size={14} color="#8B0000" />
                    </View>
                    <View style={styles.profileTextWrapper}>
                        <Text style={styles.profileName} numberOfLines={1}>
                            {adminUser.nama}
                        </Text>
                        <Text style={styles.profileRole}>Admin</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );

    // =========================================================================
    // RENDER: SUB-HEADER (AutoCare Logo Brand)
    // =========================================================================
    const renderBrandRow = () => (
        <View style={styles.brandRow}>
            <Image
                source={require("../../assets/images/autocare-logo.png")}
                style={styles.brandLogo}
                resizeMode="contain"
            />
            <Text style={styles.brandSlogan}>Servis Cepat, Perjalanan Nyaman & Terpercaya</Text>
        </View>
    );

    // =========================================================================
    // SCREEN 1: DASHBOARD
    // =========================================================================
    const renderDashboard = () => (
        <ScrollView
            style={styles.contentScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C8102E"]} />}
        >
            {renderBrandRow()}

            {/* Welcome Banner Card */}
            <View style={styles.welcomeBanner}>
                <ImageBackground
                    source={require("../../assets/images/autocare-banner.png")}
                    style={styles.bannerImage}
                    imageStyle={{ borderRadius: 12, opacity: 0.25 }}
                >
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Selamat Datang,</Text>
                        <Text style={styles.bannerName}>{adminUser.nama}</Text>
                        <Text style={styles.bannerDesc}>
                            Kelola semua data dan layanan AutoCare dengan mudah melalui dashboard admin.
                        </Text>
                        <View style={styles.bannerBadge}>
                            <Text style={styles.bannerBadgeText}>
                                "Servis Mudah, Perjalanan Lebih Baik"
                            </Text>
                        </View>
                    </View>
                </ImageBackground>
            </View>

            {/* 4 Stats Grid */}
            <View style={styles.statsGrid}>
                {/* Total Booking */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIconBox, { backgroundColor: "#FFECEE" }]}>
                            <Ionicons name="calendar-outline" size={18} color="#C8102E" />
                        </View>
                        <Text style={styles.statLabel}>Total Booking</Text>
                    </View>
                    <Text style={styles.statValue}>{stats.totalBooking}</Text>
                    <View style={styles.statTrend}>
                        <Ionicons name="trending-up" size={14} color="#16A34A" />
                        <Text style={styles.statTrendText}>+12% dari bulan lalu</Text>
                    </View>
                </View>

                {/* Booking Hari Ini */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIconBox, { backgroundColor: "#EFF6FF" }]}>
                            <Ionicons name="time-outline" size={18} color="#2563EB" />
                        </View>
                        <Text style={styles.statLabel}>Booking Hari Ini</Text>
                    </View>
                    <Text style={styles.statValue}>{stats.bookingHariIni}</Text>
                    <View style={styles.statTrend}>
                        <Ionicons name="trending-up" size={14} color="#16A34A" />
                        <Text style={styles.statTrendText}>+8% dari kemarin</Text>
                    </View>
                </View>

                {/* Total Pelanggan */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIconBox, { backgroundColor: "#F0FDF4" }]}>
                            <Ionicons name="people-outline" size={18} color="#16A34A" />
                        </View>
                        <Text style={styles.statLabel}>Total Pelanggan</Text>
                    </View>
                    <Text style={styles.statValue}>{stats.totalPelanggan}</Text>
                    <View style={styles.statTrend}>
                        <Ionicons name="trending-up" size={14} color="#16A34A" />
                        <Text style={styles.statTrendText}>+15% dari bulan lalu</Text>
                    </View>
                </View>

                {/* Total Pendapatan */}
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIconBox, { backgroundColor: "#FEF3C7" }]}>
                            <Ionicons name="wallet-outline" size={18} color="#D97706" />
                        </View>
                        <Text style={styles.statLabel}>Total Pendapatan</Text>
                    </View>
                    <Text style={[styles.statValue, { fontSize: 15 }]}>
                        {formatCurrency(stats.totalPendapatan)}
                    </Text>
                    <View style={styles.statTrend}>
                        <Ionicons name="trending-up" size={14} color="#16A34A" />
                        <Text style={styles.statTrendText}>+20% dari bulan lalu</Text>
                    </View>
                </View>
            </View>

            {/* Grafik Booking Card */}
            <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                    <View style={styles.rowAlign}>
                        <Ionicons name="bar-chart-outline" size={18} color="#C8102E" style={{ marginRight: 6 }} />
                        <Text style={styles.cardTitle}>Grafik Booking</Text>
                    </View>
                    <View style={styles.filterChip}>
                        <Text style={styles.filterChipText}>7 Hari Terakhir</Text>
                        <Ionicons name="chevron-down" size={12} color="#666" />
                    </View>
                </View>

                {/* Bar Chart Bars */}
                <View style={styles.chartContainer}>
                    {stats.chartData.map((item, index) => {
                        const maxVal = Math.max(...stats.chartData.map((d) => d.value), 35);
                        const barHeight = (item.value / maxVal) * 110;
                        return (
                            <View key={index} style={styles.barColumn}>
                                <Text style={styles.barValue}>{item.value}</Text>
                                <View style={[styles.barFill, { height: barHeight }]} />
                                <Text style={styles.barLabel}>{item.label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Booking Terbaru Section */}
            <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                    <View style={styles.rowAlign}>
                        <Ionicons name="flash-outline" size={18} color="#C8102E" style={{ marginRight: 6 }} />
                        <Text style={styles.cardTitle}>Booking Terbaru</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab("booking")}>
                        <Text style={styles.linkText}>Lihat Semua {">"}</Text>
                    </TouchableOpacity>
                </View>

                {stats.recentBookings.map((b, i) => (
                    <TouchableOpacity
                        key={i}
                        style={styles.recentItem}
                        onPress={() => setActiveTab("booking")}
                    >
                        <View style={styles.recentIconBox}>
                            <Ionicons name="car-sport" size={20} color="#C8102E" />
                        </View>
                        <View style={styles.recentInfo}>
                            <Text style={styles.recentVehicle}>
                                {b.merek} {b.model}
                            </Text>
                            <Text style={styles.recentService}>{b.layanan || "Service Berkala"}</Text>
                            <Text style={styles.recentDate}>
                                {b.tanggal_booking || "22 Sep 2026, 14:32"}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, styles[`status_${b.status}`]]}>
                            <Text style={[styles.statusText, styles[`statusText_${b.status}`]]}>
                                {b.status === "menunggu"
                                    ? "Menunggu"
                                    : b.status === "diproses"
                                    ? "Diproses"
                                    : "Selesai"}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    // =========================================================================
    // SCREEN 2: BOOKING
    // =========================================================================
    const renderBookingTab = () => {
        const filtered = bookings.filter((b) => {
            const matchStatus =
                bookingFilter === "Semua" ||
                b.status?.toLowerCase() === bookingFilter.toLowerCase();
            const q = bookingSearch.toLowerCase();
            const matchQuery =
                !q ||
                b.kode_booking?.toLowerCase().includes(q) ||
                b.customer_nama?.toLowerCase().includes(q) ||
                b.merek?.toLowerCase().includes(q) ||
                b.model?.toLowerCase().includes(q);
            return matchStatus && matchQuery;
        });

        return (
            <ScrollView
                style={styles.contentScroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C8102E"]} />}
            >
                {renderBrandRow()}

                {/* Search Bar */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari nomor booking, nama pelanggan..."
                            placeholderTextColor="#999"
                            value={bookingSearch}
                            onChangeText={setBookingSearch}
                        />
                    </View>
                    <TouchableOpacity style={styles.filterIconBtn}>
                        <Ionicons name="options-outline" size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Filter Pills */}
                <View style={styles.pillsRow}>
                    {["Semua", "Menunggu", "Diproses", "Selesai"].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.pillBtn, bookingFilter === tab && styles.pillBtnActive]}
                            onPress={() => setBookingFilter(tab)}
                        >
                            <Text
                                style={[
                                    styles.pillText,
                                    bookingFilter === tab && styles.pillTextActive,
                                ]}
                            >
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* List of Bookings */}
                {filtered.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.bookingCard}
                        onPress={() => handleUpdateStatus(item.id, item.status)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.bookingCardHeader}>
                            <Text style={styles.bookingCode}>{item.kode_booking}</Text>
                            <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                                <Text style={[styles.statusText, styles[`statusText_${item.status}`]]}>
                                    {item.status === "menunggu"
                                        ? "Menunggu"
                                        : item.status === "diproses"
                                        ? "Diproses"
                                        : "Selesai"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bookingCardBody}>
                            <View style={styles.bookingVehicleRow}>
                                <View style={styles.bookingIconCircle}>
                                    <Ionicons name="car-sport" size={18} color="#C8102E" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.bookingVehicleName}>
                                        {item.merek} {item.model}
                                    </Text>
                                    <Text style={styles.bookingServiceName}>
                                        {item.layanan || "Service Berkala"}
                                    </Text>
                                    <Text style={styles.bookingDateText}>
                                        {item.tanggal_booking || "22 Sep 2026, 14:32"}
                                    </Text>
                                </View>
                                <View style={styles.bookingPriceBox}>
                                    <Text style={styles.bookingPrice}>
                                        {formatCurrency(item.total_harga || 250000)}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={16} color="#999" />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>
        );
    };

    // =========================================================================
    // SCREEN 3: PELANGGAN
    // =========================================================================
    const renderPelangganTab = () => {
        const filtered = pelanggan.filter((p) => {
            const q = pelangganSearch.toLowerCase();
            return (
                !q ||
                p.nama.toLowerCase().includes(q) ||
                p.email.toLowerCase().includes(q) ||
                p.no_hp.toLowerCase().includes(q)
            );
        });

        return (
            <ScrollView
                style={styles.contentScroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C8102E"]} />}
            >
                {renderBrandRow()}

                {/* Search */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari nama, email, atau no. HP..."
                            placeholderTextColor="#999"
                            value={pelangganSearch}
                            onChangeText={setPelangganSearch}
                        />
                    </View>
                    <TouchableOpacity style={styles.filterIconBtn}>
                        <Ionicons name="options-outline" size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* + Tambah Pelanggan Button */}
                <TouchableOpacity
                    style={styles.primaryAddBtn}
                    onPress={() => setModalVisible("tambahPelanggan")}
                >
                    <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryAddBtnText}>+ Tambah Pelanggan</Text>
                </TouchableOpacity>

                {/* Pelanggan Cards */}
                {filtered.map((item) => (
                    <View key={item.id} style={styles.customerCard}>
                        <View style={styles.customerAvatar}>
                            <Ionicons name="person" size={22} color="#666" />
                        </View>
                        <View style={styles.customerDetails}>
                            <Text style={styles.customerName}>{item.nama}</Text>
                            <Text style={styles.customerEmail}>{item.email}</Text>
                            <Text style={styles.customerPhone}>{item.no_hp}</Text>
                        </View>
                        <View style={styles.customerBookingBadge}>
                            <Text style={styles.customerBookingText}>
                                {item.total_booking || 4} Booking
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#999" />
                        </View>
                    </View>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>
        );
    };

    // =========================================================================
    // SCREEN 4: KELOLA (KENDARAAN / LAYANAN / BENGKEL)
    // =========================================================================
    const renderKelolaTab = () => (
        <ScrollView
            style={styles.contentScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C8102E"]} />}
        >
            {renderBrandRow()}

            {/* Sub Tabs Selector */}
            <View style={styles.subTabSelector}>
                <TouchableOpacity
                    style={[styles.subTabBtn, kelolaSubTab === "kendaraan" && styles.subTabBtnActive]}
                    onPress={() => setKelolaSubTab("kendaraan")}
                >
                    <Ionicons
                        name="car-outline"
                        size={16}
                        color={kelolaSubTab === "kendaraan" ? "#C8102E" : "#666"}
                    />
                    <Text
                        style={[
                            styles.subTabText,
                            kelolaSubTab === "kendaraan" && styles.subTabTextActive,
                        ]}
                    >
                        Kendaraan
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.subTabBtn, kelolaSubTab === "layanan" && styles.subTabBtnActive]}
                    onPress={() => setKelolaSubTab("layanan")}
                >
                    <Ionicons
                        name="construct-outline"
                        size={16}
                        color={kelolaSubTab === "layanan" ? "#C8102E" : "#666"}
                    />
                    <Text
                        style={[
                            styles.subTabText,
                            kelolaSubTab === "layanan" && styles.subTabTextActive,
                        ]}
                    >
                        Layanan
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.subTabBtn, kelolaSubTab === "bengkel" && styles.subTabBtnActive]}
                    onPress={() => setKelolaSubTab("bengkel")}
                >
                    <Ionicons
                        name="business-outline"
                        size={16}
                        color={kelolaSubTab === "bengkel" ? "#C8102E" : "#666"}
                    />
                    <Text
                        style={[
                            styles.subTabText,
                            kelolaSubTab === "bengkel" && styles.subTabTextActive,
                        ]}
                    >
                        Bengkel
                    </Text>
                </TouchableOpacity>
            </View>

            {/* SUB-TAB 1: KENDARAAN */}
            {kelolaSubTab === "kendaraan" && (
                <View>
                    <View style={styles.searchRow}>
                        <View style={styles.searchBox}>
                            <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari plat nomor, merk, atau tipe..."
                                placeholderTextColor="#999"
                                value={kendaraanSearch}
                                onChangeText={setKendaraanSearch}
                            />
                        </View>
                        <TouchableOpacity style={styles.filterIconBtn}>
                            <Ionicons name="options-outline" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Pills */}
                    <View style={styles.pillsRow}>
                        {["Semua", "Mobil", "Motor"].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.pillBtn, kendaraanFilter === tab && styles.pillBtnActive]}
                                onPress={() => setKendaraanFilter(tab)}
                            >
                                <Text
                                    style={[
                                        styles.pillText,
                                        kendaraanFilter === tab && styles.pillTextActive,
                                    ]}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {kendaraan
                        .filter((v) => {
                            const matchType =
                                kendaraanFilter === "Semua" ||
                                v.tipe.toLowerCase() === kendaraanFilter.toLowerCase();
                            const q = kendaraanSearch.toLowerCase();
                            const matchQuery =
                                !q ||
                                v.nomor_polisi.toLowerCase().includes(q) ||
                                v.merek.toLowerCase().includes(q) ||
                                v.model.toLowerCase().includes(q);
                            return matchType && matchQuery;
                        })
                        .map((v) => (
                            <View key={v.id} style={styles.vehicleCard}>
                                <View style={styles.vehicleThumb}>
                                    <Ionicons
                                        name={v.tipe === "Motor" ? "bicycle" : "car"}
                                        size={32}
                                        color="#333"
                                    />
                                </View>
                                <View style={styles.vehicleDetails}>
                                    <Text style={styles.vehiclePlate}>{v.nomor_polisi}</Text>
                                    <Text style={styles.vehicleName}>
                                        {v.merek} {v.model}
                                    </Text>
                                    <Text style={styles.vehicleType}>{v.tipe}</Text>
                                    <Text style={styles.vehicleServiceLast}>
                                        Service terakhir: {v.service_terakhir}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#999" />
                            </View>
                        ))}
                </View>
            )}

            {/* SUB-TAB 2: LAYANAN */}
            {kelolaSubTab === "layanan" && (
                <View>
                    <View style={styles.searchRow}>
                        <View style={styles.searchBox}>
                            <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari layanan..."
                                placeholderTextColor="#999"
                                value={layananSearch}
                                onChangeText={setLayananSearch}
                            />
                        </View>
                        <TouchableOpacity style={styles.filterIconBtn}>
                            <Ionicons name="options-outline" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.primaryAddBtn}
                        onPress={() => setModalVisible("tambahLayanan")}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryAddBtnText}>+ Tambah Layanan</Text>
                    </TouchableOpacity>

                    {/* Filter Pills */}
                    <View style={styles.pillsRow}>
                        {["Semua", "Service", "Ganti Oli", "Tune Up"].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.pillBtn, layananFilter === tab && styles.pillBtnActive]}
                                onPress={() => setLayananFilter(tab)}
                            >
                                <Text
                                    style={[
                                        styles.pillText,
                                        layananFilter === tab && styles.pillTextActive,
                                    ]}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {layanan
                        .filter((s) => {
                            const matchCat =
                                layananFilter === "Semua" ||
                                s.kategori.toLowerCase() === layananFilter.toLowerCase();
                            const q = layananSearch.toLowerCase();
                            const matchQuery = !q || s.nama_layanan.toLowerCase().includes(q);
                            return matchCat && matchQuery;
                        })
                        .map((s) => (
                            <View key={s.id} style={styles.serviceCard}>
                                <View style={styles.serviceIconCircle}>
                                    <Ionicons
                                        name={
                                            s.nama_layanan.toLowerCase().includes("oli")
                                                ? "water-outline"
                                                : s.nama_layanan.toLowerCase().includes("tune")
                                                ? "speedometer-outline"
                                                : s.nama_layanan.toLowerCase().includes("cuci")
                                                ? "sparkles-outline"
                                                : "shield-checkmark-outline"
                                        }
                                        size={22}
                                        color="#C8102E"
                                    />
                                </View>
                                <View style={styles.serviceInfo}>
                                    <Text style={styles.serviceName}>{s.nama_layanan}</Text>
                                    <Text style={styles.servicePrice}>{formatCurrency(s.harga)}</Text>
                                    <View style={styles.serviceDurationRow}>
                                        <Ionicons name="time-outline" size={13} color="#888" style={{ marginRight: 4 }} />
                                        <Text style={styles.serviceDuration}>{s.estimasi}</Text>
                                    </View>
                                </View>
                                <View style={styles.serviceBadge}>
                                    <Text style={styles.serviceBadgeText}>{s.kategori}</Text>
                                </View>
                            </View>
                        ))}
                </View>
            )}

            {/* SUB-TAB 3: BENGKEL */}
            {kelolaSubTab === "bengkel" && (
                <View>
                    <View style={styles.searchRow}>
                        <View style={styles.searchBox}>
                            <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari nama bengkel atau lokasi..."
                                placeholderTextColor="#999"
                                value={bengkelSearch}
                                onChangeText={setBengkelSearch}
                            />
                        </View>
                        <TouchableOpacity style={styles.filterIconBtn}>
                            <Ionicons name="options-outline" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.primaryAddBtn}
                        onPress={() => setModalVisible("tambahBengkel")}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryAddBtnText}>+ Tambah Bengkel</Text>
                    </TouchableOpacity>

                    {bengkel
                        .filter((w) => {
                            const q = bengkelSearch.toLowerCase();
                            return (
                                !q ||
                                w.nama_bengkel.toLowerCase().includes(q) ||
                                w.alamat.toLowerCase().includes(q)
                            );
                        })
                        .map((w) => (
                            <View key={w.id} style={styles.workshopCard}>
                                <View style={styles.workshopImagePlaceholder}>
                                    <Ionicons name="business" size={32} color="#C8102E" />
                                </View>
                                <View style={styles.workshopDetails}>
                                    <Text style={styles.workshopName}>{w.nama_bengkel}</Text>
                                    <Text style={styles.workshopAddress} numberOfLines={2}>
                                        {w.alamat}
                                    </Text>
                                    <View style={styles.workshopRatingRow}>
                                        <Ionicons name="star" size={14} color="#F59E0B" />
                                        <Text style={styles.workshopRatingText}>
                                            {w.rating} ({w.reviews})
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.workshopStatusBadge}>
                                    <Text style={styles.workshopStatusText}>Aktif</Text>
                                </View>
                            </View>
                        ))}
                </View>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    // =========================================================================
    // SCREEN 5: LAPORAN
    // =========================================================================
    const renderLaporanTab = () => (
        <ScrollView
            style={styles.contentScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C8102E"]} />}
        >
            {renderBrandRow()}

            {/* Periode Picker Card */}
            <View style={styles.periodCard}>
                <View>
                    <Text style={styles.periodLabel}>Periode</Text>
                    <Text style={styles.periodValue}>September 2026</Text>
                </View>
                <TouchableOpacity style={styles.periodBtn}>
                    <Ionicons name="calendar-outline" size={20} color="#C8102E" />
                </TouchableOpacity>
            </View>

            {/* 4 Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIconBox, { backgroundColor: "#FFECEE" }]}>
                            <Ionicons name="bar-chart-outline" size={18} color="#C8102E" />
                        </View>
                        <Text style={styles.statLabel}>Total Booking</Text>
                    </View>
                    <Text style={styles.statValue}>248</Text>
                    <View style={styles.statTrend}>
                        <Ionicons name="trending-up" size={14} color="#16A34A" />
                        <Text style={styles.statTrendText}>+12%</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIconBox, { backgroundColor: "#F0FDF4" }]}>
                            <Ionicons name="cash-outline" size={18} color="#16A34A" />
                        </View>
                        <Text style={styles.statLabel}>Total Pendapatan</Text>
                    </View>
                    <Text style={[styles.statValue, { fontSize: 14 }]}>Rp 18.750.000</Text>
                    <View style={styles.statTrend}>
                        <Ionicons name="trending-up" size={14} color="#16A34A" />
                        <Text style={styles.statTrendText}>+20%</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIconBox, { backgroundColor: "#EFF6FF" }]}>
                            <Ionicons name="build-outline" size={18} color="#2563EB" />
                        </View>
                        <Text style={styles.statLabel}>Total Layanan</Text>
                    </View>
                    <Text style={styles.statValue}>12</Text>
                    <View style={styles.statTrend}>
                        <Ionicons name="trending-up" size={14} color="#16A34A" />
                        <Text style={styles.statTrendText}>+5%</Text>
                    </View>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statHeader}>
                        <View style={[styles.statIconBox, { backgroundColor: "#FAF5FF" }]}>
                            <Ionicons name="people-outline" size={18} color="#9333EA" />
                        </View>
                        <Text style={styles.statLabel}>Total Pelanggan</Text>
                    </View>
                    <Text style={styles.statValue}>186</Text>
                    <View style={styles.statTrend}>
                        <Ionicons name="trending-up" size={14} color="#16A34A" />
                        <Text style={styles.statTrendText}>+15%</Text>
                    </View>
                </View>
            </View>

            {/* Laporan Pendapatan Chart */}
            <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}>Laporan Pendapatan</Text>
                <View style={[styles.chartContainer, { height: 130 }]}>
                    {[
                        { label: "1-5", height: 40 },
                        { label: "6-10", height: 60 },
                        { label: "11-15", height: 50 },
                        { label: "16-20", height: 80 },
                        { label: "21-25", height: 75 },
                        { label: "26-30", height: 95 },
                    ].map((item, index) => (
                        <View key={index} style={styles.barColumn}>
                            <View style={[styles.barFill, { height: item.height, backgroundColor: "#C8102E" }]} />
                            <Text style={styles.barLabel}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Unduh Laporan */}
            <View style={styles.cardContainer}>
                <Text style={styles.cardTitle}>Unduh Laporan</Text>
                <View style={styles.downloadRow}>
                    <TouchableOpacity
                        style={[styles.downloadBtn, { backgroundColor: "#C8102E" }]}
                        onPress={() => Alert.alert("Unduh PDF", "Laporan PDF berhasil disiapkan dan diunduh.")}
                    >
                        <Ionicons name="document-text" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.downloadBtnText}>PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.downloadBtn, { backgroundColor: "#16A34A" }]}
                        onPress={() => Alert.alert("Unduh Excel", "Laporan Excel berhasil disiapkan dan diunduh.")}
                    >
                        <Ionicons name="grid" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.downloadBtnText}>Excel</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    // =========================================================================
    // SCREEN 6: PENGATURAN
    // =========================================================================
    const renderPengaturanTab = () => (
        <ScrollView
            style={styles.contentScroll}
            showsVerticalScrollIndicator={false}
        >
            {renderBrandRow()}

            {/* Profile Large Card */}
            <View style={styles.profileBigCard}>
                <View style={styles.profileBigAvatar}>
                    <Ionicons name="person" size={40} color="#C8102E" />
                </View>
                <View style={styles.profileBigInfo}>
                    <Text style={styles.profileBigName}>{adminUser.nama}</Text>
                    <Text style={styles.profileBigEmail}>{adminUser.email}</Text>
                    <View style={styles.profileRoleTag}>
                        <Text style={styles.profileRoleTagText}>Admin</Text>
                    </View>
                </View>
            </View>

            {/* Settings Menu List */}
            <View style={styles.settingsMenuCard}>
                {[
                    { icon: "person-outline", title: "Ubah Profil", onPress: () => Alert.alert("Ubah Profil", "Fitur ubah profil admin aktif.") },
                    { icon: "lock-closed-outline", title: "Ubah Password", onPress: () => Alert.alert("Ubah Password", "Fitur ubah password admin aktif.") },
                    { icon: "notifications-outline", title: "Notifikasi", onPress: () => Alert.alert("Notifikasi", "Pengaturan notifikasi admin.") },
                    { icon: "color-palette-outline", title: "Tema Aplikasi", extra: "Terang", onPress: () => {} },
                    { icon: "globe-outline", title: "Bahasa", extra: "Indonesia", onPress: () => {} },
                    { icon: "information-circle-outline", title: "Tentang Aplikasi", onPress: () => Alert.alert("AutoCare v1.0", "AutoCare Admin Panel v1.0.0") },
                    { icon: "help-circle-outline", title: "Bantuan", onPress: () => Alert.alert("Bantuan", "Pusat bantuan AutoCare siap membantu.") },
                ].map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.settingsMenuItem}
                        onPress={item.onPress}
                    >
                        <Ionicons name={item.icon} size={20} color="#444" style={{ marginRight: 14 }} />
                        <Text style={styles.settingsMenuTitle}>{item.title}</Text>
                        <View style={{ flex: 1 }} />
                        {item.extra && <Text style={styles.settingsMenuExtra}>{item.extra}</Text>}
                        <Ionicons name="chevron-forward" size={16} color="#999" />
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#C8102E" style={{ marginRight: 8 }} />
                <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    // =========================================================================
    // MODAL ADD POPUP (Pelanggan / Layanan / Bengkel)
    // =========================================================================
    const handleSaveNewItem = async () => {
        if (!newItemName.trim()) {
            Alert.alert("Perhatian", "Nama wajib diisi.");
            return;
        }

        if (modalVisible === "tambahPelanggan") {
            const newCust = {
                id: Date.now(),
                nama: newItemName.trim(),
                email: newItemExtra.trim() || `${newItemName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
                no_hp: newItemPrice.trim() || "0812-0000-0000",
                total_booking: 0,
            };
            setPelanggan((prev) => [newCust, ...prev]);
            try {
                await fetch(`${API_URL}/api/admin/pelanggan`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newCust),
                });
            } catch (_) {}
            Alert.alert("Sukses", "Pelanggan baru berhasil ditambahkan!");
        } else if (modalVisible === "tambahLayanan") {
            const newLayanan = {
                id: Date.now(),
                nama_layanan: newItemName.trim(),
                harga: parseInt(newItemPrice, 10) || 150000,
                estimasi: newItemExtra.trim() || "1 jam",
                kategori: "Service",
            };
            setLayanan((prev) => [newLayanan, ...prev]);
            try {
                await fetch(`${API_URL}/api/admin/layanan`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newLayanan),
                });
            } catch (_) {}
            Alert.alert("Sukses", "Layanan baru berhasil ditambahkan!");
        } else if (modalVisible === "tambahBengkel") {
            const newWk = {
                id: Date.now(),
                nama_bengkel: newItemName.trim(),
                alamat: newItemExtra.trim() || "Jl. Pusat AutoCare No. 1",
                rating: 5.0,
                reviews: 1,
                status: "Aktif",
            };
            setBengkel((prev) => [newWk, ...prev]);
            try {
                await fetch(`${API_URL}/api/admin/bengkel`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newWk),
                });
            } catch (_) {}
            Alert.alert("Sukses", "Bengkel baru berhasil ditambahkan!");
        }

        setModalVisible(null);
        setNewItemName("");
        setNewItemExtra("");
        setNewItemPrice("");
    };

    const renderModal = () => (
        <Modal
            visible={modalVisible !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setModalVisible(null)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>
                        {modalVisible === "tambahPelanggan"
                            ? "Tambah Pelanggan Baru"
                            : modalVisible === "tambahLayanan"
                            ? "Tambah Layanan Baru"
                            : "Tambah Bengkel Baru"}
                    </Text>

                    <TextInput
                        style={styles.modalInput}
                        placeholder={
                            modalVisible === "tambahPelanggan"
                                ? "Nama Lengkap"
                                : modalVisible === "tambahLayanan"
                                ? "Nama Layanan"
                                : "Nama Bengkel"
                        }
                        value={newItemName}
                        onChangeText={setNewItemName}
                    />

                    <TextInput
                        style={styles.modalInput}
                        placeholder={
                            modalVisible === "tambahPelanggan"
                                ? "Email (misal: budi@gmail.com)"
                                : modalVisible === "tambahLayanan"
                                ? "Estimasi Waktu (misal: 1 jam)"
                                : "Alamat Lengkap"
                        }
                        value={newItemExtra}
                        onChangeText={setNewItemExtra}
                    />

                    <TextInput
                        style={styles.modalInput}
                        placeholder={
                            modalVisible === "tambahPelanggan"
                                ? "Nomor HP / WhatsApp"
                                : modalVisible === "tambahLayanan"
                                ? "Harga (Rp)"
                                : "Nomor Kontak Bengkel"
                        }
                        keyboardType={modalVisible === "tambahLayanan" ? "numeric" : "default"}
                        value={newItemPrice}
                        onChangeText={setNewItemPrice}
                    />

                    <View style={styles.modalActionsRow}>
                        <TouchableOpacity
                            style={styles.modalCancelBtn}
                            onPress={() => setModalVisible(null)}
                        >
                            <Text style={styles.modalCancelBtnText}>Batal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalSaveBtn}
                            onPress={handleSaveNewItem}
                        >
                            <Text style={styles.modalSaveBtnText}>Simpan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // =========================================================================
    // MAIN RETURN
    // =========================================================================
    return (
        <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Top Red Header */}
            {renderHeader()}

            {/* Screen Content based on Active Tab */}
            <View style={styles.bodyWrapper}>
                {activeTab === "dashboard" && renderDashboard()}
                {activeTab === "booking" && renderBookingTab()}
                {activeTab === "pelanggan" && renderPelangganTab()}
                {activeTab === "kelola" && renderKelolaTab()}
                {activeTab === "laporan" && renderLaporanTab()}
                {activeTab === "pengaturan" && renderPengaturanTab()}
            </View>

            {/* Modal Dialog */}
            {renderModal()}

            {/* Bottom Tab Navigation Bar */}
            <View style={styles.bottomTabBar}>
                {/* 1. Dashboard */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => setActiveTab("dashboard")}
                >
                    <Ionicons
                        name={activeTab === "dashboard" ? "home" : "home-outline"}
                        size={22}
                        color={activeTab === "dashboard" ? "#C8102E" : "#888"}
                    />
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === "dashboard" && styles.tabItemTextActive,
                        ]}
                    >
                        Dashboard
                    </Text>
                </TouchableOpacity>

                {/* 2. Booking */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => setActiveTab("booking")}
                >
                    <Ionicons
                        name={activeTab === "booking" ? "calendar" : "calendar-outline"}
                        size={22}
                        color={activeTab === "booking" ? "#C8102E" : "#888"}
                    />
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === "booking" && styles.tabItemTextActive,
                        ]}
                    >
                        Booking
                    </Text>
                </TouchableOpacity>

                {/* 3. Pelanggan */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => setActiveTab("pelanggan")}
                >
                    <Ionicons
                        name={activeTab === "pelanggan" ? "people" : "people-outline"}
                        size={22}
                        color={activeTab === "pelanggan" ? "#C8102E" : "#888"}
                    />
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === "pelanggan" && styles.tabItemTextActive,
                        ]}
                    >
                        Pelanggan
                    </Text>
                </TouchableOpacity>

                {/* 4. Kelola (Kendaraan / Layanan / Bengkel) */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => setActiveTab("kelola")}
                >
                    <Ionicons
                        name={activeTab === "kelola" ? "car-sport" : "car-sport-outline"}
                        size={22}
                        color={activeTab === "kelola" ? "#C8102E" : "#888"}
                    />
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === "kelola" && styles.tabItemTextActive,
                        ]}
                    >
                        Kendaraan
                    </Text>
                </TouchableOpacity>

                {/* 5. Laporan */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => setActiveTab("laporan")}
                >
                    <Ionicons
                        name={activeTab === "laporan" ? "bar-chart" : "bar-chart-outline"}
                        size={22}
                        color={activeTab === "laporan" ? "#C8102E" : "#888"}
                    />
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === "laporan" && styles.tabItemTextActive,
                        ]}
                    >
                        Laporan
                    </Text>
                </TouchableOpacity>

                {/* 6. Lainnya / Pengaturan */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => setActiveTab("pengaturan")}
                >
                    <Ionicons
                        name={activeTab === "pengaturan" ? "settings" : "settings-outline"}
                        size={22}
                        color={activeTab === "pengaturan" ? "#C8102E" : "#888"}
                    />
                    <Text
                        style={[
                            styles.tabItemText,
                            activeTab === "pengaturan" && styles.tabItemTextActive,
                        ]}
                    >
                        Lainnya
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: "#8B0000",
    },
    bodyWrapper: {
        flex: 1,
        backgroundColor: "#F9F9FB",
    },
    contentScroll: {
        flex: 1,
        paddingHorizontal: 16,
    },

    // TOP HEADER
    topHeader: {
        backgroundColor: "#8B0000",
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    topHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    topHeaderTitle: {
        fontSize: 19,
        fontWeight: "bold",
        color: "#FFFFFF",
        letterSpacing: 0.3,
    },
    topHeaderRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    notificationBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    notificationBadge: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#F59E0B",
    },
    profileBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.18)",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 20,
        gap: 6,
    },
    profileAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
    },
    profileTextWrapper: {
        maxWidth: 90,
    },
    profileName: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    profileRole: {
        fontSize: 9,
        color: "rgba(255,255,255,0.8)",
    },

    // BRAND ROW
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 10,
        gap: 8,
    },
    brandLogo: {
        width: 85,
        height: 24,
    },
    brandSlogan: {
        fontSize: 10,
        color: "#777",
        fontStyle: "italic",
    },

    // WELCOME BANNER
    welcomeBanner: {
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#800000",
        marginBottom: 14,
    },
    bannerImage: {
        width: "100%",
        padding: 16,
    },
    bannerContent: {
        gap: 2,
    },
    bannerTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    bannerName: {
        fontSize: 18,
        fontWeight: "900",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    bannerDesc: {
        fontSize: 11,
        color: "rgba(255,255,255,0.85)",
        lineHeight: 16,
        maxWidth: "75%",
    },
    bannerBadge: {
        alignSelf: "flex-end",
        backgroundColor: "rgba(0,0,0,0.3)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 8,
    },
    bannerBadgeText: {
        fontSize: 10,
        color: "#FFD1D1",
        fontStyle: "italic",
    },

    // STATS GRID (2x2)
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 10,
        marginBottom: 14,
    },
    statCard: {
        width: "48.5%",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#EFEFEF",
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    statHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    },
    statIconBox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    statLabel: {
        fontSize: 11,
        color: "#666",
        fontWeight: "500",
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1E1E1E",
        marginBottom: 4,
    },
    statTrend: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statTrendText: {
        fontSize: 10,
        color: "#16A34A",
        fontWeight: "600",
    },

    // CARDS
    cardContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#EFEFEF",
    },
    cardHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    rowAlign: {
        flexDirection: "row",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#222",
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    filterChipText: {
        fontSize: 11,
        color: "#555",
        fontWeight: "500",
    },
    linkText: {
        fontSize: 12,
        color: "#C8102E",
        fontWeight: "600",
    },

    // BAR CHART
    chartContainer: {
        height: 120,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingTop: 10,
        paddingHorizontal: 4,
    },
    barColumn: {
        alignItems: "center",
        flex: 1,
    },
    barValue: {
        fontSize: 10,
        color: "#444",
        fontWeight: "bold",
        marginBottom: 4,
    },
    barFill: {
        width: 18,
        backgroundColor: "#C8102E",
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 9,
        color: "#777",
        marginTop: 6,
    },

    // RECENT BOOKINGS
    recentItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F5F5F5",
        gap: 10,
    },
    recentIconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "#FFECEE",
        justifyContent: "center",
        alignItems: "center",
    },
    recentInfo: {
        flex: 1,
    },
    recentVehicle: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#222",
    },
    recentService: {
        fontSize: 11,
        color: "#666",
        marginTop: 1,
    },
    recentDate: {
        fontSize: 10,
        color: "#999",
        marginTop: 2,
    },

    // STATUS BADGES
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    status_menunggu: {
        backgroundColor: "#FEF3C7",
    },
    statusText_menunggu: {
        color: "#D97706",
        fontSize: 11,
        fontWeight: "600",
    },
    status_diproses: {
        backgroundColor: "#EFF6FF",
    },
    statusText_diproses: {
        color: "#2563EB",
        fontSize: 11,
        fontWeight: "600",
    },
    status_selesai: {
        backgroundColor: "#DCFCE7",
    },
    statusText_selesai: {
        color: "#16A34A",
        fontSize: 11,
        fontWeight: "600",
    },

    // SEARCH ROW
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    searchBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    searchInput: {
        flex: 1,
        fontSize: 12,
        color: "#222",
    },
    filterIconBtn: {
        width: 40,
        height: 40,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    // PILLS ROW
    pillsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    pillBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: "#E5E7EB",
    },
    pillBtnActive: {
        backgroundColor: "#C8102E",
    },
    pillText: {
        fontSize: 11,
        color: "#4B5563",
        fontWeight: "600",
    },
    pillTextActive: {
        color: "#FFFFFF",
    },

    // BOOKING CARD
    bookingCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#EFEFEF",
    },
    bookingCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        paddingBottom: 8,
        marginBottom: 8,
    },
    bookingCode: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#374151",
    },
    bookingVehicleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    bookingIconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#FFECEE",
        justifyContent: "center",
        alignItems: "center",
    },
    bookingVehicleName: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#1E1E1E",
    },
    bookingServiceName: {
        fontSize: 11,
        color: "#6B7280",
    },
    bookingDateText: {
        fontSize: 10,
        color: "#9CA3AF",
        marginTop: 2,
    },
    bookingPriceBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    bookingPrice: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#C8102E",
    },

    // BUTTON ADD
    primaryAddBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#C8102E",
        borderRadius: 8,
        paddingVertical: 10,
        marginBottom: 12,
    },
    primaryAddBtnText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "bold",
    },

    // PELANGGAN
    customerCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#EFEFEF",
        gap: 12,
    },
    customerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#E5E7EB",
        justifyContent: "center",
        alignItems: "center",
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#1F2937",
    },
    customerEmail: {
        fontSize: 11,
        color: "#6B7280",
    },
    customerPhone: {
        fontSize: 11,
        color: "#9CA3AF",
        marginTop: 1,
    },
    customerBookingBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    customerBookingText: {
        fontSize: 11,
        color: "#6B7280",
    },

    // SUB TABS SELECTOR (Kelola)
    subTabSelector: {
        flexDirection: "row",
        backgroundColor: "#E5E7EB",
        borderRadius: 8,
        padding: 3,
        marginBottom: 12,
    },
    subTabBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 6,
        gap: 4,
    },
    subTabBtnActive: {
        backgroundColor: "#FFFFFF",
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
    },
    subTabText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#6B7280",
    },
    subTabTextActive: {
        color: "#C8102E",
        fontWeight: "bold",
    },

    // KENDARAAN CARD
    vehicleCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#EFEFEF",
        gap: 12,
    },
    vehicleThumb: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
    },
    vehicleDetails: {
        flex: 1,
    },
    vehiclePlate: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#1F2937",
    },
    vehicleName: {
        fontSize: 12,
        color: "#4B5563",
    },
    vehicleType: {
        fontSize: 10,
        color: "#9CA3AF",
    },
    vehicleServiceLast: {
        fontSize: 10,
        color: "#6B7280",
        marginTop: 2,
    },

    // LAYANAN CARD
    serviceCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#EFEFEF",
        gap: 12,
    },
    serviceIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFECEE",
        justifyContent: "center",
        alignItems: "center",
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#1F2937",
    },
    servicePrice: {
        fontSize: 12,
        fontWeight: "600",
        color: "#C8102E",
        marginTop: 2,
    },
    serviceDurationRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    serviceDuration: {
        fontSize: 10,
        color: "#6B7280",
    },
    serviceBadge: {
        backgroundColor: "#EFF6FF",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    serviceBadgeText: {
        fontSize: 10,
        color: "#2563EB",
        fontWeight: "600",
    },

    // BENGKEL CARD
    workshopCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#EFEFEF",
        gap: 12,
    },
    workshopImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: "#FFECEE",
        justifyContent: "center",
        alignItems: "center",
    },
    workshopDetails: {
        flex: 1,
    },
    workshopName: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#1F2937",
    },
    workshopAddress: {
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
    },
    workshopRatingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 3,
    },
    workshopRatingText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#374151",
    },
    workshopStatusBadge: {
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    workshopStatusText: {
        fontSize: 10,
        color: "#16A34A",
        fontWeight: "600",
    },

    // LAPORAN
    periodCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#EFEFEF",
    },
    periodLabel: {
        fontSize: 11,
        color: "#6B7280",
    },
    periodValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1F2937",
    },
    periodBtn: {
        padding: 6,
        backgroundColor: "#FFECEE",
        borderRadius: 8,
    },
    downloadRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 8,
    },
    downloadBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 8,
    },
    downloadBtnText: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#FFFFFF",
    },

    // PENGATURAN
    profileBigCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#EFEFEF",
        gap: 14,
    },
    profileBigAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#FFECEE",
        justifyContent: "center",
        alignItems: "center",
    },
    profileBigInfo: {
        flex: 1,
    },
    profileBigName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
    },
    profileBigEmail: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    profileRoleTag: {
        alignSelf: "flex-start",
        backgroundColor: "#FFECEE",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    profileRoleTagText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#C8102E",
    },
    settingsMenuCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingVertical: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#EFEFEF",
    },
    settingsMenuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    settingsMenuTitle: {
        fontSize: 13,
        color: "#1F2937",
        fontWeight: "500",
    },
    settingsMenuExtra: {
        fontSize: 12,
        color: "#6B7280",
        marginRight: 8,
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#C8102E",
        borderRadius: 8,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
    },
    logoutBtnText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#C8102E",
    },

    // BOTTOM TAB BAR
    bottomTabBar: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingVertical: 6,
        paddingHorizontal: 4,
        justifyContent: "space-around",
    },
    tabItem: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 2,
        minWidth: 50,
    },
    tabItemText: {
        fontSize: 9,
        color: "#6B7280",
        marginTop: 3,
        fontWeight: "500",
    },
    tabItemTextActive: {
        color: "#C8102E",
        fontWeight: "bold",
    },

    // MODAL
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 20,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 16,
        textAlign: "center",
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        marginBottom: 12,
    },
    modalActionsRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 6,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        alignItems: "center",
    },
    modalCancelBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#4B5563",
    },
    modalSaveBtn: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 8,
        backgroundColor: "#C8102E",
        alignItems: "center",
    },
    modalSaveBtnText: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
});
