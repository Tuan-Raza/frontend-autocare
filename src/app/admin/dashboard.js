import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminStatCard from "../../components/admin/AdminStatCard";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { adminApi } from "../../services/adminApi";

export default function AdminDashboardScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);

    const loadData = useCallback(async () => {
        try {
            const res = await adminApi.getDashboard();
            if (res.success) {
                setDashboardData(res.data);
            }
        } catch (err) {
            console.error("Failed to load dashboard:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const formatCurrency = (amount) => {
        return "Rp " + Number(amount || 0).toLocaleString("id-ID");
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <AdminLayout
            title="Dashboard Overview"
            subtitle="Ringkasan data real-time operasional servis AutoCare"
            onRefresh={handleRefresh}
            refreshing={refreshing}
        >
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#C8102E" />
                    <Text style={styles.loadingText}>Memuat statistik dashboard...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* TOP STATS CARDS */}
                    <View style={styles.statsGrid}>
                        <AdminStatCard
                            title="Total Pelanggan"
                            value={dashboardData?.totalUsers || 0}
                            subtitle="Pengguna terdaftar"
                            icon="people"
                            iconBg="#EFF6FF"
                            iconColor="#2563EB"
                        />
                        <AdminStatCard
                            title="Total Kendaraan"
                            value={dashboardData?.totalVehicles || 0}
                            subtitle="Mobil & motor terdaftar"
                            icon="car-sport"
                            iconBg="#F0FDF4"
                            iconColor="#16A34A"
                        />
                        <AdminStatCard
                            title="Total Booking"
                            value={dashboardData?.totalBookings || 0}
                            subtitle="Semua transaksi servis"
                            icon="calendar"
                            iconBg="#FEF3C7"
                            iconColor="#D97706"
                        />
                        <AdminStatCard
                            title="Total Pendapatan"
                            value={formatCurrency(dashboardData?.totalRevenue)}
                            subtitle="Servis berhasil diselesaikan"
                            icon="wallet"
                            iconBg="#FEE2E2"
                            iconColor="#C8102E"
                        />
                    </View>

                    {/* BOOKING STATUS SUMMARY */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Status Booking Servis</Text>
                        <View style={styles.statusRow}>
                            <TouchableOpacity
                                style={styles.statusBox}
                                onPress={() => router.push("/admin/bookings?status=menunggu")}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.statusCount, { color: "#D97706" }]}>
                                    {dashboardData?.bookingStatus?.menunggu || 0}
                                </Text>
                                <Text style={styles.statusLabel}>Menunggu</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statusBox}
                                onPress={() => router.push("/admin/bookings?status=dikonfirmasi")}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.statusCount, { color: "#2563EB" }]}>
                                    {dashboardData?.bookingStatus?.dikonfirmasi || 0}
                                </Text>
                                <Text style={styles.statusLabel}>Dikonfirmasi</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statusBox}
                                onPress={() => router.push("/admin/bookings?status=diproses")}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.statusCount, { color: "#7C3AED" }]}>
                                    {dashboardData?.bookingStatus?.diproses || 0}
                                </Text>
                                <Text style={styles.statusLabel}>Diproses</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statusBox}
                                onPress={() => router.push("/admin/bookings?status=selesai")}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.statusCount, { color: "#059669" }]}>
                                    {dashboardData?.bookingStatus?.selesai || 0}
                                </Text>
                                <Text style={styles.statusLabel}>Selesai</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.statusBox}
                                onPress={() => router.push("/admin/bookings?status=dibatalkan")}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.statusCount, { color: "#DC2626" }]}>
                                    {dashboardData?.bookingStatus?.dibatalkan || 0}
                                </Text>
                                <Text style={styles.statusLabel}>Dibatalkan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* QUICK ACTIONS */}
                    <View style={styles.quickActionsCard}>
                        <Text style={styles.cardTitle}>Aksi Cepat</Text>
                        <View style={styles.actionGrid}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => router.push("/admin/bookings")}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#C8102E" />
                                <Text style={styles.actionBtnText}>Kelola Booking</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => router.push("/admin/services")}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add-circle-outline" size={20} color="#C8102E" />
                                <Text style={styles.actionBtnText}>Tambah Layanan</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => router.push("/admin/payments")}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="card-outline" size={20} color="#C8102E" />
                                <Text style={styles.actionBtnText}>Verifikasi Pembayaran</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => router.push("/admin/reports")}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="document-text-outline" size={20} color="#C8102E" />
                                <Text style={styles.actionBtnText}>Lihat Laporan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* RECENT BOOKINGS TABLE */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>10 Booking Terbaru</Text>
                            <TouchableOpacity
                                onPress={() => router.push("/admin/bookings")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.viewAllText}>Lihat Semua Booking →</Text>
                            </TouchableOpacity>
                        </View>

                        {(!dashboardData?.recentBookings || dashboardData.recentBookings.length === 0) ? (
                            <Text style={styles.emptyText}>Belum ada data booking terbaru.</Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.table}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.th, { width: 130 }]}>KODE</Text>
                                        <Text style={[styles.th, { width: 140 }]}>PELANGGAN</Text>
                                        <Text style={[styles.th, { width: 140 }]}>KENDARAAN</Text>
                                        <Text style={[styles.th, { width: 110 }]}>TANGGAL</Text>
                                        <Text style={[styles.th, { width: 120 }]}>BIAYA</Text>
                                        <Text style={[styles.th, { width: 120 }]}>STATUS</Text>
                                    </View>
                                    {dashboardData.recentBookings.map((b) => (
                                        <TouchableOpacity
                                            key={b.id}
                                            style={styles.tableRow}
                                            onPress={() => router.push("/admin/bookings")}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.td, styles.codeText, { width: 130 }]}>
                                                #{b.kode_booking}
                                            </Text>
                                            <View style={{ width: 140 }}>
                                                <Text style={styles.tdBold} numberOfLines={1}>
                                                    {b.nama_pelanggan || "Tamu"}
                                                </Text>
                                                <Text style={styles.tdSub} numberOfLines={1}>
                                                    {b.kontak_pelanggan || "-"}
                                                </Text>
                                            </View>
                                            <View style={{ width: 140 }}>
                                                <Text style={styles.tdBold} numberOfLines={1}>
                                                    {b.merek} {b.model}
                                                </Text>
                                                <Text style={styles.tdSub} numberOfLines={1}>
                                                    {b.nomor_polisi}
                                                </Text>
                                            </View>
                                            <Text style={[styles.td, { width: 110 }]}>
                                                {formatDate(b.tanggal_booking)}
                                            </Text>
                                            <Text style={[styles.tdBold, { width: 120, color: "#111827" }]}>
                                                {formatCurrency(b.total_harga)}
                                            </Text>
                                            <View style={{ width: 120 }}>
                                                <AdminStatusBadge status={b.status} type="booking" />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        )}
                    </View>

                    {/* POPULAR SERVICES */}
                    {dashboardData?.topServices && dashboardData.topServices.length > 0 ? (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Layanan Paling Banyak Dipesan</Text>
                            <View style={styles.popularList}>
                                {dashboardData.topServices.map((svc, index) => (
                                    <View key={svc.id} style={styles.popularItem}>
                                        <View style={styles.rankBadge}>
                                            <Text style={styles.rankText}>#{index + 1}</Text>
                                        </View>
                                        <View style={styles.popularInfo}>
                                            <Text style={styles.popularName}>{svc.nama_layanan}</Text>
                                            <Text style={styles.popularPrice}>
                                                {formatCurrency(svc.harga)}
                                            </Text>
                                        </View>
                                        <View style={styles.popularStats}>
                                            <Text style={styles.popularCount}>
                                                {svc.jumlah_dipesan} kali
                                            </Text>
                                            <Text style={styles.popularSub}>dipesan</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}
                </ScrollView>
            )}
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
    },
    loadingText: {
        fontFamily: "Poppins_400Regular",
        marginTop: 12,
        color: "#6B7280",
        fontSize: 14,
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    cardHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    cardTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 14,
    },
    viewAllText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#C8102E",
        fontWeight: "600",
    },
    statusRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statusBox: {
        flex: 1,
        minWidth: 100,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        padding: 14,
        alignItems: "center",
    },
    statusCount: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 4,
    },
    statusLabel: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,
        color: "#4B5563",
        fontWeight: "600",
    },
    quickActionsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 20,
    },
    actionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    actionBtnText: {
        fontFamily: "Poppins_600SemiBold",
        marginLeft: 8,
        fontSize: 13,
        fontWeight: "600",
        color: "#C8102E",
    },
    table: {
        minWidth: 760,
    },
    tableHeader: {
        flexDirection: "row",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 8,
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
        paddingHorizontal: 8,
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
    tdSub: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
    },
    codeText: {
        fontFamily: "Poppins_700Bold",
        fontWeight: "700",
        color: "#C8102E",
    },
    emptyText: {
        fontFamily: "Poppins_400Regular",
        color: "#9CA3AF",
        fontSize: 13,
        textAlign: "center",
        paddingVertical: 20,
    },
    popularList: {
        gap: 10,
    },
    popularItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#FEE2E2",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    rankText: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 12,
        fontWeight: "800",
        color: "#C8102E",
    },
    popularInfo: {
        flex: 1,
    },
    popularName: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    popularPrice: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    popularStats: {
        alignItems: "flex-end",
    },
    popularCount: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        fontWeight: "700",
        color: "#C8102E",
    },
    popularSub: {
        fontFamily: "Poppins_400Regular",
        fontSize: 10,
        color: "#9CA3AF",
    },
});
