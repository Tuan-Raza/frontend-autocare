import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AdminStatCard({
    title,
    value,
    subtitle,
    icon,
    iconBg = "#FEE2E2",
    iconColor = "#C8102E",
}) {
    return (
        <View style={styles.card}>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.value} numberOfLines={1}>{value}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {icon ? (
                <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon} size={22} color={iconColor} />
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
        flex: 1,
        minWidth: 160,
    },
    content: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontFamily: "Poppins_500Medium",
        fontSize: 13,
        fontWeight: "500",
        color: "#6B7280",
        marginBottom: 4,
    },
    value: {
        fontFamily: "Poppins_700Bold",
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
    },
    subtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#9CA3AF",
        marginTop: 4,
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
});
