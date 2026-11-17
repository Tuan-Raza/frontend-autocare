import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { API_URL } from "../config";
import { getCarImage } from "./carImages";
import { getPhotoUrl } from "../utils/photo";
import RealtimeClock from "../components/RealtimeClock";

export default function Booking() {
    const [user, setUser] = useState(null);
    const [kendaraan, setKendaraan] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [imageError, setImageError] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { width } = useWindowDimensions();

    const isDesktop = width >= 900;
    const isTablet = width >= 600 && width < 900;

    // ==========================================
    // LOAD USER
    // ==========================================
    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem("autocare_user");

            if (!userData) {
                router.replace("/login");
                return null;
            }

            const parsedUser = JSON.parse(userData);

            setUser(parsedUser);

            // Load foto profil
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
            } else {
                setProfilePhoto(null);
            }

            return parsedUser;
        } catch (error) {
            console.log("Load user error:", error);
            return null;
        }
    };

    // ==========================================
    // LOAD KENDARAAN
    // ==========================================
    const loadKendaraan = async (userData = null) => {
        try {
            const currentUser = userData || user;

            if (!currentUser?.id) {
                return;
            }

            const response = await fetch(
                `${API_URL}/api/booking/kendaraan/${currentUser.id}`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Gagal mengambil kendaraan"
                );
            }

            setKendaraan(result.data || []);
        } catch (error) {
            console.log("Load kendaraan booking error:", error);

            Alert.alert(
                "Terjadi Kesalahan",
                "Data kendaraan gagal dimuat."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================
    useEffect(() => {
        const initialize = async () => {
            const currentUser = await loadUser();

            if (currentUser) {
                await loadKendaraan(currentUser);
            }
        };

        initialize();
    }, []);

    // ==========================================
    // REFRESH
    // ==========================================
    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        const currentUser = user;

        if (currentUser) {
            await loadKendaraan(currentUser);
        } else {
            const loadedUser = await loadUser();

            if (loadedUser) {
                await loadKendaraan(loadedUser);
            }
        }
    }, [user]);

    // ==========================================
    // SELECT VEHICLE
    // ==========================================
    const handleSelectVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
    };

    // ==========================================
    // NEXT STEP
    // ==========================================
    const handleContinue = () => {
        if (!selectedVehicle) {
            Alert.alert(
                "Pilih Kendaraan",
                "Silakan pilih kendaraan yang akan diservis terlebih dahulu."
            );

            return;
        }

        router.push({
            pathname: "/booking-step2",
            params: {
                kendaraanId: String(selectedVehicle.id),
                merek: selectedVehicle.merek,
                model: selectedVehicle.model,
                nomorPolisi: selectedVehicle.nomor_polisi,
                tahun: String(selectedVehicle.tahun || ""),
                kilometer: String(selectedVehicle.kilometer || 0),
            },
        });
    };

    // ==========================================
    // TAMBAH KENDARAAN
    // ==========================================
    const handleAddVehicle = () => {
        router.push("/tambah-kendaraan");
    };

    // ==========================================
    // LOADING
    // ==========================================
    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#B22222"
                    />

                    <Text style={styles.loadingText}>
                        Memuat kendaraan...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const namaUser = user?.nama || user?.name || "Pengguna";

    // ==========================================
    // DESKTOP LAYOUT
    // ==========================================
    if (isDesktop) {
        return (
            <View style={styles.desktopContainer}>
                {/* SIDEBAR */}
                <View style={styles.sidebar}>
                    <View style={styles.sidebarBrand}>
                        <View style={styles.sidebarLogoBox}>
                            <Image
                                source={require("../../assets/images/autocare-logo.png")}
                                style={styles.sidebarLogo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.sidebarBrandTitle}>AutoCare</Text>
                        <Text style={styles.sidebarBrandSubtitle}>Vehicle Service</Text>
                    </View>

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
                            icon="calendar"
                            title="Booking"
                            active
                            onPress={() => router.replace("/booking")}
                        />
                        <SidebarItem
                            icon="receipt-outline"
                            title="Riwayat Service"
                            onPress={() => router.push("/riwayat-servis")}
                        />
                        <SidebarItem
                            icon="location-outline"
                            title="Lokasi Bengkel"
                            onPress={() => router.push("/lokasi-bengkel")}
                        />
                        <SidebarItem
                            icon="person-outline"
                            title="Profil"
                            onPress={() => router.push("/profil")}
                        />
                    </View>

                    <View style={styles.sidebarBottom}>
                        <View style={styles.sidebarUser}>
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
                        </View>
                    </View>
                </View>

                {/* DESKTOP MAIN */}
                <View style={styles.desktopMain}>
                    <View style={styles.desktopHeader}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TouchableOpacity
                                style={styles.desktopBackButton}
                                onPress={() => safeBack("/home")}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="arrow-back" size={20} color="#222" />
                            </TouchableOpacity>
                            <View style={{ marginLeft: 14 }}>
                                <Text style={styles.desktopHeaderTitle}>Booking Service</Text>
                                <Text style={styles.desktopHeaderSubtitle}>
                                    Langkah 1: Pilih kendaraan Anda yang akan diservis
                                </Text>
                            </View>
                        </View>

                        {/* REALTIME CLOCK DESKTOP */}
                        <RealtimeClock isDesktop />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.desktopScrollContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#B22222"]} />
                        }
                    >
                        {/* STEP INDICATOR */}
                        <View style={styles.stepContainer}>
                            <View style={styles.stepItem}>
                                <View style={[styles.stepCircle, styles.activeStep]}>
                                    <Text style={styles.activeStepText}>1</Text>
                                </View>
                                <Text style={styles.stepActiveText}>Kendaraan</Text>
                            </View>
                            <View style={styles.stepLine} />
                            <View style={styles.stepItem}>
                                <View style={styles.stepCircle}>
                                    <Text style={styles.stepText}>2</Text>
                                </View>
                                <Text style={styles.stepTextLabel}>Bengkel</Text>
                            </View>
                            <View style={styles.stepLine} />
                            <View style={styles.stepItem}>
                                <View style={styles.stepCircle}>
                                    <Text style={styles.stepText}>3</Text>
                                </View>
                                <Text style={styles.stepTextLabel}>Jadwal</Text>
                            </View>
                            <View style={styles.stepLine} />
                            <View style={styles.stepItem}>
                                <View style={styles.stepCircle}>
                                    <Text style={styles.stepText}>4</Text>
                                </View>
                                <Text style={styles.stepTextLabel}>Konfirmasi</Text>
                            </View>
                        </View>

                        {/* SECTION HEADER */}
                        <View style={styles.desktopSectionHeader}>
                            <View>
                                <Text style={styles.desktopSectionTitle}>Pilih Kendaraan Anda</Text>
                                <Text style={styles.desktopSectionSubtitle}>
                                    Pilih kendaraan yang terdaftar untuk melanjutkan pemesanan servis
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.desktopAddButton}
                                onPress={handleAddVehicle}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="add" size={18} color="#FFFFFF" />
                                <Text style={styles.desktopAddButtonText}>Tambah Kendaraan</Text>
                            </TouchableOpacity>
                        </View>

                        {/* VEHICLE LIST */}
                        {kendaraan.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <View style={styles.emptyIcon}>
                                    <Ionicons name="car-outline" size={45} color="#B22222" />
                                </View>
                                <Text style={styles.emptyTitle}>Belum Ada Kendaraan</Text>
                                <Text style={styles.emptyDescription}>
                                    Tambahkan kendaraan terlebih dahulu sebelum melakukan booking service.
                                </Text>
                                <TouchableOpacity style={styles.addButton} onPress={handleAddVehicle} activeOpacity={0.85}>
                                    <Ionicons name="add" size={20} color="#fff" />
                                    <Text style={styles.addButtonText}>Tambah Kendaraan</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.desktopVehicleGrid}>
                                {kendaraan.map((item) => {
                                    const isSelected = selectedVehicle?.id === item.id;
                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[
                                                styles.vehicleCard,
                                                styles.vehicleCardDesktop,
                                                isSelected && styles.vehicleCardActive,
                                            ]}
                                            onPress={() => handleSelectVehicle(item)}
                                            activeOpacity={0.9}
                                        >
                                            <View style={styles.vehicleInfo}>
                                                <Text style={styles.vehicleName}>
                                                    {item.merek} {item.model}
                                                </Text>
                                                <Text style={styles.vehiclePlate}>
                                                    {item.nomor_polisi}
                                                </Text>
                                                <View style={styles.vehicleMeta}>
                                                    <Text style={styles.vehicleYear}>
                                                        Tahun {item.tahun || "-"}
                                                    </Text>
                                                    <Text style={styles.vehicleDot}>•</Text>
                                                    <Text style={styles.vehicleKm}>
                                                        {Number(item.kilometer || 0).toLocaleString("id-ID")} km
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.bookingCarImageWrap}>
                                                <Image
                                                    source={getCarImage(item.merek)}
                                                    style={styles.bookingCarImage}
                                                    resizeMode="contain"
                                                />
                                            </View>

                                            <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                                {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* DESKTOP BOTTOM ACTION */}
                    {kendaraan.length > 0 && (
                        <View style={styles.desktopBottomBar}>
                            <View style={styles.selectedInfo}>
                                <Text style={styles.selectedLabel}>Kendaraan dipilih</Text>
                                <Text style={styles.selectedVehicleName} numberOfLines={1}>
                                    {selectedVehicle
                                        ? `${selectedVehicle.merek} ${selectedVehicle.model} (${selectedVehicle.nomor_polisi})`
                                        : "Silakan pilih salah satu kendaraan"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.continueButton, !selectedVehicle && styles.continueButtonDisabled]}
                                onPress={handleContinue}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.continueText}>Lanjutkan Booking</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    }

    // ==========================================
    // MOBILE LAYOUT
    // ==========================================
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* =====================================
                HEADER
            ====================================== */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => safeBack("/home")}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#222"
                    />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        Booking Service
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Pilih kendaraan Anda
                    </Text>
                </View>

                <RealtimeClock compact />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop,
                    isTablet && styles.scrollContentTablet,
                ]}

                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#B22222"]}
                    />
                }
            >
                {/* =====================================
                    STEP INDICATOR
                ====================================== */}
                <View style={styles.stepContainer}>
                    <View style={styles.stepItem}>
                        <View style={[styles.stepCircle, styles.activeStep]}>
                            <Text style={styles.activeStepText}>1</Text>
                        </View>

                        <Text style={styles.stepActiveText}>
                            Kendaraan
                        </Text>
                    </View>

                    <View style={styles.stepLine} />

                    <View style={styles.stepItem}>
                        <View style={styles.stepCircle}>
                            <Text style={styles.stepText}>2</Text>
                        </View>

                        <Text style={styles.stepTextLabel}>
                            Layanan
                        </Text>
                    </View>

                    <View style={styles.stepLine} />

                    <View style={styles.stepItem}>
                        <View style={styles.stepCircle}>
                            <Text style={styles.stepText}>3</Text>
                        </View>

                        <Text style={styles.stepTextLabel}>
                            Jadwal
                        </Text>
                    </View>

                    <View style={styles.stepLine} />

                    <View style={styles.stepItem}>
                        <View style={styles.stepCircle}>
                            <Text style={styles.stepText}>4</Text>
                        </View>

                        <Text style={styles.stepTextLabel}>
                            Konfirmasi
                        </Text>
                    </View>
                </View>

                {/* =====================================
                    TITLE
                ====================================== */}
                <View style={styles.titleSection}>
                    <Text style={styles.pageTitle}>
                        Pilih Kendaraan
                    </Text>

                    <Text style={styles.pageDescription}>
                        Pilih kendaraan yang ingin Anda servis.
                    </Text>
                </View>

                {/* =====================================
                    VEHICLE LIST
                ====================================== */}
                {kendaraan.length > 0 ? (
                    kendaraan.map((item) => {
                        const isSelected =
                            selectedVehicle?.id === item.id;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.vehicleCard,
                                    isDesktop && styles.vehicleCardDesktop,
                                    isTablet && styles.vehicleCardTablet,
                                    isSelected &&
                                        styles.vehicleCardSelected,
                                ]}
                                onPress={() =>
                                    handleSelectVehicle(item)
                                }
                                activeOpacity={0.85}
                            >
                                <View
                                    style={[
                                        styles.vehicleIcon,
                                        isSelected &&
                                            styles.vehicleIconSelected,
                                    ]}
                                >
                                    <Ionicons
                                        name="car-sport"
                                        size={30}
                                        color={
                                            isSelected
                                                ? "#fff"
                                                : "#B22222"
                                        }
                                    />
                                </View>

                                <View style={styles.vehicleInfo}>
                                    <Text style={styles.vehicleName}>
                                        {item.merek} {item.model}
                                    </Text>

                                    <View style={styles.vehicleRow}>
                                        <Ionicons
                                            name="card-outline"
                                            size={15}
                                            color="#777"
                                        />

                                        <Text style={styles.vehicleDetail}>
                                            {item.nomor_polisi}
                                        </Text>
                                    </View>

                                    <View style={styles.vehicleBottomRow}>
                                        <View style={styles.smallInfo}>
                                            <Ionicons
                                                name="calendar-outline"
                                                size={14}
                                                color="#777"
                                            />

                                            <Text style={styles.smallText}>
                                                {item.tahun || "-"}
                                            </Text>
                                        </View>

                                        <View style={styles.smallInfo}>
                                            <Ionicons
                                                name="speedometer-outline"
                                                size={14}
                                                color="#777"
                                            />

                                            <Text style={styles.smallText}>
                                                {Number(
                                                    item.kilometer || 0
                                                ).toLocaleString(
                                                    "id-ID"
                                                )}{" "}
                                                KM
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.bookingCarImageWrap}>
                                    <Image
                                        source={getCarImage(item.merek)}
                                        style={styles.bookingCarImage}
                                        resizeMode="contain"
                                    />
                                </View>

                                <View
                                    style={[
                                        styles.radio,
                                        isSelected &&
                                            styles.radioSelected,
                                    ]}
                                >
                                    {isSelected && (
                                        <Ionicons
                                            name="checkmark"
                                            size={16}
                                            color="#fff"
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="car-outline"
                                size={45}
                                color="#B22222"
                            />
                        </View>

                        <Text style={styles.emptyTitle}>
                            Belum Ada Kendaraan
                        </Text>

                        <Text style={styles.emptyDescription}>
                            Tambahkan kendaraan terlebih dahulu
                            sebelum melakukan booking service.
                        </Text>

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddVehicle}
                            activeOpacity={0.85}
                        >
                            <Ionicons
                                name="add"
                                size={20}
                                color="#fff"
                            />

                            <Text style={styles.addButtonText}>
                                Tambah Kendaraan
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* =====================================
                    ADD VEHICLE
                ====================================== */}
                {kendaraan.length > 0 && (
                    <TouchableOpacity
                        style={styles.outlineAddButton}
                        onPress={handleAddVehicle}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="add-circle-outline"
                            size={21}
                            color="#B22222"
                        />

                        <Text style={styles.outlineAddText}>
                            Tambah Kendaraan
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 160 }} />
            </ScrollView>

            {/* =====================================
                BOTTOM ACTION
            ====================================== */}
            {kendaraan.length > 0 && (
                <View style={[styles.bottomContainer, { bottom: 64 }]}>
                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedLabel}>
                            Kendaraan dipilih
                        </Text>

                        <Text
                            style={styles.selectedVehicleName}
                            numberOfLines={1}
                        >
                            {selectedVehicle
                                ? `${selectedVehicle.merek} ${selectedVehicle.model}`
                                : "Belum dipilih"}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !selectedVehicle &&
                                styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.continueText}>
                            Lanjutkan
                        </Text>

                        <Ionicons
                            name="arrow-forward"
                            size={20}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            )}

            {/* MOBILE BOTTOM NAV */}
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
                    icon="calendar"
                    title="Booking"
                    active
                />
                <MobileNav
                    icon="person-outline"
                    title="Profil"
                    onPress={() => router.replace("/profil")}
                />
            </View>
        </SafeAreaView>
    );
}

// =============================================================
// SIDEBAR ITEM
// =============================================================

function SidebarItem({
    icon,
    title,
    active = false,
    onPress,
}) {
    return (
        <TouchableOpacity
            style={[
                styles.sidebarItem,
                active && styles.sidebarItemActive,
            ]}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Ionicons
                name={icon}
                size={20}
                color={active ? "#FFFFFF" : "#D7B4B4"}
            />
            <Text
                style={[
                    styles.sidebarItemText,
                    active && styles.sidebarItemTextActive,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}

// =============================================================
// MOBILE NAV
// =============================================================

function MobileNav({
    icon,
    title,
    active = false,
    onPress,
}) {
    return (
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Ionicons
                name={icon}
                size={21}
                color={
                    active
                        ? "#F20D18"
                        : "#999999"
                }
            />
            <Text
                style={[
                    styles.navText,
                    active &&
                        styles.navTextActive,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        marginTop: 12,
        color: "#777",
        fontSize: 14,
    },

    header: {
        height: 76,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F5F5F5",
        alignItems: "center",
        justifyContent: "center",
    },

    headerCenter: {
        flex: 1,
        alignItems: "center",
    },

    headerTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#222",
    },

    headerSubtitle: {
        marginTop: 2,
        fontSize: 12,
        color: "#888",
    },

    headerRight: {
        width: 42,
    },

    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 18,
    },

    stepContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 25,
    },

    stepItem: {
        alignItems: "center",
    },

    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#E8E8E8",
        alignItems: "center",
        justifyContent: "center",
    },

    activeStep: {
        backgroundColor: "#B22222",
    },

    activeStepText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "900",
    },

    stepText: {
        color: "#999",
        fontSize: 13,
        fontWeight: "900",
    },

    stepLine: {
        height: 2,
        width: 25,
        backgroundColor: "#E3E3E3",
        marginHorizontal: 5,
        marginBottom: 18,
    },

    stepActiveText: {
        color: "#B22222",
        fontSize: 10,
        fontWeight: "700",
        marginTop: 5,
    },

    stepTextLabel: {
        color: "#999",
        fontSize: 10,
        marginTop: 5,
    },

    titleSection: {
        marginBottom: 16,
    },

    pageTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#222",
    },

    pageDescription: {
        marginTop: 5,
        fontSize: 13,
        color: "#888",
    },

    vehicleCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EEEEEE",
    },

    vehicleCardSelected: {
        borderColor: "#B22222",
        backgroundColor: "#FFF7F7",
    },

    vehicleIcon: {
        width: 58,
        height: 58,
        borderRadius: 16,
        backgroundColor: "#FFF0F0",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },

    vehicleIconSelected: {
        backgroundColor: "#B22222",
    },

    vehicleInfo: {
        flex: 1,
    },

    vehicleName: {
        fontSize: 16,
        fontWeight: "800",
        color: "#222",
        marginBottom: 6,
    },

    vehicleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },

    vehicleDetail: {
        fontSize: 13,
        color: "#666",
    },

    vehicleBottomRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 7,
        gap: 16,
    },

    smallInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    smallText: {
        fontSize: 11,
        color: "#777",
    },

    radio: {
        width: 27,
        height: 27,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#D4D4D4",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
    },

    radioSelected: {
        backgroundColor: "#B22222",
        borderColor: "#B22222",
    },

    emptyCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 28,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EEEEEE",
    },

    emptyIcon: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: "#FFF0F0",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#222",
    },

    emptyDescription: {
        textAlign: "center",
        color: "#888",
        fontSize: 13,
        lineHeight: 20,
        marginTop: 7,
        marginBottom: 18,
    },

    addButton: {
        height: 48,
        backgroundColor: "#B22222",
        borderRadius: 13,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },

    addButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },

    outlineAddButton: {
        height: 48,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: "#B22222",
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 7,
        marginTop: 4,
    },

    outlineAddText: {
        color: "#B22222",
        fontSize: 14,
        fontWeight: "700",
    },

    bottomContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    selectedInfo: {
        flex: 1,
    },

    selectedLabel: {
        fontSize: 10,
        color: "#999",
        marginBottom: 3,
    },

    selectedVehicleName: {
        fontSize: 13,
        fontWeight: "800",
        color: "#222",
    },

    continueButton: {
        height: 48,
        backgroundColor: "#B22222",
        borderRadius: 13,
        paddingHorizontal: 17,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    continueButtonDisabled: {
        backgroundColor: "#CFCFCF",
    },

    continueText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "800",
    },
    scrollContentDesktop: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 30,
    paddingTop: 25,
},

scrollContentTablet: {
    paddingHorizontal: 35,
},

vehicleCardDesktop: {
    width: "48.5%",
    minHeight: 115,
},

vehicleCardTablet: {
    width: "100%",
},
bookingCarImageWrap: {
    width: 80,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
},
bookingCarImage: {
    width: 80,
    height: 50,
},

    // =========================================================
    // DESKTOP STYLES
    // =========================================================

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
        backgroundColor: "rgba(255, 255, 255, 0.14)",
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
    desktopSectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    desktopSectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#222222",
    },
    desktopSectionSubtitle: {
        fontSize: 13,
        color: "#777777",
        marginTop: 4,
    },
    desktopAddButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#B22222",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    desktopAddButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },
    desktopVehicleGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
    desktopBottomBar: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        paddingHorizontal: 35,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    // =========================================================
    // MOBILE BOTTOM NAV
    // =========================================================

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
        fontSize: 8,
        color: "#999999",
        marginTop: 3,
        fontWeight: "600",
    },

    navTextActive: {
        color: "#F20D18",
        fontWeight: "800",
    },
});