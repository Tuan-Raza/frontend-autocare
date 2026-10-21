import { router } from "expo-router";

/**
 * Navigasi mundur yang aman (safe back).
 * Mencegah error "The action 'GO_BACK' was not handled by any navigator"
 * terutama ketika halaman diakses langsung melalui URL browser tanpa stack history.
 *
 * @param {string} fallbackRoute - Rute tujuan jika stack riwayat navigasi kosong (default: "/home")
 */
export function safeBack(fallbackRoute = "/home") {
    try {
        if (router.canGoBack && router.canGoBack()) {
            router.back();
        } else {
            router.replace(fallbackRoute);
        }
    } catch (error) {
        router.replace(fallbackRoute);
    }
}
