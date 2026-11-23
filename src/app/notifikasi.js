import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RED = "#B22222";

export default function Notifikasi() {
    const [loading, setLoading] = useState(true);

    const [notifikasiUmum, setNotifikasiUmum] = useState(true);
    const [pengingatServis, setPengingatServis] = useState(true);
    const [statusBooking, setStatusBooking] = useState(true);
    const [promo, setPromo] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings =
                await AsyncStorage.getItem("autocare_notification_settings");

            if (savedSettings) {
                const data = JSON.parse(savedSettings);

                setNotifikasiUmum(
                    data.notifikasiUmum ?? true
                );

                setPengingatServis(
                    data.pengingatServis ?? true
                );

                setStatusBooking(
                    data.statusBooking ?? true
                );

                setPromo(
                    data.promo ?? false
                );
            }
        } catch (error) {
            console.log(
                "Load Notification Settings Error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (key, value) => {
        try {
            const savedSettings =
                await AsyncStorage.getItem(
                    "autocare_notification_settings"
                );

            const currentSettings = savedSettings
                ? JSON.parse(savedSettings)
                : {
                      notifikasiUmum: true,
                      pengingatServis: true,
                      statusBooking: true,
                      promo: false,
                  };

            const updatedSettings = {
                ...currentSettings,
                [key]: value,
            };

            await AsyncStorage.setItem(
                "autocare_notification_settings",
                JSON.stringify(updatedSettings)
            );
        } catch (error) {
            console.log(
                "Save Notification Settings Error:",
                error
            );
        }
    };

    const handleNotifikasiUmum = (value) => {
        setNotifikasiUmum(value);
        saveSettings("notifikasiUmum", value);
    };

    const handlePengingatServis = (value) => {
        setPengingatServis(value);
        saveSettings("pengingatServis", value);
    };

    const handleStatusBooking = (value) => {
        setStatusBooking(value);
        saveSettings("statusBooking", value);
    };

    const handlePromo = (value) => {
        setPromo(value);
        saveSettings("promo", value);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loading}>
                    <ActivityIndicator
                        size="large"
                        color={RED}
                    />

                    <Text style={styles.loadingText}>
                        Memuat pengaturan...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={["top", "bottom"]}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    activeOpacity={0.7}
                    onPress={() => safeBack("/home")}
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#222"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Notifikasi
                </Text>

                <View style={styles.headerSpace} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* INTRO */}
                <View style={styles.intro}>
                    <View style={styles.introIcon}>
                        <Ionicons
                            name="notifications-outline"
                            size={28}
                            color={RED}
                        />
                    </View>

                    <View style={styles.introContent}>
                        <Text style={styles.introTitle}>
                            Pengaturan Notifikasi
                        </Text>

                        <Text style={styles.introText}>
                            Atur jenis notifikasi yang ingin
                            kamu terima dari AutoCare.
                        </Text>
                    </View>
                </View>

                {/* NOTIFIKASI UMUM */}
                <Text style={styles.sectionTitle}>
                    Umum
                </Text>

                <View style={styles.menuCard}>
                    <View style={styles.menuItem}>
                        <View style={styles.menuIcon}>
                            <Ionicons
                                name="notifications-outline"
                                size={21}
                                color={RED}
                            />
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Notifikasi Umum
                            </Text>

                            <Text style={styles.menuDescription}>
                                Terima notifikasi dari AutoCare
                            </Text>
                        </View>

                        <Switch
                            value={notifikasiUmum}
                            onValueChange={
                                handleNotifikasiUmum
                            }
                            trackColor={{
                                false: "#D5D5D5",
                                true: "#E8A0A0",
                            }}
                            thumbColor={
                                notifikasiUmum
                                    ? RED
                                    : "#F4F4F4"
                            }
                        />
                    </View>
                </View>

                {/* BOOKING */}
                <Text style={styles.sectionTitle}>
                    Booking & Servis
                </Text>

                <View style={styles.menuCard}>
                    <View style={styles.menuItem}>
                        <View style={styles.menuIcon}>
                            <Ionicons
                                name="construct-outline"
                                size={21}
                                color={RED}
                            />
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Pengingat Servis
                            </Text>

                            <Text style={styles.menuDescription}>
                                Ingatkan jadwal servis kendaraan
                            </Text>
                        </View>

                        <Switch
                            value={pengingatServis}
                            onValueChange={
                                handlePengingatServis
                            }
                            trackColor={{
                                false: "#D5D5D5",
                                true: "#E8A0A0",
                            }}
                            thumbColor={
                                pengingatServis
                                    ? RED
                                    : "#F4F4F4"
                            }
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.menuItem}>
                        <View style={styles.menuIcon}>
                            <Ionicons
                                name="calendar-outline"
                                size={21}
                                color={RED}
                            />
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Status Booking
                            </Text>

                            <Text style={styles.menuDescription}>
                                Informasi perubahan status booking
                            </Text>
                        </View>

                        <Switch
                            value={statusBooking}
                            onValueChange={
                                handleStatusBooking
                            }
                            trackColor={{
                                false: "#D5D5D5",
                                true: "#E8A0A0",
                            }}
                            thumbColor={
                                statusBooking
                                    ? RED
                                    : "#F4F4F4"
                            }
                        />
                    </View>
                </View>

                {/* PROMO */}
                <Text style={styles.sectionTitle}>
                    Informasi
                </Text>

                <View style={styles.menuCard}>
                    <View style={styles.menuItem}>
                        <View style={styles.menuIcon}>
                            <Ionicons
                                name="pricetag-outline"
                                size={21}
                                color={RED}
                            />
                        </View>

                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>
                                Promo & Penawaran
                            </Text>

                            <Text style={styles.menuDescription}>
                                Dapatkan informasi promo AutoCare
                            </Text>
                        </View>

                        <Switch
                            value={promo}
                            onValueChange={handlePromo}
                            trackColor={{
                                false: "#D5D5D5",
                                true: "#E8A0A0",
                            }}
                            thumbColor={
                                promo
                                    ? RED
                                    : "#F4F4F4"
                            }
                        />
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons
                        name="information-circle-outline"
                        size={20}
                        color="#888"
                    />

                    <Text style={styles.infoText}>
                        Pengaturan ini hanya berlaku untuk
                        notifikasi yang dikirim oleh aplikasi
                        AutoCare.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8F8F8",
    },

    header: {
        height: 66,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },

    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },

    headerTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 18,
        fontWeight: "800",
        color: "#222222",
    },

    headerSpace: {
        width: 40,
    },

    content: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
    },

    intro: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 17,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 25,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },

    introIcon: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: "#FDECEC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 13,
    },

    introContent: {
        flex: 1,
    },

    introTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 15,
        fontWeight: "800",
        color: "#222222",
        marginBottom: 4,
    },

    introText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        lineHeight: 18,
        color: "#777777",
    },

    sectionTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 14,
        fontWeight: "800",
        color: "#333333",
        marginBottom: 10,
        marginTop: 4,
    },

    menuCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        marginBottom: 22,
        overflow: "hidden",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 5,
        elevation: 2,
    },

    menuItem: {
        minHeight: 75,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 12,
    },

    menuIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: "#FDECEC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    menuContent: {
        flex: 1,
        paddingRight: 8,
    },

    menuTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 14,
        fontWeight: "700",
        color: "#222222",
        marginBottom: 3,
    },

    menuDescription: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11.5,
        color: "#888888",
        lineHeight: 17,
    },

    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginLeft: 69,
    },

    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F3F3F3",
        borderRadius: 14,
        padding: 14,
        marginTop: 2,
    },

    infoText: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        fontSize: 11.5,
        color: "#777777",
        lineHeight: 18,
        marginLeft: 9,
    },

    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        fontFamily: "Poppins_400Regular",
        marginTop: 10,
        color: "#777777",
        fontSize: 13,
    },
});