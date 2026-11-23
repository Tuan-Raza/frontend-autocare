import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

/**
 * Komponen Jam Realtime Aktif (detik demi detik)
 * Menampilkan Hari, Tanggal, Bulan, Tahun & Jam:Menit:Detik WIB
 */
export default function RealtimeClock({ isDesktop = false, style, textStyle, compact = false }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const hours = String(currentTime.getHours()).padStart(2, "0");
    const minutes = String(currentTime.getMinutes()).padStart(2, "0");
    const seconds = String(currentTime.getSeconds()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}:${seconds} WIB`;

    const days = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
    ];

    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
    ];

    const dayName = days[currentTime.getDay()];
    const dateNum = currentTime.getDate();
    const monthName = months[currentTime.getMonth()];
    const year = currentTime.getFullYear();
    const dateStr = `${dayName}, ${dateNum} ${monthName} ${year}`;

    if (compact) {
        return (
            <View style={[styles.compactContainer, style]}>
                <Ionicons name="time" size={13} color="#C8102E" />
                <Text style={[styles.compactTime, textStyle]}>
                    {timeStr}
                </Text>
            </View>
        );
    }

    if (isDesktop) {
        return (
            <View style={[styles.desktopContainer, style]}>
                <View style={styles.desktopIconCircle}>
                    <Ionicons name="time-outline" size={18} color="#C8102E" />
                </View>
                <View style={styles.desktopTextWrapper}>
                    <Text style={[styles.desktopTimeText, textStyle]}>
                        {timeStr}
                    </Text>
                    <Text style={styles.desktopDateText}>
                        {dateStr}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.mobileContainer, style]}>
            <View style={styles.mobileLiveDot} />
            <Ionicons name="time-outline" size={12} color="#C8102E" />
            <Text style={[styles.mobileText, textStyle]}>
                {dateStr} • {timeStr}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    desktopContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#F0E4E4",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    desktopIconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#FFF1F2",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    desktopTextWrapper: {
        justifyContent: "center",
    },
    desktopTimeText: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 13,
        fontWeight: "800",
        color: "#181818",
        letterSpacing: 0.3,
    },
    desktopDateText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 10.5,
        color: "#777777",
        marginTop: 1,
        fontWeight: "500",
    },
    mobileContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF5F5",
        borderWidth: 1,
        borderColor: "#FECDD3",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        alignSelf: "flex-start",
        gap: 5,
    },
    mobileLiveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#16A34A",
    },
    mobileText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 10.5,
        color: "#4A0404",
        fontWeight: "600",
    },
    compactContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FFF1F2",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    compactTime: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11,
        fontWeight: "700",
        color: "#C8102E",
    },
});
