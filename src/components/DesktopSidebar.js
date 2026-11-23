import React, { useEffect, useState } from "react";
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { getPhotoUrl } from "../utils/photo";

// =========================================================
// MENU CONFIGURATION (STANDAR TERPUSAT)
// =========================================================
const SIDEBAR_MENUS = [
    {
        id: "home",
        title: "Beranda",
        route: "/home",
        activeIcon: "home",
        inactiveIcon: "home-outline",
    },
    {
        id: "kendaraan",
        title: "Kendaraan",
        route: "/kendaraan",
        activeIcon: "car",
        inactiveIcon: "car-outline",
    },
    {
        id: "booking",
        title: "Booking",
        route: "/booking",
        activeIcon: "calendar",
        inactiveIcon: "calendar-outline",
    },
    {
        id: "riwayat-servis",
        title: "Riwayat Service",
        route: "/riwayat-servis",
        activeIcon: "receipt",
        inactiveIcon: "receipt-outline",
    },
    {
        id: "lokasi-bengkel",
        title: "Lokasi Bengkel",
        route: "/lokasi-bengkel",
        activeIcon: "location",
        inactiveIcon: "location-outline",
    },
    {
        id: "profil",
        title: "Profil",
        route: "/profil",
        activeIcon: "person",
        inactiveIcon: "person-outline",
    },
];

// =========================================================
// SIDEBAR ITEM COMPONENT (STANDAR UKURAN, SPACING, HOVER)
// =========================================================
export function SidebarItem({
    icon,
    title,
    active = false,
    onPress,
}) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <TouchableOpacity
            style={[
                styles.sidebarItem,
                active && styles.sidebarItemActive,
                !active && isHovered && styles.sidebarItemHover,
            ]}
            activeOpacity={0.8}
            onPress={onPress}
            // @ts-ignore
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Ionicons
                name={icon}
                size={20}
                color={active ? "#FFFFFF" : isHovered ? "#FFFFFF" : "#D7B4B4"}
            />
            <Text
                style={[
                    styles.sidebarItemText,
                    active && styles.sidebarItemTextActive,
                    !active && isHovered && styles.sidebarItemTextHover,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}

// =========================================================
// MAIN DESKTOP SIDEBAR COMPONENT
// =========================================================
export default function DesktopSidebar({
    activeMenu = "home",
    user: propUser,
    namaUser: propNamaUser,
    profilePhoto: propProfilePhoto,
}) {
    const [storedUser, setStoredUser] = useState(null);
    const [imageError, setImageError] = useState(false);

    // Muat session user jika tidak dipass via props
    useEffect(() => {
        let isMounted = true;
        const loadUser = async () => {
            try {
                const data = await AsyncStorage.getItem("autocare_user");
                if (data && isMounted) {
                    setStoredUser(JSON.parse(data));
                }
            } catch (e) {
                // Ignore fallback
            }
        };

        if (!propUser && !propNamaUser) {
            loadUser();
        }

        return () => {
            isMounted = false;
        };
    }, [propUser, propNamaUser]);

    // Normalisasi data pengguna
    const currentUser = propUser || storedUser;
    const finalNama =
        propNamaUser ||
        currentUser?.nama ||
        currentUser?.name ||
        "Pengguna";
    const finalPhoto =
        propProfilePhoto !== undefined
            ? propProfilePhoto
            : currentUser?.foto || currentUser?.profilePhoto || null;

    const initial = finalNama ? finalNama.charAt(0).toUpperCase() : "P";

    const handleNavigate = (route, isAlreadyActive) => {
        if (isAlreadyActive) return;
        router.push(route);
    };

    return (
        <View style={styles.sidebar}>
            {/* 1. BAGIAN BRAND / LOGO (STANDAR & TETAP) */}
            <View>
                <View style={styles.sidebarBrand}>
                    <View style={styles.sidebarLogoBox}>
                        <Image
                            source={require("../../assets/images/autocare-logo.png")}
                            style={styles.sidebarLogo}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.sidebarBrandTitle}>AutoCare</Text>
                    <Text style={styles.sidebarBrandSubtitle}>
                        Vehicle Service
                    </Text>
                </View>

                {/* 2. MENU SIDEBAR */}
                <View style={styles.sidebarMenu}>
                    {SIDEBAR_MENUS.map((menu) => {
                        const isActive =
                            activeMenu === menu.id ||
                            (activeMenu === "beranda" && menu.id === "home") ||
                            (activeMenu === "riwayat" &&
                                menu.id === "riwayat-servis") ||
                            (activeMenu === "lokasi" &&
                                menu.id === "lokasi-bengkel");

                        return (
                            <SidebarItem
                                key={menu.id}
                                icon={
                                    isActive
                                        ? menu.activeIcon
                                        : menu.inactiveIcon
                                }
                                title={menu.title}
                                active={isActive}
                                onPress={() =>
                                    handleNavigate(menu.route, isActive)
                                }
                            />
                        );
                    })}
                </View>
            </View>

            {/* 3. BAGIAN PROFIL PENGGUNA (FOOTER TETAP) */}
            <View style={styles.sidebarBottom}>
                <TouchableOpacity
                    style={styles.sidebarUser}
                    activeOpacity={0.85}
                    onPress={() => router.push("/profil")}
                >
                    <View style={styles.sidebarAvatar}>
                        {finalPhoto && !imageError ? (
                            <Image
                                source={{ uri: getPhotoUrl(finalPhoto) }}
                                style={styles.sidebarAvatarImage}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <Text style={styles.sidebarAvatarInitial}>
                                {initial}
                            </Text>
                        )}
                    </View>

                    <View style={styles.sidebarUserInfo}>
                        <Text
                            style={styles.sidebarUserName}
                            numberOfLines={1}
                        >
                            {finalNama}
                        </Text>
                        <Text style={styles.sidebarUserRole}>Pengguna</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.sidebarCopyright}>
                    © 2026 AutoCare
                </Text>
            </View>
        </View>
    );
}

// =========================================================
// DESIGN TOKENS & STYLES (100% STANDAR & IDENTIK)
// =========================================================
const styles = StyleSheet.create({
    sidebar: {
        width: 245,
        backgroundColor: "#4A0404",
        paddingHorizontal: 18,
        paddingTop: 30,
        paddingBottom: 20,
        justifyContent: "space-between",
        height: "100%",
        flexShrink: 0,
    },

    // BRAND / LOGO
    sidebarBrand: {
        alignItems: "center",
        marginBottom: 32,
    },
    sidebarLogoBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        shadowColor: "#000000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    sidebarLogo: {
        width: 46,
        height: 46,
    },
    sidebarBrandTitle: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 0.4,
    },
    sidebarBrandSubtitle: {
        fontFamily: "Poppins_500Medium",
        color: "#E5B4B4",
        fontSize: 11,
        marginTop: 3,
        fontWeight: "500",
    },

    // MENU
    sidebarMenu: {
        width: "100%",
    },
    sidebarItem: {
        height: 48,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        marginBottom: 6,
        backgroundColor: "transparent",
    },
    sidebarItemHover: {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
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
        fontFamily: "Poppins_600SemiBold",
        color: "#D7B4B4",
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 13,
    },
    sidebarItemTextHover: {
        fontFamily: "Poppins_400Regular",
        color: "#FFFFFF",
    },
    sidebarItemTextActive: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontWeight: "800",
    },

    // PROFIL USER FOOTER
    sidebarBottom: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.12)",
        paddingTop: 16,
    },
    sidebarUser: {
        flexDirection: "row",
        alignItems: "center",
    },
    sidebarAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#C8102E",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    sidebarAvatarImage: {
        width: "100%",
        height: "100%",
    },
    sidebarAvatarInitial: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    sidebarUserInfo: {
        flex: 1,
        marginLeft: 10,
    },
    sidebarUserName: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 12.5,
        fontWeight: "800",
    },
    sidebarUserRole: {
        fontFamily: "Poppins_400Regular",
        color: "#CDAAAA",
        fontSize: 10,
        marginTop: 2,
    },
    sidebarCopyright: {
        fontFamily: "Poppins_400Regular",
        color: "#9F7373",
        fontSize: 9,
        textAlign: "center",
        marginTop: 14,
    },
});
