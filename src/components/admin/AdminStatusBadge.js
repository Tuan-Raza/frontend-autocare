import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AdminStatusBadge({ status, type = "booking" }) {
    const s = String(status || "").toLowerCase().trim();

    let bgColor = "#F3F4F6";
    let textColor = "#4B5563";
    let label = status || "-";

    if (type === "booking") {
        switch (s) {
            case "menunggu":
                bgColor = "#FEF3C7"; // Amber 100
                textColor = "#92400E"; // Amber 800
                label = "Menunggu";
                break;
            case "dikonfirmasi":
                bgColor = "#DBEAFE"; // Blue 100
                textColor = "#1E40AF"; // Blue 800
                label = "Dikonfirmasi";
                break;
            case "diproses":
                bgColor = "#EDE9FE"; // Purple 100
                textColor = "#5B21B6"; // Purple 800
                label = "Diproses";
                break;
            case "selesai":
                bgColor = "#D1FAE5"; // Emerald 100
                textColor = "#065F46"; // Emerald 800
                label = "Selesai";
                break;
            case "dibatalkan":
                bgColor = "#FEE2E2"; // Rose 100
                textColor = "#991B1B"; // Rose 800
                label = "Dibatalkan";
                break;
            default:
                bgColor = "#F3F4F6";
                textColor = "#4B5563";
                label = status;
        }
    } else if (type === "payment") {
        switch (s) {
            case "settlement":
            case "terverifikasi":
            case "diterima":
            case "lunas":
                bgColor = "#D1FAE5";
                textColor = "#065F46";
                label = "Lunas";
                break;
            case "menunggu_verifikasi":
                bgColor = "#FEF3C7";
                textColor = "#92400E";
                label = "Menunggu Verifikasi";
                break;
            case "belum_dibayar":
            case "menunggu_pembayaran":
            case "unpaid":
                bgColor = "#DBEAFE";
                textColor = "#1E40AF";
                label = "Belum Dibayar";
                break;
            case "pending":
                bgColor = "#FEF3C7";
                textColor = "#92400E";
                label = "Pending";
                break;
            case "deny":
            case "ditolak":
            case "cancel":
            case "expire":
                bgColor = "#FEE2E2";
                textColor = "#991B1B";
                label = "Ditolak";
                break;
            default:
                bgColor = "#F3F4F6";
                textColor = "#4B5563";
                label = status;
        }
    } else if (type === "method") {
        switch (s) {
            case "qris":
                bgColor = "#FEE2E2";
                textColor = "#B91C1C";
                label = "QRIS";
                break;
            case "cod":
            case "bayar_di_tempat":
                bgColor = "#DCFCE7";
                textColor = "#166534";
                label = "COD (Tunai)";
                break;
            default:
                bgColor = "#F3F4F6";
                textColor = "#4B5563";
                label = String(status || "-").toUpperCase();
        }
    } else if (type === "status") {
        if (s === "aktif") {
            bgColor = "#D1FAE5";
            textColor = "#065F46";
            label = "Aktif";
        } else {
            bgColor = "#FEE2E2";
            textColor = "#991B1B";
            label = "Nonaktif";
        }
    }

    return (
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: "flex-start",
    },
    badgeText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "capitalize",
    },
});
