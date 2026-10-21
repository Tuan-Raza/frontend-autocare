import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";

import {
    ActivityIndicator,
    Image,
    ImageBackground,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { API_URL } from "../config";
import { getCarImage } from "./carImages";
import { getPhotoUrl } from "../utils/photo";
import RealtimeClock from "../components/RealtimeClock";


export default function Home() {

    // =========================================================
    // RESPONSIVE
    // =========================================================

    const { width } = useWindowDimensions();

    const isDesktop =
        Platform.OS === "web" && width >= 900;


    // =========================================================
    // STATE
    // =========================================================

    const [user, setUser] = useState(null);
    const [kendaraan, setKendaraan] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [imageError, setImageError] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadData = async () => {

        try {

            const userData =
                await AsyncStorage.getItem(
                    "autocare_user"
                );

            if (!userData) {

                router.replace("/login");

                return;
            }


            const parsedUser =
                JSON.parse(userData);

            setUser(parsedUser);


            // ── Load foto profil ──────────────────────────
            const savedPhoto =
                await AsyncStorage.getItem(
                    "autocare_profile_photo"
                );

            if (savedPhoto) {
                if (Platform.OS === "web" && savedPhoto.startsWith("blob:")) {
                    await AsyncStorage.removeItem("autocare_profile_photo");
                    if (parsedUser.foto && (!Platform.OS === "web" || !parsedUser.foto.startsWith("blob:"))) {
                        setProfilePhoto(getPhotoUrl(parsedUser.foto));
                        setImageError(false);
                    } else {
                        setProfilePhoto(null);
                    }
                } else {
                    setProfilePhoto(getPhotoUrl(savedPhoto));
                    setImageError(false);
                }
            } else if (parsedUser.foto && (!Platform.OS === "web" || !parsedUser.foto.startsWith("blob:"))) {
                setProfilePhoto(getPhotoUrl(parsedUser.foto));
                setImageError(false);
            } else {
                setProfilePhoto(null);
            }


            const userId =
                parsedUser.id;


            const response =
                await fetch(
                    `${API_URL}/api/kendaraan/user/${userId}`
                );


            const data =
                await response.json();


            if (
                response.ok &&
                data.success
            ) {

                setKendaraan(
                    data.data || []
                );

            } else {

                setKendaraan([]);

            }

        } catch (error) {

            console.error(
                "Load Home Error:",
                error
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }
    };


    // =========================================================
    // RELOAD SAAT KEMBALI KE HOME
    // =========================================================

    useFocusEffect(
        useCallback(() => {

            loadData();

        }, [])
    );


    // =========================================================
    // REFRESH
    // =========================================================

    const handleRefresh = () => {

        setRefreshing(true);

        loadData();

    };


    // =========================================================
    // DATA USER
    // =========================================================

    const namaUser =
        user?.nama ||
        user?.name ||
        "Pengguna";


    // =========================================================
    // DATA KENDARAAN
    // =========================================================

    const kendaraanUtama =
        kendaraan.length > 0
            ? kendaraan[0]
            : null;


    const namaKendaraan =
        kendaraanUtama
            ? `${kendaraanUtama.merek || ""} ${
                  kendaraanUtama.model || ""
              }`.trim()
            : "";


    const nomorPolisi =
        kendaraanUtama?.nomorPolisi ||
        kendaraanUtama?.nomor_polisi ||
        "-";


    const tahunKendaraan =
        kendaraanUtama?.tahun ||
        "-";


    const kilometer =
        kendaraanUtama?.kilometer ??
        kendaraanUtama?.km ??
        0;


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <SafeAreaView
                style={styles.loadingContainer}
            >

                <ActivityIndicator
                    size="large"
                    color="#F20D18"
                />

                <Text
                    style={styles.loadingText}
                >
                    Memuat data...
                </Text>

            </SafeAreaView>
        );
    }


    // =========================================================
    // DESKTOP
    // =========================================================

    if (isDesktop) {

        return (

            <View
                style={styles.desktopContainer}
            >

                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <View
                    style={styles.sidebar}
                >

                    {/* LOGO */}

                    <View
                        style={styles.sidebarBrand}
                    >

                        <View
                            style={
                                styles.sidebarLogoBox
                            }
                        >

                            <Image
                                source={require(
                                    "../../assets/images/autocare-logo.png"
                                )}
                                style={
                                    styles.sidebarLogo
                                }
                                resizeMode="contain"
                            />

                        </View>


                        <Text
                            style={
                                styles.sidebarBrandTitle
                            }
                        >
                            AutoCare
                        </Text>


                        <Text
                            style={
                                styles.sidebarBrandSubtitle
                            }
                        >
                            Vehicle Service
                        </Text>

                    </View>


                    {/* MENU */}

                    <View
                        style={styles.sidebarMenu}
                    >

                        <SidebarItem
                            icon="home"
                            title="Beranda"
                            active
                            onPress={() =>
                                router.replace(
                                    "/home"
                                )
                            }
                        />


                        <SidebarItem
                            icon="car-outline"
                            title="Kendaraan"
                            onPress={() =>
                                router.push(
                                    "/kendaraan"
                                )
                            }
                        />


                        <SidebarItem
                            icon="calendar-outline"
                            title="Booking"
                            onPress={() =>
                                router.push(
                                    "/booking"
                                )
                            }
                        />


                        <SidebarItem
                            icon="receipt-outline"
                            title="Riwayat Service"
                            onPress={() =>
                                router.push(
                                    "/riwayat-servis"
                                )
                            }
                        />


                        <SidebarItem
                            icon="location-outline"
                            title="Lokasi Bengkel"
                            onPress={() =>
                                router.push(
                                    "/lokasi-bengkel"
                                )
                            }
                        />


                        <SidebarItem
                            icon="person-outline"
                            title="Profil"
                            onPress={() =>
                                router.push(
                                    "/profil"
                                )
                            }
                        />

                    </View>


                    {/* SIDEBAR BOTTOM */}

                    <View
                        style={
                            styles.sidebarBottom
                        }
                    >

                        <View
                            style={
                                styles.sidebarUser
                            }
                        >

                            <View
                                style={
                                    styles.sidebarAvatar
                                }
                            >

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


                            <View
                                style={
                                    styles.sidebarUserInfo
                                }
                            >

                                <Text
                                    style={
                                        styles.sidebarUserName
                                    }
                                    numberOfLines={1}
                                >
                                    {namaUser}
                                </Text>

                                <Text
                                    style={
                                        styles.sidebarUserRole
                                    }
                                >
                                    Pengguna
                                </Text>

                            </View>

                        </View>


                        <Text
                            style={
                                styles.sidebarCopyright
                            }
                        >
                            © 2026 AutoCare
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    MAIN DESKTOP
                ================================================= */}

                <View
                    style={styles.desktopMain}
                >

                    {/* TOPBAR */}

                    <View
                        style={styles.desktopTopbar}
                    >

                        <View>

                            <Text
                                style={
                                    styles.desktopTopTitle
                                }
                            >
                                Dashboard
                            </Text>

                            <Text
                                style={
                                    styles.desktopTopSubtitle
                                }
                            >
                                Kelola kendaraan dan
                                booking service Anda
                            </Text>

                        </View>


                        <View
                            style={
                                styles.desktopTopActions
                            }
                        >

                            {/* REALTIME CLOCK DESKTOP */}
                            <RealtimeClock isDesktop />

                            {/* NOTIFICATION */}

                            <TouchableOpacity
                                style={
                                    styles.desktopNotification
                                }
                                activeOpacity={0.8}
                            >

                                <Ionicons
                                    name="notifications-outline"
                                    size={22}
                                    color="#333333"
                                />

                                <View
                                    style={
                                        styles.notificationDot
                                    }
                                />

                            </TouchableOpacity>


                            {/* USER */}

                            <TouchableOpacity
                                style={
                                    styles.desktopProfileButton
                                }
                                activeOpacity={0.85}
                                onPress={() =>
                                    router.push(
                                        "/profil"
                                    )
                                }
                            >

                                <View
                                    style={
                                        styles.desktopAvatar
                                    }
                                >

                                    {profilePhoto && !imageError ? (
                                        <Image
                                            source={{ uri: getPhotoUrl(profilePhoto) }}
                                            style={styles.desktopAvatarImage}
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <Text style={styles.desktopAvatarInitial}>
                                            {namaUser.charAt(0).toUpperCase()}
                                        </Text>
                                    )}

                                </View>


                                <View>

                                    <Text
                                        style={
                                            styles.desktopProfileName
                                        }
                                        numberOfLines={1}
                                    >
                                        {namaUser}
                                    </Text>

                                    <Text
                                        style={
                                            styles.desktopProfileRole
                                        }
                                    >
                                        Pengguna AutoCare
                                    </Text>

                                </View>


                                <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color="#888888"
                                />

                            </TouchableOpacity>

                        </View>

                    </View>


                    {/* CONTENT */}

                    <ScrollView
                        showsVerticalScrollIndicator={
                            false
                        }
                        refreshControl={
                            <RefreshControl
                                refreshing={
                                    refreshing
                                }
                                onRefresh={
                                    handleRefresh
                                }
                                tintColor="#F20D18"
                            />
                        }
                        contentContainerStyle={
                            styles.desktopScroll
                        }
                    >

                        {/* WELCOME */}

                        <View
                            style={
                                styles.desktopWelcome
                            }
                        >

                            <View>

                                <Text
                                    style={
                                        styles.desktopWelcomeTitle
                                    }
                                >
                                    Selamat datang,
                                    {` `}
                                    {namaUser} 👋
                                </Text>

                                <Text
                                    style={
                                        styles.desktopWelcomeText
                                    }
                                >
                                    Siap menjaga kendaraan
                                    tetap prima hari ini?
                                </Text>

                            </View>

                        </View>


                        {/* HERO */}

                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {

                                if (!kendaraanUtama) {

                                    router.push(
                                        "/tambah-kendaraan"
                                    );

                                    return;
                                }

                                router.push(
                                    "/booking"
                                );

                            }}
                        >

                            <ImageBackground
                                source={require(
                                    "../../assets/images/autocare-banner.png"
                                )}
                                style={
                                    styles.desktopHero
                                }
                                imageStyle={
                                    styles.desktopHeroImage
                                }
                            >

                                <View
                                    style={
                                        styles.desktopHeroOverlay
                                    }
                                >

                                    <View
                                        style={
                                            styles.desktopHeroContent
                                        }
                                    >

                                        <View
                                            style={
                                                styles.heroBadge
                                            }
                                        >

                                            <Ionicons
                                                name="shield-checkmark"
                                                size={14}
                                                color="#FFFFFF"
                                            />

                                            <Text
                                                style={
                                                    styles.heroBadgeText
                                                }
                                            >
                                                AUTOCARE SERVICE
                                            </Text>

                                        </View>


                                        <Text
                                            style={
                                                styles.desktopHeroTitle
                                            }
                                        >
                                            Rawat kendaraan
                                            Anda untuk
                                            perjalanan lebih
                                            aman.
                                        </Text>


                                        <Text
                                            style={
                                                styles.desktopHeroSubtitle
                                            }
                                        >
                                            Booking service
                                            kendaraan dengan
                                            mudah, cepat, dan
                                            terpercaya.
                                        </Text>


                                        <View
                                            style={
                                                styles.desktopHeroButton
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.desktopHeroButtonText
                                                }
                                            >
                                                Booking Sekarang
                                            </Text>

                                            <Ionicons
                                                name="arrow-forward"
                                                size={17}
                                                color="#B22222"
                                            />

                                        </View>

                                    </View>

                                </View>

                            </ImageBackground>

                        </TouchableOpacity>


                        {/* =================================================
                            KENDARAAN + QUICK ACTION
                        ================================================= */}

                        <View
                            style={
                                styles.desktopSectionRow
                            }
                        >

                            {/* KENDARAAN */}

                            <View
                                style={
                                    styles.desktopVehicleSection
                                }
                            >

                                <View
                                    style={
                                        styles.desktopSectionHeader
                                    }
                                >

                                    <View>

                                        <Text
                                            style={
                                                styles.desktopSectionTitle
                                            }
                                        >
                                            Kendaraan Saya
                                        </Text>

                                        <Text
                                            style={
                                                styles.desktopSectionSubtitle
                                            }
                                        >
                                            Kendaraan yang
                                            terdaftar di akun
                                        </Text>

                                    </View>


                                    <TouchableOpacity
                                        onPress={() =>
                                            router.push(
                                                "/kendaraan"
                                            )
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.seeAllText
                                            }
                                        >
                                            Lihat Semua
                                        </Text>

                                    </TouchableOpacity>

                                </View>


                                {kendaraanUtama ? (

                                    <TouchableOpacity
                                        style={
                                            styles.desktopVehicleCard
                                        }
                                        activeOpacity={0.88}
                                        onPress={() =>
                                            router.push(
                                                "/kendaraan"
                                            )
                                        }
                                    >

                                        <View
                                            style={
                                                styles.desktopVehicleIcon
                                            }
                                        >

                                            <Ionicons
                                                name="car-sport"
                                                size={26}
                                                color="#F20D18"
                                            />

                                        </View>


                                        <View
                                            style={
                                                styles.desktopVehicleInfo
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.desktopVehicleName
                                                }
                                            >
                                                {namaKendaraan}
                                            </Text>


                                            <Text
                                                style={
                                                    styles.desktopVehiclePlate
                                                }
                                            >
                                                {nomorPolisi}
                                            </Text>


                                            <View
                                                style={
                                                    styles.desktopVehicleMeta
                                                }
                                            >

                                                <View
                                                    style={
                                                        styles.metaItem
                                                    }
                                                >

                                                    <Ionicons
                                                        name="calendar-outline"
                                                        size={14}
                                                        color="#888888"
                                                    />

                                                    <Text
                                                        style={
                                                            styles.metaText
                                                        }
                                                    >
                                                        {tahunKendaraan}
                                                    </Text>

                                                </View>


                                                <View
                                                    style={
                                                        styles.metaItem
                                                    }
                                                >

                                                    <Ionicons
                                                        name="speedometer-outline"
                                                        size={14}
                                                        color="#888888"
                                                    />

                                                    <Text
                                                        style={
                                                            styles.metaText
                                                        }
                                                    >
                                                        {Number(
                                                            kilometer
                                                        ).toLocaleString(
                                                            "id-ID"
                                                        )}{" "}
                                                        km
                                                    </Text>

                                                </View>

                                            </View>

                                        </View>


                                        <View
                                            style={
                                                styles.desktopCarImage
                                            }
                                        >

                                            <Image
                                                source={getCarImage(
                                                    kendaraanUtama.merek
                                                )}
                                                style={
                                                    styles.desktopCarImageSource
                                                }
                                                resizeMode="contain"
                                            />

                                        </View>


                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color="#AAAAAA"
                                        />

                                    </TouchableOpacity>

                                ) : (

                                    <TouchableOpacity
                                        style={
                                            styles.desktopEmptyVehicle
                                        }
                                        activeOpacity={0.85}
                                        onPress={() =>
                                            router.push(
                                                "/tambah-kendaraan"
                                            )
                                        }
                                    >

                                        <View
                                            style={
                                                styles.emptyVehicleIcon
                                            }
                                        >

                                            <Ionicons
                                                name="car-outline"
                                                size={28}
                                                color="#F20D18"
                                            />

                                        </View>


                                        <View
                                            style={
                                                styles.emptyVehicleContent
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.emptyVehicleTitleDesktop
                                                }
                                            >
                                                Belum ada
                                                kendaraan
                                            </Text>

                                            <Text
                                                style={
                                                    styles.emptyVehicleTextDesktop
                                                }
                                            >
                                                Tambahkan kendaraan
                                                untuk mulai booking
                                                service.
                                            </Text>

                                        </View>


                                        <View
                                            style={
                                                styles.addVehicleCircle
                                            }
                                        >

                                            <Ionicons
                                                name="add"
                                                size={22}
                                                color="#FFFFFF"
                                            />

                                        </View>

                                    </TouchableOpacity>

                                )}

                            </View>


                            {/* QUICK ACTION */}

                            <View
                                style={
                                    styles.desktopQuickSection
                                }
                            >

                                <View
                                    style={
                                        styles.desktopSectionHeader
                                    }
                                >

                                    <View>

                                        <Text
                                            style={
                                                styles.desktopSectionTitle
                                            }
                                        >
                                            Akses Cepat
                                        </Text>

                                        <Text
                                            style={
                                                styles.desktopSectionSubtitle
                                            }
                                        >
                                            Layanan AutoCare
                                        </Text>

                                    </View>

                                </View>


                                <View
                                    style={
                                        styles.desktopQuickGrid
                                    }
                                >

                                    <QuickAction
                                        icon="calendar-outline"
                                        title="Booking"
                                        subtitle="Service"
                                        onPress={() =>
                                            kendaraanUtama
                                                ? router.push(
                                                      "/booking"
                                                  )
                                                : router.push(
                                                      "/tambah-kendaraan"
                                                  )
                                        }
                                    />


                                    <QuickAction
                                        icon="receipt-outline"
                                        title="Riwayat"
                                        subtitle="Service"
                                        onPress={() =>
                                            router.push(
                                                "/riwayat-servis"
                                            )
                                        }
                                    />


                                    <QuickAction
                                        icon="location-outline"
                                        title="Lokasi"
                                        subtitle="Bengkel"
                                        onPress={() =>
                                            router.push(
                                                "/lokasi-bengkel"
                                            )
                                        }
                                    />


                                    <QuickAction
                                        icon="car-outline"
                                        title="Kendaraan"
                                        subtitle="Saya"
                                        onPress={() =>
                                            router.push(
                                                "/kendaraan"
                                            )
                                        }
                                    />

                                </View>

                            </View>

                        </View>


                        {/* =================================================
                            BOOKING CEPAT
                        ================================================= */}

                        <View
                            style={
                                styles.desktopBookingSection
                            }
                        >

                            <View
                                style={
                                    styles.desktopSectionHeader
                                }
                            >

                                <View>

                                    <Text
                                        style={
                                            styles.desktopSectionTitle
                                        }
                                    >
                                        Booking Cepat
                                    </Text>

                                    <Text
                                        style={
                                            styles.desktopSectionSubtitle
                                        }
                                    >
                                        Lakukan booking
                                        service dalam
                                        beberapa langkah
                                    </Text>

                                </View>

                            </View>


                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {

                                    if (!kendaraanUtama) {

                                        router.push(
                                            "/tambah-kendaraan"
                                        );

                                        return;
                                    }

                                    router.push(
                                        "/booking"
                                    );

                                }}
                            >

                                <ImageBackground
                                    source={require(
                                        "../../assets/images/bookingcepat.png"
                                    )}
                                    style={
                                        styles.desktopBookingCard
                                    }
                                    imageStyle={
                                        styles.desktopBookingImage
                                    }
                                >

                                    <View
                                        style={
                                            styles.desktopBookingOverlay
                                        }
                                    >

                                        <View
                                            style={
                                                styles.desktopBookingContent
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.desktopBookingIcon
                                                }
                                            >

                                                <Ionicons
                                                    name="construct-outline"
                                                    size={25}
                                                    color="#FFFFFF"
                                                />

                                            </View>


                                            <Text
                                                style={
                                                    styles.desktopBookingTitle
                                                }
                                            >
                                                Booking Service
                                            </Text>


                                            <Text
                                                style={
                                                    styles.desktopBookingText
                                                }
                                            >
                                                Jadwalkan perawatan
                                                kendaraan Anda
                                                sekarang.
                                            </Text>


                                            <View
                                                style={
                                                    styles.desktopBookingButton
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.desktopBookingButtonText
                                                    }
                                                >
                                                    Mulai Booking
                                                </Text>

                                                <Ionicons
                                                    name="arrow-forward"
                                                    size={16}
                                                    color="#B22222"
                                                />

                                            </View>

                                        </View>

                                    </View>

                                </ImageBackground>

                            </TouchableOpacity>

                        </View>


                        {/* =================================================
                            REMINDER
                        ================================================= */}

                        {kendaraanUtama && (

                            <View
                                style={
                                    styles.desktopReminder
                                }
                            >

                                <View
                                    style={
                                        styles.desktopReminderIcon
                                    }
                                >

                                    <Ionicons
                                        name="notifications-outline"
                                        size={22}
                                        color="#F20D18"
                                    />

                                </View>


                                <View
                                    style={
                                        styles.desktopReminderContent
                                    }
                                >

                                    <Text
                                        style={
                                            styles.desktopReminderTitle
                                        }
                                    >
                                        Pengingat Service
                                    </Text>


                                    <Text
                                        style={
                                            styles.desktopReminderText
                                        }
                                    >
                                        Pastikan {namaKendaraan}{" "}
                                        Anda selalu dalam
                                        kondisi terbaik.
                                    </Text>

                                </View>


                                <TouchableOpacity
                                    style={
                                        styles.desktopReminderButton
                                    }
                                    activeOpacity={0.85}
                                    onPress={() =>
                                        router.push(
                                            "/booking"
                                        )
                                    }
                                >

                                    <Text
                                        style={
                                            styles.desktopReminderButtonText
                                        }
                                    >
                                        Booking Service
                                    </Text>

                                    <Ionicons
                                        name="arrow-forward"
                                        size={15}
                                        color="#FFFFFF"
                                    />

                                </TouchableOpacity>

                            </View>

                        )}

                    </ScrollView>

                </View>

            </View>
        );
    }


    // =========================================================
    // MOBILE
    // =========================================================

    return (

        <SafeAreaView
            style={styles.container}
            edges={["top", "bottom"]}
        >

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#F20D18"
                    />
                }
                contentContainerStyle={
                    styles.scrollContent
                }
            >

                {/* HEADER */}

                <View
                    style={styles.header}
                >

                    <View>

                        <Text
                            style={styles.greeting}
                        >
                            Hallo, {namaUser} 👋
                        </Text>

                        <Text
                            style={
                                styles.headerSubtitle
                            }
                        >
                            Mau servis kendaraan
                            hari ini?
                        </Text>

                        <RealtimeClock style={{ marginTop: 8 }} />

                    </View>


                    <View style={styles.headerActions}>

                        {/* NOTIFIKASI */}
                        <TouchableOpacity
                            style={
                                styles.notificationButton
                            }
                            activeOpacity={0.8}
                        >

                            <Ionicons
                                name="notifications-outline"
                                size={21}
                                color="#222222"
                            />

                            <View
                                style={
                                    styles.notificationDot
                                }
                            />

                        </TouchableOpacity>

                        {/* AVATAR PROFIL */}
                        <TouchableOpacity
                            style={styles.mobileAvatarButton}
                            activeOpacity={0.85}
                            onPress={() =>
                                router.push("/profil")
                            }
                        >
                            {profilePhoto && !imageError ? (
                                <Image
                                    source={{ uri: getPhotoUrl(profilePhoto) }}
                                    style={styles.mobileAvatarImage}
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <Text style={styles.mobileAvatarInitial}>
                                    {namaUser.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </TouchableOpacity>

                    </View>

                </View>


                {/* HERO */}

                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {

                        if (!kendaraanUtama) {

                            router.push(
                                "/tambah-kendaraan"
                            );

                            return;
                        }

                        router.push(
                            "/booking"
                        );

                    }}
                >

                    <ImageBackground
                        source={require(
                            "../../assets/images/autocare-banner.png"
                        )}
                        style={styles.heroBanner}
                        imageStyle={
                            styles.heroBannerImage
                        }
                    >

                        <View
                            style={
                                styles.heroOverlay
                            }
                        >

                            <View
                                style={
                                    styles.heroContent
                                }
                            >

                                <Text
                                    style={
                                        styles.heroTitle
                                    }
                                >
                                    Rawat Kendaraan Anda
                                </Text>

                                <Text
                                    style={
                                        styles.heroTitle
                                    }
                                >
                                    untuk Perjalanan Lebih Aman
                                </Text>

                                <Text
                                    style={
                                        styles.heroSubtitle
                                    }
                                >
                                    Booking servis kendaraan
                                    dengan mudah dan cepat.
                                </Text>


                                <View
                                    style={
                                        styles.heroButton
                                    }
                                >

                                    <Text
                                        style={
                                            styles.heroButtonText
                                        }
                                    >
                                        Booking Sekarang
                                    </Text>

                                    <Ionicons
                                        name="arrow-forward"
                                        size={14}
                                        color="#B22222"
                                    />

                                </View>

                            </View>

                        </View>

                    </ImageBackground>

                </TouchableOpacity>


                {/* KENDARAAN */}

                {kendaraanUtama ? (

                    <TouchableOpacity
                        style={
                            styles.vehicleCard
                        }
                        activeOpacity={0.9}
                        onPress={() =>
                            router.push(
                                "/kendaraan"
                            )
                        }
                    >

                        <View
                            style={
                                styles.vehicleInfo
                            }
                        >

                            <Text
                                style={
                                    styles.vehicleTitle
                                }
                            >
                                {namaKendaraan}
                            </Text>


                            <View
                                style={
                                    styles.vehicleRow
                                }
                            >

                                <Ionicons
                                    name="car-outline"
                                    size={14}
                                    color="#777777"
                                />

                                <Text
                                    style={
                                        styles.vehicleText
                                    }
                                >
                                    {nomorPolisi}
                                </Text>

                            </View>


                            <View
                                style={
                                    styles.vehicleRow
                                }
                            >

                                <Ionicons
                                    name="calendar-outline"
                                    size={14}
                                    color="#777777"
                                />

                                <Text
                                    style={
                                        styles.vehicleText
                                    }
                                >
                                    Tahun {tahunKendaraan}
                                </Text>

                            </View>


                            <View
                                style={
                                    styles.vehicleRow
                                }
                            >

                                <Ionicons
                                    name="speedometer-outline"
                                    size={14}
                                    color="#777777"
                                />

                                <Text
                                    style={
                                        styles.vehicleText
                                    }
                                >
                                    {Number(
                                        kilometer
                                    ).toLocaleString(
                                        "id-ID"
                                    )}{" "}
                                    km
                                </Text>

                            </View>

                        </View>


                        <View
                            style={
                                styles.carImageContainer
                            }
                        >

                            <Image
                                source={getCarImage(
                                    kendaraanUtama.merek
                                )}
                                style={
                                    styles.carImage
                                }
                                resizeMode="contain"
                            />

                        </View>

                    </TouchableOpacity>

                ) : (

                    <View
                        style={
                            styles.vehicleCard
                        }
                    >

                        <View
                            style={
                                styles.emptyVehicleInfo
                            }
                        >

                            <Text
                                style={
                                    styles.emptyVehicleTitle
                                }
                            >
                                Belum ada jenis
                                kendaraan
                            </Text>

                            <Text
                                style={
                                    styles.emptyVehicleSubtitle
                                }
                            >
                                Tambahkan kendaraan
                                untuk mulai melakukan
                                booking servis.
                            </Text>


                            <TouchableOpacity
                                style={
                                    styles.addVehicleButton
                                }
                                activeOpacity={0.85}
                                onPress={() =>
                                    router.push(
                                        "/tambah-kendaraan"
                                    )
                                }
                            >

                                <Ionicons
                                    name="add"
                                    size={15}
                                    color="#FFFFFF"
                                />

                                <Text
                                    style={
                                        styles.addVehicleText
                                    }
                                >
                                    Tambah Kendaraan
                                </Text>

                            </TouchableOpacity>

                        </View>


                        <View
                            style={
                                styles.emptyCarImage
                            }
                        >

                            <Ionicons
                                name="car-sport-outline"
                                size={68}
                                color="#D7D7D7"
                            />

                        </View>

                    </View>

                )}


                {/* BOOKING CEPAT */}

                <Text
                    style={styles.sectionTitle}
                >
                    Booking Cepat
                </Text>


                <TouchableOpacity
                    style={styles.bookingCard}
                    activeOpacity={0.85}
                    onPress={() => {

                        if (!kendaraanUtama) {

                            router.push(
                                "/tambah-kendaraan"
                            );

                            return;
                        }

                        router.push(
                            "/booking"
                        );

                    }}
                >

                    <ImageBackground
                        source={require(
                            "../../assets/images/bookingcepat.png"
                        )}
                        style={
                            styles.bookingBackground
                        }
                        imageStyle={
                            styles.bookingBackgroundImage
                        }
                    >

                        <View
                            style={
                                styles.bookingOverlay
                            }
                        />

                        <View
                            style={
                                styles.bookingContent
                            }
                        >

                            <View
                                style={
                                    styles.quickIconWhite
                                }
                            >

                                <Ionicons
                                    name="construct-outline"
                                    size={22}
                                    color="#FFFFFF"
                                />

                            </View>


                            <Text
                                style={
                                    styles.bookingText
                                }
                            >
                                Booking
                            </Text>

                            <Text
                                style={
                                    styles.bookingText
                                }
                            >
                                Service
                            </Text>

                        </View>

                    </ImageBackground>

                </TouchableOpacity>


                {/* FITUR LAINNYA */}

                <Text
                    style={styles.sectionTitle}
                >
                    Fitur Lainnya
                </Text>


                <View
                    style={styles.featureRow}
                >

                    <MobileFeature
                        icon="car-outline"
                        title="Kendaraan"
                        subtitle="Saya"
                        onPress={() =>
                            router.push(
                                "/kendaraan"
                            )
                        }
                    />


                    <MobileFeature
                        icon="receipt-outline"
                        title="Riwayat"
                        subtitle="Service"
                        onPress={() =>
                            router.push(
                                "/riwayat-servis"
                            )
                        }
                    />


                    <MobileFeature
                        icon="location-outline"
                        title="Lokasi"
                        subtitle="Bengkel"
                        onPress={() =>
                            router.push(
                                "/lokasi-bengkel"
                            )
                        }
                    />

                </View>


                {/* REMINDER */}

                {kendaraanUtama && (

                    <View
                        style={
                            styles.reminderSection
                        }
                    >

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Pengingat Servis
                        </Text>


                        <View
                            style={
                                styles.reminderCard
                            }
                        >

                            <View
                                style={
                                    styles.reminderIcon
                                }
                            >

                                <Ionicons
                                    name="warning-outline"
                                    size={20}
                                    color="#F20D18"
                                />

                            </View>


                            <View
                                style={
                                    styles.reminderContent
                                }
                            >

                                <Text
                                    style={
                                        styles.reminderTitle
                                    }
                                >
                                    Saatnya servis
                                    kendaraan kamu
                                </Text>


                                <Text
                                    style={
                                        styles.reminderText
                                    }
                                >
                                    Pastikan kendaraan
                                    kamu selalu dalam
                                    kondisi terbaik.
                                </Text>


                                <TouchableOpacity
                                    style={
                                        styles.reminderButton
                                    }
                                    activeOpacity={0.85}
                                    onPress={() =>
                                        router.push(
                                            "/booking"
                                        )
                                    }
                                >

                                    <Text
                                        style={
                                            styles.reminderButtonText
                                        }
                                    >
                                        Booking Service
                                    </Text>

                                    <Ionicons
                                        name="arrow-forward"
                                        size={15}
                                        color="#FFFFFF"
                                    />

                                </TouchableOpacity>

                            </View>

                        </View>

                    </View>

                )}

            </ScrollView>


            {/* MOBILE BOTTOM NAV */}

            <View
                style={styles.bottomNav}
            >

                <MobileNav
                    icon="home"
                    title="Home"
                    active
                />


                <MobileNav
                    icon="car-outline"
                    title="Kendaraan"
                    onPress={() =>
                        router.push(
                            "/kendaraan"
                        )
                    }
                />


                <MobileNav
                    icon="calendar-outline"
                    title="Booking"
                    onPress={() =>
                        router.push(
                            "/booking"
                        )
                    }
                />


                <MobileNav
                    icon="person-outline"
                    title="Profil"
                    onPress={() =>
                        router.push(
                            "/profil"
                        )
                    }
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
                active &&
                    styles.sidebarItemActive,
            ]}
            activeOpacity={0.8}
            onPress={onPress}
        >

            <Ionicons
                name={icon}
                size={20}
                color={
                    active
                        ? "#FFFFFF"
                        : "#D7B4B4"
                }
            />

            <Text
                style={[
                    styles.sidebarItemText,
                    active &&
                        styles.sidebarItemTextActive,
                ]}
            >
                {title}
            </Text>

        </TouchableOpacity>
    );
}


// =============================================================
// QUICK ACTION
// =============================================================

function QuickAction({
    icon,
    title,
    subtitle,
    onPress,
}) {

    return (

        <TouchableOpacity
            style={
                styles.desktopQuickCard
            }
            activeOpacity={0.82}
            onPress={onPress}
        >

            <View
                style={
                    styles.desktopQuickIcon
                }
            >

                <Ionicons
                    name={icon}
                    size={21}
                    color="#F20D18"
                />

            </View>


            <Text
                style={
                    styles.desktopQuickTitle
                }
            >
                {title}
            </Text>


            <Text
                style={
                    styles.desktopQuickSubtitle
                }
            >
                {subtitle}
            </Text>

        </TouchableOpacity>
    );
}


// =============================================================
// MOBILE FEATURE
// =============================================================

function MobileFeature({
    icon,
    title,
    subtitle,
    onPress,
}) {

    return (

        <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.85}
            onPress={onPress}
        >

            <View
                style={styles.featureIconBox}
            >

                <Ionicons
                    name={icon}
                    size={22}
                    color="#F20D18"
                />

            </View>


            <Text
                style={styles.featureTitle}
            >
                {title}
            </Text>


            <Text
                style={styles.featureSubtitle}
            >
                {subtitle}
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


// =============================================================
// STYLE
// =============================================================

const styles = StyleSheet.create({

    // =========================================================
    // LOADING
    // =========================================================

    loadingContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        marginTop: 10,
        color: "#777777",
        fontSize: 13,
    },


    // =========================================================
    // DESKTOP
    // =========================================================

    desktopContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#F5F6F8",
    },


    // =========================================================
    // SIDEBAR
    // =========================================================

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
        width: 50,
        height: 50,
    },

    sidebarBrandTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: 0.5,
    },

    sidebarBrandSubtitle: {
        color: "#D9B7B7",
        fontSize: 11,
        marginTop: 3,
    },

    sidebarMenu: {
        flex: 1,
    },

    sidebarItem: {
        height: 52,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        marginBottom: 7,
    },

    sidebarItemActive: {
        backgroundColor: "#F20D18",
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
        color: "#D7B4B4",
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 13,
    },

    sidebarItemTextActive: {
        color: "#FFFFFF",
        fontWeight: "800",
    },

    sidebarBottom: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.12)",
        paddingTop: 18,
    },

    sidebarUser: {
        flexDirection: "row",
        alignItems: "center",
    },

    sidebarAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#F20D18",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },

    sidebarAvatarImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },

    sidebarAvatarInitial: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },

    sidebarUserInfo: {
        flex: 1,
        marginLeft: 10,
    },

    sidebarUserName: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
    },

    sidebarUserRole: {
        color: "#CDAAAA",
        fontSize: 10,
        marginTop: 2,
    },

    sidebarCopyright: {
        color: "#9F7373",
        fontSize: 9,
        textAlign: "center",
        marginTop: 18,
    },


    // =========================================================
    // DESKTOP MAIN
    // =========================================================

    desktopMain: {
        flex: 1,
        minWidth: 0,
    },

    desktopTopbar: {
        height: 82,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#EAEAEA",
        paddingHorizontal: 32,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    desktopTopTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: "#222222",
    },

    desktopTopSubtitle: {
        color: "#888888",
        fontSize: 11,
        marginTop: 4,
    },

    desktopTopActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
    },

    desktopNotification: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F7F7F7",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },

    notificationDot: {
        position: "absolute",
        top: 9,
        right: 9,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#F20D18",
    },

    desktopProfileButton: {
        minWidth: 175,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 12,
    },

    desktopAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#F20D18",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },

    desktopAvatarImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },

    desktopAvatarInitial: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },

    desktopProfileName: {
        maxWidth: 100,
        fontSize: 11,
        fontWeight: "800",
        color: "#222222",
    },

    desktopProfileRole: {
        fontSize: 9,
        color: "#999999",
        marginTop: 2,
    },

    desktopScroll: {
        paddingHorizontal: 32,
        paddingTop: 25,
        paddingBottom: 45,
        maxWidth: 1450,
        width: "100%",
        alignSelf: "center",
    },

    desktopWelcome: {
        marginBottom: 20,
    },

    desktopWelcomeTitle: {
        fontSize: 25,
        fontWeight: "900",
        color: "#1C1C1C",
    },

    desktopWelcomeText: {
        fontSize: 12,
        color: "#888888",
        marginTop: 5,
    },


    // =========================================================
    // DESKTOP HERO
    // =========================================================

    desktopHero: {
        height: 235,
        width: "100%",
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: 28,
    },

    desktopHeroImage: {
        borderRadius: 24,
    },

    desktopHeroOverlay: {
        flex: 1,
        backgroundColor: "rgba(100,0,0,0.46)",
        justifyContent: "center",
    },

    desktopHeroContent: {
        paddingHorizontal: 38,
        maxWidth: 570,
    },

    heroBadge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.18)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },

    heroBadgeText: {
        color: "#FFFFFF",
        fontSize: 9,
        fontWeight: "800",
        marginLeft: 6,
        letterSpacing: 0.7,
    },

    desktopHeroTitle: {
        color: "#FFFFFF",
        fontSize: 27,
        fontWeight: "900",
        lineHeight: 33,
    },

    desktopHeroSubtitle: {
        color: "#FFFFFF",
        fontSize: 12,
        lineHeight: 18,
        opacity: 0.9,
        marginTop: 8,
        maxWidth: 430,
    },

    desktopHeroButton: {
        alignSelf: "flex-start",
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 16,
    },

    desktopHeroButtonText: {
        color: "#B22222",
        fontSize: 11,
        fontWeight: "900",
        marginRight: 7,
    },


    // =========================================================
    // DESKTOP SECTION
    // =========================================================

    desktopSectionRow: {
        flexDirection: "row",
        gap: 22,
        marginBottom: 28,
    },

    desktopVehicleSection: {
        flex: 1.35,
    },

    desktopQuickSection: {
        flex: 1,
    },

    desktopSectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    desktopSectionTitle: {
        fontSize: 15,
        fontWeight: "900",
        color: "#222222",
    },

    desktopSectionSubtitle: {
        color: "#999999",
        fontSize: 10,
        marginTop: 3,
    },

    seeAllText: {
        color: "#F20D18",
        fontSize: 10,
        fontWeight: "800",
    },


    // =========================================================
    // DESKTOP VEHICLE
    // =========================================================

    desktopVehicleCard: {
        minHeight: 135,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E7E7E7",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
    },

    desktopVehicleIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#FFF1F1",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },

    desktopVehicleInfo: {
        flex: 1,
    },

    desktopVehicleName: {
        fontSize: 16,
        fontWeight: "900",
        color: "#222222",
    },

    desktopVehiclePlate: {
        fontSize: 11,
        color: "#777777",
        marginTop: 3,
        fontWeight: "600",
    },

    desktopVehicleMeta: {
        flexDirection: "row",
        gap: 18,
        marginTop: 10,
    },

    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },

    metaText: {
        color: "#777777",
        fontSize: 10,
    },

    desktopCarImage: {
        width: 170,
        height: 105,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    desktopCarImageSource: {
        width: 190,
        height: 110,
    },


    // =========================================================
    // DESKTOP EMPTY VEHICLE
    // =========================================================

    desktopEmptyVehicle: {
        minHeight: 135,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E7E7E7",
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
    },

    emptyVehicleIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#FFF1F1",
        justifyContent: "center",
        alignItems: "center",
    },

    emptyVehicleContent: {
        flex: 1,
        marginLeft: 15,
    },

    emptyVehicleTitleDesktop: {
        fontSize: 15,
        fontWeight: "900",
        color: "#222222",
    },

    emptyVehicleTextDesktop: {
        fontSize: 10,
        color: "#888888",
        lineHeight: 15,
        marginTop: 4,
    },

    addVehicleCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F20D18",
        justifyContent: "center",
        alignItems: "center",
    },


    // =========================================================
    // DESKTOP QUICK ACTION
    // =========================================================

    desktopQuickGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },

    desktopQuickCard: {
        width: "48%",
        minHeight: 91,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E7E7E7",
        padding: 13,
    },

    desktopQuickIcon: {
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: "#FFF1F1",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },

    desktopQuickTitle: {
        fontSize: 11,
        color: "#222222",
        fontWeight: "900",
    },

    desktopQuickSubtitle: {
        fontSize: 9,
        color: "#999999",
        marginTop: 2,
    },


    // =========================================================
    // DESKTOP BOOKING
    // =========================================================

    desktopBookingSection: {
        marginBottom: 25,
    },

    desktopBookingCard: {
        height: 185,
        borderRadius: 20,
        overflow: "hidden",
    },

    desktopBookingImage: {
        borderRadius: 20,
    },

    desktopBookingOverlay: {
        flex: 1,
        backgroundColor: "rgba(120,0,0,0.42)",
        justifyContent: "center",
    },

    desktopBookingContent: {
        paddingHorizontal: 28,
    },

    desktopBookingIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },

    desktopBookingTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "900",
    },

    desktopBookingText: {
        color: "#FFFFFF",
        fontSize: 11,
        opacity: 0.9,
        marginTop: 4,
    },

    desktopBookingButton: {
        alignSelf: "flex-start",
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: 9,
        marginTop: 13,
    },

    desktopBookingButtonText: {
        color: "#B22222",
        fontSize: 10,
        fontWeight: "900",
        marginRight: 6,
    },


    // =========================================================
    // DESKTOP REMINDER
    // =========================================================

    desktopReminder: {
        backgroundColor: "#FFF6F6",
        borderWidth: 1,
        borderColor: "#FFDCDC",
        borderRadius: 18,
        padding: 17,
        flexDirection: "row",
        alignItems: "center",
    },

    desktopReminderIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },

    desktopReminderContent: {
        flex: 1,
    },

    desktopReminderTitle: {
        color: "#C4141D",
        fontSize: 12,
        fontWeight: "900",
    },

    desktopReminderText: {
        color: "#777777",
        fontSize: 10,
        marginTop: 4,
    },

    desktopReminderButton: {
        backgroundColor: "#F20D18",
        borderRadius: 9,
        paddingHorizontal: 14,
        paddingVertical: 9,
        flexDirection: "row",
        alignItems: "center",
    },

    desktopReminderButtonText: {
        color: "#FFFFFF",
        fontSize: 9,
        fontWeight: "800",
        marginRight: 5,
    },


    // =========================================================
    // MOBILE
    // =========================================================

    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 95,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },

    greeting: {
        fontSize: 18,
        color: "#222222",
        fontWeight: "800",
    },

    headerSubtitle: {
        fontSize: 10.5,
        color: "#777777",
        marginTop: 3,
    },

    notificationButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F7F7F7",
        justifyContent: "center",
        alignItems: "center",
    },

    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    mobileAvatarButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#F20D18",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "rgba(198,40,40,0.25)",
    },

    mobileAvatarImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },

    mobileAvatarInitial: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },


    // =========================================================
    // MOBILE HERO
    // =========================================================

    heroBanner: {
        height: 150,
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 21,
        backgroundColor: "#B22222",
    },

    heroBannerImage: {
        borderRadius: 18,
    },

    heroOverlay: {
        flex: 1,
        backgroundColor: "rgba(178,34,34,0.72)",
        justifyContent: "center",
    },

    heroContent: {
        paddingLeft: 18,
        paddingRight: 125,
    },

    heroTitle: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
        lineHeight: 18,
    },

    heroSubtitle: {
        color: "#FFFFFF",
        fontSize: 9,
        lineHeight: 14,
        marginTop: 5,
        opacity: 0.9,
    },

    heroButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 10,
    },

    heroButtonText: {
        color: "#B22222",
        fontSize: 9,
        fontWeight: "800",
        marginRight: 5,
    },


    // =========================================================
    // MOBILE VEHICLE
    // =========================================================

    vehicleCard: {
        minHeight: 135,
        borderWidth: 1,
        borderColor: "#DADADA",
        borderRadius: 15,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        overflow: "hidden",
        marginBottom: 21,
        paddingLeft: 15,
        paddingVertical: 13,
    },

    vehicleInfo: {
        flex: 1,
        justifyContent: "center",
    },

    vehicleTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: "#151515",
        marginBottom: 7,
    },

    vehicleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },

    vehicleText: {
        fontSize: 9.5,
        color: "#777777",
        marginLeft: 6,
    },

    carImageContainer: {
        position: "absolute",
        right: 10,
        top: 30,
        width: 105,
        height: 80,
        justifyContent: "center",
        alignItems: "center",
        overflow: "visible",
    },

    carImage: {
        width: 200,
        height: 110,
    },

    emptyVehicleInfo: {
        flex: 1,
        justifyContent: "center",
    },

    emptyVehicleTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#222222",
        marginBottom: 7,
    },

    emptyVehicleSubtitle: {
        fontSize: 10,
        color: "#888888",
        lineHeight: 15,
        maxWidth: 180,
        marginBottom: 10,
    },

    emptyCarImage: {
        width: 110,
        justifyContent: "center",
        alignItems: "center",
    },

    addVehicleButton: {
        alignSelf: "flex-start",
        height: 30,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: "#F20D18",
        flexDirection: "row",
        alignItems: "center",
    },

    addVehicleText: {
        color: "#FFFFFF",
        fontSize: 8,
        fontWeight: "800",
        marginLeft: 4,
    },


    // =========================================================
    // MOBILE SECTION
    // =========================================================

    sectionTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: "#161616",
        marginBottom: 10,
    },


    // =========================================================
    // MOBILE BOOKING
    // =========================================================

    bookingCard: {
        width: "100%",
        height: 170,
        marginBottom: 20,
        overflow: "hidden",
        borderRadius: 20,
    },

    bookingBackground: {
        width: "100%",
        height: "100%",
        minHeight: 170,
        justifyContent: "center",
    },

    bookingBackgroundImage: {
        borderRadius: 20,
    },

    bookingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(180,0,0,0.35)",
    },

    bookingContent: {
        padding: 20,
    },

    quickIconWhite: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },

    bookingText: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "800",
        lineHeight: 25,
    },


    // =========================================================
    // MOBILE FEATURE
    // =========================================================

    featureRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 19,
    },

    featureCard: {
        flex: 1,
        height: 72,
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },

    featureIconBox: {
        marginBottom: 5,
    },

    featureTitle: {
        fontSize: 8.5,
        color: "#222222",
        fontWeight: "700",
        textAlign: "center",
    },

    featureSubtitle: {
        fontSize: 8.5,
        color: "#222222",
        fontWeight: "700",
        textAlign: "center",
    },


    // =========================================================
    // MOBILE REMINDER
    // =========================================================

    reminderSection: {
        marginTop: 0,
    },

    reminderCard: {
        backgroundColor: "#FFF1F1",
        borderRadius: 14,
        padding: 18,
        flexDirection: "row",
        borderWidth: 1,
        borderColor: "#FFD7D7",
        marginBottom: 5,
    },

    reminderIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },

    reminderContent: {
        flex: 1,
    },

    reminderTitle: {
        fontSize: 10,
        fontWeight: "800",
        color: "#C4141D",
        marginBottom: 3,
    },

    reminderText: {
        fontSize: 8.5,
        color: "#777777",
        lineHeight: 13,
        marginBottom: 8,
    },

    reminderButton: {
        height: 27,
        backgroundColor: "#C1010A",
        borderRadius: 5,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
    },

    reminderButtonText: {
        color: "#FFFFFF",
        fontSize: 8,
        fontWeight: "800",
        marginRight: 5,
    },


    // =========================================================
    // MOBILE BOTTOM NAV
    // =========================================================

    bottomNav: {
        height: 64,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
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