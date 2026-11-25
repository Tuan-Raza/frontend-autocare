import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

// =====================================================
// KONSTANTA WARNA AUTOCARE
// =====================================================

const RED       = "#C62828";
const RED_DARK  = "#8B0000";
const RED_MED   = "#D32F2F";
const WHITE     = "#FFFFFF";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// =====================================================
// KOMPONEN ANIMASI LOGOUT
// =====================================================

export default function LogoutAnimation() {

    // ---------------------
    // ANIMATED VALUES
    // ---------------------

    // Overlay fade-in
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    // Ikon lingkaran (scale + opacity)
    const iconScale   = useRef(new Animated.Value(0)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;

    // Ikon berputar (rotate)
    const iconRotate  = useRef(new Animated.Value(0)).current;

    // Teks muncul (opacity + translateY)
    const textOpacity   = useRef(new Animated.Value(0)).current;
    const textTranslate = useRef(new Animated.Value(20)).current;

    // Sub-teks muncul
    const subtextOpacity   = useRef(new Animated.Value(0)).current;
    const subtextTranslate = useRef(new Animated.Value(15)).current;

    // Lingkaran "ripple" keluar
    const rippleScale1   = useRef(new Animated.Value(0)).current;
    const rippleOpacity1 = useRef(new Animated.Value(0.5)).current;
    const rippleScale2   = useRef(new Animated.Value(0)).current;
    const rippleOpacity2 = useRef(new Animated.Value(0.35)).current;

    // Loading dots (3 titik)
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    // Fade-out akhir (seluruh layar)
    const screenFade = useRef(new Animated.Value(1)).current;

    // ---------------------
    // JALANKAN URUTAN ANIMASI
    // ---------------------

    useEffect(() => {
        runAnimations();
    }, []);

    const runAnimations = async () => {
        // ── LANGKAH 1: Hapus data user & profile photo ──────────────────
        try {
            await AsyncStorage.multiRemove([
                "autocare_token",
                "autocare_user",
                "autocare_admin_token",
                "autocare_admin_user",
                "autocare_profile_photo",
                "autocare_reset_email",
            ]);
        } catch (_) {}

        // ── LANGKAH 2: Urutan animasi ────────────────────────────

        // Phase A: Overlay muncul
        Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();

        // Phase B: Ikon muncul (scale + opacity) + ripple
        setTimeout(() => {
            Animated.parallel([
                // Ikon scale "pop"
                Animated.spring(iconScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 120,
                    useNativeDriver: true,
                }),
                Animated.timing(iconOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),

                // Ikon berputar 360°
                Animated.timing(iconRotate, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.back(1.2)),
                    useNativeDriver: true,
                }),

                // Ripple 1
                Animated.sequence([
                    Animated.delay(100),
                    Animated.parallel([
                        Animated.timing(rippleScale1, {
                            toValue: 3.5,
                            duration: 800,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(rippleOpacity1, {
                            toValue: 0,
                            duration: 800,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),

                // Ripple 2
                Animated.sequence([
                    Animated.delay(250),
                    Animated.parallel([
                        Animated.timing(rippleScale2, {
                            toValue: 3,
                            duration: 700,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(rippleOpacity2, {
                            toValue: 0,
                            duration: 700,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            ]).start();
        }, 200);

        // Phase C: Teks muncul
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(textTranslate, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();
        }, 500);

        // Phase D: Sub-teks muncul
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(subtextOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(subtextTranslate, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();
        }, 700);

        // Phase E: Animasi dots (loop)
        setTimeout(() => {
            const dotAnim = (dot, delay) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(dot, {
                            toValue: 1,
                            duration: 350,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(dot, {
                            toValue: 0,
                            duration: 350,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ])
                );

            dotAnim(dot1, 0).start();
            dotAnim(dot2, 180).start();
            dotAnim(dot3, 360).start();
        }, 900);

        // Phase F: Fade-out → pindah ke login
        setTimeout(() => {
            Animated.timing(screenFade, {
                toValue: 0,
                duration: 600,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }).start(() => {
                router.replace("/login");
            });
        }, 2800);
    };

    // ---------------------
    // COMPUTED VALUES
    // ---------------------

    const iconRotateDeg = iconRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    const dot1Scale = dot1.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.5],
    });
    const dot2Scale = dot2.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.5],
    });
    const dot3Scale = dot3.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.5],
    });

    // ---------------------
    // RENDER
    // ---------------------

    return (
        <Animated.View style={[styles.screen, { opacity: screenFade }]}>

            {/* ── BACKGROUND GRADIENT EFFECT ── */}
            <Animated.View
                style={[styles.overlay, { opacity: overlayOpacity }]}
            />

            {/* ── DEKORASI LINGKARAN LATAR ── */}
            <View style={styles.bgCircleTop}    pointerEvents="none" />
            <View style={styles.bgCircleBottom} pointerEvents="none" />

            {/* ── KONTEN UTAMA ── */}
            <View style={styles.center}>

                {/* IKON DENGAN RIPPLE */}
                <View style={styles.iconWrapper}>

                    {/* Ripple 2 (dalam) */}
                    <Animated.View
                        style={[
                            styles.ripple,
                            {
                                transform: [{ scale: rippleScale2 }],
                                opacity:   rippleOpacity2,
                            },
                        ]}
                    />

                    {/* Ripple 1 (luar) */}
                    <Animated.View
                        style={[
                            styles.ripple,
                            {
                                transform: [{ scale: rippleScale1 }],
                                opacity:   rippleOpacity1,
                            },
                        ]}
                    />

                    {/* Lingkaran ikon */}
                    <Animated.View
                        style={[
                            styles.iconCircle,
                            {
                                opacity:   iconOpacity,
                                transform: [
                                    { scale:  iconScale   },
                                    { rotate: iconRotateDeg },
                                ],
                            },
                        ]}
                    >
                        <Ionicons
                            name="log-out-outline"
                            size={48}
                            color={WHITE}
                        />
                    </Animated.View>
                </View>

                {/* TEKS UTAMA */}
                <Animated.Text
                    style={[
                        styles.title,
                        {
                            opacity:   textOpacity,
                            transform: [{ translateY: textTranslate }],
                        },
                    ]}
                >
                    Sampai Jumpa! 👋
                </Animated.Text>

                {/* SUB-TEKS */}
                <Animated.Text
                    style={[
                        styles.subtitle,
                        {
                            opacity:   subtextOpacity,
                            transform: [{ translateY: subtextTranslate }],
                        },
                    ]}
                >
                    Anda telah berhasil keluar dari akun AutoCare.
                </Animated.Text>

                {/* LOADING DOTS */}
                <Animated.View
                    style={[
                        styles.dotsContainer,
                        { opacity: subtextOpacity },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.dot,
                            { transform: [{ scale: dot1Scale }], opacity: dot1 },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.dot,
                            { transform: [{ scale: dot2Scale }], opacity: dot2 },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.dot,
                            { transform: [{ scale: dot3Scale }], opacity: dot3 },
                        ]}
                    />
                </Animated.View>

                {/* LABEL REDIRECT */}
                <Animated.Text
                    style={[
                        styles.redirectLabel,
                        { opacity: subtextOpacity },
                    ]}
                >
                    Mengarahkan ke halaman login...
                </Animated.Text>
            </View>

            {/* ── BRAND FOOTER ── */}
            <Animated.View
                style={[
                    styles.footer,
                    {
                        opacity:   textOpacity,
                        transform: [{ translateY: textTranslate }],
                    },
                ]}
            >
                <Text style={styles.footerText}>AutoCare • Vehicle Service</Text>
            </Animated.View>
        </Animated.View>
    );
}

// =====================================================
// STYLES
// =====================================================

const ICON_SIZE = 100;

const styles = StyleSheet.create({

    /* ── LAYOUT ── */

    screen: {
        flex: 1,
        backgroundColor: RED_DARK,
        alignItems:      "center",
        justifyContent:  "center",
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: RED,
        opacity:         0,
    },

    /* ── DEKORASI LATAR ── */

    bgCircleTop: {
        position:        "absolute",
        width:           SCREEN_W * 1.2,
        height:          SCREEN_W * 1.2,
        borderRadius:    SCREEN_W * 0.6,
        backgroundColor: "rgba(255,255,255,0.04)",
        top:             -SCREEN_W * 0.6,
        left:            -SCREEN_W * 0.1,
    },

    bgCircleBottom: {
        position:        "absolute",
        width:           SCREEN_W * 1.4,
        height:          SCREEN_W * 1.4,
        borderRadius:    SCREEN_W * 0.7,
        backgroundColor: "rgba(0,0,0,0.10)",
        bottom:          -SCREEN_W * 0.9,
        right:           -SCREEN_W * 0.2,
    },

    /* ── KONTEN ── */

    center: {
        alignItems: "center",
        paddingHorizontal: 32,
    },

    /* ── IKON ── */

    iconWrapper: {
        width:           ICON_SIZE,
        height:          ICON_SIZE,
        alignItems:      "center",
        justifyContent:  "center",
        marginBottom:    32,
    },

    ripple: {
        position:        "absolute",
        width:           ICON_SIZE,
        height:          ICON_SIZE,
        borderRadius:    ICON_SIZE / 2,
        backgroundColor: WHITE,
    },

    iconCircle: {
        width:           ICON_SIZE,
        height:          ICON_SIZE,
        borderRadius:    ICON_SIZE / 2,
        backgroundColor: "rgba(255,255,255,0.18)",
        borderWidth:     2,
        borderColor:     "rgba(255,255,255,0.45)",
        alignItems:      "center",
        justifyContent:  "center",

        // Shadow
        ...Platform.select({
            ios: {
                shadowColor:   "#000",
                shadowOffset:  { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius:  12,
            },
            android: {
                elevation: 10,
            },
            web: {
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            },
        }),
    },

    /* ── TEKS ── */

    title: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize:      30,
        fontWeight:    "800",
        color:         WHITE,
        textAlign:     "center",
        marginBottom:  12,
        letterSpacing: 0.3,

        ...Platform.select({
            ios: {
                shadowColor:   "#000",
                shadowOffset:  { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius:  4,
            },
        }),
    },

    subtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize:      15,
        fontWeight:    "400",
        color:         "rgba(255,255,255,0.80)",
        textAlign:     "center",
        lineHeight:    22,
        paddingHorizontal: 12,
        marginBottom:  28,
    },

    /* ── LOADING DOTS ── */

    dotsContainer: {
        flexDirection:  "row",
        alignItems:     "center",
        gap:            10,
        marginBottom:   16,
    },

    dot: {
        width:           10,
        height:          10,
        borderRadius:    5,
        backgroundColor: "rgba(255,255,255,0.75)",
    },

    /* ── REDIRECT LABEL ── */

    redirectLabel: {
        fontFamily: "Poppins_400Regular",
        fontSize:   13,
        color:      "rgba(255,255,255,0.55)",
        textAlign:  "center",
        fontStyle:  "italic",
    },

    /* ── FOOTER ── */

    footer: {
        position:       "absolute",
        bottom:         40,
        left:           0,
        right:          0,
        alignItems:     "center",
    },

    footerText: {
        fontFamily: "Poppins_400Regular",
        fontSize:  13,
        color:     "rgba(255,255,255,0.45)",
        textAlign: "center",
        letterSpacing: 0.5,
    },
});
