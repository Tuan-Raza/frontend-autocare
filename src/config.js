import { Platform } from "react-native";
import Constants from "expo-constants";

// Dapatkan host IP mesin dev secara dinamis dari host Expo jika tersedia
const getDevHost = () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.hostname) {
      return window.location.hostname;
    }
    return "localhost";
  }

  // Ambil hostUri dari expoConfig / manifest jika sedang berjalan via Expo Go atau dev client
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip) return ip;
  }

  // Fallback IP LAN laptop saat ini (Wi-Fi 192.168.1.13)
  return "192.168.1.13";
};

const devHost = getDevHost();

// Gunakan __DEV__ bawaan React Native/Expo
export const API_URL = __DEV__
  ? `http://${devHost}:5000`
  : "https://apk-autocare.online"; // Domain publik saat aplikasi dirilis/build APK
