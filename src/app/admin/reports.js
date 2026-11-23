import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminStatCard from "../../components/admin/AdminStatCard";
import { adminApi } from "../../services/adminApi";

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function AdminReportsScreen() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportData, setReportData] = useState(null);

    const loadReports = useCallback(async () => {
        try {
            const res = await adminApi.getReports(selectedYear);
            if (res.success) {
                setReportData(res.data);
            }
        } catch (err) {
            console.error("Load reports error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadReports();
    };

    const formatCurrency = (amount) => {
        return "Rp " + Number(amount || 0).toLocaleString("id-ID");
    };

    const overall = reportData?.overall || {};

    return (
        <AdminLayout
            title="Laporan & Analitik"
            subtitle="Ringkasan data pendapatan, performa servis, dan evaluasi berkala"
            onRefresh={handleRefresh}
            refreshing={refreshing}
        >
            <View style={styles.container}>
                {/* YEAR SELECTOR */}
                <View style={styles.topBar}>
                    <Text style={styles.topBarTitle}>Periode Tahun</Text>
                    <View style={styles.yearRow}>
                        {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                            <TouchableOpacity
                                key={yr}
                                style={[styles.yearChip, selectedYear === yr && styles.yearChipActive]}
                                onPress={() => setSelectedYear(yr)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.yearChipText,
                                        selectedYear === yr && styles.yearChipTextActive,
                                    ]}
                                >
                                    {yr}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#C8102E" />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollArea}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                        }
                    >
                        {/* OVERALL METRICS */}
                        <View style={styles.statsGrid}>
                            <AdminStatCard
                                title="Grand Total Pendapatan"
                                value={formatCurrency(overall.grand_total_pendapatan)}
                                subtitle="Dari servis yang terselesaikan"
                                icon="cash"
                                iconBg="#D1FAE5"
                                iconColor="#059669"
                            />
                            <AdminStatCard
                                title="Rata-rata Servis"
                                value={formatCurrency(overall.rata_rata_booking)}
                                subtitle="Nilai transaksi per booking"
                                icon="calculator"
                                iconBg="#EFF6FF"
                                iconColor="#2563EB"
                            />
                            <AdminStatCard
                                title="Total Servis Selesai"
                                value={`${overall.grand_total_selesai || 0} Unit`}
                                subtitle="Pekerjaan selesai tuntas"
                                icon="checkmark-done"
                                iconBg="#FEF3C7"
                                iconColor="#D97706"
                            />
                            <AdminStatCard
                                title="Total Dibatalkan"
                                value={`${overall.grand_total_batal || 0} Unit`}
                                subtitle="Pemesanan dibatalkan/ditolak"
                                icon="close-circle"
                                iconBg="#FEE2E2"
                                iconColor="#DC2626"
                            />
                        </View>

                        {/* MONTHLY BREAKDOWN TABLE */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>
                                Rincian Pendapatan Bulanan Tahun {selectedYear}
                            </Text>

                            {(!reportData?.monthly || reportData.monthly.length === 0) ? (
                                <Text style={styles.emptyText}>
                                    Belum ada catatan transaksi pada tahun {selectedYear}.
                                </Text>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.table}>
                                        <View style={styles.tableHeader}>
                                            <Text style={[styles.th, { width: 140 }]}>BULAN</Text>
                                            <Text style={[styles.th, { width: 120 }]}>TOTAL BOOKING</Text>
                                            <Text style={[styles.th, { width: 110 }]}>SELESAI</Text>
                                            <Text style={[styles.th, { width: 110 }]}>BATAL</Text>
                                            <Text style={[styles.th, { width: 160, textAlign: "right" }]}>
                                                TOTAL PENDAPATAN
                                            </Text>
                                        </View>

                                        {reportData.monthly.map((m) => (
                                            <View key={m.bulan} style={styles.tableRow}>
                                                <Text style={[styles.tdBold, { width: 140 }]}>
                                                    {MONTH_NAMES[m.bulan - 1] || `Bulan ${m.bulan}`}
                                                </Text>
                                                <Text style={[styles.td, { width: 120 }]}>
                                                    {m.total_booking} order
                                                </Text>
                                                <Text style={[styles.tdBold, { width: 110, color: "#059669" }]}>
                                                    {m.booking_selesai}
                                                </Text>
                                                <Text style={[styles.tdBold, { width: 110, color: "#DC2626" }]}>
                                                    {m.booking_batal}
                                                </Text>
                                                <Text style={[styles.tdBold, { width: 160, textAlign: "right", color: "#C8102E" }]}>
                                                    {formatCurrency(m.total_pendapatan)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            )}
                        </View>

                        {/* TOP SERVICES PERFORMANCE */}
                        {reportData?.servicesSummary && reportData.servicesSummary.length > 0 ? (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Performa Finansial Tiap Layanan</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.table}>
                                        <View style={styles.tableHeader}>
                                            <Text style={[styles.th, { width: 220 }]}>NAMA LAYANAN</Text>
                                            <Text style={[styles.th, { width: 140 }]}>FREKUENSI ORDER</Text>
                                            <Text style={[styles.th, { width: 160, textAlign: "right" }]}>
                                                TOTAL KONTRIBUSI OMSET
                                            </Text>
                                        </View>

                                        {reportData.servicesSummary.map((s) => (
                                            <View key={s.id} style={styles.tableRow}>
                                                <Text style={[styles.tdBold, { width: 220 }]}>
                                                    {s.nama_layanan}
                                                </Text>
                                                <Text style={[styles.td, { width: 140 }]}>
                                                    {s.total_order} kali dipesan
                                                </Text>
                                                <Text style={[styles.tdBold, { width: 160, textAlign: "right", color: "#059669" }]}>
                                                    {formatCurrency(s.total_omset)}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        ) : null}
                    </ScrollView>
                )}
            </View>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    topBarTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
    },
    yearRow: {
        flexDirection: "row",
        gap: 8,
    },
    yearChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    yearChipActive: {
        backgroundColor: "#C8102E",
        borderColor: "#C8102E",
    },
    yearChipText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#4B5563",
    },
    yearChipTextActive: {
        fontFamily: "Poppins_400Regular",
        color: "#FFFFFF",
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 20,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 20,
    },
    cardTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 14,
    },
    table: {
        minWidth: 640,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#F9FAFB",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    th: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11,
        fontWeight: "700",
        color: "#6B7280",
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    td: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#374151",
    },
    tdBold: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    emptyText: {
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        padding: 30,
        color: "#9CA3AF",
        fontSize: 13,
    },
});
