import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import AdminLayout from "../../components/admin/AdminLayout";
import { adminApi } from "../../services/adminApi";

export default function AdminVehiclesScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const loadVehicles = useCallback(async () => {
        try {
            const params = {};
            if (searchQuery.trim()) params.q = searchQuery.trim();
            const res = await adminApi.getVehicles(params);
            if (res.success) {
                setVehicles(res.data);
            }
        } catch (err) {
            console.error("Failed to load vehicles:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadVehicles();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadVehicles]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadVehicles();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <AdminLayout
            title="Data Kendaraan Pelanggan"
            subtitle="Daftar kendaraan mobil dan motor yang terdaftar di AutoCare"
            onRefresh={handleRefresh}
            refreshing={refreshing}
        >
            <View style={styles.container}>
                {/* SEARCH BAR */}
                <View style={styles.topBar}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Cari plat nomor, tipe, merek, atau nama pemilik..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{vehicles.length} Kendaraan</Text>
                    </View>
                </View>

                {/* VEHICLES TABLE */}
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
                        <View style={styles.card}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.table}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.th, { width: 140 }]}>PLAT NOMOR</Text>
                                        <Text style={[styles.th, { width: 180 }]}>KENDARAAN</Text>
                                        <Text style={[styles.th, { width: 160 }]}>PEMILIK</Text>
                                        <Text style={[styles.th, { width: 100 }]}>KILOMETER</Text>
                                        <Text style={[styles.th, { width: 100 }]}>TOTAL SERVIS</Text>
                                        <Text style={[styles.th, { width: 110 }]}>TERDAFTAR</Text>
                                        <Text style={[styles.th, { width: 80, textAlign: "center" }]}>
                                            AKSI
                                        </Text>
                                    </View>

                                    {vehicles.length === 0 ? (
                                        <Text style={styles.emptyText}>Tidak ada data kendaraan ditemukan.</Text>
                                    ) : (
                                        vehicles.map((v) => (
                                            <View key={v.id} style={styles.tableRow}>
                                                <View style={{ width: 140 }}>
                                                    <View style={styles.plateBadge}>
                                                        <Text style={styles.plateText}>{v.nomor_polisi}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ width: 180 }}>
                                                    <Text style={styles.vehicleName} numberOfLines={1}>
                                                        {v.merek} {v.model}
                                                    </Text>
                                                    <Text style={styles.vehicleSub} numberOfLines={1}>
                                                        Tahun {v.tahun || "-"}
                                                    </Text>
                                                </View>
                                                <View style={{ width: 160 }}>
                                                    <Text style={styles.ownerName} numberOfLines={1}>
                                                        {v.nama_pemilik || "-"}
                                                    </Text>
                                                    <Text style={styles.ownerSub} numberOfLines={1}>
                                                        {v.kontak_pemilik || v.email_pemilik || "-"}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.td, { width: 100 }]}>
                                                    {v.kilometer ? `${Number(v.kilometer).toLocaleString("id-ID")} KM` : "-"}
                                                </Text>
                                                <Text style={[styles.tdCenter, { width: 100 }]}>
                                                    {v.total_servis || 0} kali
                                                </Text>
                                                <Text style={[styles.td, { width: 110 }]}>
                                                    {formatDate(v.created_at)}
                                                </Text>
                                                <View style={[styles.actionCell, { width: 80 }]}>
                                                    <TouchableOpacity
                                                        style={styles.iconBtn}
                                                        onPress={() => setSelectedVehicle(v)}
                                                    >
                                                        <Ionicons name="eye-outline" size={17} color="#2563EB" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </ScrollView>
                        </View>
                    </ScrollView>
                )}
            </View>

            {/* DETAIL MODAL */}
            <Modal
                visible={!!selectedVehicle}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedVehicle(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detail Kendaraan</Text>
                            <TouchableOpacity onPress={() => setSelectedVehicle(null)}>
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        {selectedVehicle ? (
                            <View style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Plat Nomor:</Text>
                                    <Text style={[styles.detailVal, { color: "#C8102E" }]}>
                                        {selectedVehicle.nomor_polisi}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Merek & Model:</Text>
                                    <Text style={styles.detailVal}>
                                        {selectedVehicle.merek} {selectedVehicle.model}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Tahun Pembuatan:</Text>
                                    <Text style={styles.detailVal}>{selectedVehicle.tahun || "-"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Kilometer Terakhir:</Text>
                                    <Text style={styles.detailVal}>
                                        {selectedVehicle.kilometer ? `${Number(selectedVehicle.kilometer).toLocaleString("id-ID")} KM` : "-"}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Nama Pemilik:</Text>
                                    <Text style={styles.detailVal}>{selectedVehicle.nama_pemilik || "-"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Kontak Pemilik:</Text>
                                    <Text style={styles.detailVal}>{selectedVehicle.kontak_pemilik || "-"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Email Pemilik:</Text>
                                    <Text style={styles.detailVal}>{selectedVehicle.email_pemilik || "-"}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Total Servis:</Text>
                                    <Text style={styles.detailVal}>{selectedVehicle.total_servis || 0} kali</Text>
                                </View>
                            </View>
                        ) : null}
                    </View>
                </View>
            </Modal>
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
        gap: 12,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 42,
    },
    searchInput: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: "#111827",
    },
    countBadge: {
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    countBadgeText: {
        fontFamily: "Poppins_700Bold",
        color: "#C8102E",
        fontWeight: "700",
        fontSize: 13,
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
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    table: {
        minWidth: 870,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#F9FAFB",
        paddingVertical: 12,
        paddingHorizontal: 16,
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
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    plateBadge: {
        backgroundColor: "#111827",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        alignSelf: "flex-start",
    },
    plateText: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 12,
        letterSpacing: 0.5,
    },
    vehicleName: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    vehicleSub: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
    },
    ownerName: {
        fontFamily: "Poppins_500Medium",
        fontSize: 13,
        fontWeight: "500",
        color: "#111827",
    },
    ownerSub: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
    },
    td: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#374151",
    },
    tdCenter: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        color: "#374151",
        fontWeight: "600",
    },
    actionCell: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    iconBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: "#EFF6FF",
    },
    emptyText: {
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        padding: 30,
        color: "#9CA3AF",
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        maxWidth: 450,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    modalTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    modalBody: {
        padding: 18,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    detailLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 13,
        color: "#6B7280",
    },
    detailVal: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
});
