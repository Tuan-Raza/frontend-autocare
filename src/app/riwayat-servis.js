import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { safeBack } from "../utils/navigation";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_URL } from "../config";
import { getPhotoUrl } from "../utils/photo";
import RealtimeClock from "../components/RealtimeClock";
import BottomNavBar from "../components/BottomNavBar";
import DesktopSidebar from "../components/DesktopSidebar";

const RED = "#C8102E";

export default function RiwayatServis() {
    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === "web" && width >= 900;

    const [user, setUser] = useState(null);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [imageError, setImageError] = useState(false);

    const [riwayat, setRiwayat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // =====================================================
    // LOAD USER & PROFIL
    // =====================================================

    const loadUserData = async () => {
        try {
            const savedUser = await AsyncStorage.getItem("autocare_user");
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);

                const savedPhoto = await AsyncStorage.getItem("autocare_profile_photo");
                if (savedPhoto) {
                    if (Platform.OS === "web" && savedPhoto.startsWith("blob:")) {
                        await AsyncStorage.removeItem("autocare_profile_photo");
                        if (parsedUser.foto && (Platform.OS !== "web" || !parsedUser.foto.startsWith("blob:"))) {
                            setProfilePhoto(getPhotoUrl(parsedUser.foto));
                            setImageError(false);
                        } else {
                            setProfilePhoto(null);
                        }
                    } else {
                        setProfilePhoto(getPhotoUrl(savedPhoto));
                        setImageError(false);
                    }
                } else if (parsedUser.foto && (Platform.OS !== "web" || !parsedUser.foto.startsWith("blob:"))) {
                    setProfilePhoto(getPhotoUrl(parsedUser.foto));
                    setImageError(false);
                }
            }
        } catch (err) {
            console.error("Load user data error:", err);
        }
    };

    // =====================================================
    // LOAD RIWAYAT SERVIS
    // =====================================================

    const loadRiwayat = async () => {
        try {
            setError("");
            await loadUserData();

            const userData = await AsyncStorage.getItem("autocare_user");
            if (!userData) {
                router.replace("/login");
                return;
            }

            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            const userId = parsedUser.id;
            if (!userId) {
                setError("Data pengguna tidak ditemukan.");
                return;
            }

            const response = await fetch(`${API_URL}/api/booking/user/${userId}`);
            const data = await response.json();

            if (response.ok && data.success) {
                setRiwayat(data.data || []);
            } else {
                setRiwayat([]);
                setError(data.message || "Gagal mengambil riwayat servis.");
            }
        } catch (err) {
            console.error("Load Riwayat Servis Error:", err);
            setError("Tidak dapat terhubung ke server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadRiwayat();
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadRiwayat();
    };

    const formatTanggal = (tanggal) => {
        if (!tanggal) return "-";
        const date = new Date(tanggal);
        if (isNaN(date.getTime())) return tanggal;

        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatJam = (jam) => {
        if (!jam) return "-";
        return String(jam).substring(0, 5);
    };

    const formatHarga = (harga) => {
        const nominal = Number(harga || 0);
        return `Rp ${nominal.toLocaleString("id-ID")}`;
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "menunggu":
                return "Menunggu";
            case "dikonfirmasi":
                return "Dikonfirmasi";
            case "diproses":
                return "Diproses";
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
                return "#16A34A";
            case "dikonfirmasi":
                return "#2563EB";
            case "diproses":
                return "#D97706";
            case "dibatalkan":
                return "#DC2626";
            case "menunggu":
            default:
                return RED;
        }
    };

    const namaUser = user?.nama_lengkap || user?.nama || "Pelanggan";

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
                <ActivityIndicator size="large" color={RED} />
                <Text style={styles.loadingText}>Memuat riwayat servis...</Text>
            </SafeAreaView>
        );
    }

    // =====================================================
    // RENDER CONTENT (Shared by Desktop & Mobile)
    // =====================================================

    const renderRiwayatContent = () => (
        <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
            {/* ERROR */}
            {Boolean(error) && (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={21} color={RED} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* INFO COUNT */}
            {!error && riwayat.length > 0 && (
                <View style={[styles.infoBox, isDesktop && styles.infoBoxDesktop]}>
                    <Ionicons name="time-outline" size={18} color={RED} />
                    <Text style={styles.infoText}>
                        Menampilkan {riwayat.length} riwayat servis
                    </Text>
                </View>
            )}

            {/* EMPTY */}
            {!error && riwayat.length === 0 && (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="receipt-outline" size={38} color="#CFCFCF" />
                    </View>
                    <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
                    <Text style={styles.emptyText}>Anda belum memiliki riwayat servis.</Text>
                    <TouchableOpacity
                        style={styles.bookingButton}
                        activeOpacity={0.85}
                        onPress={() => router.push("/booking")}
                    >
                        <Ionicons name="construct-outline" size={17} color="#FFFFFF" />
                        <Text style={styles.bookingButtonText}>Booking Service Sekarang</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* RIWAYAT CARDS */}
            {!error && riwayat.length > 0 && (
                <View style={[styles.bookingGrid, isDesktop && styles.bookingGridDesktop]}>
                    {riwayat.map((item, index) => {
                        const statusColor = getStatusColor(item.status);

                        return (
                            <TouchableOpacity
                                key={item.id || item.booking_id || index}
                                style={[
                                    styles.bookingCard,
                                    isDesktop && styles.bookingCardDesktop,
                                ]}
                                activeOpacity={0.9}
                                onPress={() =>
                                    router.push({
                                        pathname: "/booking-detail",
                                        params: { id: String(item.id) },
                                    })
                                }
                            >
                                {/* TOP CARD */}
                                <View style={styles.cardTop}>
                                    <View style={styles.bookingIcon}>
                                        <Ionicons name="construct-outline" size={21} color={RED} />
                                    </View>

                                    <View style={styles.bookingInfo}>
                                        <Text style={styles.bookingCodeLabel}>KODE BOOKING</Text>
                                        <Text style={styles.bookingCode} numberOfLines={1}>
                                            {item.kode_booking || item.kodeBooking || "-"}
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: `${statusColor}18` },
                                        ]}
                                    >
                                        <Text style={[styles.statusText, { color: statusColor }]}>
                                            {getStatusLabel(item.status)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* VEHICLE */}
                                <View style={styles.vehicleRow}>
                                    <View style={styles.rowIcon}>
                                        <Ionicons name="car-outline" size={18} color="#666" />
                                    </View>
                                    <View style={styles.rowContent}>
                                        <Text style={styles.rowLabel}>Kendaraan</Text>
                                        <Text style={styles.rowValue} numberOfLines={1}>
                                            {item.merek || ""} {item.model || ""}
                                        </Text>
                                        {Boolean(item.nomor_polisi || item.nomorPolisi) ? (
                                            <Text style={styles.rowSubValue}>
                                                {item.nomor_polisi || item.nomorPolisi}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>

                                {/* WORKSHOP */}
                                <View style={styles.vehicleRow}>
                                    <View style={styles.rowIcon}>
                                        <Ionicons name="business-outline" size={18} color="#666" />
                                    </View>
                                    <View style={styles.rowContent}>
                                        <Text style={styles.rowLabel}>Bengkel</Text>
                                        <Text style={styles.rowValue} numberOfLines={1}>
                                            {item.nama_bengkel || item.namaBengkel || "-"}
                                        </Text>
                                    </View>
                                </View>

                                {/* DATE + TIME */}
                                <View style={styles.detailRow}>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="calendar-outline" size={16} color={RED} />
                                        <View style={styles.detailTextContainer}>
                                            <Text style={styles.detailLabel}>Tanggal</Text>
                                            <Text style={styles.detailValue}>
                                                {formatTanggal(item.tanggal_booking || item.tanggal)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Ionicons name="time-outline" size={16} color={RED} />
                                        <View style={styles.detailTextContainer}>
                                            <Text style={styles.detailLabel}>Jam</Text>
                                            <Text style={styles.detailValue}>
                                                {formatJam(item.jam_booking || item.jam)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* FOOTER */}
                                <View style={styles.cardFooter}>
                                    <View>
                                        <Text style={styles.priceLabel}>Total</Text>
                                        <Text style={styles.priceValue}>
                                            {formatHarga(item.total_harga || item.totalHarga)}
                                        </Text>
                                    </View>

                                    <View style={styles.detailButton}>
                                        <Text style={styles.detailButtonText}>Detail</Text>
                                        <Ionicons name="chevron-forward" size={14} color={RED} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );

    // =====================================================
    // DESKTOP LAYOUT (WITH SIDEBAR)
    // =====================================================

    if (isDesktop) {
        return (
            <View style={styles.desktopContainer}>
                {/* SIDEBAR (STANDARDIZED) */}
                <DesktopSidebar
                    activeMenu="riwayat-servis"
                    namaUser={namaUser}
                    profilePhoto={profilePhoto}
                />

                {/* DESKTOP MAIN */}
                <View style={styles.desktopMain}>
                    {/* DESKTOP HEADER */}
                    <View style={styles.desktopHeader}>
                        <View style={styles.desktopHeaderLeft}>
                            <TouchableOpacity
                                style={styles.desktopBackButton}
                                onPress={() => safeBack("/home")}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="arrow-back" size={20} color="#222" />
                            </TouchableOpacity>
                            <View style={{ marginLeft: 14 }}>
                                <Text style={styles.desktopHeaderTitle}>Riwayat Servis</Text>
                                <Text style={styles.desktopHeaderSubtitle}>
                                    Pantau jadwal, status pengerjaan, dan histori servis kendaraan Anda
                                </Text>
                            </View>
                        </View>

                        {/* REALTIME CLOCK DESKTOP */}
                        <RealtimeClock isDesktop />
                    </View>

                    {/* DESKTOP SCROLL */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.desktopScrollContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={RED}
                            />
                        }
                    >
                        {renderRiwayatContent()}
                    </ScrollView>
                </View>
            </View>
        );
    }

    // =====================================================
    // MOBILE LAYOUT
    // =====================================================

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            {/* MOBILE HEADER */}
            <View style={styles.header}>
                <View style={styles.headerInner}>
                    <TouchableOpacity
                        style={styles.backButton}
                        activeOpacity={0.8}
                        onPress={() => safeBack("/home")}
                    >
                        <Ionicons name="arrow-back" size={21} color="#222" />
                    </TouchableOpacity>

                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Riwayat Servis</Text>
                        <Text style={styles.headerSubtitle}>
                            Riwayat booking servis kendaraan Anda
                        </Text>
                    </View>

                    {/* COMPACT REALTIME CLOCK */}
                    <RealtimeClock compact />
                </View>
            </View>

            {/* MOBILE SCROLL */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={RED}
                    />
                }
                contentContainerStyle={styles.scrollContent}
            >
                {renderRiwayatContent()}
            </ScrollView>

            {/* MOBILE BOTTOM NAVIGATION */}
            <BottomNavBar activeTab={null} />
        </SafeAreaView>
    );
}

// =====================================================
// HELPER COMPONENTS
// =====================================================

function SidebarItem({ icon, title, active = false, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.sidebarItem, active && styles.sidebarItemActive]}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Ionicons
                name={icon}
                size={20}
                color={active ? "#FFFFFF" : "#D7B4B4"}
            />
            <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

function MobileNav({ icon, title, active = false, onPress }) {
    return (
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Ionicons
                name={icon}
                size={21}
                color={active ? RED : "#999999"}
            />
            <Text style={[styles.navText, active && styles.navTextActive]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

// =====================================================
// STYLES
// =====================================================

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
        marginTop: 12,
        fontSize: 13,
        color: "#666",
    },

    // MOBILE HEADER
    header: {
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerInner: {
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#222222",
    },
    headerSubtitle: {
        fontSize: 11,
        color: "#888888",
        marginTop: 2,
    },

    // MOBILE SCROLL
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 90, // safe space for bottom nav
    },

    contentWrapper: {
        width: "100%",
    },
    contentWrapperDesktop: {
        maxWidth: 1200,
        alignSelf: "center",
        width: "100%",
    },

    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF1F2",
        borderWidth: 1,
        borderColor: "#FECDD3",
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        gap: 10,
    },
    errorText: {
        color: RED,
        fontSize: 12,
        flex: 1,
        fontWeight: "600",
    },

    infoBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF5F5",
        borderWidth: 1,
        borderColor: "#FECDD3",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        gap: 8,
    },
    infoBoxDesktop: {
        marginBottom: 20,
    },
    infoText: {
        fontSize: 12,
        color: RED,
        fontWeight: "600",
    },

    emptyContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingVertical: 50,
        paddingHorizontal: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EEEEEE",
    },
    emptyIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#F7F8FA",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#222",
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 12,
        color: "#888",
        marginBottom: 20,
    },
    bookingButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: RED,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 12,
        gap: 8,
    },
    bookingButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },

    // CARDS & GRID
    bookingGrid: {
        width: "100%",
    },
    bookingGridDesktop: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
    bookingCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#EEEEEE",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    bookingCardDesktop: {
        width: "32%",
        marginBottom: 0,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
    },
    bookingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#FFF1F2",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    bookingInfo: {
        flex: 1,
    },
    bookingCodeLabel: {
        fontSize: 9.5,
        fontWeight: "700",
        color: "#888",
        letterSpacing: 0.4,
    },
    bookingCode: {
        fontSize: 13,
        fontWeight: "800",
        color: "#222",
        marginTop: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 10.5,
        fontWeight: "800",
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F1F1",
        marginVertical: 12,
    },
    vehicleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    rowIcon: {
        width: 26,
        alignItems: "center",
        marginTop: 1,
    },
    rowContent: {
        flex: 1,
        marginLeft: 6,
    },
    rowLabel: {
        fontSize: 10,
        color: "#888",
        fontWeight: "600",
    },
    rowValue: {
        fontSize: 13,
        fontWeight: "700",
        color: "#222",
        marginTop: 1,
    },
    rowSubValue: {
        fontSize: 11,
        color: "#666",
        marginTop: 1,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFC",
        borderRadius: 12,
        padding: 10,
        marginTop: 4,
        marginBottom: 4,
    },
    detailItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    detailTextContainer: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 9.5,
        color: "#888",
        fontWeight: "600",
    },
    detailValue: {
        fontSize: 11.5,
        fontWeight: "700",
        color: "#222",
        marginTop: 1,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    priceLabel: {
        fontSize: 10,
        color: "#888",
        fontWeight: "600",
    },
    priceValue: {
        fontSize: 14,
        fontWeight: "800",
        color: RED,
        marginTop: 1,
    },
    detailButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    detailButtonText: {
        fontSize: 12,
        fontWeight: "700",
        color: RED,
    },

    // MOBILE BOTTOM NAV
    bottomNav: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 99,
    },
    navItem: {
        width: "25%",
        justifyContent: "center",
        alignItems: "center",
    },
    navText: {
        fontSize: 9,
        color: "#999999",
        marginTop: 3,
        fontWeight: "600",
    },
    navTextActive: {
        color: RED,
        fontWeight: "800",
    },

    // DESKTOP LAYOUT
    desktopContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#F5F6F8",
    },
    sidebar: {
        width: 245,
        backgroundColor: "#4A0404",
        paddingHorizontal: 18,
        paddingTop: 30,
        paddingBottom: 22,
        justifyContent: "space-between",
    },
    sidebarBrand: {
        alignItems: "center",
        marginBottom: 35,
    },
    sidebarLogoBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    sidebarLogo: {
        width: 44,
        height: 44,
    },
    sidebarBrandTitle: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 0.3,
    },
    sidebarBrandSubtitle: {
        color: "#E5B4B4",
        fontSize: 11,
        marginTop: 3,
    },
    sidebarMenu: {
        flex: 1,
    },
    sidebarItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        marginBottom: 8,
    },
    sidebarItemActive: {
        backgroundColor: "rgb(87, 10, 10)",
        shadowColor: "#000000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 4,
    },
    sidebarItemText: {
        marginLeft: 12,
        color: "#D7B4B4",
        fontSize: 13,
        fontWeight: "600",
    },
    sidebarItemTextActive: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
    sidebarBottom: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.08)",
        paddingTop: 16,
    },
    sidebarUser: {
        flexDirection: "row",
        alignItems: "center",
    },
    sidebarAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    sidebarAvatarImage: {
        width: "100%",
        height: "100%",
    },
    sidebarAvatarInitial: {
        color: "#4A0404",
        fontWeight: "900",
        fontSize: 15,
    },
    sidebarUserInfo: {
        marginLeft: 10,
        flex: 1,
    },
    sidebarUserName: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },
    sidebarUserRole: {
        color: "#D7B4B4",
        fontSize: 11,
        marginTop: 2,
    },
    desktopMain: {
        flex: 1,
        backgroundColor: "#F7F8FA",
    },
    desktopHeader: {
        height: 80,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
        paddingHorizontal: 32,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    desktopHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    desktopHeaderTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#222222",
    },
    desktopHeaderSubtitle: {
        fontSize: 12,
        color: "#888888",
        marginTop: 3,
    },
    desktopBackButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#F4F4F4",
        alignItems: "center",
        justifyContent: "center",
    },
    desktopScrollContent: {
        paddingHorizontal: 35,
        paddingTop: 28,
        paddingBottom: 40,
    },
});