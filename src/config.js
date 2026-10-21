import { Platform } from "react-native";

// Gunakan __DEV__ bawaan React Native/Expo
export const API_URL = __DEV__
  ? Platform.OS === "web"
    ? "http://localhost:5000"
    : "http://10.224.109.252:5000" // IP Wi-Fi lokal saat ngoding di laptop
  : "https://apk-autocare.online";  // Domain publik saat aplikasi dirilis/build APK