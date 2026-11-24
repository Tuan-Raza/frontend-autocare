import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

const ONBOARDING_SLIDES = [
    {
        id: "1",
        highlight: "Dapatkan banyak",
        restText: "kemudahan kendaraanmu\ndalam satu genggaman",
        badgeIcon: "car-sport-outline",
        imageSource: require("../../assets/images/autocare-logo.png"),
    },
    {
        id: "2",
        highlight: "Booking servis mudah",
        restText: "dan pantau jadwal perawatan\nkendaraan tanpa antre",
        badgeIcon: "calendar-check-outline",
        imageSource: null,
    },
    {
        id: "3",
        highlight: "Riwayat perawatan rapi",
        restText: "dan transparan untuk\nsetiap kendaraan terdaftar",
        badgeIcon: "clipboard-checkmark-outline",
        imageSource: null,
    },
    {
        id: "4",
        highlight: "Bengkel terpercaya",
        restText: "dengan layanan cepat dan\nstandar terbaik untuk Anda",
        badgeIcon: "shield-checkmark-outline",
        imageSource: null,
    },
    {
        id: "5",
        highlight: "Siap merawat kendaraan",
        restText: "bersama AutoCare kapan saja\ndan di mana saja",
        badgeIcon: "sparkles-outline",
        imageSource: null,
    },
];

export default function Onboarding() {
    const { width } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef(null);

    const handleSkip = () => {
        router.replace("/login");
    };

    const handleNextOrLogin = () => {
        if (activeIndex < ONBOARDING_SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: activeIndex + 1,
                animated: true,
            });
        } else {
            router.replace("/login");
        }
    };

    const handleMomentumScrollEnd = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(offsetX / width);
        setActiveIndex(
            Math.max(0, Math.min(currentIndex, ONBOARDING_SLIDES.length - 1))
        );
    };

    const renderSlide = ({ item }) => (
        <View style={[styles.slide, { width }]}>
            <View style={styles.visualArea}>
                <View style={styles.softBlob} />

                <View style={styles.cardVisual}>
                    {item.imageSource ? (
                        <Image
                            source={item.imageSource}
                            style={styles.centerLogo}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.iconCircle}>
                            <Ionicons
                                name={item.badgeIcon}
                                size={54}
                                color="#A80000"
                            />
                        </View>
                    )}

                    <View style={styles.pillTag}>
                        <Ionicons
                            name="checkmark-circle"
                            size={15}
                            color="#A80000"
                        />
                        <Text style={styles.pillTagText}>AutoCare</Text>
                    </View>
                </View>
            </View>

            <View style={styles.textBlock}>
                <Text style={styles.headlineHighlight}>{item.highlight}</Text>
                <Text style={styles.headlineRest}>{item.restText}</Text>
            </View>
        </View>
    );

    const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={handleSkip}
                    activeOpacity={0.75}
                    hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
                >
                    <Text style={styles.skipText}>Lewati</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={ONBOARDING_SLIDES}
                keyExtractor={(item) => item.id}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />

            <View style={styles.bottomArea}>
                <View style={styles.dotsRow}>
                    {ONBOARDING_SLIDES.map((slide, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <TouchableOpacity
                                key={slide.id}
                                style={[
                                    styles.dot,
                                    isActive && styles.dotActive,
                                ]}
                                onPress={() => {
                                    flatListRef.current?.scrollToIndex({
                                        index,
                                        animated: true,
                                    });
                                }}
                                activeOpacity={0.8}
                            />
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        isLastSlide && styles.actionButtonPrimary,
                    ]}
                    onPress={handleNextOrLogin}
                    activeOpacity={0.85}
                >
                    <Text
                        style={[
                            styles.actionButtonText,
                            isLastSlide && styles.actionButtonTextPrimary,
                        ]}
                    >
                        {isLastSlide ? "Mulai Sekarang" : "Lanjutkan"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    topBar: {
        paddingTop: Platform.OS === "ios" ? 56 : 38,
        paddingHorizontal: 24,
        paddingBottom: 8,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    skipText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#A80000",
    },
    slide: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
    },
    visualArea: {
        width: 270,
        height: 270,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 28,
    },
    softBlob: {
        position: "absolute",
        width: 245,
        height: 245,
        borderRadius: 110,
        backgroundColor: "#F9ECEC",
        transform: [{ rotate: "-12deg" }],
    },
    cardVisual: {
        width: 175,
        height: 215,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        elevation: 5,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    centerLogo: {
        width: 96,
        height: 96,
        marginBottom: 14,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#FFF5F5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },
    pillTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF5F5",
        borderWidth: 1,
        borderColor: "#F3C6C6",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        gap: 5,
    },
    pillTagText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#A80000",
    },
    textBlock: {
        alignItems: "center",
        paddingHorizontal: 10,
    },
    headlineHighlight: {
        fontSize: 20,
        fontWeight: "700",
        color: "#A80000",
        textAlign: "center",
        lineHeight: 28,
    },
    headlineRest: {
        fontSize: 19,
        fontWeight: "600",
        color: "#4B5563",
        textAlign: "center",
        lineHeight: 27,
        marginTop: 2,
    },
    bottomArea: {
        paddingHorizontal: 28,
        paddingBottom: Platform.OS === "ios" ? 42 : 30,
        alignItems: "center",
    },
    dotsRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        marginBottom: 24,
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: "#D1D5DB",
    },
    dotActive: {
        backgroundColor: "#A80000",
        width: 11,
        height: 11,
        borderRadius: 5.5,
    },
    actionButton: {
        width: "100%",
        height: 46,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        justifyContent: "center",
        alignItems: "center",
    },
    actionButtonPrimary: {
        backgroundColor: "#A80000",
        borderColor: "#A80000",
    },
    actionButtonText: {
        fontSize: 14.5,
        fontWeight: "700",
        color: "#374151",
    },
    actionButtonTextPrimary: {
        color: "#FFFFFF",
    },
});