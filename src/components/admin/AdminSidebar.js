import Ionicons from "@expo/vector-icons/Ionicons";
import { router, usePathname } from "expo-router";
import React from "react";
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { adminApi } from "../../services/adminApi";

const MENU_ITEMS = [
    {
        name: "Dashboard",
        path: "/admin/dashboard",
        icon: "grid-outline",
        activeIcon: "grid",
    },
    {
        name: "Data Pelanggan",
        path: "/admin/users",
        icon: "people-outline",
        activeIcon: "people",
    },
    {
        name: "Data Kendaraan",
        path: "/admin/vehicles",
        icon: "car-sport-outline",
        activeIcon: "car-sport",
    },
    {
        name: "Booking Servis",
        path: "/admin/bookings",
        icon: "calendar-outline",
        activeIcon: "calendar",
    },
    {
        name: "Riwayat Servis",
        path: "/admin/service-history",
        icon: "time-outline",
        activeIcon: "time",
    },
    {
        name: "Pembayaran",
        path: "/admin/payments",
        icon: "card-outline",
        activeIcon: "card",
    },
    {
        name: "Kelola Layanan",
        path: "/admin/services",
        icon: "construct-outline",
        activeIcon: "construct",
    },
    {
        name: "Laporan & Analitik",
        path: "/admin/reports",
        icon: "stats-chart-outline",
        activeIcon: "stats-chart",
    },
    {
        name: "Pengaturan",
        path: "/admin/settings",
        icon: "settings-outline",
        activeIcon: "settings",
    },
];

export default function AdminSidebar({ adminUser, onClose }) {
    const pathname = usePathname();

    const handleNavigation = (path) => {
        if (onClose) onClose();
        if (pathname !== path) {
            router.push(path);
        }
    };

    const handleLogout = async () => {
        const doLogout = async () => {
            await adminApi.logout();
            router.replace("/login");
        };

        if (Platform.OS === "web") {
            if (window.confirm("Apakah Anda yakin ingin keluar dari Admin Panel?")) {
                await doLogout();
            }
        } else {
            Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
                { text: "Batal", style: "cancel" },
                {
                    text: "Keluar",
                    style: "destructive",
                    onPress: doLogout,
                },
            ]);
        }
    };

    return (
        <View style={styles.sidebar}>
            {/* BRAND HEADER */}
            <View style={styles.brandContainer}>
                <Image
                    source={require("../../../assets/images/autocare-logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <View style={styles.brandTextWrapper}>
                    <Text style={styles.brandTitle}>AutoCare</Text>
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>ADMIN PANEL</Text>
                    </View>
                </View>
                {onClose ? (
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={22} color="#6B7280" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* NAVIGATION MENU */}
            <ScrollView
                style={styles.menuContainer}
                contentContainerStyle={styles.menuContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionHeader}>MENU UTAMA</Text>
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
                    return (
                        <TouchableOpacity
                            key={item.path}
                            style={[styles.menuItem, isActive && styles.menuItemActive]}
                            onPress={() => handleNavigation(item.path)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isActive ? item.activeIcon : item.icon}
                                size={20}
                                color={isActive ? "#C8102E" : "#6B7280"}
                                style={styles.menuIcon}
                            />
                            <Text
                                style={[
                                    styles.menuLabel,
                                    isActive && styles.menuLabelActive,
                                ]}
                            >
                                {item.name}
                            </Text>
                            {isActive ? <View style={styles.activeIndicator} /> : null}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* USER & LOGOUT SECTION */}
            <View style={styles.footerSection}>
                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {(adminUser?.nama || "A").charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {adminUser?.nama || "Administrator"}
                        </Text>
                        <Text style={styles.userRole} numberOfLines={1}>
                            {adminUser?.email || "admin@autocare.com"}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    <Text style={styles.logoutText}>Keluar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sidebar: {
        width: 260,
        backgroundColor: "#FFFFFF",
        borderRightWidth: 1,
        borderRightColor: "#E5E7EB",
        flexDirection: "column",
        height: "100%",
    },
    brandContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    logo: {
        width: 38,
        height: 38,
        marginRight: 10,
    },
    brandTextWrapper: {
        flex: 1,
    },
    brandTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 17,
        fontWeight: "800",
        color: "#4A0404",
        letterSpacing: 0.5,
    },
    adminBadge: {
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: "flex-start",
        marginTop: 2,
    },
    adminBadgeText: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 9,
        fontWeight: "800",
        color: "#C8102E",
        letterSpacing: 0.5,
    },
    closeBtn: {
        padding: 4,
    },
    menuContainer: {
        flex: 1,
    },
    menuContent: {
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    sectionHeader: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11,
        fontWeight: "700",
        color: "#9CA3AF",
        letterSpacing: 0.8,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginBottom: 4,
        position: "relative",
    },
    menuItemActive: {
        backgroundColor: "#FEF2F2",
    },
    menuIcon: {
        marginRight: 12,
    },
    menuLabel: {
        fontFamily: "Poppins_500Medium",
        fontSize: 14,
        fontWeight: "500",
        color: "#4B5563",
        flex: 1,
    },
    menuLabelActive: {
        fontFamily: "Poppins_700Bold",
        color: "#C8102E",
        fontWeight: "700",
    },
    activeIndicator: {
        position: "absolute",
        right: 0,
        top: 6,
        bottom: 6,
        width: 3,
        backgroundColor: "#C8102E",
        borderRadius: 2,
    },
    footerSection: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        backgroundColor: "#F9FAFB",
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#C8102E",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    avatarText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 15,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#1F2937",
    },
    userRole: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#6B7280",
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#FCA5A5",
        paddingVertical: 8,
        borderRadius: 6,
    },
    logoutText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#EF4444",
        marginLeft: 6,
    },
});
