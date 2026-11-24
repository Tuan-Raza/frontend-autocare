import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";

import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_URL } from "../config";

const KOTA_BY_PROFINSI = {
    "DKI JAKARTA": [
        "Jakarta Pusat",
        "Jakarta Utara",
        "Jakarta Barat",
        "Jakarta Selatan",
        "Jakarta Timur",
        "Kepulauan Seribu",
    ],
    "JAWA BARAT": [
        "Kabupaten Karawang",
        "Kota Bandung",
        "Kabupaten Bandung",
        "Kabupaten Bandung Barat",
        "Kota Bekasi",
        "Kabupaten Bekasi",
        "Kota Bogor",
        "Kabupaten Bogor",
        "Kota Depok",
        "Kota Cirebon",
        "Kabupaten Cirebon",
        "Kota Sukabumi",
        "Kabupaten Sukabumi",
        "Kota Tasikmalaya",
        "Kabupaten Tasikmalaya",
        "Kota Cimahi",
        "Kota Banjar",
        "Kabupaten Garut",
        "Kabupaten Indramayu",
        "Kabupaten Kuningan",
        "Kabupaten Majalengka",
        "Kabupaten Pangandaran",
        "Kabupaten Purwakarta",
        "Kabupaten Subang",
        "Kabupaten Sumedang",
        "Kabupaten Cianjur",
        "Kabupaten Ciamis",
    ],
    BANTEN: [
        "Kota Tangerang",
        "Kota Tangerang Selatan",
        "Kabupaten Tangerang",
        "Kota Serang",
        "Kabupaten Serang",
        "Kota Cilegon",
        "Kabupaten Lebak",
        "Kabupaten Pandeglang",
    ],
    "JAWA TENGAH": [
        "Kota Semarang",
        "Kabupaten Semarang",
        "Kota Surakarta (Solo)",
        "Kota Magelang",
        "Kabupaten Magelang",
        "Kota Pekalongan",
        "Kabupaten Pekalongan",
        "Kota Salatiga",
        "Kota Tegal",
        "Kabupaten Tegal",
        "Kabupaten Banyumas",
        "Kabupaten Cilacap",
        "Kabupaten Demak",
        "Kabupaten Jepara",
        "Kabupaten Kendal",
        "Kabupaten Klaten",
        "Kabupaten Kudus",
        "Kabupaten Pati",
        "Kabupaten Purbalingga",
        "Kabupaten Purworejo",
        "Kabupaten Sukoharjo",
    ],
    "JAWA TIMUR": [
        "Kota Surabaya",
        "Kota Malang",
        "Kabupaten Malang",
        "Kota Batu",
        "Kota Kediri",
        "Kabupaten Kediri",
        "Kota Madiun",
        "Kabupaten Madiun",
        "Kota Mojokerto",
        "Kabupaten Mojokerto",
        "Kota Pasuruan",
        "Kabupaten Pasuruan",
        "Kota Probolinggo",
        "Kabupaten Probolinggo",
        "Kota Blitar",
        "Kabupaten Blitar",
        "Kabupaten Sidoarjo",
        "Kabupaten Gresik",
        "Kabupaten Jember",
        "Kabupaten Banyuwangi",
    ],
    LAMPUNG: [
        "Kota Bandar Lampung",
        "Kota Metro",
        "Kabupaten Lampung Selatan",
        "Kabupaten Lampung Tengah",
        "Kabupaten Lampung Utara",
        "Kabupaten Lampung Timur",
        "Kabupaten Lampung Barat",
        "Kabupaten Pesawaran",
        "Kabupaten Pringsewu",
        "Kabupaten Tanggamus",
        "Kabupaten Tulang Bawang",
        "Kabupaten Way Kanan",
    ],
    "SUMATRA SELATAN": [
        "Kota Palembang",
        "Kota Prabumulih",
        "Kota Pagar Alam",
        "Kota Lubuklinggau",
        "Kabupaten Banyuasin",
        "Kabupaten Musi Banyuasin",
        "Kabupaten Muara Enim",
        "Kabupaten Ogan Komering Ilir",
        "Kabupaten Ogan Komering Ulu",
    ],
    "SUMATERA BARAT": [
        "Kota Padang",
        "Kota Bukittinggi",
        "Kota Payakumbuh",
        "Kota Padang Panjang",
        "Kota Pariaman",
        "Kota Sawahlunto",
        "Kota Solok",
        "Kabupaten Agam",
        "Kabupaten Lima Puluh Kota",
        "Kabupaten Padang Pariaman",
        "Kabupaten Pasaman",
        "Kabupaten Pesisir Selatan",
        "Kabupaten Solok",
        "Kabupaten Tanah Datar",
    ],
    "SUMATERA UTARA": [
        "Kota Medan",
        "Kota Binjai",
        "Kota Pematangsiantar",
        "Kota Tebing Tinggi",
        "Kota Tanjungbalai",
        "Kota Sibolga",
        "Kota Padangsidimpuan",
        "Kabupaten Deli Serdang",
        "Kabupaten Langkat",
        "Kabupaten Serdang Bedagai",
        "Kabupaten Asahan",
        "Kabupaten Karo",
        "Kabupaten Toba",
    ],
    "PEKAN BARU": [
        "Pekanbaru Kota",
        "Marpoyan Damai",
        "Tampan / Bina Widya",
        "Sukajadi",
        "Sail",
        "Tenayan Raya",
        "Rumbai",
    ],
    "BANGKA BELITUNG": [
        "Kota Pangkalpinang",
        "Kabupaten Bangka",
        "Kabupaten Bangka Barat",
        "Kabupaten Bangka Tengah",
        "Kabupaten Bangka Selatan",
        "Kabupaten Belitung",
        "Kabupaten Belitung Timur",
    ],
    JAMBI: [
        "Kota Jambi",
        "Kota Sungai Penuh",
        "Kabupaten Batanghari",
        "Kabupaten Bungo",
        "Kabupaten Kerinci",
        "Kabupaten Merangin",
        "Kabupaten Muaro Jambi",
        "Kabupaten Sarolangun",
        "Kabupaten Tanjung Jabung Barat",
        "Kabupaten Tanjung Jabung Timur",
        "Kabupaten Tebo",
    ],
    BALI: [
        "Baki",
        "Gedongan",
        "Gentan",
        "Jetis",
        "Kudu",
        "Menjing",
        "Ngrombo",
        "Siwalan",
        "Warungboto",
    ],
    NTT: [
        "Kota Kupang",
        "Kabupaten Kupang",
        "Kabupaten Ende",
        "Kabupaten Flores Timur",
        "Kabupaten Manggarai",
        "Kabupaten Manggarai Barat",
        "Kabupaten Ngada",
        "Kabupaten Sikka",
        "Kabupaten Sumba Timur",
        "Kabupaten Timor Tengah Selatan",
        "Kabupaten Timor Tengah Utara",
    ],
    NTB: [
        "Kota Mataram",
        "Kota Bima",
        "Kabupaten Lombok Barat",
        "Kabupaten Lombok Tengah",
        "Kabupaten Lombok Timur",
        "Kabupaten Lombok Utara",
        "Kabupaten Sumbawa",
        "Kabupaten Sumbawa Barat",
        "Kabupaten Bima",
        "Kabupaten Dompu",
    ],
    "MALUKU UTARA": [
        "Kota Ternate",
        "Kota Tidore Kepulauan",
        "Kabupaten Halmahera Barat",
        "Kabupaten Halmahera Tengah",
        "Kabupaten Halmahera Timur",
        "Kabupaten Halmahera Selatan",
        "Kabupaten Halmahera Utara",
        "Kabupaten Kepulauan Sula",
        "Kabupaten Pulau Morotai",
        "Kabupaten Pulau Taliabu",
    ],
    "SULAWESI SELATAN": [
        "Kota Makassar",
        "Kota Parepare",
        "Kota Palopo",
        "Kabupaten Bone",
        "Kabupaten Bulukumba",
        "Kabupaten Gowa",
        "Kabupaten Maros",
        "Kabupaten Pinrang",
        "Kabupaten Sinjai",
        "Kabupaten Takalar",
        "Kabupaten Wajo",
    ],
    "SULAWESI TENGAH": [
        "Kota Palu",
        "Kabupaten Banggai",
        "Kabupaten Banggai Kepulauan",
        "Kabupaten Banggai Laut",
        "Kabupaten Donggala",
        "Kabupaten Morowali",
        "Kabupaten Morowali Utara",
        "Kabupaten Parigi Moutong",
        "Kabupaten Poso",
        "Kabupaten Sigi",
        "Kabupaten Tolitoli",
    ],
    "SULAWESI UTARA": [
        "Kota Manado",
        "Kota Bitung",
        "Kota Kotamobagu",
        "Kota Tomohon",
        "Kabupaten Minahasa",
        "Kabupaten Minahasa Selatan",
        "Kabupaten Minahasa Utara",
        "Kabupaten Bolaang Mongondow",
        "Kabupaten Kepulauan Sangihe",
        "Kabupaten Kepulauan Talaud",
    ],
};

const PROFINSI_LIST = Object.keys(KOTA_BY_PROFINSI);

export default function Daftar() {
    const [nama, setNama] = useState("");
    const [email, setEmail] = useState("");
    const [noHp, setNoHp] = useState("");
    const [profinsi, setProfinsi] = useState("");
    const [kota, setKota] = useState("");
    const [password, setPassword] = useState("");
    const [konfirmasiPassword, setKonfirmasiPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showKonfirmasiPassword, setShowKonfirmasiPassword] = useState(false);

    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState("profinsi"); // "profinsi" | "kota"

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const kotaOptions = profinsi ? KOTA_BY_PROFINSI[profinsi] || [] : [];

    const openPicker = (type) => {
        if (type === "kota" && !profinsi) {
            setErrorMessage("Pilih profinsi domisili terlebih dahulu.");
            return;
        }
        setErrorMessage("");
        setPickerType(type);
        setPickerVisible(true);
    };

    const handleSelectOption = (value) => {
        if (pickerType === "profinsi") {
            setProfinsi(value);
            setKota("");
        } else {
            setKota(value);
        }
        setPickerVisible(false);
    };

    const handleDaftar = async () => {
        Keyboard.dismiss();

        setErrorMessage("");
        setSuccessMessage("");

        // Validasi
        if (
            !nama.trim() ||
            !email.trim() ||
            !noHp.trim() ||
            !profinsi ||
            !kota ||
            !password ||
            !konfirmasiPassword
        ) {
            setErrorMessage("Semua field wajib diisi.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim().toLowerCase())) {
            setErrorMessage("Format email tidak valid.");
            return;
        }

        if (password.length < 8) {
            setErrorMessage("Password minimal 8 karakter.");
            return;
        }

        if (!/\d/.test(password)) {
            setErrorMessage(
                "Password harus memiliki minimal 1 angka."
            );
            return;
        }

        if (password !== konfirmasiPassword) {
            setErrorMessage(
                "Konfirmasi password tidak sama."
            );
            return;
        }

        try {
            setLoading(true);

            const emailClean = email.trim().toLowerCase();

            const response = await fetch(
                `${API_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nama: nama.trim(),
                        email: emailClean,
                        noHp: noHp.trim(),
                        profinsi: profinsi,
                        kota: kota,
                        password: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setErrorMessage(
                    data.message ||
                        "Registrasi gagal. Silakan coba lagi."
                );
                return;
            }

            // OTP berhasil dibuat / dikirim
            setSuccessMessage(
                "Pendaftaran berhasil! Kode OTP verifikasi telah dikirimkan ke email Anda. Silakan periksa inbox/spam email Anda."
            );

            // Pindah ke halaman verifikasi dengan email & initialOtp
            setTimeout(() => {
                router.push({
                    pathname: "/verifikasi-email",
                    params: {
                        email: emailClean,
                    },
                });
            }, 700);

        } catch (error) {
            console.error("Register Error:", error);

            setErrorMessage(
                "Tidak dapat terhubung ke server AutoCare."
            );
        } finally {
            setLoading(false);
        }
    };

    const isFormFilled =
        nama.trim().length > 0 &&
        noHp.trim().length > 0 &&
        profinsi.length > 0 &&
        kota.length > 0 &&
        email.trim().length > 0 &&
        password.length > 0 &&
        konfirmasiPassword.length > 0;

    const activeOptions = pickerType === "profinsi" ? PROFINSI_LIST : kotaOptions;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER MERAH MELENGKUNG */}
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.replace("/login")}
                        activeOpacity={0.75}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Daftar</Text>

                    <View style={styles.headerSpacer} />
                </View>

                {/* FORM AREA */}
                <View style={styles.formContainer}>
                    {/* ERROR */}
                    {errorMessage !== "" && (
                        <View style={styles.errorBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={18}
                                color="#B30000"
                            />
                            <Text style={styles.errorText}>
                                {errorMessage}
                            </Text>
                        </View>
                    )}

                    {/* SUCCESS */}
                    {successMessage !== "" && (
                        <View style={styles.successBox}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={18}
                                color="#15803D"
                            />
                            <Text style={styles.successText}>
                                {successMessage}
                            </Text>
                        </View>
                    )}

                    {/* NAMA LENGKAP */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nama Lengkap"
                            placeholderTextColor="#68707E"
                            value={nama}
                            onChangeText={setNama}
                            autoCapitalize="words"
                            autoComplete="off"
                        />
                    </View>

                    {/* NOMOR HANDPHONE */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nomor Handphone"
                            placeholderTextColor="#68707E"
                            value={noHp}
                            onChangeText={setNoHp}
                            keyboardType="phone-pad"
                            autoComplete="tel"
                            textContentType="telephoneNumber"
                        />
                    </View>

                    {/* PROFINSI DOMISILI */}
                    <TouchableOpacity
                        style={styles.inputContainer}
                        onPress={() => openPicker("profinsi")}
                        activeOpacity={0.75}
                    >
                        <Text
                            style={[
                                styles.pickerText,
                                !profinsi && styles.placeholderText,
                            ]}
                            numberOfLines={1}
                        >
                            {profinsi || "Provinsi Domisili"}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={18}
                            color="#68707E"
                        />
                    </TouchableOpacity>

                    {/* KOTA DOMISILI */}
                    <TouchableOpacity
                        style={[
                            styles.inputContainer,
                            !profinsi && styles.disabledField,
                        ]}
                        onPress={() => openPicker("kota")}
                        activeOpacity={0.75}
                    >
                        <Text
                            style={[
                                styles.pickerText,
                                !kota && styles.placeholderText,
                            ]}
                            numberOfLines={1}
                        >
                            {kota || "Kota Domisili"}
                        </Text>
                        <Ionicons
                            name="chevron-down"
                            size={18}
                            color="#68707E"
                        />
                    </TouchableOpacity>

                    {/* EMAIL */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#68707E"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="off"
                        />
                    </View>

                    {/* PASSWORD */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#68707E"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            textContentType="newPassword"
                        />

                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeBtn}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons
                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                size={20}
                                color="#68707E"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* KONFIRMASI PASSWORD */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Konfirmasi Password"
                            placeholderTextColor="#68707E"
                            value={konfirmasiPassword}
                            onChangeText={setKonfirmasiPassword}
                            secureTextEntry={!showKonfirmasiPassword}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            textContentType="newPassword"
                        />

                        <TouchableOpacity
                            onPress={() =>
                                setShowKonfirmasiPassword(!showKonfirmasiPassword)
                            }
                            style={styles.eyeBtn}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons
                                name={
                                    showKonfirmasiPassword
                                        ? "eye-outline"
                                        : "eye-off-outline"
                                }
                                size={20}
                                color="#68707E"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* BUTTON LANJUT */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            isFormFilled && styles.submitButtonActive,
                            loading && styles.disabledButton,
                        ]}
                        onPress={handleDaftar}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                            />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                Lanjut
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* LOGIN LINK */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>
                            Sudah punya akun?
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.replace("/login")}
                        >
                            <Text style={styles.loginLink}>
                                Login
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* MODAL PILIH PROFINSI / KOTA */}
            <Modal
                visible={pickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {pickerType === "profinsi"
                                    ? "Pilih Profinsi Domisili"
                                    : `Pilih Kota (${profinsi})`}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setPickerVisible(false)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="close" size={22} color="#1F2937" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.modalList}
                            showsVerticalScrollIndicator={false}
                        >
                            {activeOptions.map((item) => {
                                const isSelected =
                                    pickerType === "profinsi"
                                        ? profinsi === item
                                        : kota === item;
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        style={[
                                            styles.modalOption,
                                            isSelected && styles.modalOptionActive,
                                        ]}
                                        onPress={() => handleSelectOption(item)}
                                    >
                                        <Text
                                            style={[
                                                styles.modalOptionText,
                                                isSelected &&
                                                    styles.modalOptionTextActive,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons
                                                name="checkmark"
                                                size={18}
                                                color="#A80000"
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    scrollContent: {
        flexGrow: 1,
        backgroundColor: "#FFFFFF",
        paddingBottom: 36,
    },

    topHeader: {
        backgroundColor: "#A80000",
        paddingTop: Platform.OS === "ios" ? 54 : 36,
        paddingBottom: 22,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    backButton: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "flex-start",
    },

    headerTitle: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },

    headerSpacer: {
        width: 32,
    },

    formContainer: {
        paddingHorizontal: 28,
        paddingTop: 28,
    },

    errorBox: {
        minHeight: 42,
        backgroundColor: "#FFF0F0",
        borderWidth: 1,
        borderColor: "#FFCCCC",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    errorText: {
        flex: 1,
        color: "#B30000",
        fontSize: 12.5,
        fontWeight: "600",
    },

    successBox: {
        minHeight: 42,
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    successText: {
        flex: 1,
        color: "#15803D",
        fontSize: 12.5,
        fontWeight: "600",
    },

    inputContainer: {
        height: 46,
        borderWidth: 1.2,
        borderColor: "#636B78",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 34,
        paddingRight: 14,
        marginBottom: 14,
        backgroundColor: "#FFFFFF",
    },

    disabledField: {
        opacity: 0.65,
    },

    input: {
        flex: 1,
        height: "100%",
        backgroundColor: "transparent",
        fontSize: 13.5,
        color: "#1F2937",
        paddingVertical: 0,
    },

    pickerText: {
        flex: 1,
        fontSize: 13.5,
        color: "#1F2937",
    },

    placeholderText: {
        color: "#68707E",
    },

    eyeBtn: {
        padding: 4,
        marginLeft: 6,
    },

    submitButton: {
        height: 46,
        borderRadius: 8,
        backgroundColor: "#A9A9A9",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 18,
        elevation: 3,
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.16,
        shadowRadius: 3,
    },

    submitButtonActive: {
        backgroundColor: "#A80000",
    },

    disabledButton: {
        opacity: 0.7,
    },

    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 14.5,
        fontWeight: "700",
    },

    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
    },

    loginText: {
        fontSize: 12.5,
        color: "#5C6370",
    },

    loginLink: {
        fontSize: 12.5,
        fontWeight: "700",
        color: "#A80000",
        marginLeft: 5,
    },

    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        paddingHorizontal: 22,
    },

    modalCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        maxHeight: "75%",
        overflow: "hidden",
    },

    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    modalTitle: {
        fontSize: 14.5,
        fontWeight: "700",
        color: "#1F2937",
        flex: 1,
        marginRight: 10,
    },

    modalList: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },

    modalOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
    },

    modalOptionActive: {
        backgroundColor: "#FFF2F2",
    },

    modalOptionText: {
        fontSize: 13.5,
        color: "#1F2937",
    },

    modalOptionTextActive: {
        color: "#A80000",
        fontWeight: "700",
    },
});