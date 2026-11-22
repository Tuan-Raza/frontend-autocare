import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useCallback, useEffect, useState } from "react";

import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

import { API_URL } from "../config";
import { getCarImage } from "./carImages";
import { getPhotoUrl } from "../utils/photo";
import RealtimeClock from "../components/RealtimeClock";
import BottomNavBar from "../components/BottomNavBar";
import AnimatedModalCard from "../components/AnimatedModalCard";
import DesktopSidebar from "../components/DesktopSidebar";

export default function Kendaraan() {

    // =========================================================
    // RESPONSIVE
    // =========================================================

    const { width } = useWindowDimensions();

    const isDesktop =
        Platform.OS === "web" && width >= 900;


    // =========================================================
    // STATE
    // =========================================================

    const [user, setUser] = useState(null);
    const [kendaraan, setKendaraan] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [imageError, setImageError] = useState(false);

    const [loading, setLoading] = useState(true);

    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [selectedKendaraan, setSelectedKendaraan] =
        useState(null);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    // ── Edit State ───────────────────────────────────────────
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        id: null,
        merek: "",
        model: "",
        tahun: "",
        nomorPolisi: "",
        kilometer: "",
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");


    // =========================================================
    // LOAD DATA
    // =========================================================

    const loadKendaraan = async () => {

        try {

            const savedUser =
                await AsyncStorage.getItem(
                    "autocare_user"
                );


            if (!savedUser) {

                router.replace("/login");

                return;
            }


            const parsedUser =
                JSON.parse(savedUser);

            setUser(parsedUser);


            // ── Load foto profil ──────────────────────────
            const savedPhoto =
                await AsyncStorage.getItem(
                    "autocare_profile_photo"
                );

            if (savedPhoto) {
                if (Platform.OS === "web" && savedPhoto.startsWith("blob:")) {
                    await AsyncStorage.removeItem("autocare_profile_photo");
                    if (parsedUser.foto && (Platform.OS !== "web" || !parsedUser.foto.startsWith("blob:"))) {
                        setProfilePhoto(getPhotoUrl(parsedUser.foto));
                        setImageError(false);
                    } else {
                        setProfilePhoto(null);
                    }
                } else {
                    setProfilePhoto(getPhotoUrl(savedPhoto));
                    setImageError(false);
                }
            } else if (parsedUser.foto && (Platform.OS !== "web" || !parsedUser.foto.startsWith("blob:"))) {
                setProfilePhoto(getPhotoUrl(parsedUser.foto));
                setImageError(false);
            } else {
                setProfilePhoto(null);
            }


            const response =
                await fetch(
                    `${API_URL}/api/kendaraan/user/${parsedUser.id}`
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Gagal mengambil kendaraan"
                );
            }


            setKendaraan(
                data.data || []
            );

        } catch (error) {

            console.error(
                "Load Kendaraan Error:",
                error
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================================================
    // RELOAD SAAT KEMBALI KE HALAMAN KENDARAAN
    // =========================================================

    useFocusEffect(
        useCallback(() => {
            loadKendaraan();
        }, [])
    );


    // =========================================================
    // DATA USER
    // =========================================================

    const namaUser =
        user?.nama ||
        user?.name ||
        "Pengguna";


    // =========================================================
    // DELETE PRESS
    // =========================================================

    const handleDeletePress = (item) => {

        setSelectedKendaraan(item);

        setShowDeleteModal(true);

    };


    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async () => {

        if (!selectedKendaraan) {
            return;
        }


        try {

            setDeleteLoading(true);


            const response =
                await fetch(
                    `${API_URL}/api/kendaraan/${selectedKendaraan.id}`,
                    {
                        method: "DELETE",
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Gagal menghapus kendaraan."
                );
            }


            setKendaraan((prev) =>
                prev.filter(
                    (item) =>
                        item.id !==
                        selectedKendaraan.id
                )
            );


            setShowDeleteModal(false);

            setSelectedKendaraan(null);

        } catch (error) {

            console.error(
                "Delete Kendaraan Error:",
                error
            );

        } finally {

            setDeleteLoading(false);

        }
    };


    // =========================================================
    // EDIT PRESS & SAVE
    // =========================================================

    const handleEditPress = (item) => {
        setEditForm({
            id: item.id,
            merek: item.merek || "",
            model: item.model || "",
            tahun: item.tahun ? String(item.tahun) : "",
            nomorPolisi: item.nomor_polisi || item.nomorPolisi || "",
            kilometer:
                item.kilometer !== undefined && item.kilometer !== null
                    ? String(item.kilometer)
                    : "0",
        });
        setEditError("");
        setShowEditModal(true);
    };

    const handleFormChange = (key, value) => {
        setEditForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSaveEdit = async () => {
        if (!editForm.merek || !editForm.model || !editForm.nomorPolisi) {
            setEditError("Merek, model, dan nomor polisi wajib diisi.");
            return;
        }

        try {
            setEditLoading(true);
            setEditError("");

            const response = await fetch(
                `${API_URL}/api/kendaraan/${editForm.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        merek: editForm.merek,
                        model: editForm.model,
                        tahun: editForm.tahun,
                        nomorPolisi: editForm.nomorPolisi,
                        kilometer: Number(editForm.kilometer) || 0,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Gagal memperbarui kendaraan."
                );
            }

            setShowEditModal(false);
            setToastMessage('Perubahan data kendaraan berhasil disimpan.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            await loadKendaraan();
        } catch (err) {
            console.error("Save Edit Kendaraan Error:", err);
            setEditError(
                err.message || "Gagal memperbarui data kendaraan."
            );
        } finally {
            setEditLoading(false);
        }
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <View
                style={
                    styles.loading
                }
            >

                <ActivityIndicator
                    size="large"
                    color="#F20D18"
                />

                <Text
                    style={
                        styles.loadingText
                    }
                >
                    Memuat kendaraan...
                </Text>

            </View>
        );
    }


    // =========================================================
    // DESKTOP
    // =========================================================

    if (isDesktop) {

        return (

            <View
                style={
                    styles.desktopContainer
                }
            >

                {/* =================================================
                    SIDEBAR (STANDARDIZED)
                ================================================= */}
                <DesktopSidebar
                    activeMenu="kendaraan"
                    user={user}
                    namaUser={namaUser}
                    profilePhoto={profilePhoto}
                />


                {/* =================================================
                    MAIN
                ================================================= */}

                <View
                    style={
                        styles.desktopMain
                    }
                >

                    {/* TOPBAR */}

                    <View
                        style={
                            styles.desktopTopbar
                        }
                    >

                        <View>

                            <Text
                                style={
                                    styles.desktopTopTitle
                                }
                            >
                                Kendaraan Saya
                            </Text>


                            <Text
                                style={
                                    styles.desktopTopSubtitle
                                }
                            >
                                Kelola kendaraan yang
                                terdaftar di akun Anda
                            </Text>

                        </View>


                        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                            <RealtimeClock isDesktop />
                            <TouchableOpacity
                                style={
                                    styles.desktopAddButton
                                }
                                activeOpacity={0.85}
                                onPress={() =>
                                    router.push(
                                        "/tambah-kendaraan"
                                    )
                                }
                            >
                                <Ionicons
                                    name="add"
                                    size={18}
                                    color="#FFFFFF"
                                />
                                <Text
                                    style={
                                        styles.desktopAddButtonText
                                    }
                                >
                                    Tambah Kendaraan
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>


                    {/* CONTENT */}

                    <View
                        style={
                            styles.desktopContent
                        }
                    >

                        {/* SUMMARY */}

                        <View
                            style={
                                styles.summaryRow
                            }
                        >

                            <View
                                style={
                                    styles.summaryCard
                                }
                            >

                                <View
                                    style={
                                        styles.summaryIcon
                                    }
                                >

                                    <Ionicons
                                        name="car-sport-outline"
                                        size={23}
                                        color="#F20D18"
                                    />

                                </View>


                                <View>

                                    <Text
                                        style={
                                            styles.summaryNumber
                                        }
                                    >
                                        {kendaraan.length}
                                    </Text>

                                    <Text
                                        style={
                                            styles.summaryLabel
                                        }
                                    >
                                        Total Kendaraan
                                    </Text>

                                </View>

                            </View>




                        </View>


                        {/* TITLE */}

                        <View
                            style={
                                styles.vehicleSectionHeader
                            }
                        >

                            <View>

                                <Text
                                    style={
                                        styles.vehicleSectionTitle
                                    }
                                >
                                    Daftar Kendaraan
                                </Text>

                                <Text
                                    style={
                                        styles.vehicleSectionSubtitle
                                    }
                                >
                                    Kendaraan yang dapat
                                    digunakan untuk booking
                                    service
                                </Text>

                            </View>

                        </View>


                        {/* EMPTY */}

                        {kendaraan.length === 0 ? (

                            <View
                                style={
                                    styles.desktopEmpty
                                }
                            >

                                <View
                                    style={
                                        styles.desktopEmptyIcon
                                    }
                                >

                                    <Ionicons
                                        name="car-outline"
                                        size={42}
                                        color="#F20D18"
                                    />

                                </View>


                                <Text
                                    style={
                                        styles.desktopEmptyTitle
                                    }
                                >
                                    Belum Ada Kendaraan
                                </Text>


                                <Text
                                    style={
                                        styles.desktopEmptyText
                                    }
                                >
                                    Tambahkan kendaraan
                                    pertama Anda untuk
                                    mulai melakukan booking
                                    service.
                                </Text>


                                <TouchableOpacity
                                    style={
                                        styles.desktopEmptyButton
                                    }
                                    activeOpacity={0.85}
                                    onPress={() =>
                                        router.push(
                                            "/tambah-kendaraan"
                                        )
                                    }
                                >

                                    <Ionicons
                                        name="add"
                                        size={18}
                                        color="#FFFFFF"
                                    />

                                    <Text
                                        style={
                                            styles.desktopEmptyButtonText
                                        }
                                    >
                                        Tambah Kendaraan
                                    </Text>

                                </TouchableOpacity>

                            </View>

                        ) : (

                            <FlatList
                                data={
                                    kendaraan
                                }
                                keyExtractor={(
                                    item
                                ) =>
                                    item.id.toString()
                                }
                                renderItem={({
                                    item,
                                }) => (
                                    <DesktopVehicleCard
                                        item={item}
                                        onEdit={
                                            handleEditPress
                                        }
                                        onDelete={
                                            handleDeletePress
                                        }
                                    />
                                )}
                                numColumns={
                                    width >= 1250
                                        ? 3
                                        : 2
                                }
                                key={
                                    width >= 1250
                                        ? "three"
                                        : "two"
                                }
                                columnWrapperStyle={
                                    styles.desktopColumn
                                }
                                contentContainerStyle={
                                    styles.desktopList
                                }
                                showsVerticalScrollIndicator={
                                    false
                                }
                            />

                        )}

                    </View>

                </View>


                {/* DELETE MODAL */}

                <DeleteModal
                    visible={
                        showDeleteModal
                    }
                    selectedKendaraan={
                        selectedKendaraan
                    }
                    deleteLoading={
                        deleteLoading
                    }
                    onCancel={() =>
                        setShowDeleteModal(
                            false
                        )
                    }
                    onDelete={
                        handleDelete
                    }
                />

                {/* EDIT VEHICLE MODAL */}

                <EditVehicleModal
                    visible={
                        showEditModal
                    }
                    form={
                        editForm
                    }
                    loading={
                        editLoading
                    }
                    error={
                        editError
                    }
                    onChange={
                        handleFormChange
                    }
                    onCancel={() =>
                        setShowEditModal(
                            false
                        )
                    }
                    onSave={
                        handleSaveEdit
                    }
                />

            </View>
        );
    }


    // =========================================================
    // MOBILE
    // =========================================================

    return (

        <View
            style={
                styles.container
            }
        >

            {/* HEADER */}

            <View
                style={
                    styles.header
                }
            >

                <TouchableOpacity
                    onPress={() =>
                        safeBack("/home")
                    }
                    style={
                        styles.backButton
                    }
                >

                    <Text
                        style={
                            styles.backText
                        }
                    >
                        ‹
                    </Text>

                </TouchableOpacity>


                <View style={{ flex: 1, marginLeft: 10 }}>

                    <Text
                        style={
                            styles.headerTitle
                        }
                    >
                        Kendaraan Saya
                    </Text>


                    <Text
                        style={
                            styles.headerSubtitle
                        }
                    >
                        Daftar kendaraan Anda
                    </Text>

                </View>

                <RealtimeClock compact />

            </View>


            {/* LIST */}

            {kendaraan.length === 0 ? (

                <View
                    style={
                        styles.empty
                    }
                >

                    <View
                        style={
                            styles.emptyIcon
                        }
                    >

                        <Ionicons
                            name="car-outline"
                            size={38}
                            color="#C8102E"
                        />

                    </View>


                    <Text
                        style={
                            styles.emptyTitle
                        }
                    >
                        Belum Ada Kendaraan
                    </Text>


                    <Text
                        style={
                            styles.emptyText
                        }
                    >
                        Anda belum memiliki
                        kendaraan yang terdaftar.
                    </Text>

                </View>

            ) : (

                <FlatList
                    data={
                        kendaraan
                    }
                    keyExtractor={(
                        item
                    ) =>
                        item.id.toString()
                    }
                    renderItem={({ item }) =>
                        renderMobileVehicle({
                            item,
                            onEdit:
                                handleEditPress,
                            onDelete:
                                handleDeletePress,
                        })
                    }
                    contentContainerStyle={
                        styles.list
                    }
                    showsVerticalScrollIndicator={
                        false
                    }
                />

            )}


            {/* MOBILE ADD BUTTON */}

            <TouchableOpacity
                style={
                    styles.addButton
                }
                onPress={() =>
                    router.push(
                        "/tambah-kendaraan"
                    )
                }
                activeOpacity={0.85}
            >

                <Ionicons
                    name="add"
                    size={21}
                    color="#FFFFFF"
                />

                <Text
                    style={
                        styles.addButtonText
                    }
                >
                    Tambah Kendaraan
                </Text>

            </TouchableOpacity>


            {/* DELETE MODAL */}

            <DeleteModal
                visible={
                    showDeleteModal
                }
                selectedKendaraan={
                    selectedKendaraan
                }
                deleteLoading={
                    deleteLoading
                }
                onCancel={() =>
                    setShowDeleteModal(
                        false
                    )
                }
                onDelete={
                    handleDelete
                }
            />

            {/* EDIT VEHICLE MODAL */}

            <EditVehicleModal
                visible={
                    showEditModal
                }
                form={
                    editForm
                }
                loading={
                    editLoading
                }
                error={
                    editError
                }
                onChange={
                    handleFormChange
                }
                onCancel={() =>
                    setShowEditModal(
                        false
                    )
                }
                onSave={
                    handleSaveEdit
                }
            />

            {/* MOBILE BOTTOM NAV */}
            <BottomNavBar activeTab="kendaraan" />

        </View>
    );
}


// =============================================================
// MOBILE VEHICLE CARD
// =============================================================

const renderMobileVehicle = ({
    item,
    onEdit,
    onDelete,
}) => {

    return (
        <View
            style={
                styles.card
            }
        >

            <View
                style={
                    styles.cardHeader
                }
            >

                <View
                    style={
                        styles.vehicleTitle
                    }
                >

                    <Text
                        style={
                            styles.merek
                        }
                    >
                        {item.merek}
                    </Text>


                    <Text
                        style={
                            styles.model
                        }
                    >
                        {item.model}
                    </Text>

                </View>


                <View
                    style={
                        styles.headerRight
                    }
                >

                    <Text
                        style={
                            styles.tahun
                        }
                    >
                        {item.tahun || "-"}
                    </Text>

                    <TouchableOpacity
                        style={
                            styles.editButton
                        }
                        onPress={() =>
                            onEdit &&
                            onEdit(item)
                        }
                        activeOpacity={0.75}
                    >

                        <Ionicons
                            name="pencil-outline"
                            size={16}
                            color="#1E88E5"
                        />

                    </TouchableOpacity>

                    <TouchableOpacity
                        style={
                            styles.deleteButton
                        }
                        onPress={() =>
                            onDelete &&
                            onDelete(item)
                        }
                        activeOpacity={0.75}
                    >

                        <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#C8102E"
                        />

                    </TouchableOpacity>

                </View>

            </View>


            {/* GAMBAR MOBIL */}
            <View
                style={
                    styles.mobileCarImageContainer
                }
            >

                <Image
                    source={getCarImage(
                        item.merek
                    )}
                    style={
                        styles.mobileCarImage
                    }
                    resizeMode="contain"
                />

            </View>


            <View
                style={
                    styles.divider
                }
            />


            <View
                style={
                    styles.infoRow
                }
            >

                <Text
                    style={
                        styles.label
                    }
                >
                    Nomor Polisi
                </Text>


                <Text
                    style={
                        styles.value
                    }
                >
                    {item.nomor_polisi}
                </Text>

            </View>


            <View
                style={
                    styles.infoRow
                }
            >

                <Text
                    style={
                        styles.label
                    }
                >
                    Kilometer
                </Text>


                <Text
                    style={
                        styles.value
                    }
                >
                    {Number(
                        item.kilometer || 0
                    ).toLocaleString(
                        "id-ID"
                    )}{" "}
                    km
                </Text>

            </View>

        </View>
    );
};


// =============================================================
// DESKTOP VEHICLE CARD
// =============================================================

function DesktopVehicleCard({
    item,
    onEdit,
    onDelete,
}) {

    return (

        <View
            style={
                styles.desktopVehicleCard
            }
        >

            <View
                style={
                    styles.desktopVehicleTop
                }
            >

                <View
                    style={
                        styles.desktopVehicleTopLeft
                    }
                >

                    <View
                        style={
                            styles.desktopVehicleIcon
                        }
                    >

                        <Ionicons
                            name="car-sport"
                            size={22}
                            color="#F20D18"
                        />

                    </View>


                    <View
                        style={
                            styles.desktopVehicleYear
                        }
                    >

                        <Text
                            style={
                                styles.desktopYearText
                            }
                        >
                            {item.tahun || "-"}
                        </Text>

                    </View>

                </View>

            </View>


            <View
                style={
                    styles.desktopVehicleMainRow
                }
            >

                <View
                    style={
                        styles.desktopVehicleBrandCol
                    }
                >

                    <Text
                        style={
                            styles.desktopVehicleBrand
                        }
                    >
                        {item.merek}
                    </Text>


                    <Text
                        style={
                            styles.desktopVehicleModel
                        }
                    >
                        {item.model}
                    </Text>

                </View>


                <View
                    style={
                        styles.desktopCarImageWrap
                    }
                >

                    <Image
                        source={getCarImage(
                            item.merek
                        )}
                        style={
                            styles.desktopCarImage
                        }
                        resizeMode="contain"
                    />

                </View>

            </View>


            <View
                style={
                    styles.desktopVehicleDivider
                }
            />


            <View
                style={
                    styles.desktopInfoRow
                }
            >

                <View>

                    <Text
                        style={
                            styles.desktopInfoLabel
                        }
                    >
                        Nomor Polisi
                    </Text>

                    <Text
                        style={
                            styles.desktopInfoValue
                        }
                    >
                        {item.nomor_polisi}
                    </Text>

                </View>


                <View
                    style={
                        styles.desktopInfoRight
                    }
                >

                    <Text
                        style={
                            styles.desktopInfoLabel
                        }
                    >
                        Kilometer
                    </Text>

                    <Text
                        style={
                            styles.desktopInfoValue
                        }
                    >
                        {Number(
                            item.kilometer ||
                            0
                        ).toLocaleString(
                            "id-ID"
                        )}{" "}
                        km
                    </Text>

                </View>

            </View>


            <View style={styles.desktopActionRow}>
                <TouchableOpacity
                    style={styles.desktopEditButton}
                    activeOpacity={0.8}
                    onPress={() => onEdit && onEdit(item)}
                >
                    <Ionicons
                        name="pencil-outline"
                        size={15}
                        color="#1E88E5"
                    />
                    <Text style={styles.desktopEditText}>
                        Edit
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.desktopDeleteButton}
                    activeOpacity={0.8}
                    onPress={() => onDelete && onDelete(item)}
                >
                    <Ionicons
                        name="trash-outline"
                        size={15}
                        color="#C8102E"
                    />
                    <Text style={styles.desktopDeleteText}>
                        Hapus
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}


// =============================================================
// SIDEBAR ITEM
// =============================================================

function SidebarItem({
    icon,
    title,
    active = false,
    onPress,
}) {

    return (

        <TouchableOpacity
            style={[
                styles.sidebarItem,
                active &&
                styles.sidebarItemActive,
            ]}
            activeOpacity={0.8}
            onPress={onPress}
        >

            <Ionicons
                name={icon}
                size={20}
                color={
                    active
                        ? "#FFFFFF"
                        : "#D7B4B4"
                }
            />


            <Text
                style={[
                    styles.sidebarItemText,
                    active &&
                    styles.sidebarItemTextActive,
                ]}
            >
                {title}
            </Text>

        </TouchableOpacity>
    );
}


// =============================================================
// DELETE MODAL
// =============================================================

function DeleteModal({
    visible,
    selectedKendaraan,
    deleteLoading,
    onCancel,
    onDelete,
}) {

    return (

        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={
                onCancel
            }
        >

            <View
                style={
                    styles.modalOverlay
                }
            >

                <AnimatedModalCard
                    style={
                        styles.modalCard
                    }
                    visible={visible}
                >

                    {/* ICON */}

                    <View
                        style={
                            styles.modalIcon
                        }
                    >

                        <Ionicons
                            name="trash-outline"
                            size={27}
                            color="#C8102E"
                        />

                    </View>


                    <Text
                        style={
                            styles.modalTitle
                        }
                    >
                        Hapus Kendaraan?
                    </Text>


                    <Text
                        style={
                            styles.modalText
                        }
                    >
                        Apakah Anda yakin ingin
                        menghapus kendaraan ini?
                    </Text>


                    {/* SELECTED VEHICLE */}

                    {selectedKendaraan && (

                        <View
                            style={
                                styles.selectedVehicle
                            }
                        >

                            <Ionicons
                                name="car-sport-outline"
                                size={20}
                                color="#C8102E"
                            />


                            <View
                                style={
                                    styles.selectedVehicleText
                                }
                            >

                                <Text
                                    style={
                                        styles.selectedVehicleName
                                    }
                                >
                                    {
                                        selectedKendaraan.merek
                                    }{" "}
                                    {
                                        selectedKendaraan.model
                                    }
                                </Text>


                                <Text
                                    style={
                                        styles.selectedVehiclePlate
                                    }
                                >
                                    {
                                        selectedKendaraan.nomor_polisi
                                    }
                                </Text>

                            </View>

                        </View>
                    )}


                    {/* BUTTON */}

                    <View
                        style={
                            styles.modalButtons
                        }
                    >

                        <Pressable
                            style={[
                                styles.cancelButton,
                                deleteLoading &&
                                styles.disabledButton,
                            ]}
                            onPress={
                                onCancel
                            }
                            disabled={
                                deleteLoading
                            }
                        >

                            <Text
                                style={
                                    styles.cancelButtonText
                                }
                            >
                                Batal
                            </Text>

                        </Pressable>


                        <Pressable
                            style={[
                                styles.confirmDeleteButton,
                                deleteLoading &&
                                styles.disabledButton,
                            ]}
                            onPress={
                                onDelete
                            }
                            disabled={
                                deleteLoading
                            }
                        >

                            {deleteLoading ? (

                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />

                            ) : (

                                <>

                                    <Ionicons
                                        name="trash-outline"
                                        size={16}
                                        color="#FFFFFF"
                                    />


                                    <Text
                                        style={
                                            styles.confirmDeleteText
                                        }
                                    >
                                        Hapus
                                    </Text>

                                </>

                            )}

                        </Pressable>

                    </View>

                </AnimatedModalCard>

            </View>

        </Modal>
    );
}


// =============================================================
// EDIT VEHICLE MODAL
// =============================================================

function EditVehicleModal({
    visible,
    form,
    loading,
    error,
    onChange,
    onCancel,
    onSave,
}) {
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <AnimatedModalCard style={[styles.modalCard, { maxWidth: 440, padding: 22 }]} visible={visible}>
                    {/* ICON */}
                    <View style={[styles.modalIcon, { backgroundColor: "#E3F2FD" }]}>
                        <Ionicons
                            name="pencil-outline"
                            size={24}
                            color="#1E88E5"
                        />
                    </View>

                    <Text style={styles.modalTitle}>
                        Edit Data Kendaraan
                    </Text>

                    <Text style={[styles.modalText, { marginBottom: 16 }]}>
                        Perbarui detail spesifikasi kendaraan Anda
                    </Text>

                    {Boolean(error) && (
                        <View style={styles.errorAlert}>
                            <Ionicons name="alert-circle" size={16} color="#C8102E" />
                            <Text style={styles.errorAlertText}>{error}</Text>
                        </View>
                    )}

                    {/* FORM INPUTS */}
                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Merek Kendaraan</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={form.merek}
                            onChangeText={(val) => onChange("merek", val)}
                            placeholder="Contoh: Honda, Toyota"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Model Kendaraan</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={form.model}
                            onChangeText={(val) => onChange("model", val)}
                            placeholder="Contoh: Civic, Avanza"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>Tahun</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={form.tahun}
                                onChangeText={(val) => onChange("tahun", val)}
                                placeholder="2022"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.inputLabel}>Kilometer</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={form.kilometer}
                                onChangeText={(val) => onChange("kilometer", val)}
                                placeholder="25000"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Nomor Polisi (Plat)</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={form.nomorPolisi}
                            onChangeText={(val) => onChange("nomorPolisi", val.toUpperCase())}
                            placeholder="Contoh: B 1234 ABC"
                            placeholderTextColor="#999"
                            autoCapitalize="characters"
                        />
                    </View>

                    {/* BUTTONS */}
                    <View style={[styles.modalButtons, { marginTop: 20 }]}>
                        <Pressable
                            style={[
                                styles.cancelButton,
                                loading && styles.disabledButton,
                            ]}
                            onPress={onCancel}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>
                                Batal
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.confirmSaveButton,
                                loading && styles.disabledButton,
                            ]}
                            onPress={onSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmSaveText}>
                                    Simpan Perubahan
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </AnimatedModalCard>
            </View>
        </Modal>
    );
}


// =============================================================
// MOBILE NAV
// =============================================================

function MobileNav({
    icon,
    title,
    active = false,
    onPress,
}) {
    return (
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Ionicons
                name={icon}
                size={21}
                color={
                    active
                        ? "#F20D18"
                        : "#999999"
                }
            />
            <Text
                style={[
                    styles.navText,
                    active &&
                    styles.navTextActive,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}


// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({

    // =========================================================
    // GENERAL
    // =========================================================

    container: {
        flex: 1,
        backgroundColor: "#F7F7F7",
    },

    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },

    loadingText: {
        marginTop: 10,
        color: "#777777",
    },


    // =========================================================
    // DESKTOP
    // =========================================================

    topRightToast: {
        position: "absolute",
        top: 24,
        right: 24,
        zIndex: 9999,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 14,
        borderLeftWidth: 5,
        borderLeftColor: "#16A34A",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        maxWidth: 380,
    },
    toastIconBox: {
        marginRight: 12,
    },
    toastTextBox: {
        flex: 1,
    },
    toastTitle: {
        fontSize: 13.5,
        fontWeight: "800",
        color: "#181818",
    },
    toastSubtitle: {
        fontSize: 11.5,
        color: "#555555",
        marginTop: 2,
    },
    desktopContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#F5F6F8",
    },

    sidebar: {
        width: 245,
        backgroundColor: "#4A0404",
        paddingHorizontal: 18,
        paddingTop: 30,
        paddingBottom: 22,
        justifyContent: "space-between",
    },

    sidebarBrand: {
        alignItems: "center",
        marginBottom: 35,
    },

    sidebarLogoBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },

    sidebarLogo: {
        width: 44,
        height: 44,
    },

    sidebarBrandTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "900",
    },

    sidebarBrandSubtitle: {
        color: "#D9B7B7",
        fontSize: 11,
        marginTop: 3,
    },

    sidebarMenu: {
        flex: 1,
    },

    sidebarItem: {
        height: 52,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        marginBottom: 7,
    },

    sidebarItemActive: {
        backgroundColor: "rgb(87, 10, 10)",
        shadowColor: "#000000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 4,
    },

    sidebarItemText: {
        color: "#D7B4B4",
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 13,
    },

    sidebarItemTextActive: {
        color: "#FFFFFF",
        fontWeight: "800",
    },

    sidebarFooter: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.12)",
        paddingTop: 18,
        flexDirection: "row",
        alignItems: "center",
    },

    sidebarAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#F20D18",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },

    sidebarAvatarImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },

    sidebarAvatarInitial: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },

    sidebarUserInfo: {
        marginLeft: 10,
    },

    sidebarUserName: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "800",
    },

    sidebarUserRole: {
        color: "#CDAAAA",
        fontSize: 9,
        marginTop: 2,
    },

    desktopMain: {
        flex: 1,
        minWidth: 0,
    },

    desktopTopbar: {
        height: 86,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#EAEAEA",
        paddingHorizontal: 34,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    desktopTopTitle: {
        fontSize: 21,
        fontWeight: "900",
        color: "#222222",
    },

    desktopTopSubtitle: {
        fontSize: 11,
        color: "#888888",
        marginTop: 4,
    },

    desktopAddButton: {
        height: 44,
        paddingHorizontal: 17,
        borderRadius: 11,
        backgroundColor: "#860007ff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    desktopAddButtonText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "800",
        marginLeft: 6,
    },

    desktopContent: {
        flex: 1,
        paddingHorizontal: 34,
        paddingTop: 25,
    },

    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 28,
    },

    summaryCard: {
        width: 230,
        height: 82,
        borderRadius: 17,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E9E9E9",
        paddingHorizontal: 17,
        flexDirection: "row",
        alignItems: "center",
    },

    summaryIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: "#FFF1F1",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    summaryNumber: {
        fontSize: 21,
        fontWeight: "900",
        color: "#222222",
    },

    summaryLabel: {
        fontSize: 10,
        color: "#888888",
        marginTop: 2,
    },

    summaryInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: "#F2FBF5",
        borderRadius: 10,
    },

    summaryInfoText: {
        color: "#4D755B",
        fontSize: 10,
        marginLeft: 7,
    },

    vehicleSectionHeader: {
        marginBottom: 15,
    },

    vehicleSectionTitle: {
        fontSize: 17,
        fontWeight: "900",
        color: "#222222",
    },

    vehicleSectionSubtitle: {
        fontSize: 10,
        color: "#999999",
        marginTop: 4,
    },

    desktopList: {
        paddingBottom: 35,
    },

    desktopColumn: {
        gap: 18,
    },

    desktopVehicleCard: {
        flex: 1,
        minHeight: 235,
        maxWidth: 480,
        marginBottom: 18,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E7E7E7",
        padding: 20,
    },

    desktopVehicleTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    desktopVehicleTopLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    desktopVehicleIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#FFF1F1",
        justifyContent: "center",
        alignItems: "center",
    },

    desktopVehicleYear: {
        backgroundColor: "#FDECEF",
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 8,
    },

    desktopYearText: {
        color: "#C8102E",
        fontSize: 10,
        fontWeight: "800",
    },

    desktopVehicleMainRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 6,
    },

    desktopVehicleBrandCol: {
        flex: 1,
        paddingRight: 10,
    },

    desktopVehicleBrand: {
        fontSize: 18,
        fontWeight: "900",
        color: "#222222",
    },

    desktopVehicleModel: {
        fontSize: 13,
        color: "#888888",
        marginTop: 3,
    },

    desktopCarImageWrap: {
        width: 150,
        height: 90,
        justifyContent: "center",
        alignItems: "center",
    },

    desktopCarImage: {
        width: 150,
        height: 90,
    },

    desktopVehicleDivider: {
        height: 1,
        backgroundColor: "#EEEEEE",
        marginVertical: 17,
    },

    desktopInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    desktopInfoRight: {
        alignItems: "flex-end",
    },

    desktopInfoLabel: {
        fontSize: 9,
        color: "#999999",
        marginBottom: 4,
    },

    desktopInfoValue: {
        fontSize: 12,
        color: "#333333",
        fontWeight: "800",
    },

    desktopActionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 18,
    },

    desktopEditButton: {
        flex: 1,
        height: 35,
        borderRadius: 9,
        backgroundColor: "#E3F2FD",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    desktopEditText: {
        color: "#1E88E5",
        fontSize: 11,
        fontWeight: "800",
        marginLeft: 6,
    },

    desktopDeleteButton: {
        flex: 1,
        height: 35,
        borderRadius: 9,
        backgroundColor: "#FFF3F4",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    desktopDeleteText: {
        color: "#C8102E",
        fontSize: 11,
        fontWeight: "800",
        marginLeft: 6,
    },

    desktopEmpty: {
        minHeight: 330,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E7E7E7",
        justifyContent: "center",
        alignItems: "center",
        padding: 30,
    },

    desktopEmptyIcon: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: "#FFF1F2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 17,
    },

    desktopEmptyTitle: {
        fontSize: 19,
        fontWeight: "900",
        color: "#222222",
    },

    desktopEmptyText: {
        maxWidth: 380,
        textAlign: "center",
        color: "#888888",
        fontSize: 11,
        lineHeight: 18,
        marginTop: 7,
    },

    desktopEmptyButton: {
        height: 43,
        paddingHorizontal: 17,
        borderRadius: 10,
        backgroundColor: "#F20D18",
        flexDirection: "row",
        alignItems: "center",
        marginTop: 18,
    },

    desktopEmptyButtonText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "800",
        marginLeft: 6,
    },


    // =========================================================
    // MOBILE
    // =========================================================

    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 20,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    backText: {
        fontSize: 32,
        color: "#222222",
        lineHeight: 34,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#222222",
    },

    headerSubtitle: {
        fontSize: 13,
        color: "#888888",
        marginTop: 3,
    },

    list: {
        padding: 20,
        paddingBottom: 155,
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        marginBottom: 15,
        elevation: 3,
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    vehicleTitle: {
        flex: 1,
        paddingRight: 10,
    },

    merek: {
        fontSize: 18,
        fontWeight: "800",
        color: "#222222",
    },

    model: {
        fontSize: 15,
        color: "#777777",
        marginTop: 3,
    },

    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    tahun: {
        backgroundColor: "#FDECEF",
        color: "#C8102E",
        fontWeight: "700",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },

    editButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#E3F2FD",
        justifyContent: "center",
        alignItems: "center",
    },

    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#FFF1F2",
        justifyContent: "center",
        alignItems: "center",
    },

    mobileCarImageContainer: {
        width: "100%",
        height: 120,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 10,
    },

    mobileCarImage: {
        width: "100%",
        height: 120,
    },

    divider: {
        height: 1,
        backgroundColor: "#EEEEEE",
        marginVertical: 15,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },

    label: {
        fontSize: 13,
        color: "#888888",
    },

    value: {
        fontSize: 13,
        fontWeight: "700",
        color: "#333333",
    },

    empty: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
    },

    emptyIcon: {
        width: 75,
        height: 75,
        borderRadius: 38,
        backgroundColor: "#FFF1F2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#222222",
    },

    emptyText: {
        textAlign: "center",
        color: "#888888",
        marginTop: 8,
        lineHeight: 20,
    },

    addButton: {
        position: "absolute",
        bottom: 76,
        left: 20,
        right: 20,
        height: 52,
        borderRadius: 15,
        backgroundColor: "#C8102E",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        zIndex: 10,
        elevation: 6,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },

    addButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        marginLeft: 6,
    },

    // =========================================================
    // MOBILE BOTTOM NAV
    // =========================================================

    bottomNav: {
        height: 64,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },

    navItem: {
        width: "25%",
        justifyContent: "center",
        alignItems: "center",
    },

    navText: {
        fontSize: 8,
        color: "#999999",
        marginTop: 3,
        fontWeight: "600",
    },

    navTextActive: {
        color: "#F20D18",
        fontWeight: "800",
    },


    // =========================================================
    // MODAL
    // =========================================================

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 25,
    },

    modalCard: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },

    modalIcon: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: "#FFF1F2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#222222",
        textAlign: "center",
    },

    modalText: {
        fontSize: 13,
        color: "#777777",
        lineHeight: 19,
        textAlign: "center",
        marginTop: 7,
    },

    selectedVehicle: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F8F8",
        borderRadius: 13,
        padding: 13,
        marginTop: 17,
        marginBottom: 20,
    },

    selectedVehicleText: {
        marginLeft: 10,
        flex: 1,
    },

    selectedVehicleName: {
        fontSize: 14,
        fontWeight: "800",
        color: "#222222",
    },

    selectedVehiclePlate: {
        fontSize: 12,
        color: "#888888",
        marginTop: 2,
    },

    modalButtons: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
    },

    cancelButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
    },

    cancelButtonText: {
        color: "#555555",
        fontSize: 13,
        fontWeight: "800",
    },

    confirmDeleteButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: "#C8102E",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },

    confirmDeleteText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
        marginLeft: 6,
    },

    disabledButton: {
        opacity: 0.6,
    },

    formGroup: {
        width: "100%",
        marginBottom: 12,
    },

    formRow: {
        width: "100%",
        flexDirection: "row",
    },

    inputLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#444444",
        marginBottom: 6,
    },

    modalInput: {
        width: "100%",
        height: 44,
        borderRadius: 10,
        backgroundColor: "#F8F9FA",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 12,
        fontSize: 13,
        color: "#222222",
    },

    confirmSaveButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: "#1E88E5",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },

    confirmSaveText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    errorAlert: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF1F2",
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        width: "100%",
        gap: 6,
    },

    errorAlertText: {
        color: "#C8102E",
        fontSize: 12,
        fontWeight: "600",
        flex: 1,
    },

});