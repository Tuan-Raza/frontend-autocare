import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useState } from "react";
import {
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RED = "#B22222";

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(
        true
    );
}

const FAQ = [
    {
        question: "Bagaimana cara melakukan booking service?",
        answer:
            "Pilih menu Booking pada halaman utama, pilih kendaraan, pilih layanan service, tentukan bengkel dan jadwal, kemudian periksa kembali data booking sebelum melakukan konfirmasi.",
    },
    {
        question: "Bagaimana cara melihat riwayat service?",
        answer:
            "Buka halaman Home, kemudian pilih menu Riwayat Service pada bagian Fitur Lainnya. Anda dapat melihat daftar booking dan detail service kendaraan.",
    },
    {
        question: "Bagaimana cara menambahkan kendaraan?",
        answer:
            "Masuk ke menu Kendaraan kemudian pilih Tambah Kendaraan. Masukkan merek, model, tahun, nomor polisi, dan kilometer kendaraan.",
    },
    {
        question: "Bagaimana jika saya ingin mengganti password?",
        answer:
            "Masuk ke menu Profil, pilih Keamanan, kemudian masukkan password lama dan password baru Anda.",
    },
    {
        question: "Bagaimana cara mengetahui status service?",
        answer:
            "Status booking dapat dilihat melalui menu Riwayat Service. Pilih booking yang ingin dilihat untuk mengetahui detail dan status service.",
    },
];

export default function Bantuan() {
    const [openIndex, setOpenIndex] =
        useState(null);

    const toggleFAQ = (index) => {
        LayoutAnimation.configureNext(
            LayoutAnimation.Presets.easeInEaseOut
        );

        setOpenIndex(
            openIndex === index ? null : index
        );
    };

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={["top", "bottom"]}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => safeBack("/profil")}
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#222"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Bantuan
                </Text>

                <View style={styles.headerSpace} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.helpCard}>
                    <View style={styles.helpIcon}>
                        <Ionicons
                            name="help-circle-outline"
                            size={38}
                            color={RED}
                        />
                    </View>

                    <Text style={styles.helpTitle}>
                        Ada yang bisa kami bantu?
                    </Text>

                    <Text style={styles.helpText}>
                        Temukan jawaban dari pertanyaan yang
                        sering ditanyakan tentang AutoCare.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>
                    Pertanyaan Umum
                </Text>

                <View style={styles.faqCard}>
                    {FAQ.map((item, index) => {
                        const isOpen =
                            openIndex === index;

                        return (
                            <View key={index}>
                                <TouchableOpacity
                                    style={styles.faqItem}
                                    activeOpacity={0.8}
                                    onPress={() =>
                                        toggleFAQ(
                                            index
                                        )
                                    }
                                >
                                    <View
                                        style={
                                            styles.questionIcon
                                        }
                                    >
                                        <Ionicons
                                            name="help-outline"
                                            size={18}
                                            color={RED}
                                        />
                                    </View>

                                    <Text
                                        style={
                                            styles.question
                                        }
                                    >
                                        {item.question}
                                    </Text>

                                    <Ionicons
                                        name={
                                            isOpen
                                                ? "chevron-up"
                                                : "chevron-down"
                                        }
                                        size={19}
                                        color="#888"
                                    />
                                </TouchableOpacity>

                                {isOpen && (
                                    <View
                                        style={
                                            styles.answerContainer
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.answer
                                            }
                                        >
                                            {item.answer}
                                        </Text>
                                    </View>
                                )}

                                {index <
                                    FAQ.length -
                                        1 && (
                                    <View
                                        style={
                                            styles.divider
                                        }
                                    />
                                )}
                            </View>
                        );
                    })}
                </View>

                <Text style={styles.sectionTitle}>
                    Hubungi Kami
                </Text>

                <View style={styles.contactCard}>
                    <TouchableOpacity
                        style={styles.contactItem}
                        activeOpacity={0.8}
                    >
                        <View style={styles.contactIcon}>
                            <Ionicons
                                name="call-outline"
                                size={21}
                                color={RED}
                            />
                        </View>

                        <View
                            style={styles.contactContent}
                        >
                            <Text
                                style={
                                    styles.contactTitle
                                }
                            >
                                Customer Service
                            </Text>

                            <Text
                                style={
                                    styles.contactText
                                }
                            >
                                0812-3456-7890
                            </Text>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#AAA"
                        />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.contactItem}
                        activeOpacity={0.8}
                    >
                        <View style={styles.contactIcon}>
                            <Ionicons
                                name="mail-outline"
                                size={21}
                                color={RED}
                            />
                        </View>

                        <View
                            style={styles.contactContent}
                        >
                            <Text
                                style={
                                    styles.contactTitle
                                }
                            >
                                Email
                            </Text>

                            <Text
                                style={
                                    styles.contactText
                                }
                            >
                                support@autocare.com
                            </Text>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#AAA"
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>
                    AutoCare v1.0.0
                </Text>
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
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
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
        color: "#222",
    },

    headerSpace: {
        width: 40,
    },

    content: {
        padding: 16,
        paddingBottom: 35,
    },

    helpCard: {
        backgroundColor: "#FFF3F3",
        borderRadius: 18,
        padding: 22,
        alignItems: "center",
        marginBottom: 22,
    },

    helpIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },

    helpTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 19,
        fontWeight: "800",
        color: "#222",
        textAlign: "center",
    },

    helpText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#777",
        lineHeight: 18,
        textAlign: "center",
        marginTop: 7,
    },

    sectionTitle: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 17,
        fontWeight: "800",
        color: "#222",
        marginBottom: 10,
    },

    faqCard: {
        backgroundColor: "#fff",
        borderRadius: 17,
        borderWidth: 1,
        borderColor: "#eee",
        overflow: "hidden",
        marginBottom: 22,
    },

    faqItem: {
        minHeight: 64,
        paddingHorizontal: 13,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
    },

    questionIcon: {
        width: 37,
        height: 37,
        borderRadius: 11,
        backgroundColor: "#FFF2F2",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    question: {
        fontFamily: "Poppins_700Bold",
        flex: 1,
        fontSize: 12.5,
        fontWeight: "700",
        color: "#333",
        lineHeight: 18,
        paddingRight: 7,
    },

    answerContainer: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingLeft: 60,
    },

    answer: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#777",
        lineHeight: 19,
    },

    divider: {
        height: 1,
        backgroundColor: "#eee",
        marginLeft: 60,
    },

    contactCard: {
        backgroundColor: "#fff",
        borderRadius: 17,
        borderWidth: 1,
        borderColor: "#eee",
        overflow: "hidden",
    },

    contactItem: {
        minHeight: 70,
        padding: 13,
        flexDirection: "row",
        alignItems: "center",
    },

    contactIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "#FFF2F2",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
    },

    contactContent: {
        flex: 1,
    },

    contactTitle: {
        fontFamily: "Poppins_700Bold",
        fontSize: 13,
        fontWeight: "700",
        color: "#333",
        marginBottom: 3,
    },

    contactText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 11,
        color: "#888",
    },

    version: {
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        fontSize: 11,
        color: "#AAA",
        marginTop: 20,
    },
});