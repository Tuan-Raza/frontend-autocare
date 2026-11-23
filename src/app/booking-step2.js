import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { API_URL } from "../config";
import RealtimeClock from "../components/RealtimeClock";

const RED = "#B22222";

export default function BookingStep2() {
    const params = useLocalSearchParams();

    const { width } = useWindowDimensions();

    const isDesktop = width >= 900;
    const isTablet = width >= 600 && width < 900;

    const [user, setUser] = useState(null);
    const [layanan, setLayanan] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // ==========================================
    // LOAD DATA
    // ==========================================
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const userData =
                await AsyncStorage.getItem("autocare_user");

            if (!userData) {
                router.replace("/login");
                return;
            }

            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            const response = await fetch(
                `${API_URL}/api/booking/layanan`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                        "Gagal mengambil data layanan"
                );
            }

            setLayanan(result.data || []);
        } catch (err) {
            console.error(
                "Booking Step 2 Error:",
                err
            );

            setError(
                err.message ||
                    "Terjadi kesalahan saat mengambil data layanan."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // SELECT SERVICE
    // ==========================================
    const toggleService = (item) => {
        setSelectedServices((current) => {
            const exists = current.some(
                (service) => service.id === item.id
            );

            if (exists) {
                return current.filter(
                    (service) => service.id !== item.id
                );
            }

            return [...current, item];
        });
    };

    const isSelected = (id) => {
        return selectedServices.some(
            (service) => service.id === id
        );
    };

    // ==========================================
    // TOTAL
    // ==========================================
    const getTotal = () => {
        return selectedServices.reduce(
            (total, item) =>
                total + Number(item.harga || 0),
            0
        );
    };

    const getTotalDuration = () => {
        return selectedServices.reduce(
            (total, item) =>
                total +
                Number(item.estimasi_menit || 0),
            0
        );
    };

    const formatRupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    // ==========================================
    // NEXT STEP
    // ==========================================
    const handleNext = () => {
        if (selectedServices.length === 0) {
            setError(
                "Silakan pilih minimal satu layanan."
            );
            return;
        }

        setSaving(true);
        setError("");

        const layananData = selectedServices.map(
            (item) => ({
                id: item.id,
                nama_layanan: item.nama_layanan,
                harga: Number(item.harga || 0),
                estimasi_menit: Number(
                    item.estimasi_menit || 0
                ),
                qty: 1,
            })
        );

        router.push({
            pathname: "/booking-step3",

            params: {
                kendaraanId: String(
                    params.kendaraanId || ""
                ),

                merek: String(
                    params.merek || ""
                ),

                model: String(
                    params.model || ""
                ),

                nomorPolisi: String(
                    params.nomorPolisi || ""
                ),

                tahun: String(
                    params.tahun || ""
                ),

                kilometer: String(
                    params.kilometer || "0"
                ),

                layanan:
                    JSON.stringify(layananData),

                totalHarga: String(
                    getTotal()
                ),

                totalDurasi: String(
                    getTotalDuration()
                ),
            },
        });

        setSaving(false);
    };

    // ==========================================
    // BACK
    // ==========================================
    const handleBack = () => {
        safeBack("/booking");
    };

    // ==========================================
    // SERVICE ICON
    // ==========================================
    const getServiceIcon = (nama) => {
        const name =
            nama?.toLowerCase() || "";

        if (name.includes("oli")) {
            return "water";
        }

        if (name.includes("tune")) {
            return "settings";
        }

        if (name.includes("perbaikan")) {
            return "build";
        }

        if (name.includes("ac")) {
            return "snow";
        }

        return "car-sport";
    };

    // ==========================================
    // LOADING
    // ==========================================
    if (loading) {
        return (
            <SafeAreaView
                style={styles.safeArea}
            >
                <View
                    style={
                        styles.loadingContainer
                    }
                >
                    <ActivityIndicator
                        size="large"
                        color={RED}
                    />

                    <Text
                        style={
                            styles.loadingText
                        }
                    >
                        Memuat layanan...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.safeArea}
        >
            <View style={styles.container}>

                {/* =====================================
                    HEADER
                ====================================== */}
                <View
                    style={[
                        styles.header,
                        isDesktop &&
                            styles.headerDesktop,
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#222"
                        />
                    </TouchableOpacity>

                    <View
                        style={[
                            styles.headerCenter,
                            isDesktop &&
                                styles.headerCenterDesktop,
                        ]}
                    >
                        <Text
                            style={[
                                styles.headerTitle,
                                isDesktop &&
                                    styles.headerTitleDesktop,
                            ]}
                        >
                            Pilih Layanan
                        </Text>

                        <Text
                            style={
                                styles.headerSubtitle
                            }
                        >
                            Tentukan layanan untuk
                            kendaraan Anda
                        </Text>
                    </View>

                    <RealtimeClock compact={!isDesktop} isDesktop={isDesktop} />
                </View>

                {/* =====================================
                    STEP INDICATOR
                ====================================== */}
                <View
                    style={[
                        styles.stepContainer,
                        isDesktop &&
                            styles.stepContainerDesktop,
                    ]}
                >
                    {/* STEP 1 */}
                    <View
                        style={styles.stepItem}
                    >
                        <View
                            style={[
                                styles.stepCircle,
                                styles.stepDone,
                            ]}
                        >
                            <Ionicons
                                name="checkmark"
                                size={15}
                                color="#fff"
                            />
                        </View>

                        <Text
                            style={styles.stepText}
                        >
                            Kendaraan
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.stepLine,
                            styles.stepLineActive,
                        ]}
                    />

                    {/* STEP 2 */}
                    <View
                        style={styles.stepItem}
                    >
                        <View
                            style={[
                                styles.stepCircle,
                                styles.stepActive,
                            ]}
                        >
                            <Text
                                style={
                                    styles.stepNumberActive
                                }
                            >
                                2
                            </Text>
                        </View>

                        <Text
                            style={[
                                styles.stepText,
                                styles.stepTextActive,
                            ]}
                        >
                            Layanan
                        </Text>
                    </View>

                    <View
                        style={styles.stepLine}
                    />

                    {/* STEP 3 */}
                    <View
                        style={styles.stepItem}
                    >
                        <View
                            style={styles.stepCircle}
                        >
                            <Text
                                style={
                                    styles.stepNumber
                                }
                            >
                                3
                            </Text>
                        </View>

                        <Text
                            style={styles.stepText}
                        >
                            Jadwal
                        </Text>
                    </View>

                    <View
                        style={styles.stepLine}
                    />

                    {/* STEP 4 */}
                    <View
                        style={styles.stepItem}
                    >
                        <View
                            style={styles.stepCircle}
                        >
                            <Text
                                style={
                                    styles.stepNumber
                                }
                            >
                                4
                            </Text>
                        </View>

                        <Text
                            style={styles.stepText}
                        >
                            Konfirmasi
                        </Text>
                    </View>
                </View>

                {/* =====================================
                    CONTENT
                ====================================== */}
                <ScrollView
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={[
                        styles.scrollContent,
                        isTablet &&
                            styles.scrollContentTablet,
                        isDesktop &&
                            styles.scrollContentDesktop,
                    ]}
                >

                    {/* =================================
                        VEHICLE SUMMARY
                    ================================== */}
                    <View
                        style={[
                            styles.vehicleCard,
                            isDesktop &&
                                styles.vehicleCardDesktop,
                        ]}
                    >
                        <View
                            style={
                                styles.vehicleIcon
                            }
                        >
                            <Ionicons
                                name="car-sport"
                                size={25}
                                color={RED}
                            />
                        </View>

                        <View
                            style={
                                styles.vehicleInfo
                            }
                        >
                            <Text
                                style={
                                    styles.vehicleLabel
                                }
                            >
                                Kendaraan
                            </Text>

                            <Text
                                style={[
                                    styles.vehicleName,
                                    isDesktop &&
                                        styles.vehicleNameDesktop,
                                ]}
                            >
                                {params.merek}{" "}
                                {params.model}
                            </Text>

                            <Text
                                style={
                                    styles.vehiclePlate
                                }
                            >
                                {
                                    params.nomorPolisi
                                }

                                {params.tahun
                                    ? ` • ${params.tahun}`
                                    : ""}
                            </Text>
                        </View>

                        <Ionicons
                            name="checkmark-circle"
                            size={23}
                            color="#2E9D59"
                        />
                    </View>

                    {/* =================================
                        SECTION TITLE
                    ================================== */}
                    <View
                        style={[
                            styles.sectionHeader,
                            isDesktop &&
                                styles.sectionHeaderDesktop,
                        ]}
                    >
                        <View>
                            <Text
                                style={[
                                    styles.sectionTitle,
                                    isDesktop &&
                                        styles.sectionTitleDesktop,
                                ]}
                            >
                                Pilih Layanan
                            </Text>

                            <Text
                                style={
                                    styles.sectionSubtitle
                                }
                            >
                                Anda dapat memilih beberapa
                                layanan
                            </Text>
                        </View>

                        <View
                            style={
                                styles.selectedBadge
                            }
                        >
                            <Text
                                style={
                                    styles.selectedBadgeText
                                }
                            >
                                {
                                    selectedServices.length
                                }{" "}
                                dipilih
                            </Text>
                        </View>
                    </View>

                    {/* =================================
                        ERROR
                    ================================== */}
                    {error ? (
                        <View
                            style={
                                styles.errorBox
                            }
                        >
                            <Ionicons
                                name="alert-circle"
                                size={20}
                                color="#C62828"
                            />

                            <Text
                                style={
                                    styles.errorText
                                }
                            >
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    {/* =================================
                        SERVICE LIST
                    ================================== */}
                    {layanan.length === 0 ? (
                        <View
                            style={
                                styles.emptyContainer
                            }
                        >
                            <Ionicons
                                name="construct-outline"
                                size={50}
                                color="#bbb"
                            />

                            <Text
                                style={
                                    styles.emptyTitle
                                }
                            >
                                Belum ada layanan
                            </Text>

                            <Text
                                style={
                                    styles.emptyText
                                }
                            >
                                Saat ini belum tersedia
                                layanan servis yang dapat
                                dipilih.
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.serviceGrid,
                                (isTablet ||
                                    isDesktop) &&
                                    styles.serviceGridResponsive,
                            ]}
                        >
                            {layanan.map(
                                (item) => {
                                    const selected =
                                        isSelected(
                                            item.id
                                        );

                                    return (
                                        <TouchableOpacity
                                            key={
                                                item.id
                                            }
                                            activeOpacity={
                                                0.85
                                            }
                                            style={[
                                                styles.serviceCard,
                                                (isTablet ||
                                                    isDesktop) &&
                                                    styles.serviceCardResponsive,
                                                selected &&
                                                    styles.serviceCardSelected,
                                            ]}
                                            onPress={() =>
                                                toggleService(
                                                    item
                                                )
                                            }
                                        >

                                            {/* ICON */}
                                            <View
                                                style={[
                                                    styles.serviceIcon,
                                                    selected &&
                                                        styles.serviceIconSelected,
                                                ]}
                                            >
                                                <Ionicons
                                                    name={getServiceIcon(
                                                        item.nama_layanan
                                                    )}
                                                    size={
                                                        25
                                                    }
                                                    color={
                                                        selected
                                                            ? "#fff"
                                                            : RED
                                                    }
                                                />
                                            </View>

                                            {/* INFO */}
                                            <View
                                                style={
                                                    styles.serviceInfo
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.serviceName,
                                                        selected &&
                                                            styles.serviceNameSelected,
                                                    ]}
                                                >
                                                    {
                                                        item.nama_layanan
                                                    }
                                                </Text>

                                                {item.deskripsi ? (
                                                    <Text
                                                        style={
                                                            styles.serviceDescription
                                                        }
                                                        numberOfLines={
                                                            2
                                                        }
                                                    >
                                                        {
                                                            item.deskripsi
                                                        }
                                                    </Text>
                                                ) : null}

                                                <View
                                                    style={
                                                        styles.serviceMeta
                                                    }
                                                >
                                                    <View
                                                        style={
                                                            styles.metaItem
                                                        }
                                                    >
                                                        <Ionicons
                                                            name="time-outline"
                                                            size={
                                                                15
                                                            }
                                                            color="#777"
                                                        />

                                                        <Text
                                                            style={
                                                                styles.metaText
                                                            }
                                                        >
                                                            {item.estimasi_menit ||
                                                                0}{" "}
                                                            menit
                                                        </Text>
                                                    </View>

                                                    <Text
                                                        style={
                                                            styles.servicePrice
                                                        }
                                                    >
                                                        {Number(
                                                            item.harga ||
                                                                0
                                                        ) ===
                                                        0
                                                            ? "Sesuai Kerusakan"
                                                            : formatRupiah(
                                                                  item.harga
                                                              )}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* CHECKBOX */}
                                            <View
                                                style={[
                                                    styles.checkbox,
                                                    selected &&
                                                        styles.checkboxSelected,
                                                ]}
                                            >
                                                {selected && (
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={
                                                            17
                                                        }
                                                        color="#fff"
                                                    />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }
                            )}
                        </View>
                    )}

                    {/* =================================
                        SUMMARY
                    ================================== */}
                    {selectedServices.length >
                        0 && (
                        <View
                            style={[
                                styles.summaryCard,
                                isDesktop &&
                                    styles.summaryCardDesktop,
                            ]}
                        >
                            <View
                                style={
                                    styles.summaryHeader
                                }
                            >
                                <View>
                                    <Text
                                        style={
                                            styles.summaryTitle
                                        }
                                    >
                                        Ringkasan Layanan
                                    </Text>

                                    <Text
                                        style={
                                            styles.summarySubtitle
                                        }
                                    >
                                        {
                                            selectedServices.length
                                        }{" "}
                                        layanan dipilih
                                    </Text>
                                </View>

                                <Ionicons
                                    name="receipt-outline"
                                    size={24}
                                    color={RED}
                                />
                            </View>

                            {selectedServices.map(
                                (item) => (
                                    <View
                                        key={item.id}
                                        style={
                                            styles.summaryRow
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.summaryServiceName
                                            }
                                        >
                                            {
                                                item.nama_layanan
                                            }
                                        </Text>

                                        <Text
                                            style={
                                                styles.summaryServicePrice
                                            }
                                        >
                                            {Number(
                                                item.harga ||
                                                    0
                                            ) === 0
                                                ? "Sesuai kerusakan"
                                                : formatRupiah(
                                                      item.harga
                                                  )}
                                        </Text>
                                    </View>
                                )
                            )}

                            <View
                                style={
                                    styles.divider
                                }
                            />

                            <View
                                style={
                                    styles.totalRow
                                }
                            >
                                <View>
                                    <Text
                                        style={
                                            styles.totalLabel
                                        }
                                    >
                                        Estimasi total
                                    </Text>

                                    <Text
                                        style={
                                            styles.durationText
                                        }
                                    >
                                        ±{" "}
                                        {getTotalDuration()}{" "}
                                        menit
                                    </Text>
                                </View>

                                <Text
                                    style={
                                        styles.totalPrice
                                    }
                                >
                                    {formatRupiah(
                                        getTotal()
                                    )}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View
                        style={{
                            height: 120,
                        }}
                    />
                </ScrollView>

                {/* =====================================
                    BOTTOM ACTION
                ====================================== */}
                <View
                    style={[
                        styles.bottomAction,
                        isDesktop &&
                            styles.bottomActionDesktop,
                    ]}
                >
                    <View
                        style={[
                            styles.bottomActionInner,
                            isDesktop &&
                                styles.bottomActionInnerDesktop,
                        ]}
                    >
                        <View
                            style={
                                styles.bottomInfo
                            }
                        >
                            <Text
                                style={
                                    styles.bottomLabel
                                }
                            >
                                Total layanan
                            </Text>

                            <Text
                                style={
                                    styles.bottomPrice
                                }
                            >
                                {formatRupiah(
                                    getTotal()
                                )}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.nextButton,
                                selectedServices.length ===
                                    0 &&
                                    styles.nextButtonDisabled,
                                isDesktop &&
                                    styles.nextButtonDesktop,
                            ]}
                            disabled={
                                selectedServices.length ===
                                    0 ||
                                saving
                            }
                            onPress={
                                handleNext
                            }
                            activeOpacity={0.85}
                        >
                            {saving ? (
                                <ActivityIndicator
                                    color="#fff"
                                />
                            ) : (
                                <>
                                    <Text
                                        style={
                                            styles.nextButtonText
                                        }
                                    >
                                        Lanjutkan
                                    </Text>

                                    <Ionicons
                                        name="arrow-forward"
                                        size={20}
                                        color="#fff"
                                    />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ==========================================
    // BASIC
    // ==========================================

    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },

    container: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },

    loadingText: {
        fontFamily: "Poppins_400Regular",
        marginTop: 12,
        fontSize: 14,
        color: "#777",
    },

    // ==========================================
    // HEADER
    // ==========================================

    header: {
        height: 76,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },

    headerDesktop: {
        height: 82,
        paddingHorizontal: 30,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
    },

    headerCenter: {
        flex: 1,
        marginLeft: 14,
    },

    headerCenterDesktop: {
        marginLeft: 20,
    },

    headerTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "800",
        color: "#222",
    },

    headerTitleDesktop: {
        fontFamily: "Poppins_400Regular",
        fontSize: 21,
    },

    headerSubtitle: {
        fontFamily: "Poppins_400Regular",
        marginTop: 3,
        fontSize: 11,
        color: "#888",
    },

    headerSpace: {
        width: 42,
    },

    // ==========================================
    // STEP
    // ==========================================

    stepContainer: {
        backgroundColor: "#fff",
        paddingHorizontal: 14,
        paddingVertical: 15,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },

    stepContainerDesktop: {
        paddingHorizontal: 30,
        paddingVertical: 18,
    },

    stepItem: {
        alignItems: "center",
        minWidth: 50,
    },

    stepCircle: {
        width: 27,
        height: 27,
        borderRadius: 14,
        backgroundColor: "#E5E5E5",
        justifyContent: "center",
        alignItems: "center",
    },

    stepActive: {
        backgroundColor: RED,
    },

    stepDone: {
        backgroundColor: RED,
    },

    stepNumber: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12,
        fontWeight: "700",
        color: "#777",
    },

    stepNumberActive: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 12,
        fontWeight: "800",
        color: "#fff",
    },

    stepText: {
        fontFamily: "Poppins_700Bold",
        marginTop: 5,
        fontSize: 9,
        color: "#888",
        fontWeight: "700",
    },

    stepTextActive: {
        fontFamily: "Poppins_800ExtraBold",
        color: RED,
        fontWeight: "900",
    },

    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: "#E5E5E5",
        marginHorizontal: 4,
        marginBottom: 16,
    },

    stepLineActive: {
        backgroundColor: RED,
    },

    // ==========================================
    // SCROLL
    // ==========================================

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 30,
    },

    scrollContentTablet: {
        paddingHorizontal: 28,
        paddingTop: 22,
    },

    scrollContentDesktop: {
        width: "100%",
        maxWidth: 1100,
        alignSelf: "center",
        paddingHorizontal: 30,
        paddingTop: 25,
        paddingBottom: 40,
    },

    // ==========================================
    // VEHICLE
    // ==========================================

    vehicleCard: {
        backgroundColor: "#fff",
        borderRadius: 17,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#eee",
        marginBottom: 20,
    },

    vehicleCardDesktop: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
    },

    vehicleIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "#FFF0F0",
        justifyContent: "center",
        alignItems: "center",
    },

    vehicleInfo: {
        flex: 1,
        marginLeft: 13,
    },

    vehicleLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#999",
        marginBottom: 3,
    },

    vehicleName: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 16,
        fontWeight: "800",
        color: "#222",
    },

    vehicleNameDesktop: {
        fontFamily: "Poppins_400Regular",
        fontSize: 18,
    },

    vehiclePlate: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#777",
        marginTop: 4,
    },

    // ==========================================
    // SECTION HEADER
    // ==========================================

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    sectionHeaderDesktop: {
        marginBottom: 18,
    },

    sectionTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 20,
        fontWeight: "800",
        color: "#222",
    },

    sectionTitleDesktop: {
        fontFamily: "Poppins_400Regular",
        fontSize: 23,
    },

    sectionSubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#888",
        marginTop: 3,
    },

    selectedBadge: {
        backgroundColor: "#FFF0F0",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
    },

    selectedBadgeText: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11,
        color: RED,
        fontWeight: "700",
    },

    // ==========================================
    // ERROR
    // ==========================================

    errorBox: {
        backgroundColor: "#FFF0F0",
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#FFD0D0",
    },

    errorText: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        color: "#C62828",
        lineHeight: 18,
    },

    // ==========================================
    // SERVICE GRID
    // ==========================================

    serviceGrid: {
        width: "100%",
    },

    serviceGridResponsive: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    // ==========================================
    // SERVICE CARD
    // ==========================================

    serviceCard: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 17,
        padding: 14,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },

    serviceCardResponsive: {
        width: "48.7%",
        minHeight: 118,
    },

    serviceCardSelected: {
        borderColor: RED,
        backgroundColor: "#FFF9F9",
    },

    serviceIcon: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: "#FFF0F0",
        justifyContent: "center",
        alignItems: "center",
    },

    serviceIconSelected: {
        backgroundColor: RED,
    },

    serviceInfo: {
        flex: 1,
        marginLeft: 13,
        marginRight: 8,
    },

    serviceName: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 15,
        fontWeight: "800",
        color: "#222",
    },

    serviceNameSelected: {
        color: RED,
    },

    serviceDescription: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#888",
        marginTop: 4,
        lineHeight: 16,
    },

    serviceMeta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },

    metaItem: {
        flexDirection: "row",
        alignItems: "center",
    },

    metaText: {
        fontFamily: "Poppins_400Regular",
        marginLeft: 4,
        fontSize: 11,
        color: "#777",
    },

    servicePrice: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 12,
        fontWeight: "800",
        color: RED,
        textAlign: "right",
    },

    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: "#D5D5D5",
        justifyContent: "center",
        alignItems: "center",
    },

    checkboxSelected: {
        backgroundColor: RED,
        borderColor: RED,
    },

    // ==========================================
    // SUMMARY
    // ==========================================

    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 16,
        marginTop: 7,
        borderWidth: 1,
        borderColor: "#eee",
    },

    summaryCardDesktop: {
        padding: 22,
        borderRadius: 20,
        marginTop: 15,
    },

    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 13,
    },

    summaryTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 15,
        fontWeight: "800",
        color: "#222",
    },

    summarySubtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#888",
        marginTop: 3,
    },

    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 7,
    },

    summaryServiceName: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        fontSize: 12,
        color: "#555",
    },

    summaryServicePrice: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12,
        fontWeight: "700",
        color: "#333",
    },

    divider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 8,
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    totalLabel: {
        fontFamily: "Poppins_700Bold",
        fontSize: 12,
        fontWeight: "700",
        color: "#555",
    },

    durationText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#888",
        marginTop: 3,
    },

    totalPrice: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "900",
        color: RED,
    },

    // ==========================================
    // EMPTY
    // ==========================================

    emptyContainer: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 35,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#eee",
    },

    emptyTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 16,
        fontWeight: "800",
        color: "#333",
        marginTop: 12,
    },

    emptyText: {
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        fontSize: 12,
        color: "#888",
        marginTop: 7,
        lineHeight: 18,
    },

    // ==========================================
    // BOTTOM ACTION
    // ==========================================

    bottomAction: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },

    bottomActionDesktop: {
        paddingHorizontal: 30,
        paddingVertical: 14,
    },

    bottomActionInner: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
    },

    bottomActionInnerDesktop: {
        maxWidth: 1100,
        alignSelf: "center",
    },

    bottomInfo: {
        flex: 1,
    },

    bottomLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#888",
    },

    bottomPrice: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 17,
        fontWeight: "900",
        color: RED,
        marginTop: 2,
    },

    nextButton: {
        minWidth: 145,
        height: 50,
        borderRadius: 15,
        backgroundColor: RED,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
    },

    nextButtonDesktop: {
        minWidth: 180,
        height: 52,
        borderRadius: 14,
    },

    nextButtonDisabled: {
        backgroundColor: "#CFCFCF",
    },

    nextButtonText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#fff",
        fontSize: 14,
        fontWeight: "800",
        marginRight: 9,
    },
});