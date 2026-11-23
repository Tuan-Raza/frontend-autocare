import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";

import {
    ActivityIndicator,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import { API_URL } from "../config";

export default function Login() {
    const { width, height } = useWindowDimensions();

    // Desktop mulai dari 900px
    const isDesktop = Platform.OS === "web" && width >= 900;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [ingatSaya, setIngatSaya] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let isMounted = true;
        AsyncStorage.getItem("autocare_user").then((userData) => {
            if (!isMounted) return;
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    if (parsed && (parsed.id || parsed.email)) {
                        if (parsed.role === "admin") {
                            router.replace("/admin");
                        } else {
                            if (data.user.role === "admin") {
                router.replace("/admin");
            } else {
                router.replace("/home");
            }
                        }
                    }
                } catch (_) {}
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogin = async () => {
        setErrorMessage("");

        if (!email.trim() || !password) {
            setErrorMessage(
                "Email/no HP dan password wajib diisi."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        password: password,
                    }),
                }
            );

            const text = await response.text();

            let data;

            try {
                data = JSON.parse(text);
            } catch {
                setErrorMessage(
                    "Server mengembalikan response yang tidak valid."
                );
                return;
            }

            if (!response.ok || !data.success) {
                setErrorMessage(
                    data.message ||
                        "Email atau password salah."
                );
                return;
            }

            if (!data.user) {
                setErrorMessage(
                    "Data pengguna tidak ditemukan."
                );
                return;
            }

            await AsyncStorage.setItem(
                "autocare_user",
                JSON.stringify(data.user)
            );

            // Bersihkan atau set profile photo sesuai data akun yang login
            if (data.user.foto) {
                await AsyncStorage.setItem("autocare_profile_photo", data.user.foto);
            } else {
                await AsyncStorage.removeItem("autocare_profile_photo");
            }

            if (data.user.role === "admin") {
                router.replace("/admin");
            } else {
                router.replace("/home");
            }
        } catch (error) {
            console.error("Login Error:", error);

            setErrorMessage(
                "Tidak dapat terhubung ke server."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    ============================================================
    DESKTOP
    ============================================================
    */

    if (isDesktop) {
        return (
            <KeyboardAvoidingView
                style={styles.desktopContainer}
                behavior={undefined}
            >
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />

                {/* =================================================
                    PANEL KIRI
                ================================================= */}

                <ImageBackground
                    source={require("../../assets/images/autocare-login-desktop.png")}
                    style={styles.desktopLeft}
                    imageStyle={styles.desktopLeftImage}
                >

                    {/* Background decoration */}
                    <View style={styles.leftCircleOne} />
                    <View style={styles.leftCircleTwo} />
                    <View style={styles.leftCircleThree} />

                    {/* Grid */}
                    <View style={styles.leftGrid}>
                        {Array.from({ length: 9 }).map(
                            (_, index) => (
                                <View
                                    key={`left-v-${index}`}
                                    style={[
                                        styles.gridVertical,
                                        {
                                            left: `${index * 12.5}%`,
                                        },
                                    ]}
                                />
                            )
                        )}

                        {Array.from({ length: 7 }).map(
                            (_, index) => (
                                <View
                                    key={`left-h-${index}`}
                                    style={[
                                        styles.gridHorizontal,
                                        {
                                            top: `${index * 16}%`,
                                        },
                                    ]}
                                />
                            )
                        )}
                    </View>

                    {/* Overlay */}
                    <View style={styles.leftOverlay} />

                    <ScrollView
                        style={styles.desktopLeftScroll}
                        contentContainerStyle={[
                            styles.desktopLeftContent,
                            {
                                minHeight: height,
                            },
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <BlurView
                            intensity={55}
                            tint="dark"
                            style={styles.desktopLoginCard}
                        >
                            <View style={styles.desktopGlassInner}>

                                {/* LOGO */}
                                <View style={styles.desktopLogoBox}>
                                    <Image
                                        source={require("../../assets/images/autocare-logo.png")}
                                        style={styles.desktopLogo}
                                        resizeMode="contain"
                                    />
                                </View>

                                {/* TITLE */}
                                <Text style={styles.desktopTitle}>
                                    Selamat Datang
                                </Text>

                                <Text style={styles.desktopSubtitle}>
                                    Masuk ke akun AutoCare Anda
                                </Text>

                                {/* ERROR */}
                                {errorMessage ? (
                                    <View
                                        style={
                                            styles.desktopErrorBox
                                        }
                                    >
                                        <Ionicons
                                            name="alert-circle-outline"
                                            size={18}
                                            color="#B00000"
                                        />

                                        <Text
                                            style={
                                                styles.desktopErrorText
                                            }
                                        >
                                            {errorMessage}
                                        </Text>
                                    </View>
                                ) : null}

                                {/* EMAIL */}
                                <Text
                                    style={
                                        styles.desktopInputLabel
                                    }
                                >
                                    Email / No. HP
                                </Text>

                                <View
                                    style={
                                        styles.desktopInputContainer
                                    }
                                >
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color="#777777"
                                    />

                                    <TextInput
                                        style={
                                            styles.desktopInput
                                        }
                                        placeholder="Masukkan Email atau no. HP"
                                        placeholderTextColor="#999999"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                        returnKeyType="next"
                                        onSubmitEditing={() => {
                                            if (password) handleLogin();
                                        }}
                                    />
                                </View>

                                {/* PASSWORD */}
                                <Text
                                    style={[
                                        styles.desktopInputLabel,
                                        {
                                            marginTop: 15,
                                        },
                                    ]}
                                >
                                    Password
                                </Text>

                                <View
                                    style={
                                        styles.desktopInputContainer
                                    }
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color="#777777"
                                    />

                                    <TextInput
                                        style={
                                            styles.desktopInput
                                        }
                                        placeholder="Masukkan password"
                                        placeholderTextColor="#999999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={
                                            !showPassword
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="go"
                                        onSubmitEditing={handleLogin}
                                    />

                                    <TouchableOpacity
                                        onPress={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                        style={
                                            styles.passwordEye
                                        }
                                    >
                                        <Ionicons
                                            name={
                                                showPassword
                                                    ? "eye-outline"
                                                    : "eye-off-outline"
                                            }
                                            size={20}
                                            color="#777777"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* OPTIONS */}
                                <View
                                    style={
                                        styles.desktopOptionRow
                                    }
                                >
                                    <Pressable
                                        style={
                                            styles.rememberContainer
                                        }
                                        onPress={() =>
                                            setIngatSaya(
                                                !ingatSaya
                                            )
                                        }
                                    >
                                        <View
                                            style={[
                                                styles.checkbox,
                                                ingatSaya &&
                                                    styles.checkboxActive,
                                            ]}
                                        >
                                            {ingatSaya && (
                                                <Text
                                                    style={
                                                        styles.checkmark
                                                    }
                                                >
                                                    ✓
                                                </Text>
                                            )}
                                        </View>

                                        <Text
                                            style={
                                                styles.rememberText
                                            }
                                        >
                                            Ingat saya
                                        </Text>
                                    </Pressable>

                                    <TouchableOpacity
                                        onPress={() =>
                                            router.push(
                                                "/lupa-password"
                                            )
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.desktopForgot
                                            }
                                        >
                                            Lupa password?
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* LOGIN */}
                                <TouchableOpacity
                                    style={[
                                        styles.desktopLoginButton,
                                        loading &&
                                            styles.loginButtonDisabled,
                                    ]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <ActivityIndicator
                                            color="#FFFFFF"
                                        />
                                    ) : (
                                        <>
                                            <Text
                                                style={
                                                    styles.desktopLoginText
                                                }
                                            >
                                                Masuk
                                            </Text>

                                            <Ionicons
                                                name="arrow-forward"
                                                size={19}
                                                color="#FFFFFF"
                                            />
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* OR */}
                                <View
                                    style={
                                        styles.desktopOrContainer
                                    }
                                >
                                    <View
                                        style={
                                            styles.desktopOrLine
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.desktopOrText
                                        }
                                    >
                                        atau
                                    </Text>

                                    <View
                                        style={
                                            styles.desktopOrLine
                                        }
                                    />
                                </View>

                                {/* GOOGLE */}
                                <TouchableOpacity
                                    style={
                                        styles.desktopGoogleButton
                                    }
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={
                                            styles.googleG
                                        }
                                    >
                                        G
                                    </Text>

                                    <Text
                                        style={
                                            styles.googleText
                                        }
                                    >
                                        Masuk dengan Google
                                    </Text>
                                </TouchableOpacity>

                                {/* REGISTER */}
                                <View
                                    style={
                                        styles.desktopRegister
                                    }
                                >
                                    <Text
                                        style={
                                            styles.desktopRegisterText
                                        }
                                    >
                                        Belum punya akun?
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() =>
                                            router.push(
                                                "/daftar"
                                            )
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.desktopRegisterLink
                                            }
                                        >
                                            Daftar
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <Text
                                    style={
                                        styles.desktopFooter
                                    }
                                >
                                    AutoCare • Vehicle Service
                                </Text>

                            </View>
                        </BlurView>
                    </ScrollView>
                </ImageBackground>

                {/* =================================================
                    PANEL KANAN
                ================================================= */}

                <ImageBackground
                    source={require("../../assets/images/autocare-banner.png")}
                    style={styles.desktopRight}
                    imageStyle={styles.desktopRightImage}
                >
                    {/* DARK RED OVERLAY */}
                    <View style={styles.rightOverlay} />

                    {/* DECORATION */}
                    <View style={styles.rightCircleOne} />
                    <View style={styles.rightCircleTwo} />

                    <View style={styles.rightContent}>

                        {/* LOGO */}
                        <View style={styles.brandLogoBox}>
                            <Image
                                source={require("../../assets/images/autocare-logo.png")}
                                style={styles.brandLogo}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.brandTitle}>
                            AutoCare
                        </Text>

                        <Text style={styles.brandSubtitle}>
                            Solusi Service Kendaraan
                        </Text>

                        <Text style={styles.brandSubtitle}>
                            Lebih Mudah & Terpercaya
                        </Text>

                        <View
                            style={
                                styles.brandLine
                            }
                        />

                        <Text
                            style={
                                styles.brandDescription
                            }
                        >
                            Kelola kendaraan, booking
                            service, dan pantau riwayat
                            perawatan kendaraan Anda
                            dalam satu aplikasi.
                        </Text>

                        {/* FEATURES */}
                        <View
                            style={
                                styles.brandFeatures
                            }
                        >

                        </View>

                    </View>

                    <Text
                        style={
                            styles.brandCopyright
                        }
                    >
                        © 2026 AutoCare
                    </Text>

                </ImageBackground>
            </KeyboardAvoidingView>
        );
    }

    /*
    ============================================================
    MOBILE
    ============================================================
    */

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <ImageBackground
                source={require("../../assets/autocare-login-bg.jpg")}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.overlay} />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <BlurView
                        intensity={50}
                        tint="dark"
                        style={styles.loginCard}
                    >
                        <View style={styles.mobileGlassInner}>

                            {/* LOGO */}
                        <View style={styles.logoRow}>
                            <View style={styles.logoWrapper}>
                                <Image
                                    source={require("../../assets/images/autocare-logo.png")}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                            {/* TITLE */}
                            <Text style={styles.title}>
                                Selamat Datang
                            </Text>

                            <Text style={styles.subtitle}>
                                Masuk ke akun Anda untuk melanjutkan
                            </Text>

                            {/* ERROR */}
                            {errorMessage ? (
                                <View
                                    style={
                                        styles.errorBox
                                    }
                                >
                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={16}
                                        color="#E00000"
                                    />

                                    <Text
                                        style={
                                            styles.errorText
                                        }
                                    >
                                        {errorMessage}
                                    </Text>
                                </View>
                            ) : null}

                            {/* EMAIL */}
                            <View
                                style={
                                    styles.inputContainer
                                }
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={19}
                                    color="#FFFFFF"
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan Email atau no. HP"
                                    placeholderTextColor="#FFFFFF"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                    onSubmitEditing={() => {
                                        if (password) handleLogin();
                                    }}
                                />
                            </View>

                            {/* PASSWORD */}
                            <View
                                style={
                                    styles.inputContainer
                                }
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={19}
                                    color="#FFFFFF"
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#FFFFFF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={
                                        !showPassword
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="go"
                                    onSubmitEditing={handleLogin}
                                />

                                <TouchableOpacity
                                    onPress={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                >
                                    <Ionicons
                                        name={
                                            showPassword
                                                ? "eye-outline"
                                                : "eye-off-outline"
                                        }
                                        size={20}
                                        color="#FFFFFF"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* OPTIONS */}
                            <View
                                style={
                                    styles.optionRow
                                }
                            >
                                <Pressable
                                    style={
                                        styles.rememberContainer
                                    }
                                    onPress={() =>
                                        setIngatSaya(
                                            !ingatSaya
                                        )
                                    }
                                >
                                    <View
                                        style={[
                                            styles.checkbox,
                                            ingatSaya &&
                                                styles.checkboxActive,
                                        ]}
                                    >
                                        {ingatSaya && (
                                            <Text
                                                style={
                                                    styles.checkmark
                                                }
                                            >
                                                ✓
                                            </Text>
                                        )}
                                    </View>

                                    <Text
                                        style={
                                            styles.rememberText
                                        }
                                    >
                                        Ingat saya
                                    </Text>
                                </Pressable>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push(
                                            "/lupa-password"
                                        )
                                    }
                                >
                                    <Text
                                        style={
                                            styles.forgotText
                                        }
                                    >
                                        Lupa password?
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* LOGIN */}
                            <TouchableOpacity
                                style={[
                                    styles.loginButton,
                                    loading &&
                                        styles.loginButtonDisabled,
                                ]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator
                                        color="#FFFFFF"
                                        size="small"
                                    />
                                ) : (
                                    <>
                                        <Text
                                            style={
                                                styles.loginText
                                            }
                                        >
                                            Masuk
                                        </Text>

                                        <Ionicons
                                            name="arrow-forward"
                                            size={17}
                                            color="#FFFFFF"
                                        />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* OR */}
                            <View
                                style={
                                    styles.orContainer
                                }
                            >
                                <View
                                    style={
                                        styles.orLine
                                    }
                                />

                                <Text
                                    style={
                                        styles.orText
                                    }
                                >
                                    atau
                                </Text>

                                <View
                                    style={
                                        styles.orLine
                                    }
                                />
                            </View>

                            {/* GOOGLE */}
                            <TouchableOpacity
                                style={
                                    styles.googleButton
                                }
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={
                                        styles.googleG
                                    }
                                >
                                    G
                                </Text>

                                <Text
                                    style={
                                        styles.googleText
                                    }
                                >
                                    Masuk dengan Google
                                </Text>
                            </TouchableOpacity>

                            {/* REGISTER */}
                            <View
                                style={
                                    styles.registerContainer
                                }
                            >
                                <Text
                                    style={
                                        styles.registerText
                                    }
                                >
                                    Belum punya akun?
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push(
                                            "/daftar"
                                        )
                                    }
                                >
                                    <Text
                                        style={
                                            styles.registerLink
                                        }
                                    >
                                        Daftar
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.footer}>
                                AutoCare • Vehicle Service
                            </Text>

                        </View>
                    </BlurView>
                </ScrollView>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    /*
    ============================================================
    DESKTOP CONTAINER
    ============================================================
    */

    desktopContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#7A0000",
    },

    /*
    ============================================================
    DESKTOP LEFT
    ============================================================
    */

    desktopLeft: {
        flex: 1.05,
        minWidth: 500,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#7A0000",
    },

    desktopLeftScroll: {
        flex: 1,
        zIndex: 10,
    },

    desktopLeftContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 45,
        paddingVertical: 40,
    },

    leftOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(74, 4, 4, 0.25)",
    },

    leftGrid: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.12,
    },

    gridVertical: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: "#FFFFFF",
    },

    gridHorizontal: {
        position: "absolute",
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "#FFFFFF",
    },

    leftCircleOne: {
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: 250,
        backgroundColor:
            "rgba(255,255,255,0.045)",
        top: -250,
        left: -220,
    },

    leftCircleTwo: {
        position: "absolute",
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor:
            "rgba(220,0,0,0.20)",
        bottom: -160,
        right: -130,
    },

    leftCircleThree: {
        position: "absolute",
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.12)",
        top: "15%",
        right: "8%",
    },
    

    /*
    ============================================================
    DESKTOP GLASS CARD
    ============================================================
    */

    desktopLoginCard: {
        width: "100%",
        maxWidth: 480,
        borderRadius: 28,
        overflow: "hidden",

        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.35)",

        backgroundColor:
            "rgba(255,255,255,0.12)",

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 15,
        },
        shadowOpacity: 0.30,
        shadowRadius: 25,
        elevation: 15,
    },

    desktopGlassInner: {
        paddingHorizontal: 38,
        paddingTop: 35,
        paddingBottom: 30,

        backgroundColor:
            "rgba(255,255,255,0.07)",
    },

    desktopLogoBox: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor:
            "rgba(255,255,255,0.96)",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        padding: 8,
        marginBottom: 16,
    },

    desktopLogo: {
        width: "100%",
        height: "100%",
    },

    desktopTitle: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 29,
        fontWeight: "900",
        textAlign: "center",
    },

    desktopSubtitle: {
        fontFamily: "Poppins_400Regular",
        color: "rgba(255,255,255,0.72)",
        fontSize: 13,
        textAlign: "center",
        marginTop: 7,
        marginBottom: 25,
    },

    desktopInputLabel: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
        marginBottom: 7,
    },

    desktopInputContainer: {
        fontFamily: "Poppins_400Regular",
        height: 53,
        borderRadius: 14,

        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.35)",

        backgroundColor:
            "rgba(255,255,255,0.90)",

        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
    },

    desktopInput: {
        fontFamily: "Poppins_400Regular",
        flex: 1,
        height: "100%",
        marginLeft: 10,
        paddingRight: 35,

        color: "#222222",
        fontSize: 13,

        outlineStyle: "none",
        backgroundColor: "transparent",
    },

    passwordEye: {
        position: "absolute",
        right: 12,
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },

    desktopOptionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        marginBottom: 20,
    },

    desktopForgot: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "800",
    },

    desktopLoginButton: {
        height: 53,
        borderRadius: 14,

        backgroundColor: "#D71920",

        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",

        gap: 8,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 6,
    },

    desktopLoginText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },

    desktopOrContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 19,
    },

    desktopOrLine: {
        flex: 1,
        height: 1,
        backgroundColor:
            "rgba(255,255,255,0.30)",
    },

    desktopOrText: {
        fontFamily: "Poppins_400Regular",
        color:
            "rgba(255,255,255,0.75)",
        fontSize: 11,
        marginHorizontal: 10,
    },

    desktopGoogleButton: {
        height: 48,
        borderRadius: 13,

        backgroundColor: "#FFFFFF",

        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",

        borderWidth: 1,
        borderColor: "#DDDDDD",
    },

    desktopRegister: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 21,
    },

    desktopRegisterText: {
        fontFamily: "Poppins_400Regular",
        color:
            "rgba(255,255,255,0.70)",
        fontSize: 11,
    },

    desktopRegisterLink: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "900",
        marginLeft: 5,
    },

    desktopFooter: {
        fontFamily: "Poppins_400Regular",
        textAlign: "center",
        color:
            "rgba(255,255,255,0.40)",
        fontSize: 9,
        marginTop: 18,
    },

    /*
    ============================================================
    DESKTOP RIGHT / AUT0CARE BANNER
    ============================================================
    */

    desktopRight: {
        flex: 0.95,
        minWidth: 430,

        position: "relative",
        overflow: "hidden",

        justifyContent: "center",
        alignItems: "center",
    },

    desktopRightImage: {
        resizeMode: "cover",
    },

    rightOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor:
            "rgba(74,4,4,0.48)",
    },

    rightCircleOne: {
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: 250,

        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.12)",

        top: -250,
        right: -180,
    },

    rightCircleTwo: {
        position: "absolute",
        width: 330,
        height: 330,
        borderRadius: 165,

        backgroundColor:
            "rgba(120,0,0,0.25)",

        bottom: -150,
        left: -120,
    },

    rightContent: {
        width: "82%",
        maxWidth: 520,

        alignItems: "center",

        zIndex: 5,
    },

    brandLogoBox: {
        width: 125,
        height: 125,
        borderRadius: 36,

        backgroundColor:
            "rgba(255,255,255,0.96)",

        justifyContent: "center",
        alignItems: "center",

        padding: 16,

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.28,
        shadowRadius: 18,
        elevation: 10,
    },

    brandLogo: {
        width: "100%",
        height: "100%",
    },

    brandTitle: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",
        fontSize: 42,
        fontWeight: "900",
        marginTop: 27,
    },

    brandSubtitle: {
        fontFamily: "Poppins_600SemiBold",
        color:
            "rgba(255,255,255,0.84)",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 5,
    },

    brandLine: {
        width: 55,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#E31B23",
        marginTop: 23,
        marginBottom: 20,
    },

    brandDescription: {
        fontFamily: "Poppins_400Regular",
        maxWidth: 430,

        textAlign: "center",

        color:
            "rgba(255,255,255,0.72)",

        fontSize: 13,
        lineHeight: 21,
    },

    brandFeatures: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",

        flexWrap: "wrap",

        gap: 10,

        marginTop: 28,
    },

    brandFeature: {
        flexDirection: "row",
        alignItems: "center",

        paddingHorizontal: 13,
        paddingVertical: 10,

        borderRadius: 12,

        backgroundColor:
            "rgba(255,255,255,0.10)",

        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.14)",
    },

    brandFeatureText: {
        fontFamily: "Poppins_800ExtraBold",
        color:
            "rgba(255,255,255,0.86)",

        fontSize: 10,
        fontWeight: "800",

        marginLeft: 7,
    },

    brandCopyright: {
        fontFamily: "Poppins_400Regular",
        position: "absolute",
        bottom: 20,

        color:
            "rgba(255,255,255,0.48)",

        fontSize: 9,
    },

    /*
    ============================================================
    MOBILE
    ============================================================
    */

    container: {
        flex: 1,
        backgroundColor: "#111111",
    },

    background: {
        flex: 1,
        width: "100%",
        height: "100%",
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor:
            "rgba(0,0,0,0.38)",
    },

    scrollContent: {
        flexGrow: 1,

        justifyContent: "center",
        alignItems: "center",

        paddingHorizontal: 18,
        paddingVertical: 30,
    },

    loginCard: {
        width: "100%",
        maxWidth: 430,

        borderRadius: 24,
        overflow: "hidden",

        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.35)",

        backgroundColor:
            "rgba(255,255,255,0.10)",

        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
    },

    mobileGlassInner: {
        paddingHorizontal: 26,
        paddingTop: 30,
        paddingBottom: 25,

        backgroundColor:
            "rgba(255,255,255,0.06)",
    },

    logoContainer: {
        width: "100%",
        height: 85,

        justifyContent: "center",
        alignItems: "center",

        marginBottom: 8,
        borderRadius: 20,
    },
    logoRow: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    logoWrapper: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    logo: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        resizeMode: 'contain',
    },

    title: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 22,
        fontWeight: "800",

        color: "#FFFFFF",

        textAlign: "center",

        marginBottom: 5,
    },

    subtitle: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,

        color:
            "rgba(255,255,255,0.75)",

        textAlign: "center",

        marginBottom: 22,
    },

    errorBox: {
        backgroundColor: "#FFF1F1",

        borderWidth: 1,
        borderColor: "#FFD0D0",

        borderRadius: 10,

        paddingVertical: 10,
        paddingHorizontal: 11,

        marginBottom: 12,

        flexDirection: "row",
        alignItems: "center",
    },

    errorText: {
        fontFamily: "Poppins_400Regular",
        color: "#E00000",
        fontSize: 11,

        marginLeft: 6,

        flex: 1,
    },

    inputContainer: {
        fontFamily: "Poppins_400Regular",
        height: 50,

        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.40)",

        borderRadius: 13,

        flexDirection: "row",
        alignItems: "center",

        paddingHorizontal: 13,

        backgroundColor:
            "rgba(255,255,255,0.12)",

        marginBottom: 11,
    },

    input: {
        fontFamily: "Poppins_400Regular",
        flex: 1,

        marginLeft: 10,

        height: 50,

        fontSize: 12,

        color: "#FFFFFF",

        paddingVertical: 0,
    },

    optionRow: {
        flexDirection: "row",

        justifyContent:
            "space-between",

        alignItems: "center",

        marginBottom: 20,
    },

    rememberContainer: {
        flexDirection: "row",
        alignItems: "center",

        paddingLeft: 5,
    },

    checkbox: {
        width: 14,
        height: 14,

        borderWidth: 1,
        borderColor: "#F20D18",

        borderRadius: 4,

        marginRight: 6,

        justifyContent: "center",
        alignItems: "center",
    },

    checkboxActive: {
        backgroundColor: "#F20D18",
    },

    checkmark: {
        fontFamily: "Poppins_700Bold",
        color: "#FFFFFF",

        fontSize: 9,

        lineHeight: 10,

        fontWeight: "bold",
    },

    rememberText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,
        color: "#FFFFFF",
    },

    forgotText: {
        fontFamily: "Poppins_700Bold",
        fontSize: 11,

        color: "#FFFFFF",

        fontWeight: "700",
    },

    loginButton: {
        height: 50,

        borderRadius: 13,

        backgroundColor: "#C2030C",

        justifyContent: "center",
        alignItems: "center",

        flexDirection: "row",

        gap: 5,

        shadowColor: "#F20D18",

        shadowOffset: {
            width: 0,
            height: 5,
        },

        shadowOpacity: 0.25,
        shadowRadius: 8,

        elevation: 5,
    },

    loginButtonDisabled: {
        opacity: 0.5,
    },

    loginText: {
        fontFamily: "Poppins_800ExtraBold",
        color: "#FFFFFF",

        fontSize: 13,

        fontWeight: "800",
    },

    orContainer: {
        flexDirection: "row",

        alignItems: "center",

        marginVertical: 18,
    },

    orLine: {
        flex: 1,

        height: 1,

        backgroundColor:
            "rgba(255,255,255,0.30)",
    },

    orText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,

        color: "#FFFFFF",

        marginHorizontal: 10,
    },

    googleButton: {
        height: 48,

        borderWidth: 1,
        borderColor: "#DDDDDD",

        borderRadius: 13,

        flexDirection: "row",

        justifyContent: "center",
        alignItems: "center",

        backgroundColor: "#FFFFFF",
    },

    googleG: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 20,

        fontWeight: "800",

        color: "#4285F4",

        marginRight: 8,
    },

    googleText: {
        fontFamily: "Poppins_600SemiBold",
        fontSize: 12,

        color: "#555555",

        fontWeight: "600",
    },

    registerContainer: {
        flexDirection: "row",

        justifyContent: "center",
        alignItems: "center",

        marginTop: 22,
    },

    registerText: {
        fontFamily: "Poppins_400Regular",
        fontSize: 12,

        color:
            "rgba(255,255,255,0.75)",
    },

    registerLink: {
        fontFamily: "Poppins_800ExtraBold",
        fontSize: 12,

        color: "#FFFFFF",

        fontWeight: "800",

        marginLeft: 4,
    },

    footer: {
        fontFamily: "Poppins_400Regular",
        textAlign: "center",

        fontSize: 9,

        color:
            "rgba(255,255,255,0.45)",

        marginTop: 18,
    },
});