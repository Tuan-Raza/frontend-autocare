import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
/**
 * RootLayout AutoCare
 * Mengatur animasi transisi navigasi terpusat untuk seluruh screen.
 * 
 * Jenis Animasi:
 * 1. Bottom Navigation Tabs (home, kendaraan, booking, profil): Fade transition (250ms).
 * 2. Halaman Detail & Sub-pages: Slide dari kanan ke kiri (slide_from_right, 280ms)
 *    dan otomatis reverse slide saat kembali ke halaman sebelumnya.
 * 3. Auth & Onboarding: Fade / Slide yang halus dan modern (250-280ms).
 * 4. Success / Feedback: Fade (280ms).
 */
export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
        Poppins_800ExtraBold,
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    // Default transisi untuk sub-page/detail: slide dari kanan, reverse slide saat kembali
                    animation: "slide_from_right",
                    animationDuration: 280,
                    gestureEnabled: true,
                    contentStyle: {
                        backgroundColor: "#FFFFFF",
                    },
                }}
            >
                {/* ========================================================= */}
                {/* 1. SPLASH & AUTH SCREENS                                 */}
                {/* ========================================================= */}
                <Stack.Screen
                    name="index"
                    options={{
                        animation: "fade",
                        animationDuration: 250,
                    }}
                />
                <Stack.Screen
                    name="login"
                    options={{
                        animation: "fade",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="daftar"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="lupa-password"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="reset-password"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="verifikasi-email"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="verifikasi-otp"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="logout-animation"
                    options={{
                        animation: "fade",
                        animationDuration: 250,
                    }}
                />

                {/* ========================================================= */}
                {/* 2. MAIN BOTTOM NAVIGATION TABS (SMOOTH FADE)              */}
                {/* ========================================================= */}
                <Stack.Screen
                    name="home"
                    options={{
                        animation: "fade",
                        animationDuration: 250,
                    }}
                />
                <Stack.Screen
                    name="kendaraan"
                    options={{
                        animation: "fade",
                        animationDuration: 250,
                    }}
                />
                <Stack.Screen
                    name="booking"
                    options={{
                        animation: "fade",
                        animationDuration: 250,
                    }}
                />
                <Stack.Screen
                    name="profil"
                    options={{
                        animation: "fade",
                        animationDuration: 250,
                    }}
                />

                {/* ========================================================= */}
                {/* 3. DETAIL & SUB-PAGES (SLIDE FROM RIGHT / REVERSE)        */}
                {/* ========================================================= */}
                <Stack.Screen
                    name="booking-detail"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="booking-step2"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="booking-step3"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="booking-step4"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="payment"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="booking-berhasil"
                    options={{
                        animation: "fade",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="tambah-kendaraan"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="edit-profil"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="notifikasi"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="bantuan"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="keamanan"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="ubah-email"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="lokasi-bengkel"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="riwayat-servis"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />
                <Stack.Screen
                    name="riwayat-booking"
                    options={{
                        animation: "slide_from_right",
                        animationDuration: 280,
                    }}
                />

                {/* ========================================================= */}
                {/* 4. ADMIN PORTAL                                          */}
                {/* ========================================================= */}
                <Stack.Screen
                    name="admin"
                    options={{
                        animation: "fade",
                        animationDuration: 280,
                    }}
                />
            </Stack>
        </SafeAreaProvider>
    );
}
