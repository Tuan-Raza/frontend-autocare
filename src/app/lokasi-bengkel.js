import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { safeBack } from "../utils/navigation";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import { API_URL } from "../config";
import { getPhotoUrl } from "../utils/photo";
import RealtimeClock from "../components/RealtimeClock";

// =====================================================
// WARNA AUTOCARE
// =====================================================

const COLORS = {
    red: "#C8102E",
    redDark: "#9B0D23",
    redSoft: "#FFF1F2",
    redVerySoft: "#FFF8F8",
    redBorder: "#FECDD3",

    sidebarBg: "#4A0404",
    sidebarActive: "rgba(255, 255, 255, 0.14)",
    sidebarText: "#D7B4B4",

    white: "#FFFFFF",
    black: "#181818",
    darkText: "#222222",
    grayText: "#666666",
    lightText: "#999999",
    border: "#EEEEEE",

    green: "#16A34A",
    greenSoft: "#DCFCE7",
};

// =====================================================
// HITUNG JARAK
// =====================================================

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const latitude1 = Number(lat1);
    const longitude1 = Number(lon1);
    const latitude2 = Number(lat2);
    const longitude2 = Number(lon2);

    if (
        !Number.isFinite(latitude1) ||
        !Number.isFinite(longitude1) ||
        !Number.isFinite(latitude2) ||
        !Number.isFinite(longitude2)
    ) {
        return null;
    }

    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(latitude2 - latitude1);
    const dLon = toRad(longitude2 - longitude1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(latitude1)) *
            Math.cos(toRad(latitude2)) *
            Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// =====================================================
// FORMAT JARAK
// =====================================================

const formatDistance = (distance) => {
    if (distance === null || typeof distance !== "number" || isNaN(distance)) {
        return "Jarak tidak tersedia";
    }

    if (distance < 1) {
        return `${Math.round(distance * 1000)} m`;
    }

    return `${distance.toFixed(1)} km`;
};

// =====================================================
// KOMPONEN UTAMA
// =====================================================

export default function LokasiBengkel() {
    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === "web" && width >= 900;
    const isLargeDesktop = width >= 1200;

    const [user, setUser] = useState(null);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [imageError, setImageError] = useState(false);

    const [bengkelList, setBengkelList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [userLocation, setUserLocation] = useState(null);

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
        } catch (error) {
            console.error("Load user data error:", error);
        }
    };

    // =====================================================
    // LOAD DATA BENGKEL
    // =====================================================

    const loadBengkel = async () => {
        try {
            const response = await fetch(`${API_URL}/api/booking/bengkel`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Gagal mengambil data bengkel");
            }

            const data = Array.isArray(result.data) ? result.data : [];

            const formattedData = data.map((item) => ({
                ...item,
                latitude: Number(item.latitude),
                longitude: Number(item.longitude),
                distanceKm: userLocation
                    ? calculateDistanceKm(
                          userLocation.latitude,
                          userLocation.longitude,
                          item.latitude,
                          item.longitude
                      )
                    : null,
            }));

            const finalData = userLocation ? sortByDistance(formattedData) : formattedData;
            setBengkelList(finalData);
            return finalData;
        } catch (error) {
            console.error("Load lokasi bengkel error:", error);
            setBengkelList([]);
            return [];
        }
    };

    // =====================================================
    // LOAD AWAL
    // =====================================================

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            await loadUserData();
            await loadBengkel();
            setLoading(false);
        };

        initialize();
    }, []);

    // =====================================================
    // SORT BERDASARKAN JARAK
    // =====================================================

    const sortByDistance = (list) => {
        return [...list].sort((a, b) => {
            if (a.distanceKm === null && b.distanceKm === null) return 0;
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
        });
    };

    // =====================================================
    // REFRESH
    // =====================================================

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await loadBengkel();
        } catch (error) {
            console.error("Refresh bengkel error:", error);
        } finally {
            setRefreshing(false);
        }
    };

    // =====================================================
    // HITUNG JARAK SEMUA BENGKEL
    // =====================================================

    const calculateDistances = (latitude, longitude) => {
        setBengkelList((currentList) => {
            const updatedList = currentList.map((bengkel) => ({
                ...bengkel,
                distanceKm: calculateDistanceKm(
                    latitude,
                    longitude,
                    bengkel.latitude,
                    bengkel.longitude
                ),
            }));

            return sortByDistance(updatedList);
        });
    };

    // =====================================================
    // GUNAKAN LOKASI SAYA
    // =====================================================

    const useMyLocation = async () => {
        try {
            setLocationLoading(true);
            setLocationError("");

            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                setLocationError("Izin lokasi diperlukan untuk menghitung jarak ke lokasi bengkel.");
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;

            setUserLocation({ latitude, longitude });
            calculateDistances(latitude, longitude);
        } catch (error) {
            console.error("Get location error:", error);
            setLocationError("Lokasi Anda tidak dapat diperoleh. Pastikan GPS perangkat telah diaktifkan.");
        } finally {
            setLocationLoading(false);
        }
    };

    // =====================================================
    // GOOGLE MAPS RUTE (DIRECTIONS)
    // =====================================================

    const openGoogleMapsDirections = async (bengkel) => {
        const latitude = Number(bengkel.latitude);
        const longitude = Number(bengkel.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return;
        }

        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error("Open Google Maps error:", error);
        }
    };

    // =====================================================
    // LIHAT LOKASI DI GOOGLE MAPS (SEARCH PIN)
    // =====================================================

    const openLocationPin = async (bengkel) => {
        const latitude = Number(bengkel.latitude);
        const longitude = Number(bengkel.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return;
        }

        const query = encodeURIComponent(`${bengkel.nama_bengkel || "AutoCare"}, ${bengkel.alamat || ""}`);
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error("Open Location Pin error:", error);
        }
    };

    const namaUser = user?.nama_lengkap || user?.nama || "Pelanggan";

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.red} />
                <Text style={styles.loadingText}>Memuat lokasi bengkel...</Text>
            </View>
        );
    }

    // =====================================================
    // RENDER ISI BENGKEL CONTENT
    // =====================================================

    const renderBengkelContent = () => (
        <View style={[styles.pageContent, isDesktop && styles.pageContentDesktop]}>
            {/* LOKASI SAYA TRIGGER BUTTON */}
            <TouchableOpacity
                style={[styles.locationButton, isDesktop && styles.locationButtonDesktop]}
                activeOpacity={0.85}
                onPress={useMyLocation}
                disabled={locationLoading}
            >
                <View style={styles.locationButtonIcon}>
                    {locationLoading ? (
                        <ActivityIndicator size="small" color={COLORS.red} />
                    ) : (
                        <Ionicons name="navigate" size={20} color={COLORS.red} />
                    )}
                </View>

                <View style={styles.locationButtonContent}>
                    <Text style={styles.locationButtonTitle}>
                        {locationLoading ? "Mencari koordinat lokasi..." : "Gunakan Lokasi Saya"}
                    </Text>
                    <Text style={styles.locationButtonSubtitle}>
                        Hitung dan tampilkan jarak lokasi AutoCare terdekat dari posisi Anda saat ini
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#999999" />
            </TouchableOpacity>

            {/* ERROR LOKASI */}
            {Boolean(locationError) ? (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color={COLORS.red} />
                    <Text style={styles.errorText}>{locationError}</Text>
                </View>
            ) : null}

            {/* SECTION HEADER */}
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>Daftar Lokasi AutoCare</Text>
                    <Text style={styles.sectionSubtitle}>
                        {userLocation
                            ? "Diurutkan otomatis dari lokasi terdekat"
                            : `${bengkelList.length} lokasi resmi siap melayani Anda`}
                    </Text>
                </View>

                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{bengkelList.length} Lokasi</Text>
                </View>
            </View>

            {/* BENGKEL LIST / GRID */}
            {bengkelList.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="location-outline" size={38} color="#CCCCCC" />
                    </View>
                    <Text style={styles.emptyTitle}>Belum ada bengkel</Text>
                    <Text style={styles.emptyText}>Data lokasi bengkel saat ini belum tersedia.</Text>
                </View>
            ) : (
                <View style={[styles.bengkelGrid, isDesktop && styles.bengkelGridDesktop]}>
                    {bengkelList.map((bengkel, index) => {
                        const hasDistance = bengkel.distanceKm !== null && typeof bengkel.distanceKm === "number";

                        return (
                            <View
                                key={bengkel.id || index}
                                style={[
                                    styles.bengkelCard,
                                    isDesktop && styles.bengkelCardDesktop,
                                    isLargeDesktop && styles.bengkelCardLargeDesktop,
                                ]}
                            >
                                {/* CARD HEADER */}
                                <View style={styles.cardTop}>
                                    <View style={styles.bengkelIcon}>
                                        <Ionicons name="construct" size={22} color={COLORS.red} />
                                    </View>

                                    <View style={styles.bengkelNameContainer}>
                                        <Text style={styles.bengkelName} numberOfLines={2}>
                                            {bengkel.nama_bengkel}
                                        </Text>

                                        <View style={styles.statusRow}>
                                            <View style={styles.statusDot} />
                                            <Text style={styles.statusText}>Buka & Siap Melayani</Text>
                                        </View>
                                    </View>

                                    {hasDistance ? (
                                        <View style={styles.distanceBadge}>
                                            <Ionicons name="location" size={13} color={COLORS.red} />
                                            <Text style={styles.distanceBadgeText}>
                                                {formatDistance(bengkel.distanceKm)}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>

                                {/* ADDRESS */}
                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={17} color="#777777" style={styles.infoIcon} />
                                    <Text style={styles.infoText}>
                                        {bengkel.alamat || "Alamat lokasi belum tersedia"}
                                    </Text>
                                </View>

                                {/* PHONE */}
                                {Boolean(bengkel.no_hp) ? (
                                    <View style={styles.infoRow}>
                                        <Ionicons name="call-outline" size={16} color="#777777" style={styles.infoIcon} />
                                        <Text style={styles.infoText}>{bengkel.no_hp}</Text>
                                    </View>
                                ) : null}

                                {/* HOURS */}
                                <View style={styles.infoRow}>
                                    <Ionicons name="time-outline" size={17} color="#777777" style={styles.infoIcon} />
                                    <Text style={styles.infoText}>
                                        {bengkel.jam_buka || "08:00"} - {bengkel.jam_tutup || "17:00"} WIB
                                    </Text>
                                </View>

                                {/* DISTANCE HINT IF NOT YET GEOLOCATED */}
                                {!hasDistance ? (
                                    <View style={styles.distanceInfoRow}>
                                        <Ionicons name="navigate-outline" size={15} color="#999999" />
                                        <Text style={styles.distanceInfoText}>
                                            Gunakan tombol 'Lokasi Saya' di atas untuk cek jarak
                                        </Text>
                                    </View>
                                ) : null}

                                {/* ACTION BUTTONS */}
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={styles.singleMapsButton}
                                        activeOpacity={0.85}
                                        onPress={() => openGoogleMapsDirections(bengkel)}
                                    >
                                        <Ionicons name="navigate" size={17} color={COLORS.white} />
                                        <Text style={styles.singleMapsButtonText}>Petunjuk Arah Google Maps</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* BOOKING QUICK BUTTON */}
                                <TouchableOpacity
                                    style={styles.bookingLinkButton}
                                    activeOpacity={0.85}
                                    onPress={() => router.push("/booking")}
                                >
                                    <Ionicons name="calendar-outline" size={15} color="#666666" />
                                    <Text style={styles.bookingLinkText}>Booking Servis di Lokasi Ini</Text>
                                    <Ionicons name="chevron-forward" size={15} color="#999999" />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* BOTTOM INFO */}
            <View style={styles.bottomInfo}>
                <Ionicons name="information-circle-outline" size={16} color="#999999" />
                <Text style={styles.bottomInfoText}>
                    Jarak dihitung secara akurat dari titik koordinat GPS perangkat Anda ke bengkel.
                </Text>
            </View>
        </View>
    );

    // =====================================================
    // DESKTOP LAYOUT (WITH SIDEBAR)
    // =====================================================

    if (isDesktop) {
        return (
            <View style={styles.desktopContainer}>
                {/* SIDEBAR */}
                <View style={styles.sidebar}>
                    <View>
                        {/* BRAND */}
                        <View style={styles.sidebarBrand}>
                            <View style={styles.sidebarLogoBox}>
                                <Image
                                    source={require("../../assets/images/autocare-logo.png")}
                                    style={styles.sidebarLogo}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.sidebarBrandTitle}>AutoCare</Text>
                            <Text style={styles.sidebarBrandSubtitle}>Vehicle Service System</Text>
                        </View>

                        {/* MENU */}
                        <View style={styles.sidebarMenu}>
                            <SidebarItem
                                icon="home-outline"
                                title="Beranda"
                                onPress={() => router.push("/home")}
                            />
                            <SidebarItem
                                icon="car-outline"
                                title="Kendaraan"
                                onPress={() => router.push("/kendaraan")}
                            />
                            <SidebarItem
                                icon="calendar-outline"
                                title="Booking"
                                onPress={() => router.push("/booking")}
                            />
                            <SidebarItem
                                icon="receipt-outline"
                                title="Riwayat Service"
                                onPress={() => router.push("/riwayat-servis")}
                            />
                            <SidebarItem
                                icon="location"
                                title="Lokasi Bengkel"
                                active
                                onPress={() => {}}
                            />
                            <SidebarItem
                                icon="person-outline"
                                title="Profil"
                                onPress={() => router.push("/profil")}
                            />
                        </View>
                    </View>

                    {/* SIDEBAR USER BOTTOM */}
                    <View style={styles.sidebarBottom}>
                        <TouchableOpacity
                            style={styles.sidebarUser}
                            activeOpacity={0.85}
                            onPress={() => router.push("/profil")}
                        >
                            <View style={styles.sidebarAvatar}>
                                {profilePhoto && !imageError ? (
                                    <Image
                                        source={{ uri: getPhotoUrl(profilePhoto) }}
                                        style={styles.sidebarAvatarImage}
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <Text style={styles.sidebarAvatarInitial}>
                                        {namaUser.charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.sidebarUserInfo}>
                                <Text style={styles.sidebarUserName} numberOfLines={1}>
                                    {namaUser}
                                </Text>
                                <Text style={styles.sidebarUserRole}>Pengguna</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* MAIN CONTENT AREA */}
                <View style={styles.desktopMain}>
                    {/* DESKTOP TOPBAR */}
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
                                <Text style={styles.desktopHeaderTitle}>Lokasi Bengkel AutoCare</Text>
                                <Text style={styles.desktopHeaderSubtitle}>
                                    Temukan lokasi dan rute menuju lokasi bengkel resmi AutoCare Karawang
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
                                onRefresh={onRefresh}
                                tintColor={COLORS.red}
                            />
                        }
                    >
                        {renderBengkelContent()}
                    </ScrollView>
                </View>
            </View>
        );
    }

    // =====================================================
    // MOBILE LAYOUT
    // =====================================================

    return (
        <View style={styles.container}>
            {/* MOBILE HEADER */}
            <View style={styles.header}>
                <View style={styles.headerInner}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => safeBack("/home")}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={22} color={COLORS.darkText} />
                    </TouchableOpacity>

                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Lokasi Bengkel</Text>
                        <Text style={styles.headerSubtitle}>Lokasi bengkel AutoCare Karawang</Text>
                    </View>

                    <RealtimeClock compact />
                </View>
            </View>

            {/* MOBILE SCROLL CONTENT */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.red}
                    />
                }
            >
                {renderBengkelContent()}
            </ScrollView>

            {/* MOBILE BOTTOM NAVIGATION */}
            <View style={styles.bottomNav}>
                <MobileNav
                    icon="home-outline"
                    title="Home"
                    onPress={() => router.replace("/home")}
                />
                <MobileNav
                    icon="car-outline"
                    title="Kendaraan"
                    onPress={() => router.replace("/kendaraan")}
                />
                <MobileNav
                    icon="calendar-outline"
                    title="Booking"
                    onPress={() => router.replace("/booking")}
                />
                <MobileNav
                    icon="person-outline"
                    title="Profil"
                    onPress={() => router.replace("/profil")}
                />
            </View>
        </View>
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
                color={active ? "#FFFFFF" : COLORS.sidebarText}
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
                color={active ? COLORS.red : "#999999"}
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
    // CONTAINER MOBILE
    container: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },

    // LOADING
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 13,
        color: COLORS.grayText,
    },

    // MOBILE HEADER
    header: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
        paddingTop: Platform.OS === "ios" ? 50 : 45,
        paddingBottom: 12,
        paddingHorizontal: 18,
    },
    headerInner: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.black,
    },
    headerSubtitle: {
        marginTop: 3,
        fontSize: 11,
        color: "#888888",
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.redSoft,
        justifyContent: "center",
        alignItems: "center",
    },

    // MOBILE SCROLL
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 90, // safe space for bottom nav
    },

    // CONTENT CONTAINER
    pageContent: {
        width: "100%",
    },
    pageContentDesktop: {
        width: "100%",
        maxWidth: 1200,
        alignSelf: "center",
    },

    // LOCATION BUTTON
    locationButton: {
        minHeight: 76,
        borderRadius: 18,
        backgroundColor: COLORS.redVerySoft,
        borderWidth: 1,
        borderColor: COLORS.redBorder,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    locationButtonDesktop: {
        minHeight: 82,
        marginBottom: 24,
    },
    locationButtonIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.white,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    locationButtonContent: {
        flex: 1,
    },
    locationButtonTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.red,
    },
    locationButtonSubtitle: {
        fontSize: 11,
        color: "#777777",
        marginTop: 3,
        lineHeight: 15,
    },

    // ERROR
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.redSoft,
        borderWidth: 1,
        borderColor: COLORS.redBorder,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 11.5,
        lineHeight: 16,
        color: COLORS.redDark,
    },

    // SECTION HEADER
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: COLORS.black,
    },
    sectionSubtitle: {
        fontSize: 11,
        color: "#888888",
        marginTop: 3,
    },
    countBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: COLORS.redSoft,
        justifyContent: "center",
        alignItems: "center",
    },
    countBadgeText: {
        color: COLORS.red,
        fontSize: 11,
        fontWeight: "800",
    },

    // GRID
    bengkelGrid: {
        width: "100%",
    },
    bengkelGridDesktop: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 16,
    },

    // CARD
    bengkelCard: {
        width: "100%",
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    bengkelCardDesktop: {
        width: "48.8%",
        marginBottom: 0,
    },
    bengkelCardLargeDesktop: {
        width: "32%",
    },

    // CARD TOP
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    bengkelIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.redSoft,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    bengkelNameContainer: {
        flex: 1,
    },
    bengkelName: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: "800",
        color: COLORS.darkText,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: COLORS.green,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        color: COLORS.green,
        fontWeight: "700",
    },
    distanceBadge: {
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 5,
        backgroundColor: COLORS.redSoft,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },
    distanceBadgeText: {
        fontSize: 11,
        color: COLORS.red,
        fontWeight: "800",
        marginLeft: 4,
    },

    // INFO ROW
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    infoIcon: {
        marginTop: 1,
        marginRight: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: COLORS.grayText,
    },

    // DISTANCE HINT
    distanceInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9F9F9",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 2,
        marginBottom: 12,
    },
    distanceInfoText: {
        marginLeft: 6,
        fontSize: 11,
        color: COLORS.lightText,
    },

    // ACTION BUTTONS
    singleMapsButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.red,
        height: 44,
        borderRadius: 12,
        gap: 8,
        shadowColor: COLORS.red,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    singleMapsButtonText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: "700",
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
    },
    mapsButton: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        backgroundColor: COLORS.red,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
    },
    mapsButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: "700",
    },
    detailButton: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        backgroundColor: COLORS.redVerySoft,
        borderWidth: 1,
        borderColor: COLORS.redBorder,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
    },
    detailButtonText: {
        color: COLORS.red,
        fontSize: 12,
        fontWeight: "700",
    },

    // BOOKING LINK
    bookingLinkButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F7F7F7",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginTop: 10,
    },
    bookingLinkText: {
        fontSize: 11.5,
        fontWeight: "600",
        color: "#444444",
        flex: 1,
        marginLeft: 6,
    },

    // EMPTY
    emptyContainer: {
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 18,
        paddingVertical: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emptyIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#F7F7F7",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.darkText,
    },
    emptyText: {
        marginTop: 5,
        fontSize: 12,
        color: COLORS.lightText,
    },

    // BOTTOM INFO
    bottomInfo: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 25,
        gap: 6,
    },
    bottomInfoText: {
        fontSize: 11,
        color: COLORS.lightText,
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
        color: COLORS.red,
        fontWeight: "800",
    },

    // =====================================================
    // DESKTOP SPECIFIC STYLES
    // =====================================================

    desktopContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#F5F6F8",
    },
    sidebar: {
        width: 245,
        backgroundColor: COLORS.sidebarBg,
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
        backgroundColor: COLORS.sidebarActive,
    },
    sidebarItemText: {
        marginLeft: 12,
        color: COLORS.sidebarText,
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
        color: COLORS.sidebarBg,
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
        color: COLORS.sidebarText,
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