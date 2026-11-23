import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

export default function AdminHeader({
    title,
    subtitle,
    onToggleSidebar,
    onRefresh,
    refreshing = false,
    adminUser,
}) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View style={styles.header}>
            <View style={styles.leftSection}>
                {isMobile ? (
                    <TouchableOpacity
                        onPress={onToggleSidebar}
                        style={styles.menuButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="menu-outline" size={26} color="#1F2937" />
                    </TouchableOpacity>
                ) : null}
                <View>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
            </View>

            <View style={styles.rightSection}>
                {onRefresh ? (
                    <TouchableOpacity
                        onPress={onRefresh}
                        style={styles.iconButton}
                        disabled={refreshing}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="refresh-outline"
                            size={20}
                            color={refreshing ? "#9CA3AF" : "#4B5563"}
                        />
                    </TouchableOpacity>
                ) : null}

                <View style={styles.profileBadge}>
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>
                            {(adminUser?.nama || "A").charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    {!isMobile ? (
                        <View style={styles.adminMeta}>
                            <Text style={styles.adminName} numberOfLines={1}>
                                {adminUser?.nama || "Admin"}
                            </Text>
                            <Text style={styles.adminRole}>Administrator</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 64,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
    },
    leftSection: {
        flexDirection: "row",
        alignItems: "center",
    },
    menuButton: {
        marginRight: 12,
        padding: 4,
    },
    title: {
        fontFamily: "Poppins_700Bold",
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    subtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    rightSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    profileBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 20,
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#C8102E",
        alignItems: "center",
        justifyContent: "center",
    },
    headerAvatarText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },
    adminMeta: {
        marginLeft: 8,
    },
    adminName: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#1F2937",
        maxWidth: 140,
    },
    adminRole: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 10,
        color: "#C8102E",
        fontWeight: "600",
    },
});
