import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { API_URL } from "../config";
import { getCarImage } from "./carImages";

const COLORS = {
    red: "#C62828",
    redDark: "#A91F1F",
    redLight: "#FFF3F3",
    redSoft: "#FDECEC",
    redBorder: "#F0D0D0",

    white: "#FFFFFF",
    background: "#F6F7F9",

    text: "#222222",
    darkText: "#333333",
    gray: "#777777",
    lightGray: "#999999",

    border: "#E4E5E7",

    green: "#2E9D63",
    greenLight: "#EAF7F0",
    greenBorder: "#C9E8D7",
};

const DATA_KENDARAAN = {
    Toyota: [
        "Agya",
        "Calya",
        "Avanza",
        "Veloz",
        "Kijang Innova",
        "Kijang Innova Zenix",
        "Voxy",
        "Alphard",
        "Vellfire",
        "Rush",
        "Raize",
        "Corolla Cross",
        "Corolla Altis",
        "Yaris",
        "Yaris Cross",
        "Camry",
        "Fortuner",
        "Hilux",
        "HiAce",
        "Dyna",
        "bZ4X",
    ],

    Honda: [
        "Brio",
        "Brio Satya",
        "Brio RS",
        "City",
        "City Hatchback RS",
        "Civic RS",
        "Civic Type R",
        "Accord",
        "HR-V",
        "WR-V",
        "BR-V",
        "BR-V N7X",
        "CR-V",
        "STEP WGN",
        "Prelude",
        "e:N1",
        "Super-ONE",
    ],

    Mazda: [
        "Mazda2 Hatchback",
        "Mazda2 Sedan",
        "Mazda3 Hatchback",
        "Mazda3 Sedan",
        "CX-3",
        "CX-30",
        "CX-5",
        "CX-8",
        "CX-60",
        "CX-80",
        "MX-5",
        "MX-30",
        "Mazda6e",
    ],

    Suzuki: [
        "S-Presso",
        "Ignis",
        "Swift",
        "Baleno",
        "Ertiga",
        "Ertiga Hybrid",
        "XL7",
        "XL7 Hybrid",
        "Grand Vitara",
        "Fronx",
        "Jimny 3-Door",
        "Jimny 5-Door",
        "e VITARA",
        "APV",
        "Carry Pick Up",
    ],

    Mitsubishi: [
        "Xforce",
        "Xforce HEV",
        "Destinator",
        "Xpander",
        "Xpander Cross",
        "Pajero Sport",
        "Triton",
        "L100 EV",
        "L300",
    ],
};

const TAHUN = Array.from(
    { length: 27 },
    (_, index) => String(2026 - index)
);

export default function TambahKendaraan() {
    const { width } = useWindowDimensions();

    const isDesktop = width >= 900;

    const [merek, setMerek] = useState("");
    const [model, setModel] = useState("");
    const [tahun, setTahun] = useState("");
    const [nomorPolisi, setNomorPolisi] = useState("");
    const [kilometer, setKilometer] = useState("");

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const modelList = merek
        ? DATA_KENDARAAN[merek] || []
        : [];

    const openMerek = () => {
        setModalType("merek");
        setModalVisible(true);
    };

    const openModel = () => {
        if (!merek) {
            setError(
                "Silakan pilih merek kendaraan terlebih dahulu."
            );
            return;
        }

        setModalType("model");
        setModalVisible(true);
    };

    const openTahun = () => {
        setModalType("tahun");
        setModalVisible(true);
    };

    const pilihMerek = (value) => {
        setMerek(value);
        setModel("");
        setModalVisible(false);
        setError("");
    };

    const pilihModel = (value) => {
        setModel(value);
        setModalVisible(false);
        setError("");
    };

    const pilihTahun = (value) => {
        setTahun(value);
        setModalVisible(false);
        setError("");
    };

    const getModalTitle = () => {
        if (modalType === "merek") {
            return "Pilih Merek";
        }

        if (modalType === "model") {
            return `Pilih Model ${merek}`;
        }

        return "Pilih Tahun";
    };

    const getModalData = () => {
        if (modalType === "merek") {
            return Object.keys(DATA_KENDARAAN);
        }

        if (modalType === "model") {
            return modelList;
        }

        return TAHUN;
    };

    const handleSimpan = async () => {
        setError("");
        setSuccess("");

        if (!merek) {
            setError("Merek kendaraan wajib dipilih.");
            return;
        }

        if (!model) {
            setError("Model kendaraan wajib dipilih.");
            return;
        }

        if (!tahun) {
            setError("Tahun kendaraan wajib dipilih.");
            return;
        }

        if (!nomorPolisi.trim()) {
            setError("Nomor polisi wajib diisi.");
            return;
        }

        if (!kilometer.trim()) {
            setError("Kilometer kendaraan wajib diisi.");
            return;
        }

        const kilometerNumber = Number(
            kilometer.replace(/\D/g, "")
        );

        if (Number.isNaN(kilometerNumber)) {
            setError("Kilometer tidak valid.");
            return;
        }

        try {
            setLoading(true);

            const userData =
                await AsyncStorage.getItem(
                    "autocare_user"
                );

            if (!userData) {
                setError(
                    "Sesi pengguna tidak ditemukan. Silakan login kembali."
                );

                setLoading(false);
                return;
            }

            const user = JSON.parse(userData);

            const response = await fetch(
                `${API_URL}/api/kendaraan`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: Number(user.id),
                        merek: merek,
                        model: model,
                        tahun: Number(tahun),
                        nomorPolisi:
                            nomorPolisi
                                .trim()
                                .toUpperCase(),
                        kilometer:
                            kilometerNumber,
                    }),
                }
            );

            const result = await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                        "Gagal menyimpan kendaraan."
                );
            }

            setSuccess(
                "Kendaraan berhasil ditambahkan."
            );

            setTimeout(() => {
                safeBack("/kendaraan");
            }, 1000);
        } catch (err) {
            console.error(
                "Tambah kendaraan error:",
                err
            );

            setError(
                err.message ||
                    "Terjadi kesalahan saat menyimpan kendaraan."
            );
        } finally {
            setLoading(false);
        }
    };

    const renderDropdown = ({
        label,
        value,
        placeholder,
        icon,
        onPress,
        disabled = false,
        imageSource = null,
    }) => {
        return (
            <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                    {label}
                </Text>

                <TouchableOpacity
                    style={[
                        styles.dropdown,
                        disabled &&
                            styles.disabledDropdown,
                    ]}
                    onPress={onPress}
                    activeOpacity={0.8}
                    disabled={disabled}
                >
                    <View style={styles.inputLeft}>
                        {imageSource ? (
                            <View style={styles.dropdownImageWrap}>
                                <Image
                                    source={imageSource}
                                    style={styles.dropdownImage}
                                    resizeMode="contain"
                                />
                            </View>
                        ) : (
                            <View
                                style={[
                                    styles.inputIcon,
                                    disabled &&
                                        styles.inputIconDisabled,
                                ]}
                            >
                                <Ionicons
                                    name={icon}
                                    size={18}
                                    color={
                                        disabled
                                            ? "#AAAAAA"
                                            : COLORS.red
                                    }
                                />
                            </View>
                        )}

                        <Text
                            style={[
                                styles.dropdownText,
                                !value &&
                                    styles.placeholder,
                            ]}
                        >
                            {value || placeholder}
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-down"
                        size={18}
                        color={
                            disabled
                                ? "#AAAAAA"
                                : "#777777"
                        }
                    />
                </TouchableOpacity>
            </View>
        );
    };

    const renderTextInput = ({
        label,
        icon,
        placeholder,
        value,
        onChangeText,
        keyboardType,
        rightText,
    }) => {
        return (
            <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                    {label}
                </Text>

                <View style={styles.textInputBox}>
                    <View style={styles.inputIcon}>
                        <Ionicons
                            name={icon}
                            size={18}
                            color={COLORS.red}
                        />
                    </View>

                    <TextInput
                        style={styles.textInput}
                        placeholder={placeholder}
                        placeholderTextColor="#A0A0A0"
                        value={value}
                        onChangeText={onChangeText}
                        keyboardType={keyboardType}
                        autoCapitalize={
                            label ===
                            "Nomor Polisi"
                                ? "characters"
                                : "none"
                        }
                    />

                    {rightText ? (
                        <Text
                            style={
                                styles.rightText
                            }
                        >
                            {rightText}
                        </Text>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboard}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.container,
                        isDesktop &&
                            styles.containerDesktop,
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* HEADER */}
                    <View
                        style={[
                            styles.header,
                            isDesktop &&
                                styles.headerDesktop,
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() =>
                                safeBack("/kendaraan")
                            }
                        >
                            <Ionicons
                                name="arrow-back"
                                size={21}
                                color="#222222"
                            />
                        </TouchableOpacity>

                        <View
                            style={
                                styles.headerText
                            }
                        >
                            <Text
                                style={[
                                    styles.title,
                                    isDesktop &&
                                        styles.titleDesktop,
                                ]}
                            >
                                Tambah Kendaraan
                            </Text>

                            <Text
                                style={
                                    styles.subtitle
                                }
                            >
                                Daftarkan kendaraan Anda
                                untuk kebutuhan service
                            </Text>
                        </View>

                        {isDesktop && (
                            <View
                                style={
                                    styles.headerBadge
                                }
                            >
                                <Ionicons
                                    name="car-sport-outline"
                                    size={18}
                                    color={
                                        COLORS.red
                                    }
                                />

                                <Text
                                    style={
                                        styles.headerBadgeText
                                    }
                                >
                                    Kendaraan Saya
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* MAIN */}
                    <View
                        style={[
                            styles.mainWrapper,
                            isDesktop &&
                                styles.mainWrapperDesktop,
                        ]}
                    >
                        {/* INFORMASI KENDARAAN */}
                        <View
                            style={[
                                styles.introSection,
                                isDesktop &&
                                    styles.introSectionDesktop,
                            ]}
                        >
                            <View
                                style={[
                                    styles.carIconBox,
                                    isDesktop &&
                                        styles.carIconBoxDesktop,
                                ]}
                            >
                                <Ionicons
                                    name="car-sport"
                                    size={
                                        isDesktop
                                            ? 40
                                            : 34
                                    }
                                    color={
                                        COLORS.red
                                    }
                                />
                            </View>

                            <View
                                style={
                                    styles.introText
                                }
                            >
                                <Text
                                    style={
                                        styles.introTitle
                                    }
                                >
                                    Informasi Kendaraan
                                </Text>

                                <Text
                                    style={
                                        styles.introDescription
                                    }
                                >
                                    Lengkapi data kendaraan
                                    untuk mempermudah
                                    proses booking service
                                    di AutoCare.
                                </Text>
                            </View>
                        </View>

                        {/* ERROR */}
                        {error ? (
                            <View
                                style={
                                    styles.errorBox
                                }
                            >
                                <Ionicons
                                    name="alert-circle"
                                    size={20}
                                    color="#C62828"
                                />

                                <Text
                                    style={
                                        styles.errorText
                                    }
                                >
                                    {error}
                                </Text>
                            </View>
                        ) : null}

                        {/* SUCCESS */}
                        {success ? (
                            <View
                                style={
                                    styles.successBox
                                }
                            >
                                <Ionicons
                                    name="checkmark-circle"
                                    size={20}
                                    color={
                                        COLORS.green
                                    }
                                />

                                <Text
                                    style={
                                        styles.successText
                                    }
                                >
                                    {success}
                                </Text>
                            </View>
                        ) : null}

                        {/* FORM */}
                        <View
                            style={[
                                styles.formCard,
                                isDesktop &&
                                    styles.formCardDesktop,
                            ]}
                        >
                            <View
                                style={
                                    styles.formHeader
                                }
                            >
                                <View
                                    style={
                                        styles.formHeaderText
                                    }
                                >
                                    <Text
                                        style={
                                            styles.formTitle
                                        }
                                    >
                                        Data Kendaraan
                                    </Text>

                                    <Text
                                        style={
                                            styles.formSubtitle
                                        }
                                    >
                                        Isi informasi sesuai
                                        dengan kendaraan Anda
                                    </Text>
                                </View>

                                <View
                                    style={
                                        styles.requiredBadge
                                    }
                                >
                                    <Text
                                        style={
                                            styles.requiredText
                                        }
                                    >
                                        * Wajib diisi
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={[
                                    styles.formColumns,
                                    isDesktop &&
                                        styles.formColumnsDesktop,
                                ]}
                            >
                                {/* KOLOM KIRI */}
                                <View
                                    style={[
                                        styles.formColumn,
                                        isDesktop &&
                                            styles.formColumnDesktop,
                                    ]}
                                >
                                    {renderDropdown({
                                        label: "Merek Kendaraan",
                                        value: merek,
                                        placeholder:
                                            "Pilih merek kendaraan",
                                        icon: "car-outline",
                                        imageSource:
                                            merek
                                                ? getCarImage(
                                                      merek
                                                  )
                                                : null,
                                        onPress:
                                            openMerek,
                                    })}

                                    {renderDropdown({
                                        label: "Model Kendaraan",
                                        value: model,
                                        placeholder:
                                            merek
                                                ? "Pilih model kendaraan"
                                                : "Pilih merek terlebih dahulu",
                                        icon: "speedometer-outline",
                                        onPress:
                                            openModel,
                                        disabled:
                                            !merek,
                                    })}

                                    {renderDropdown({
                                        label: "Tahun Kendaraan",
                                        value: tahun,
                                        placeholder:
                                            "Pilih tahun kendaraan",
                                        icon: "calendar-outline",
                                        onPress:
                                            openTahun,
                                    })}
                                </View>

                                {/* KOLOM KANAN */}
                                <View
                                    style={[
                                        styles.formColumn,
                                        isDesktop &&
                                            styles.formColumnDesktop,
                                    ]}
                                >
                                    {renderTextInput({
                                        label: "Nomor Polisi",
                                        icon: "card-outline",
                                        placeholder:
                                            "Contoh: T 1234 ABC",
                                        value:
                                            nomorPolisi,
                                        onChangeText:
                                            setNomorPolisi,
                                    })}

                                    {renderTextInput({
                                        label: "Kilometer",
                                        icon: "speedometer-outline",
                                        placeholder:
                                            "Contoh: 25000",
                                        value:
                                            kilometer,
                                        onChangeText:
                                            setKilometer,
                                        keyboardType:
                                            "numeric",
                                        rightText: "KM",
                                    })}

                                    {/* INFO */}
                                    <View
                                        style={
                                            styles.infoCard
                                        }
                                    >
                                        <View
                                            style={
                                                styles.infoIcon
                                            }
                                        >
                                            <Ionicons
                                                name="information-circle-outline"
                                                size={19}
                                                color={
                                                    COLORS.red
                                                }
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.infoContent
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.infoTitle
                                                }
                                            >
                                                Pastikan data benar
                                            </Text>

                                            <Text
                                                style={
                                                    styles.infoText
                                                }
                                            >
                                                Data kendaraan akan
                                                digunakan saat Anda
                                                melakukan booking
                                                service.
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* SIMPAN */}
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    loading &&
                                        styles.disabledButton,
                                    isDesktop &&
                                        styles.saveButtonDesktop,
                                ]}
                                onPress={
                                    handleSimpan
                                }
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#FFFFFF"
                                    />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="save-outline"
                                            size={20}
                                            color="#FFFFFF"
                                        />

                                        <Text
                                            style={
                                                styles.saveText
                                            }
                                        >
                                            Simpan Kendaraan
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <Text
                            style={
                                styles.bottomInfo
                            }
                        >
                            Data kendaraan akan tersimpan
                            pada akun AutoCare Anda.
                        </Text>
                    </View>
                </ScrollView>

                {/* MODAL DROPDOWN */}
                <Modal
                    visible={modalVisible}
                    transparent
                    animationType={
                        isDesktop
                            ? "fade"
                            : "slide"
                    }
                    onRequestClose={() =>
                        setModalVisible(false)
                    }
                >
                    <View
                        style={[
                            styles.modalOverlay,
                            isDesktop &&
                                styles.modalOverlayDesktop,
                        ]}
                    >
                        <Pressable
                            style={
                                styles.modalBackground
                            }
                            onPress={() =>
                                setModalVisible(false)
                            }
                        />

                        <View
                            style={[
                                styles.modalContainer,
                                isDesktop &&
                                    styles.modalContainerDesktop,
                            ]}
                        >
                            {!isDesktop && (
                                <View
                                    style={
                                        styles.modalHandle
                                    }
                                />
                            )}

                            <View
                                style={
                                    styles.modalHeader
                                }
                            >
                                <View
                                    style={
                                        styles.modalHeaderText
                                    }
                                >
                                    <Text
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        {getModalTitle()}
                                    </Text>

                                    <Text
                                        style={
                                            styles.modalSubtitle
                                        }
                                    >
                                        Pilih salah satu
                                        pilihan
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={
                                        styles.closeButton
                                    }
                                    onPress={() =>
                                        setModalVisible(
                                            false
                                        )
                                    }
                                >
                                    <Ionicons
                                        name="close"
                                        size={21}
                                        color="#555555"
                                    />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={
                                    false
                                }
                                contentContainerStyle={
                                    styles.optionList
                                }
                            >
                                {getModalData().map(
                                    (item) => {
                                        const selected =
                                            (modalType ===
                                                "merek" &&
                                                item ===
                                                    merek) ||
                                            (modalType ===
                                                "model" &&
                                                item ===
                                                    model) ||
                                            (modalType ===
                                                "tahun" &&
                                                item ===
                                                    tahun);

                                        return (
                                            <TouchableOpacity
                                                key={item}
                                                style={[
                                                    styles.option,
                                                    selected &&
                                                        styles.selectedOption,
                                                ]}
                                                onPress={() => {
                                                    if (
                                                        modalType ===
                                                        "merek"
                                                    ) {
                                                        pilihMerek(
                                                            item
                                                        );
                                                    } else if (
                                                        modalType ===
                                                        "model"
                                                    ) {
                                                        pilihModel(
                                                            item
                                                        );
                                                    } else {
                                                        pilihTahun(
                                                            item
                                                        );
                                                    }
                                                }}
                                                activeOpacity={
                                                    0.8
                                                }
                                            >
                                                <View
                                                    style={
                                                        styles.optionLeft
                                                    }
                                                >
                                                    <View
                                                        style={[
                                                            styles.optionIcon,
                                                            selected &&
                                                                styles.selectedOptionIcon,
                                                            modalType ===
                                                                "merek" &&
                                                                styles.optionIconBrand,
                                                        ]}
                                                    >
                                                        {modalType ===
                                                        "merek" ? (
                                                            <Image
                                                                source={getCarImage(
                                                                    item
                                                                )}
                                                                style={
                                                                    styles.modalBrandImage
                                                                }
                                                                resizeMode="contain"
                                                            />
                                                        ) : (
                                                            <Ionicons
                                                                name={
                                                                    modalType ===
                                                                    "tahun"
                                                                        ? "calendar-outline"
                                                                        : "car-sport-outline"
                                                                }
                                                                size={
                                                                    19
                                                                }
                                                                color={
                                                                    selected
                                                                        ? "#FFFFFF"
                                                                        : COLORS.red
                                                                }
                                                            />
                                                        )}
                                                    </View>

                                                    <Text
                                                        style={[
                                                            styles.optionText,
                                                            selected &&
                                                                styles.selectedOptionText,
                                                        ]}
                                                    >
                                                        {item}
                                                    </Text>
                                                </View>

                                                {selected ? (
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={
                                                            22
                                                        }
                                                        color={
                                                            COLORS.red
                                                        }
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name="chevron-forward"
                                                        size={
                                                            18
                                                        }
                                                        color="#AAAAAA"
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    }
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    keyboard: {
        flex: 1,
    },

    /* =========================
       CONTAINER
    ========================= */

    container: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 30,
    },

    containerDesktop: {
        paddingHorizontal: 35,
        paddingTop: 24,
        alignItems: "center",
    },

    /* =========================
       HEADER
    ========================= */

    header: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 17,
    },

    headerDesktop: {
        maxWidth: 1180,
        marginBottom: 28,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: COLORS.white,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E7E7E7",
        marginRight: 11,
    },

    headerText: {
        flex: 1,
    },

    title: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.text,
    },

    titleDesktop: {
        fontSize: 25,
    },

    subtitle: {
        marginTop: 3,
        fontSize: 11.5,
        color: COLORS.gray,
        lineHeight: 16,
    },

    headerBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.redLight,
        borderWidth: 1,
        borderColor: COLORS.redBorder,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },

    headerBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.red,
        marginLeft: 7,
    },

    /* =========================
       MAIN
    ========================= */

    mainWrapper: {
        width: "100%",
    },

    mainWrapperDesktop: {
        maxWidth: 1180,
    },

    /* =========================
       INTRO
    ========================= */

    introSection: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },

    introSectionDesktop: {
        marginBottom: 20,
    },

    carIconBox: {
        width: 56,
        height: 56,
        borderRadius: 17,
        backgroundColor: COLORS.redLight,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    carIconBoxDesktop: {
        width: 74,
        height: 74,
        borderRadius: 22,
        marginRight: 17,
    },

    introText: {
        flex: 1,
    },

    introTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.text,
    },

    introDescription: {
        fontSize: 11.5,
        color: COLORS.gray,
        lineHeight: 17,
        marginTop: 3,
        maxWidth: 650,
    },

    /* =========================
       ALERT
    ========================= */

    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FDECEC",
        borderWidth: 1,
        borderColor: "#F3CACA",
        borderRadius: 13,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },

    errorText: {
        flex: 1,
        color: "#B71C1C",
        fontSize: 12,
        marginLeft: 8,
        lineHeight: 18,
    },

    successBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.greenLight,
        borderWidth: 1,
        borderColor: COLORS.greenBorder,
        borderRadius: 13,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },

    successText: {
        flex: 1,
        color: "#237A4C",
        fontSize: 12,
        marginLeft: 8,
        lineHeight: 18,
    },

    /* =========================
       FORM
    ========================= */

    formCard: {
        width: "100%",
        backgroundColor: COLORS.white,
        borderRadius: 19,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E7E7E7",
    },

    formCardDesktop: {
        padding: 28,
        borderRadius: 22,
    },

    formHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 19,
    },

    formHeaderText: {
        flex: 1,
    },

    formTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: COLORS.text,
    },

    formSubtitle: {
        fontSize: 11.5,
        color: COLORS.gray,
        marginTop: 3,
    },

    requiredBadge: {
        backgroundColor: "#F7F7F7",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginLeft: 8,
    },

    requiredText: {
        fontSize: 10,
        color: COLORS.gray,
        fontWeight: "600",
    },

    formColumns: {
        width: "100%",
    },

    formColumnsDesktop: {
        flexDirection: "row",
        gap: 28,
    },

    formColumn: {
        width: "100%",
    },

    formColumnDesktop: {
        flex: 1,
    },

    /* =========================
       INPUT
    ========================= */

    fieldGroup: {
        marginBottom: 14,
    },

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.darkText,
        marginBottom: 7,
    },

    dropdown: {
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#DFE0E2",
        backgroundColor: COLORS.white,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 11,
    },

    disabledDropdown: {
        backgroundColor: "#F5F5F5",
        borderColor: "#E8E8E8",
    },

    inputLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    inputIcon: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: COLORS.redLight,
        justifyContent: "center",
        alignItems: "center",
    },

    inputIconDisabled: {
        backgroundColor: "#EEEEEE",
    },

    dropdownImageWrap: {
        width: 36,
        height: 28,
        justifyContent: "center",
        alignItems: "center",
    },

    dropdownImage: {
        width: 36,
        height: 26,
    },

    dropdownText: {
        fontSize: 13,
        color: COLORS.darkText,
        marginLeft: 9,
        flex: 1,
    },

    placeholder: {
        color: "#999999",
    },

    textInputBox: {
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#DFE0E2",
        backgroundColor: COLORS.white,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 11,
    },

    textInput: {
        flex: 1,
        height: 48,
        fontSize: 13,
        color: COLORS.text,
        marginLeft: 9,
    },

    rightText: {
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.gray,
        marginLeft: 8,
    },

    /* =========================
       INFO
    ========================= */

    infoCard: {
        flexDirection: "row",
        backgroundColor: COLORS.redLight,
        borderWidth: 1,
        borderColor: COLORS.redBorder,
        borderRadius: 14,
        padding: 11,
        marginTop: 1,
        minHeight: 70,
    },

    infoIcon: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: COLORS.white,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 9,
    },

    infoContent: {
        flex: 1,
    },

    infoTitle: {
        fontSize: 12,
        fontWeight: "800",
        color: COLORS.red,
        marginBottom: 2,
    },

    infoText: {
        fontSize: 10.5,
        color: "#777777",
        lineHeight: 16,
    },

    /* =========================
       SAVE
    ========================= */

    saveButton: {
        height: 52,
        borderRadius: 14,
        backgroundColor: COLORS.red,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 3,
    },

    saveButtonDesktop: {
        marginTop: 8,
        height: 57,
        borderRadius: 15,
    },

    disabledButton: {
        opacity: 0.65,
    },

    saveText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "800",
        marginLeft: 8,
    },

    bottomInfo: {
        textAlign: "center",
        color: "#8A8A8A",
        fontSize: 10.5,
        lineHeight: 16,
        marginTop: 11,
        paddingHorizontal: 20,
    },

    /* =========================
       MODAL
    ========================= */

    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },

    modalOverlayDesktop: {
        justifyContent: "center",
        alignItems: "center",
    },

    modalBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.45)",
    },

    modalContainer: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 27,
        borderTopRightRadius: 27,
        maxHeight: "82%",
        paddingTop: 10,
        paddingHorizontal: 17,
        paddingBottom: 22,
    },

    modalContainerDesktop: {
        width: 520,
        maxHeight: "78%",
        borderRadius: 22,
        paddingTop: 22,
        paddingHorizontal: 22,
        paddingBottom: 22,
    },

    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 5,
        backgroundColor: "#D5D5D5",
        alignSelf: "center",
        marginBottom: 16,
    },

    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },

    modalHeaderText: {
        flex: 1,
    },

    modalTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: COLORS.text,
    },

    modalSubtitle: {
        fontSize: 11.5,
        color: "#888888",
        marginTop: 3,
    },

    closeButton: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: "#F4F4F4",
        justifyContent: "center",
        alignItems: "center",
    },

    optionList: {
        paddingBottom: 5,
    },

    option: {
        minHeight: 55,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: "#E8E8E8",
        backgroundColor: COLORS.white,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 11,
        marginBottom: 8,
    },

    selectedOption: {
        borderColor: COLORS.red,
        backgroundColor: COLORS.redLight,
    },

    optionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.redLight,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },

    selectedOptionIcon: {
        backgroundColor: COLORS.red,
    },

    optionIconBrand: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },

    modalBrandImage: {
        width: 32,
        height: 24,
    },

    optionText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.darkText,
        flex: 1,
    },

    selectedOptionText: {
        color: COLORS.red,
        fontWeight: "800",
    },
});