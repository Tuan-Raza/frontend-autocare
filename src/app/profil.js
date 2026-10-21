import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useCallback, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
    Image,
    Platform,
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

// =====================================================
// WARNA AUTOCARE
// =====================================================

const RED = "#C62828";
const RED_DARK = "#A91F1F";
const RED_LIGHT = "#FFF3F3";
const RED_SOFT = "#FFF8F8";

export default function Profil() {
    const { width } = useWindowDimensions();

    const isDesktop = width >= 900;

    const [user, setUser] = useState(null);
    const [notification, setNotification] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] =
        useState(false);
    const [profilePhoto, setProfilePhoto] =
        useState(null);
    const [imageError, setImageError] = useState(false);

    // =================================================
    // LOAD DATA
    // =================================================

    useFocusEffect(
        useCallback(() => {
            loadUser();
            loadProfilePhoto();
        }, [])
    );

    const loadProfilePhoto = async () => {
        try {
            const savedUser = await AsyncStorage.getItem("autocare_user");
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                if (parsed.foto && (Platform.OS !== "web" || !parsed.foto.startsWith("blob:"))) {
                    setProfilePhoto(getPhotoUrl(parsed.foto));
                    setImageError(false);
                    return;
                }
            }
            setProfilePhoto(null);
            await AsyncStorage.removeItem("autocare_profile_photo");
        } catch (error) {
            console.log(
                "Load Profile Photo Error:",
                error
            );
        }
    };

    const loadUser = async () => {
        try {
            const savedUser =
                await AsyncStorage.getItem(
                    "autocare_user"
                );

            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);

                if (parsed.foto && (!Platform.OS === "web" || !parsed.foto.startsWith("blob:"))) {
                    setProfilePhoto(getPhotoUrl(parsed.foto));
                    setImageError(false);
                }

                // Ambil data terbaru dari database MySQL
                if (parsed.id) {
                    try {
                        const res = await fetch(`${API_URL}/api/user/profile/${parsed.id}`);
                        const resData = await res.json();
                        if (res.ok && resData.success && resData.user) {
                            const dbUser = {
                                ...parsed,
                                ...resData.user,
                                foto: resData.user.foto ? getPhotoUrl(resData.user.foto) : null,
                            };
                            setUser(dbUser);
                            await AsyncStorage.setItem("autocare_user", JSON.stringify(dbUser));
                            if (dbUser.foto) {
                                setProfilePhoto(dbUser.foto);
                                await AsyncStorage.setItem("autocare_profile_photo", dbUser.foto);
                            }
                        }
                    } catch (e) {
                        // ignore network error
                    }
                }
            }
        } catch (error) {
            console.error(
                "Gagal mengambil data user:",
                error
            );
        }
    };

    // =================================================
    // INITIAL
    // =================================================

    const getInitial = () => {
        if (!user?.nama) {
            return "A";
        }

        return user.nama
            .trim()
            .charAt(0)
            .toUpperCase();
    };

    // =================================================
    // NOTIFICATION
    // =================================================

    const showNotification = (
        type,
        title,
        message
    ) => {
        setNotification({
            type,
            title,
            message,
        });

        setTimeout(() => {
            setNotification(null);
        }, 2200);
    };

    // =================================================
    // FOTO PROFIL
    // =================================================

    const saveAndUploadPhoto = async (finalPhotoUri) => {
        try {
            setProfilePhoto(finalPhotoUri);
            setImageError(false);

            let savedPhotoResult = finalPhotoUri;

            if (user?.id) {
                try {
                    const response = await fetch(
                        `${API_URL}/api/user/profile/${user.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                foto: finalPhotoUri,
                            }),
                        }
                    );

                    const result = await response.json();
                    if (response.ok && result.success && result.user?.foto) {
                        savedPhotoResult = getPhotoUrl(result.user.foto);
                    }
                } catch (apiErr) {
                    console.log("Upload photo API error:", apiErr);
                }
            }

            setProfilePhoto(savedPhotoResult);
            setImageError(false);

            await AsyncStorage.setItem(
                "autocare_profile_photo",
                savedPhotoResult
            );

            try {
                const savedUser = await AsyncStorage.getItem("autocare_user");
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    parsed.foto = savedPhotoResult;
                    await AsyncStorage.setItem("autocare_user", JSON.stringify(parsed));
                    setUser(parsed);
                }
            } catch (e) {
                console.log("Sync user photo error:", e);
            }

            showNotification(
                "success",
                "Foto Profil Tersimpan",
                "Foto profil Anda berhasil diperbarui dan tersimpan di database."
            );
        } catch (err) {
            console.error("Save & upload photo error:", err);
            showNotification(
                "error",
                "Gagal Menyimpan",
                "Tidak dapat menyimpan foto profil."
            );
        }
    };

    const handleChoosePhoto = async () => {
        try {
            // WEB: Gunakan input file native browser agar 100% responsif & langsung diconvert ke Base64 Data URL
            if (Platform.OS === "web") {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (event) => {
                    const file = event.target.files && event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (readerEvent) => {
                        const dataUrl = readerEvent.target.result;
                        await saveAndUploadPhoto(dataUrl);
                    };
                    reader.readAsDataURL(file);
                };
                input.click();
                return;
            }

            // MOBILE (iOS / Android): Gunakan ImagePicker
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                showNotification(
                    "error",
                    "Izin Diperlukan",
                    "Izinkan AutoCare mengakses galeri foto."
                );
                return;
            }

            const result =
                await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                    base64: true,
                });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                let finalPhotoUri = asset.uri;

                if (asset.base64) {
                    finalPhotoUri = asset.base64.startsWith("data:")
                        ? asset.base64
                        : `data:image/jpeg;base64,${asset.base64}`;
                }

                await saveAndUploadPhoto(finalPhotoUri);
            }
        } catch (error) {
            console.log(
                "Profile Photo Error:",
                error
            );

            showNotification(
                "error",
                "Gagal",
                "Tidak dapat memilih foto profil."
            );
        }
    };

    // =================================================
    // LOGOUT
    // =================================================

    const handleLogout = async () => {
        try {
            setShowLogoutConfirm(false);

            // Langsung arahkan ke halaman animasi logout.
            // Halaman logout-animation akan menghapus sesi & redirect ke /login.
            router.replace("/logout-animation");
        } catch (error) {
            console.log(
                "Logout Error:",
                error
            );

            setShowLogoutConfirm(false);

            showNotification(
                "error",
                "Logout Gagal",
                "Terjadi kesalahan. Silakan coba lagi."
            );
        }
    };

    // =================================================
    // MENU ITEM
    // =================================================

    const AccountItem = ({
        icon,
        title,
        value,
        onPress,
    }) => {
        return (
            <TouchableOpacity
                style={[
                    styles.menuItem,
                    isDesktop &&
                        styles.menuItemDesktop,
                ]}
                activeOpacity={0.8}
                onPress={onPress}
            >
                <View style={styles.menuIcon}>
                    <Ionicons
                        name={icon}
                        size={21}
                        color={RED}
                    />
                </View>

                <View
                    style={styles.menuContent}
                >
                    <Text
                        style={
                            styles.menuTitle
                        }
                    >
                        {title}
                    </Text>

                    <Text
                        style={
                            styles.menuValue
                        }
                        numberOfLines={1}
                    >
                        {value || "-"}
                    </Text>
                </View>

                <Ionicons
                    name="chevron-forward"
                    size={19}
                    color="#B0B0B0"
                />
            </TouchableOpacity>
        );
    };

    const SettingItem = ({
        icon,
        title,
        description,
        onPress,
    }) => {
        return (
            <TouchableOpacity
                style={[
                    styles.menuItem,
                    isDesktop &&
                        styles.menuItemDesktop,
                ]}
                activeOpacity={0.8}
                onPress={onPress}
            >
                <View style={styles.menuIcon}>
                    <Ionicons
                        name={icon}
                        size={21}
                        color={RED}
                    />
                </View>

                <View
                    style={styles.menuContent}
                >
                    <Text
                        style={
                            styles.menuTitle
                        }
                    >
                        {title}
                    </Text>

                    <Text
                        style={
                            styles.menuDescription
                        }
                        numberOfLines={2}
                    >
                        {description}
                    </Text>
                </View>

                <Ionicons
                    name="chevron-forward"
                    size={19}
                    color="#B0B0B0"
                />
            </TouchableOpacity>
        );
    };

    // =================================================
    // PROFILE CARD
    // =================================================

    const ProfileCard = () => (
        <View
            style={[
                styles.profileCard,
                isDesktop &&
                    styles.profileCardDesktop,
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.profilePhoto,
                    isDesktop &&
                        styles.profilePhotoDesktop,
                ]}
                activeOpacity={0.8}
                onPress={handleChoosePhoto}
            >
                {profilePhoto && !imageError ? (
                    <Image
                        source={{
                            uri: getPhotoUrl(profilePhoto),
                        }}
                        style={
                            styles.profileImage
                        }
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <Text
                        style={
                            styles.profileInitial
                        }
                    >
                        {getInitial()}
                    </Text>
                )}

                <View
                    style={[
                        styles.cameraButton,
                        isDesktop &&
                            styles.cameraButtonDesktop,
                    ]}
                >
                    <Ionicons
                        name="camera"
                        size={15}
                        color="#FFFFFF"
                    />
                </View>
            </TouchableOpacity>

            <Text
                style={[
                    styles.profileName,
                    isDesktop &&
                        styles.profileNameDesktop,
                ]}
                numberOfLines={2}
            >
                {user?.nama ||
                    "Pengguna AutoCare"}
            </Text>

            <Text
                style={[
                    styles.profileEmail,
                    isDesktop &&
                        styles.profileEmailDesktop,
                ]}
                numberOfLines={2}
            >
                {user?.email ||
                    "Email belum tersedia"}
            </Text>

            <View
                style={styles.profileStatus}
            >
                <View
                    style={
                        styles.profileStatusDot
                    }
                />

                <Text
                    style={
                        styles.profileStatusText
                    }
                >
                    Akun Aktif
                </Text>
            </View>

            <TouchableOpacity
                style={[
                    styles.editProfileButton,
                    isDesktop &&
                        styles.editProfileButtonDesktop,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                    router.push(
                        "/edit-profil"
                    )
                }
            >
                <Ionicons
                    name="create-outline"
                    size={18}
                    color="#FFFFFF"
                />

                <Text
                    style={
                        styles.editProfileText
                    }
                >
                    Edit Profil
                </Text>
            </TouchableOpacity>

            <Text
                style={
                    styles.photoHint
                }
            >
                Klik foto untuk mengganti
            </Text>
        </View>
    );

    // =================================================
    // LOGOUT
    // =================================================

    const LogoutButton = () => (
        <TouchableOpacity
            style={[
                styles.logoutButton,
                isDesktop &&
                    styles.logoutButtonDesktop,
            ]}
            activeOpacity={0.8}
            onPress={() =>
                setShowLogoutConfirm(true)
            }
        >
            <Ionicons
                name="log-out-outline"
                size={20}
                color="#C62828"
            />

            <Text
                style={styles.logoutText}
            >
                Logout
            </Text>
        </TouchableOpacity>
    );

    // =================================================
    // RETURN
    // =================================================

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
                            icon="location-outline"
                            title="Lokasi Bengkel"
                            onPress={() => router.push("/lokasi-bengkel")}
                        />
                        <SidebarItem
                            icon="person"
                            title="Profil"
                            active
                            onPress={() => router.replace("/profil")}
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
                                        {getInitial()}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.sidebarUserInfo}>
                                <Text style={styles.sidebarUserName} numberOfLines={1}>
                                    {user?.nama || "Pengguna"}
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
                                <Text style={styles.desktopHeaderTitle}>Profil Pengguna</Text>
                                <Text style={styles.desktopHeaderSubtitle}>
                                    Kelola informasi akun dan pengaturan profil AutoCare Anda
                                </Text>
                            </View>
                        </View>

                        {/* REALTIME CLOCK DESKTOP */}
                        <RealtimeClock isDesktop />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.desktopScrollContent}
                    >
                        <View style={styles.desktopLayout}>
                            {/* LEFT COLUMN */}
                            <View style={styles.leftColumn}>
                                <ProfileCard />
                                <View style={styles.infoCard}>
                                    <View style={styles.infoCardIcon}>
                                        <Ionicons name="shield-checkmark-outline" size={19} color={RED} />
                                    </View>
                                    <View style={styles.infoCardContent}>
                                        <Text style={styles.infoCardTitle}>Data Terlindungi</Text>
                                        <Text style={styles.infoCardText}>
                                            Pastikan informasi akun Anda selalu terbaru untuk memudahkan proses booking servis.
                                        </Text>
                                    </View>
                                </View>
                                <LogoutButton />
                                <Text style={styles.version}>AutoCare v1.0.0</Text>
                            </View>

                            {/* RIGHT COLUMN */}
                            <View style={styles.rightColumn}>
                                <View style={styles.sectionBlock}>
                                    <View style={styles.sectionHeader}>
                                        <View>
                                            <Text style={styles.sectionTitle}>Data Akun</Text>
                                            <Text style={styles.sectionSubtitle}>Informasi pribadi akun AutoCare</Text>
                                        </View>
                                        <View style={styles.sectionBadge}>
                                            <Ionicons name="person-outline" size={15} color={RED} />
                                        </View>
                                    </View>
                                    <View style={styles.menuCard}>
                                        <AccountItem icon="person-outline" title="Nama Lengkap" value={user?.nama} onPress={() => router.push("/edit-profil")} />
                                        <View style={styles.divider} />
                                        <AccountItem icon="mail-outline" title="Email" value={user?.email} onPress={() => router.push("/edit-profil")} />
                                        <View style={styles.divider} />
                                        <AccountItem icon="call-outline" title="Nomor HP" value={user?.no_hp || user?.noHp} onPress={() => router.push("/edit-profil")} />
                                    </View>
                                </View>

                                <View style={styles.sectionBlock}>
                                    <View style={styles.sectionHeader}>
                                        <View>
                                            <Text style={styles.sectionTitle}>Pengaturan</Text>
                                            <Text style={styles.sectionSubtitle}>Keamanan dan preferensi aplikasi</Text>
                                        </View>
                                        <View style={styles.sectionBadge}>
                                            <Ionicons name="settings-outline" size={15} color={RED} />
                                        </View>
                                    </View>
                                    <View style={styles.menuCard}>
                                        <SettingItem icon="lock-closed-outline" title="Keamanan" description="Kelola password dan keamanan akun" onPress={() => router.push("/keamanan")} />
                                        <View style={styles.divider} />
                                        <SettingItem icon="notifications-outline" title="Notifikasi" description="Atur notifikasi AutoCare" onPress={() => router.push("/notifikasi")} />
                                        <View style={styles.divider} />
                                        <SettingItem icon="help-circle-outline" title="Bantuan" description="Pusat bantuan AutoCare" onPress={() => router.push("/bantuan")} />
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={{ height: 60 }} />
                    </ScrollView>
                </View>

                {/* LOGOUT CONFIRM MODAL */}
                {showLogoutConfirm && (
                    <View style={styles.modalOverlay}>
                        <View style={[styles.logoutModal, styles.logoutModalDesktop]}>
                            <View style={styles.logoutModalIcon}>
                                <Ionicons name="log-out-outline" size={30} color="#C62828" />
                            </View>
                            <Text style={styles.logoutModalTitle}>Yakin ingin keluar?</Text>
                            <Text style={styles.logoutModalMessage}>
                                Apakah kamu yakin ingin keluar dari akun AutoCare?
                            </Text>
                            <View style={styles.logoutModalButtons}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLogoutConfirm(false)}>
                                    <Text style={styles.cancelButtonText}>Batal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmLogoutButton} onPress={handleLogout}>
                                    <Text style={styles.confirmLogoutText}>Ya, Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* NOTIFICATION */}
                {notification && (
                    <View style={[styles.notificationContainer, styles.notificationContainerDesktop]}>
                        <View style={[styles.notification, notification.type === "success" ? styles.notificationSuccess : styles.notificationError]}>
                            <View style={styles.notificationIcon}>
                                <Ionicons name={notification.type === "success" ? "checkmark" : "close"} size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.notificationContent}>
                                <Text style={styles.notificationTitle}>{notification.title}</Text>
                                <Text style={styles.notificationMessage}>{notification.message}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    }

    // =================================================
    // MOBILE RETURN
    // =================================================

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={["top", "bottom"]}
        >
            {/* =================================================
                NOTIFICATION
            ================================================= */}

            {notification && (
                <View
                    style={[
                        styles.notificationContainer,
                        isDesktop &&
                            styles.notificationContainerDesktop,
                    ]}
                >
                    <View
                        style={[
                            styles.notification,
                            notification.type ===
                            "success"
                                ? styles.notificationSuccess
                                : styles.notificationError,
                        ]}
                    >
                        <View
                            style={
                                styles.notificationIcon
                            }
                        >
                            <Ionicons
                                name={
                                    notification.type ===
                                    "success"
                                        ? "checkmark"
                                        : "close"
                                }
                                size={20}
                                color="#FFFFFF"
                            />
                        </View>

                        <View
                            style={
                                styles.notificationContent
                            }
                        >
                            <Text
                                style={
                                    styles.notificationTitle
                                }
                            >
                                {
                                    notification.title
                                }
                            </Text>

                            <Text
                                style={
                                    styles.notificationMessage
                                }
                            >
                                {
                                    notification.message
                                }
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* =================================================
                LOGOUT MODAL
            ================================================= */}

            {showLogoutConfirm && (
                <View
                    style={
                        styles.modalOverlay
                    }
                >
                    <View
                        style={[
                            styles.logoutModal,
                            isDesktop &&
                                styles.logoutModalDesktop,
                        ]}
                    >
                        <View
                            style={
                                styles.logoutModalIcon
                            }
                        >
                            <Ionicons
                                name="log-out-outline"
                                size={30}
                                color="#C62828"
                            />
                        </View>

                        <Text
                            style={
                                styles.logoutModalTitle
                            }
                        >
                            Yakin ingin keluar?
                        </Text>

                        <Text
                            style={
                                styles.logoutModalMessage
                            }
                        >
                            Apakah kamu yakin ingin
                            keluar dari akun AutoCare?
                        </Text>

                        <View
                            style={
                                styles.logoutModalButtons
                            }
                        >
                            <TouchableOpacity
                                style={
                                    styles.cancelButton
                                }
                                onPress={() =>
                                    setShowLogoutConfirm(
                                        false
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.cancelButtonText
                                    }
                                >
                                    Batal
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={
                                    styles.confirmLogoutButton
                                }
                                onPress={
                                    handleLogout
                                }
                            >
                                <Text
                                    style={
                                        styles.confirmLogoutText
                                    }
                                >
                                    Ya, Logout
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* =================================================
                HEADER
            ================================================= */}

            <View
                style={[
                    styles.header,
                    isDesktop &&
                        styles.headerDesktop,
                ]}
            >
                <View
                    style={
                        styles.headerInner
                    }
                >
                    <TouchableOpacity
                        style={
                            styles.backButton
                        }
                        onPress={() =>
                            safeBack("/home")
                        }
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={22}
                            color="#222222"
                        />
                    </TouchableOpacity>

                    <View
                        style={
                            styles.headerTitleContainer
                        }
                    >
                        <Text
                            style={
                                styles.headerTitle
                            }
                        >
                            Profil
                        </Text>

                        {isDesktop && (
                            <Text
                                style={
                                    styles.headerSubtitle
                                }
                            >
                                Kelola informasi dan
                                pengaturan akun Anda
                            </Text>
                        )}
                    </View>

                    <RealtimeClock compact />
                </View>
            </View>

            {/* =================================================
                CONTENT
            ================================================= */}

            <ScrollView
                showsVerticalScrollIndicator={
                    false
                }
                contentContainerStyle={[
                    styles.content,
                    isDesktop &&
                        styles.contentDesktop,
                ]}
            >
                <View
                    style={[
                        styles.pageContainer,
                        isDesktop &&
                            styles.pageContainerDesktop,
                    ]}
                >
                    {/* =================================================
                        DESKTOP
                    ================================================= */}

                    {isDesktop ? (
                        <View
                            style={
                                styles.desktopLayout
                            }
                        >
                            {/* LEFT */}
                            <View
                                style={
                                    styles.leftColumn
                                }
                            >
                                <ProfileCard />

                                <View
                                    style={
                                        styles.infoCard
                                    }
                                >
                                    <View
                                        style={
                                            styles.infoCardIcon
                                        }
                                    >
                                        <Ionicons
                                            name="shield-checkmark-outline"
                                            size={21}
                                            color={RED}
                                        />
                                    </View>

                                    <View
                                        style={
                                            styles.infoCardContent
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.infoCardTitle
                                            }
                                        >
                                            Akun AutoCare
                                        </Text>

                                        <Text
                                            style={
                                                styles.infoCardText
                                            }
                                        >
                                            Pastikan informasi
                                            akun Anda selalu
                                            terbaru untuk
                                            memudahkan proses
                                            booking servis.
                                        </Text>
                                    </View>
                                </View>

                                <LogoutButton />

                                <Text
                                    style={
                                        styles.version
                                    }
                                >
                                    AutoCare v1.0.0
                                </Text>
                            </View>

                            {/* RIGHT */}
                            <View
                                style={
                                    styles.rightColumn
                                }
                            >
                                {/* DATA AKUN */}

                                <View
                                    style={
                                        styles.sectionBlock
                                    }
                                >
                                    <View
                                        style={
                                            styles.sectionHeader
                                        }
                                    >
                                        <View>
                                            <Text
                                                style={
                                                    styles.sectionTitle
                                                }
                                            >
                                                Data Akun
                                            </Text>

                                            <Text
                                                style={
                                                    styles.sectionSubtitle
                                                }
                                            >
                                                Informasi pribadi
                                                akun AutoCare
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.sectionBadge
                                            }
                                        >
                                            <Ionicons
                                                name="person-outline"
                                                size={15}
                                                color={
                                                    RED
                                                }
                                            />
                                        </View>
                                    </View>

                                    <View
                                        style={
                                            styles.menuCard
                                        }
                                    >
                                        <AccountItem
                                            icon="person-outline"
                                            title="Nama Lengkap"
                                            value={
                                                user?.nama
                                            }
                                            onPress={() =>
                                                router.push(
                                                    "/edit-profil"
                                                )
                                            }
                                        />

                                        <View
                                            style={
                                                styles.divider
                                            }
                                        />

                                        <AccountItem
                                            icon="mail-outline"
                                            title="Email"
                                            value={
                                                user?.email
                                            }
                                            onPress={() =>
                                                router.push(
                                                    "/edit-profil"
                                                )
                                            }
                                        />

                                        <View
                                            style={
                                                styles.divider
                                            }
                                        />

                                        <AccountItem
                                            icon="call-outline"
                                            title="Nomor HP"
                                            value={
                                                user?.no_hp ||
                                                user?.noHp
                                            }
                                            onPress={() =>
                                                router.push(
                                                    "/edit-profil"
                                                )
                                            }
                                        />
                                    </View>
                                </View>

                                {/* PENGATURAN */}

                                <View
                                    style={
                                        styles.sectionBlock
                                    }
                                >
                                    <View
                                        style={
                                            styles.sectionHeader
                                        }
                                    >
                                        <View>
                                            <Text
                                                style={
                                                    styles.sectionTitle
                                                }
                                            >
                                                Pengaturan
                                            </Text>

                                            <Text
                                                style={
                                                    styles.sectionSubtitle
                                                }
                                            >
                                                Kelola keamanan
                                                dan preferensi
                                                aplikasi
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.sectionBadge
                                            }
                                        >
                                            <Ionicons
                                                name="settings-outline"
                                                size={16}
                                                color={
                                                    RED
                                                }
                                            />
                                        </View>
                                    </View>

                                    <View
                                        style={
                                            styles.menuCard
                                        }
                                    >
                                        <SettingItem
                                            icon="lock-closed-outline"
                                            title="Keamanan"
                                            description="Kelola password dan keamanan akun"
                                            onPress={() =>
                                                router.push(
                                                    "/keamanan"
                                                )
                                            }
                                        />

                                        <View
                                            style={
                                                styles.divider
                                            }
                                        />

                                        <SettingItem
                                            icon="notifications-outline"
                                            title="Notifikasi"
                                            description="Atur notifikasi AutoCare"
                                            onPress={() =>
                                                router.push(
                                                    "/notifikasi"
                                                )
                                            }
                                        />

                                        <View
                                            style={
                                                styles.divider
                                            }
                                        />

                                        <SettingItem
                                            icon="help-circle-outline"
                                            title="Bantuan"
                                            description="Pusat bantuan AutoCare"
                                            onPress={() =>
                                                router.push(
                                                    "/bantuan"
                                                )
                                            }
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* =================================================
                           MOBILE
                        ================================================= */

                        <>
                            <ProfileCard />

                            <Text
                                style={
                                    styles.mobileSectionTitle
                                }
                            >
                                Data Akun
                            </Text>

                            <View
                                style={
                                    styles.menuCard
                                }
                            >
                                <AccountItem
                                    icon="person-outline"
                                    title="Nama Lengkap"
                                    value={
                                        user?.nama
                                    }
                                    onPress={() =>
                                        router.push(
                                            "/edit-profil"
                                        )
                                    }
                                />

                                <View
                                    style={
                                        styles.divider
                                    }
                                />

                                <AccountItem
                                    icon="mail-outline"
                                    title="Email"
                                    value={
                                        user?.email
                                    }
                                    onPress={() =>
                                        router.push(
                                            "/edit-profil"
                                        )
                                    }
                                />

                                <View
                                    style={
                                        styles.divider
                                    }
                                />

                                <AccountItem
                                    icon="call-outline"
                                    title="Nomor HP"
                                    value={
                                        user?.no_hp ||
                                        user?.noHp
                                    }
                                    onPress={() =>
                                        router.push(
                                            "/edit-profil"
                                        )
                                    }
                                />
                            </View>

                            <Text
                                style={
                                    styles.mobileSectionTitle
                                }
                            >
                                Pengaturan
                            </Text>

                            <View
                                style={
                                    styles.menuCard
                                }
                            >
                                <SettingItem
                                    icon="lock-closed-outline"
                                    title="Keamanan"
                                    description="Kelola password dan keamanan akun"
                                    onPress={() =>
                                        router.push(
                                            "/keamanan"
                                        )
                                    }
                                />

                                <View
                                    style={
                                        styles.divider
                                    }
                                />

                                <SettingItem
                                    icon="notifications-outline"
                                    title="Notifikasi"
                                    description="Atur notifikasi AutoCare"
                                    onPress={() =>
                                        router.push(
                                            "/notifikasi"
                                        )
                                    }
                                />

                                <View
                                    style={
                                        styles.divider
                                    }
                                />

                                <SettingItem
                                    icon="help-circle-outline"
                                    title="Bantuan"
                                    description="Pusat bantuan AutoCare"
                                    onPress={() =>
                                        router.push(
                                            "/bantuan"
                                        )
                                    }
                                />
                            </View>

                            <LogoutButton />

                            <Text
                                style={
                                    styles.version
                                }
                            >
                                AutoCare v1.0.0
                            </Text>

                            <View
                                style={{
                                    height: 40,
                                }}
                            />
                        </>
                    )}
                </View>
            </ScrollView>

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
                    icon="calendar-outline"
                    title="Booking"
                    onPress={() => router.replace("/booking")}
                />
                <MobileNav
                    icon="person"
                    title="Profil"
                    active
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

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F6F7F9",
    },

    // =================================================
    // HEADER
    // =================================================

    header: {
        height: 66,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#ECECEC",
    },

    headerDesktop: {
        height: 82,
    },

    headerInner: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        maxWidth: 1180,
        alignSelf: "center",
        paddingHorizontal: 20,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "#F7F7F7",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 13,
    },

    headerTitleContainer: {
        flex: 1,
    },

    headerTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: "#222222",
    },

    headerSubtitle: {
        marginTop: 3,
        fontSize: 11,
        color: "#888888",
    },

    headerRight: {
        alignItems: "center",
        justifyContent: "center",
    },

    headerIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: RED_LIGHT,
        justifyContent: "center",
        alignItems: "center",
    },

    // =================================================
    // CONTENT
    // =================================================

    content: {
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 30,
    },

    contentDesktop: {
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 50,
    },

    pageContainer: {
        width: "100%",
    },

    pageContainerDesktop: {
        maxWidth: 1180,
        alignSelf: "center",
    },

    // =================================================
    // DESKTOP LAYOUT
    // =================================================

    desktopLayout: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 24,
    },

    leftColumn: {
        width: 340,
    },

    rightColumn: {
        flex: 1,
        minWidth: 0,
    },

    // =================================================
    // PROFILE CARD
    // =================================================

    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EAEAEA",
        marginBottom: 20,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 7,
        elevation: 2,
    },

    profileCardDesktop: {
        padding: 28,
        borderRadius: 20,
        marginBottom: 18,
    },

    profilePhoto: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: RED,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "visible",
        marginBottom: 12,
    },

    profilePhotoDesktop: {
        width: 104,
        height: 104,
        borderRadius: 52,
        marginBottom: 16,
    },

    profileImage: {
        width: "100%",
        height: "100%",
        borderRadius: 100,
    },

    profileInitial: {
        color: "#FFFFFF",
        fontSize: 34,
        fontWeight: "800",
    },

    cameraButton: {
        position: "absolute",
        right: -3,
        bottom: -3,
        width: 29,
        height: 29,
        borderRadius: 15,
        backgroundColor: RED_DARK,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#FFFFFF",
    },

    cameraButtonDesktop: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },

    profileName: {
        fontSize: 18,
        fontWeight: "800",
        color: "#222222",
        textAlign: "center",
        marginBottom: 4,
    },

    profileNameDesktop: {
        fontSize: 21,
    },

    profileEmail: {
        fontSize: 12,
        color: "#777777",
        textAlign: "center",
    },

    profileEmailDesktop: {
        fontSize: 13,
    },

    profileStatus: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: "#F0FAF4",
    },

    profileStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#18A558",
        marginRight: 6,
    },

    profileStatusText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#18A558",
    },

    editProfileButton: {
        height: 44,
        width: "100%",
        borderRadius: 12,
        backgroundColor: RED,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 18,
    },

    editProfileButtonDesktop: {
        height: 46,
        marginTop: 20,
    },

    editProfileText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
        marginLeft: 7,
    },

    photoHint: {
        marginTop: 9,
        fontSize: 9.5,
        color: "#AAAAAA",
    },

    // =================================================
    // INFO CARD DESKTOP
    // =================================================

    infoCard: {
        backgroundColor: RED_SOFT,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: "#F2D8D8",
        padding: 16,
        flexDirection: "row",
        marginBottom: 14,
    },

    infoCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 11,
    },

    infoCardContent: {
        flex: 1,
    },

    infoCardTitle: {
        fontSize: 12,
        fontWeight: "800",
        color: "#333333",
        marginBottom: 4,
    },

    infoCardText: {
        fontSize: 10,
        lineHeight: 15,
        color: "#777777",
    },

    // =================================================
    // SECTION
    // =================================================

    sectionBlock: {
        marginBottom: 25,
    },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 11,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#222222",
    },

    sectionSubtitle: {
        fontSize: 10.5,
        color: "#888888",
        marginTop: 4,
    },

    sectionBadge: {
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: RED_LIGHT,
        justifyContent: "center",
        alignItems: "center",
    },

    mobileSectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#222222",
        marginBottom: 10,
    },

    // =================================================
    // MENU CARD
    // =================================================

    menuCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        marginBottom: 20,
        overflow: "hidden",

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.035,
        shadowRadius: 6,
        elevation: 2,
    },

    menuItem: {
        minHeight: 70,
        paddingHorizontal: 14,
        paddingVertical: 11,
        flexDirection: "row",
        alignItems: "center",
    },

    menuItemDesktop: {
        minHeight: 78,
        paddingHorizontal: 18,
    },

    menuIcon: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor: RED_LIGHT,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    menuContent: {
        flex: 1,
        paddingRight: 8,
    },

    menuTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#333333",
        marginBottom: 3,
    },

    menuValue: {
        fontSize: 12,
        color: "#777777",
    },

    menuDescription: {
        fontSize: 10.5,
        color: "#888888",
        lineHeight: 16,
    },

    divider: {
        height: 1,
        backgroundColor: "#EEEEEE",
        marginLeft: 69,
    },

    // =================================================
    // LOGOUT
    // =================================================

    logoutButton: {
        height: 51,
        borderRadius: 15,
        backgroundColor: "#FFF2F2",
        borderWidth: 1,
        borderColor: "#F1D0D0",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        marginTop: 2,
    },

    logoutButtonDesktop: {
        height: 48,
        marginTop: 0,
    },

    logoutText: {
        color: RED,
        fontSize: 13,
        fontWeight: "800",
    },

    // =================================================
    // VERSION
    // =================================================

    version: {
        textAlign: "center",
        fontSize: 10,
        color: "#AAAAAA",
        marginTop: 14,
    },

    // =================================================
    // NOTIFICATION
    // =================================================

    notificationContainer: {
        position: "absolute",
        top: 55,
        left: 20,
        right: 20,
        zIndex: 9999,
    },

    notificationContainerDesktop: {
        left: "50%",
        right: "auto",
        width: 420,
        transform: [
            {
                translateX: -210,
            },
        ],
        top: 25,
    },

    notification: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },

    notificationSuccess: {
        backgroundColor: "#16A34A",
    },

    notificationError: {
        backgroundColor: "#DC2626",
    },

    notificationIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor:
            "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    notificationContent: {
        flex: 1,
    },

    notificationTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 2,
    },

    notificationMessage: {
        color: "#FFFFFF",
        fontSize: 11,
        opacity: 0.9,
    },

    // =================================================
    // LOGOUT MODAL
    // =================================================

    modalOverlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor:
            "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        paddingHorizontal: 25,
    },

    logoutModal: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 25,
        alignItems: "center",

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 12,
    },

    logoutModalDesktop: {
        maxWidth: 400,
        padding: 30,
    },

    logoutModalIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#FDECEC",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },

    logoutModalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#222222",
        marginBottom: 8,
    },

    logoutModalMessage: {
        fontSize: 14,
        color: "#777777",
        textAlign: "center",
        lineHeight: 21,
        marginBottom: 22,
    },

    logoutModalButtons: {
        flexDirection: "row",
        width: "100%",
        gap: 10,
    },

    cancelButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#DDDDDD",
        justifyContent: "center",
        alignItems: "center",
    },

    cancelButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#555555",
    },

    confirmLogoutButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: RED,
        justifyContent: "center",
        alignItems: "center",
    },

    confirmLogoutText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
    },

    // =========================================================
    // DESKTOP SIDEBAR & LAYOUT
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