import { router, useLocalSearchParams } from "expo-router";
import { safeBack } from "../utils/navigation";
import { useEffect, useState } from "react";
import * as Location from "expo-location";

import {
    ActivityIndicator,
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { API_URL } from "../config";
import RealtimeClock from "../components/RealtimeClock";
import AnimatedModalCard from "../components/AnimatedModalCard";

const RED = "#B22222";

export default function BookingStep3() {
    const params = useLocalSearchParams();
    const { width } = useWindowDimensions();

    const isDesktop = width >= 900;

    const {
        kendaraanId,
        merek,
        model,
        nomorPolisi,
        tahun,
        kilometer,
        layanan,
        totalHarga,
        totalDurasi,
    } = params;

    // =========================================================
    // STATE
    // =========================================================

    const [bengkelList, setBengkelList] = useState([]);
    const [selectedBengkel, setSelectedBengkel] = useState(null);

    const getTodayFormatted = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(getTodayFormatted());
    const [jadwalList, setJadwalList] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [selectedJam, setSelectedJam] = useState("");

    const [loadingBengkel, setLoadingBengkel] = useState(true);
    const [loadingJadwal, setLoadingJadwal] = useState(false);

    const [showCalendar, setShowCalendar] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // =========================================================
    // LOKASI
    // =========================================================

    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [locationEnabled, setLocationEnabled] = useState(false);

    // =========================================================
    // CALENDAR
    // =========================================================

    const today = new Date();

    const [calendarMonth, setCalendarMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );

    // =========================================================
    // RESPONSIVE CONTAINER
    // =========================================================

    const contentStyle = isDesktop
        ? styles.desktopContent
        : styles.mobileContent;

    // =========================================================
    // LOAD BENGKEL
    // =========================================================

    useEffect(() => {
        loadBengkel();
    }, []);

    const loadBengkel = async () => {
        try {
            setLoadingBengkel(true);

            const response = await fetch(
                `${API_URL}/api/booking/bengkel`
            );

            const data = await response.json();

            console.log("BENGKEL:", data);

            if (data.success) {
                const list = data.data || [];

                const preparedList = list.map((bengkel) => ({
                    ...bengkel,
                    latitude: Number(bengkel.latitude),
                    longitude: Number(bengkel.longitude),
                    distanceKm: null,
                }));

                setBengkelList(preparedList);

                if (preparedList.length > 0) {
                    setSelectedBengkel(preparedList[0]);
                }
            } else {
                setBengkelList([]);
            }
        } catch (error) {
            console.log("LOAD BENGKEL ERROR:", error);
            setBengkelList([]);
        } finally {
            setLoadingBengkel(false);
        }
    };

    // =========================================================
    // HITUNG JARAK
    // =========================================================

    const calculateDistanceKm = (
        lat1,
        lon1,
        lat2,
        lon2
    ) => {
        const latitude1 = Number(lat1);
        const longitude1 = Number(lon1);
        const latitude2 = Number(lat2);
        const longitude2 = Number(lon2);

        if (
            !Number.isFinite(latitude1) ||
            !Number.isFinite(longitude1) ||
            !Number.isFinite(latitude2) ||
            !Number.isFinite(longitude2)
        ) {
            return null;
        }

        const toRad = (value) =>
            (value * Math.PI) / 180;

        const R = 6371;

        const dLat = toRad(latitude2 - latitude1);
        const dLon = toRad(longitude2 - longitude1);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(latitude1)) *
                Math.cos(toRad(latitude2)) *
                Math.sin(dLon / 2) ** 2;

        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return R * c;
    };

    const formatDistance = (distance) => {
        if (distance === null) {
            return "Jarak tidak tersedia";
        }

        if (distance < 1) {
            return `${Math.round(distance * 1000)} m dari Anda`;
        }

        return `${distance.toFixed(1)} km dari Anda`;
    };

    // =========================================================
    // GUNAKAN LOKASI USER
    // =========================================================

    const useMyLocation = async () => {
        try {
            setLocationLoading(true);
            setLocationError("");

            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                setLocationEnabled(false);

                setLocationError(
                    "Izin lokasi ditolak. Anda tetap dapat memilih bengkel secara manual."
                );

                return;
            }

            const location =
                await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;

            console.log("LOKASI USER:", {
                latitude,
                longitude,
            });

            setUserLocation({
                latitude,
                longitude,
            });

            setLocationEnabled(true);

            const sortedList = bengkelList
                .map((bengkel) => {
                    const distanceKm =
                        calculateDistanceKm(
                            latitude,
                            longitude,
                            bengkel.latitude,
                            bengkel.longitude
                        );

                    return {
                        ...bengkel,
                        distanceKm,
                    };
                })
                .sort((a, b) => {
                    if (a.distanceKm === null) {
                        return 1;
                    }

                    if (b.distanceKm === null) {
                        return -1;
                    }

                    return (
                        a.distanceKm -
                        b.distanceKm
                    );
                });

            setBengkelList(sortedList);

            if (sortedList.length > 0) {
                setSelectedBengkel(sortedList[0]);
                setSelectedScheduleId(null);
                setSelectedJam("");
            }
        } catch (error) {
            console.log("LOCATION ERROR:", error);

            setLocationEnabled(false);

            setLocationError(
                "Lokasi tidak dapat ditemukan. Silakan pilih bengkel secara manual."
            );
        } finally {
            setLocationLoading(false);
        }
    };

    // =========================================================
    // GOOGLE MAPS
    // =========================================================

    const openGoogleMaps = async (bengkel) => {
        const latitude = Number(bengkel.latitude);
        const longitude = Number(bengkel.longitude);

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            setErrorMessage(
                "Lokasi bengkel belum tersedia."
            );
            return;
        }

        const url =
            `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

        try {
            await Linking.openURL(url);
        } catch (error) {
            console.log(
                "GOOGLE MAPS ERROR:",
                error
            );

            setErrorMessage(
                "Google Maps tidak dapat dibuka."
            );
        }
    };

    // =========================================================
    // PILIH BENGKEL
    // =========================================================

    const selectBengkel = (bengkel) => {
        setSelectedBengkel(bengkel);

        setSelectedScheduleId(null);
        setSelectedJam("");

        setErrorMessage("");

        console.log("BENGKEL DIPILIH:", {
            id: bengkel.id,
            nama: bengkel.nama_bengkel,
            alamat: bengkel.alamat,
        });
    };

    // =========================================================
    // FORMAT TANGGAL
    // =========================================================

    const formatDateAPI = (date) => {
        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const formatDateDisplay = (dateString) => {
        if (!dateString) {
            return "Belum dipilih";
        }

        const [year, month, day] =
            dateString.split("-");

        const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        const hari = [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
        ];

        const bulan = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
        ];

        return `${hari[date.getDay()]}, ${day} ${bulan[date.getMonth()]} ${year}`;
    };

    // =========================================================
    // LOAD JADWAL
    // =========================================================

    useEffect(() => {
        if (selectedBengkel && selectedDate) {
            loadJadwal();
        }
    }, [selectedBengkel, selectedDate]);

    const loadJadwal = async () => {
        try {
            setLoadingJadwal(true);

            setJadwalList([]);
            setSelectedScheduleId(null);
            setSelectedJam("");
            setErrorMessage("");

            const url =
                `${API_URL}/api/booking/jadwal/` +
                `${selectedBengkel.id}/` +
                `${selectedDate}`;

            console.log("REQUEST JADWAL:", url);

            const response = await fetch(url);
            const data = await response.json();

            console.log("RESPONSE JADWAL:", data);

            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                setJadwalList(data.data);
            } else {
                const defaultHours = [
                    "09:00:00",
                    "10:00:00",
                    "11:00:00",
                    "13:00:00",
                    "14:00:00",
                    "15:00:00",
                    "16:00:00",
                    "17:00:00",
                    "18:00:00",
                    "19:00:00",
                ];
                const fallbackList = defaultHours.map((jam, index) => ({
                    id: (selectedBengkel?.id || 1) * 1000 + index + 1,
                    bengkel_id: selectedBengkel?.id || 1,
                    tanggal: selectedDate,
                    jam: jam,
                    tersedia: 2,
                    kapasitas: 2,
                    status: "tersedia",
                }));
                setJadwalList(fallbackList);
            }
        } catch (error) {
            console.log(
                "LOAD JADWAL ERROR:",
                error
            );

            const defaultHours = [
                "09:00:00",
                "10:00:00",
                "11:00:00",
                "13:00:00",
                "14:00:00",
                "15:00:00",
                "16:00:00",
                "17:00:00",
                "18:00:00",
                "19:00:00",
            ];
            const fallbackList = defaultHours.map((jam, index) => ({
                id: (selectedBengkel?.id || 1) * 1000 + index + 1,
                bengkel_id: selectedBengkel?.id || 1,
                tanggal: selectedDate,
                jam: jam,
                tersedia: 2,
                kapasitas: 2,
                status: "tersedia",
            }));
            setJadwalList(fallbackList);
        } finally {
            setLoadingJadwal(false);
        }
    };

    // =========================================================
    // KALENDER
    // =========================================================

    const getDaysInMonth = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();

        const firstDay =
            new Date(year, month, 1).getDay();

        const totalDays =
            new Date(
                year,
                month + 1,
                0
            ).getDate();

        const days = [];

        for (
            let i = 0;
            i < firstDay;
            i++
        ) {
            days.push(null);
        }

        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {
            days.push(day);
        }

        return days;
    };

    const isPastDate = (day) => {
        if (!day) {
            return false;
        }

        const date = new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth(),
            day
        );

        const todayDate = new Date();

        todayDate.setHours(
            0,
            0,
            0,
            0
        );

        return date < todayDate;
    };

    const isSelectedDate = (day) => {
        if (!day || !selectedDate) {
            return false;
        }

        const date = new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth(),
            day
        );

        return (
            formatDateAPI(date) ===
            selectedDate
        );
    };

    const selectDate = (day) => {
        if (!day) {
            return;
        }

        if (isPastDate(day)) {
            return;
        }

        const date = new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth(),
            day
        );

        const formatted =
            formatDateAPI(date);

        console.log(
            "TANGGAL DIPILIH:",
            formatted
        );

        setSelectedDate(formatted);
        setSelectedScheduleId(null);
        setSelectedJam("");
        setErrorMessage("");
        setShowCalendar(false);
    };

    const changeMonth = (amount) => {
        setCalendarMonth(
            new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth() +
                    amount,
                1
            )
        );
    };

    const monthName = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];

    // =========================================================
    // PILIH JAM
    // =========================================================

    const selectSchedule = (jadwal) => {
        const scheduleId =
            String(jadwal.id);

        const jam =
            String(jadwal.jam || "")
                .substring(0, 5);

        console.log(
            "JADWAL DIPILIH:",
            {
                id: scheduleId,
                jam,
            }
        );

        setSelectedScheduleId(
            scheduleId
        );

        setSelectedJam(jam);
        setErrorMessage("");
    };

    // =========================================================
    // BACK
    // =========================================================

    const handleBack = () => {
        safeBack("/booking-step2");
    };

    // =========================================================
    // CONTINUE
    // =========================================================

    const canContinue =
        Boolean(
            selectedBengkel &&
                selectedDate &&
                selectedScheduleId &&
                selectedJam
        );

    const handleContinue = () => {
        if (!selectedBengkel) {
            setErrorMessage(
                "Silakan pilih bengkel terlebih dahulu."
            );
            return;
        }

        if (!selectedDate) {
            setErrorMessage(
                "Silakan pilih tanggal service."
            );
            return;
        }

        if (!selectedScheduleId) {
            setErrorMessage(
                "Silakan pilih jam service."
            );
            return;
        }

        if (!selectedJam) {
            setErrorMessage(
                "Silakan pilih jam service."
            );
            return;
        }

        console.log(
            "STEP 3 DATA:",
            {
                kendaraanId,
                bengkelId:
                    selectedBengkel.id,
                tanggal:
                    selectedDate,
                jadwalId:
                    selectedScheduleId,
                jam:
                    selectedJam,
            }
        );

        router.push({
            pathname:
                "/booking-step4",

            params: {
                kendaraanId:
                    String(kendaraanId),

                merek:
                    String(
                        merek || ""
                    ),

                model:
                    String(
                        model || ""
                    ),

                nomorPolisi:
                    String(
                        nomorPolisi || ""
                    ),

                tahun:
                    String(
                        tahun || ""
                    ),

                kilometer:
                    String(
                        kilometer || "0"
                    ),

                layanan:
                    String(
                        layanan || "[]"
                    ),

                totalHarga:
                    String(
                        totalHarga || "0"
                    ),

                totalDurasi:
                    String(
                        totalDurasi || "0"
                    ),

                bengkelId:
                    String(
                        selectedBengkel.id
                    ),

                namaBengkel:
                    String(
                        selectedBengkel.nama_bengkel ||
                            ""
                    ),

                alamatBengkel:
                    String(
                        selectedBengkel.alamat ||
                            ""
                    ),

                tanggal:
                    String(
                        selectedDate
                    ),

                jam:
                    String(
                        selectedJam
                    ),

                jadwalId:
                    String(
                        selectedScheduleId
                    ),
            },
        });
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>

                {/* =================================================
                    HEADER
                ================================================= */}

                <View
                    style={[
                        styles.header,
                        isDesktop &&
                            styles.headerDesktop,
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={23}
                            color="#222"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerTextBox}>
                        <Text style={styles.headerTitle}>
                            Pilih Jadwal
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            Tentukan bengkel, tanggal dan waktu
                        </Text>
                    </View>

                    <RealtimeClock compact={!isDesktop} isDesktop={isDesktop} />
                </View>

                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        contentStyle,
                    ]}
                >
                    {/* =================================================
                        STEPPER
                    ================================================= */}

                    <View
                        style={[
                            styles.stepContainer,
                            isDesktop &&
                                styles.stepContainerDesktop,
                        ]}
                    >
                        {[
                            {
                                number: 1,
                                label: "Kendaraan",
                            },
                            {
                                number: 2,
                                label: "Layanan",
                            },
                            {
                                number: 3,
                                label: "Jadwal",
                            },
                            {
                                number: 4,
                                label: "Konfirmasi",
                            },
                        ].map(
                            (
                                item,
                                index
                            ) => (
                                <View
                                    key={
                                        item.number
                                    }
                                    style={
                                        styles.stepItem
                                    }
                                >
                                    <View
                                        style={
                                            styles.stepTop
                                        }
                                    >
                                        <View
                                            style={[
                                                styles.stepCircle,
                                                item.number <=
                                                    3 &&
                                                    styles.stepCircleActive,
                                            ]}
                                        >
                                            {item.number <
                                            3 ? (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={
                                                        16
                                                    }
                                                    color="#fff"
                                                />
                                            ) : (
                                                <Text
                                                    style={[
                                                        styles.stepNumber,
                                                        item.number ===
                                                            3 &&
                                                            styles.stepNumberActive,
                                                    ]}
                                                >
                                                    {
                                                        item.number
                                                    }
                                                </Text>
                                            )}
                                        </View>

                                        {index <
                                            3 && (
                                            <View
                                                style={[
                                                    styles.stepLine,
                                                    item.number <
                                                        3 &&
                                                        styles.stepLineActive,
                                                ]}
                                            />
                                        )}
                                    </View>

                                    <Text
                                        style={[
                                            styles.stepLabel,
                                            item.number ===
                                                3 &&
                                                styles.stepLabelActive,
                                        ]}
                                    >
                                        {
                                            item.label
                                        }
                                    </Text>
                                </View>
                            )
                        )}
                    </View>

                    {/* =================================================
                        VEHICLE
                    ================================================= */}

                    <View
                        style={[
                            styles.vehicleCard,
                            isDesktop &&
                                styles.desktopCard,
                        ]}
                    >
                        <View style={styles.vehicleIcon}>
                            <Ionicons
                                name="car-sport"
                                size={27}
                                color={RED}
                            />
                        </View>

                        <View style={styles.vehicleInfo}>
                            <Text style={styles.labelSmall}>
                                Kendaraan
                            </Text>

                            <Text style={styles.vehicleName}>
                                {merek} {model}
                            </Text>

                            <Text style={styles.vehicleMeta}>
                                {nomorPolisi} • {tahun}
                            </Text>
                        </View>

                        <View style={styles.vehicleCheck}>
                            <Ionicons
                                name="checkmark"
                                size={18}
                                color="#fff"
                            />
                        </View>
                    </View>

                    {/* =================================================
                        BENGKEL
                    ================================================= */}

                    <Text style={styles.sectionTitle}>
                        Pilih Bengkel
                    </Text>

                    {/* LOCATION */}

                    <View
                        style={[
                            styles.locationCard,
                            isDesktop &&
                                styles.desktopCard,
                        ]}
                    >
                        <View style={styles.locationIcon}>
                            <Ionicons
                                name={
                                    locationEnabled
                                        ? "location"
                                        : "location-outline"
                                }
                                size={23}
                                color={RED}
                            />
                        </View>

                        <View style={styles.locationInfo}>
                            <Text style={styles.locationTitle}>
                                {locationEnabled
                                    ? "Lokasi aktif"
                                    : "Cari bengkel terdekat"}
                            </Text>

                            <Text style={styles.locationText}>
                                {locationEnabled
                                    ? "Bengkel sudah diurutkan dari yang terdekat."
                                    : "Gunakan lokasi Anda untuk menemukan bengkel terdekat."}
                            </Text>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={useMyLocation}
                            disabled={locationLoading}
                            style={styles.locationButton}
                        >
                            {locationLoading ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#fff"
                                />
                            ) : (
                                <Text style={styles.locationButtonText}>
                                    {locationEnabled
                                        ? "Perbarui"
                                        : "Gunakan"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* LOCATION ERROR */}

                    {Boolean(locationError) ? (
                        <View style={styles.locationErrorBox}>
                            <Ionicons
                                name="information-circle-outline"
                                size={18}
                                color={RED}
                            />

                            <Text style={styles.locationErrorText}>
                                {locationError}
                            </Text>
                        </View>
                    ) : null}

                    {/* NEAREST */}

                    {Boolean(locationEnabled) ? (
                        <View style={styles.nearestLabel}>
                            <Ionicons
                                name="navigate-outline"
                                size={17}
                                color={RED}
                            />

                            <Text style={styles.nearestLabelText}>
                                Bengkel terdekat dari Anda
                            </Text>
                        </View>
                    ) : null}

                    {/* BENGKEL LIST */}

                    {loadingBengkel ? (
                        <ActivityIndicator
                            color={RED}
                            style={styles.loadingMargin}
                        />
                    ) : bengkelList.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons
                                name="business-outline"
                                size={32}
                                color="#aaa"
                            />

                            <Text style={styles.emptyTitle}>
                                Bengkel tidak tersedia
                            </Text>

                            <Text style={styles.emptyText}>
                                Belum ada bengkel aktif.
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={
                                isDesktop
                                    ? styles.desktopBengkelGrid
                                    : undefined
                            }
                        >
                            {bengkelList.map(
                                (
                                    bengkel,
                                    index
                                ) => {
                                    const selected =
                                        selectedBengkel?.id ===
                                        bengkel.id;

                                    const isNearest =
                                        locationEnabled &&
                                        index ===
                                            0 &&
                                        bengkel.distanceKm !==
                                            null;

                                    return (
                                        <View
                                            key={
                                                bengkel.id
                                            }
                                            style={[
                                                styles.bengkelCard,
                                                selected &&
                                                    styles.bengkelCardSelected,
                                                isDesktop &&
                                                    styles.bengkelCardDesktop,
                                            ]}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={
                                                    0.8
                                                }
                                                onPress={() =>
                                                    selectBengkel(
                                                        bengkel
                                                    )
                                                }
                                                style={
                                                    styles.bengkelTopRow
                                                }
                                            >
                                                <View
                                                    style={
                                                        styles.bengkelIconBox
                                                    }
                                                >
                                                    <Ionicons
                                                        name="business"
                                                        size={
                                                            27
                                                        }
                                                        color={
                                                            RED
                                                        }
                                                    />
                                                </View>

                                                <View
                                                    style={
                                                        styles.bengkelMain
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.bengkelName
                                                        }
                                                        numberOfLines={
                                                            2
                                                        }
                                                    >
                                                        {bengkel.nama_bengkel ||
                                                            "Nama bengkel tidak tersedia"}
                                                    </Text>

                                                    <View
                                                        style={
                                                            styles.infoRow
                                                        }
                                                    >
                                                        <Ionicons
                                                            name="location-outline"
                                                            size={
                                                                15
                                                            }
                                                            color="#888"
                                                        />

                                                        <Text
                                                            style={
                                                                styles.bengkelAddress
                                                            }
                                                            numberOfLines={
                                                                3
                                                            }
                                                        >
                                                            {bengkel.alamat ||
                                                                "Alamat bengkel tidak tersedia"}
                                                        </Text>
                                                    </View>

                                                    {bengkel.no_hp ? (
                                                        <View
                                                            style={
                                                                styles.infoRow
                                                            }
                                                        >
                                                            <Ionicons
                                                                name="call-outline"
                                                                size={
                                                                    14
                                                                }
                                                                color="#888"
                                                            />

                                                            <Text
                                                                style={
                                                                    styles.bengkelExtra
                                                                }
                                                            >
                                                                {
                                                                    bengkel.no_hp
                                                                }
                                                            </Text>
                                                        </View>
                                                    ) : null}

                                                    {bengkel.jam_buka &&
                                                    bengkel.jam_tutup ? (
                                                        <View
                                                            style={
                                                                styles.infoRow
                                                            }
                                                        >
                                                            <Ionicons
                                                                name="time-outline"
                                                                size={
                                                                    14
                                                                }
                                                                color="#888"
                                                            />

                                                            <Text
                                                                style={
                                                                    styles.bengkelExtra
                                                                }
                                                            >
                                                                Buka{" "}
                                                                {String(
                                                                    bengkel.jam_buka
                                                                ).substring(
                                                                    0,
                                                                    5
                                                                )}{" "}
                                                                -{" "}
                                                                {String(
                                                                    bengkel.jam_tutup
                                                                ).substring(
                                                                    0,
                                                                    5
                                                                )}
                                                            </Text>
                                                        </View>
                                                    ) : null}

                                                    {locationEnabled &&
                                                    bengkel.distanceKm !==
                                                        null ? (
                                                        <View
                                                            style={
                                                                styles.distanceRow
                                                            }
                                                        >
                                                            <Ionicons
                                                                name="navigate-outline"
                                                                size={
                                                                    15
                                                                }
                                                                color={
                                                                    RED
                                                                }
                                                            />

                                                            <Text
                                                                style={
                                                                    styles.distanceText
                                                                }
                                                            >
                                                                {formatDistance(
                                                                    bengkel.distanceKm
                                                                )}
                                                            </Text>
                                                        </View>
                                                    ) : null}

                                                    {isNearest ? (
                                                        <View
                                                            style={
                                                                styles.nearestBadge
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.nearestBadgeText
                                                                }
                                                            >
                                                                BENGKEL TERDEKAT
                                                            </Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            </TouchableOpacity>

                                            {/* ACTION */}

                                            <View
                                                style={
                                                    styles.bengkelActions
                                                }
                                            >
                                                <TouchableOpacity
                                                    activeOpacity={
                                                        0.8
                                                    }
                                                    onPress={() =>
                                                        openGoogleMaps(
                                                            bengkel
                                                        )
                                                    }
                                                    style={
                                                        styles.mapsButton
                                                    }
                                                >
                                                    <Ionicons
                                                        name="map-outline"
                                                        size={
                                                            18
                                                        }
                                                        color={
                                                            RED
                                                        }
                                                    />

                                                    <Text
                                                        style={
                                                            styles.mapsButtonText
                                                        }
                                                    >
                                                        Maps
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    activeOpacity={
                                                        0.8
                                                    }
                                                    onPress={() =>
                                                        selectBengkel(
                                                            bengkel
                                                        )
                                                    }
                                                    style={[
                                                        styles.selectBengkelButton,
                                                        selected &&
                                                            styles.selectBengkelButtonActive,
                                                    ]}
                                                >
                                                    {selected && (
                                                        <Ionicons
                                                            name="checkmark"
                                                            size={
                                                                16
                                                            }
                                                            color="#fff"
                                                        />
                                                    )}

                                                    <Text
                                                        style={[
                                                            styles.selectBengkelText,
                                                            selected &&
                                                                styles.selectBengkelTextActive,
                                                        ]}
                                                    >
                                                        {selected
                                                            ? "Dipilih"
                                                            : "Pilih"}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                }
                            )}
                        </View>
                    )}

                    {/* =================================================
                        DATE
                    ================================================= */}

                    <Text style={styles.sectionTitle}>
                        Pilih Tanggal
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            setCalendarMonth(
                                selectedDate
                                    ? new Date(
                                          Number(
                                              selectedDate.substring(
                                                  0,
                                                  4
                                              )
                                          ),
                                          Number(
                                              selectedDate.substring(
                                                  5,
                                                  7
                                              )
                                          ) - 1,
                                          1
                                      )
                                    : new Date(
                                          today.getFullYear(),
                                          today.getMonth(),
                                          1
                                      )
                            );

                            setShowCalendar(true);
                        }}
                        style={[
                            styles.dateCard,
                            selectedDate &&
                                styles.cardSelected,
                            isDesktop &&
                                styles.desktopCard,
                        ]}
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons
                                name="calendar-outline"
                                size={26}
                                color={RED}
                            />
                        </View>

                        <View style={styles.dateInfo}>
                            <Text style={styles.labelSmall}>
                                Tanggal Service
                            </Text>

                            <Text
                                style={[
                                    styles.dateValue,
                                    !selectedDate &&
                                        styles.notSelected,
                                ]}
                            >
                                {selectedDate
                                    ? formatDateDisplay(
                                          selectedDate
                                      )
                                    : "Belum dipilih"}
                            </Text>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={22}
                            color="#777"
                        />
                    </TouchableOpacity>

                    {/* =================================================
                        TIME
                    ================================================= */}

                    {Boolean(selectedDate) ? (
                        <>
                            <Text style={styles.sectionTitle}>
                                Pilih Waktu
                            </Text>

                            {loadingJadwal ? (
                                <View style={styles.loadingCard}>
                                    <ActivityIndicator
                                        color={RED}
                                    />

                                    <Text style={styles.loadingText}>
                                        Memuat jadwal...
                                    </Text>
                                </View>
                            ) : jadwalList.length === 0 ? (
                                <View style={styles.emptyCard}>
                                    <Ionicons
                                        name="time-outline"
                                        size={32}
                                        color="#aaa"
                                    />

                                    <Text style={styles.emptyTitle}>
                                        Jadwal belum tersedia
                                    </Text>

                                    <Text style={styles.emptyText}>
                                        Tidak ada jadwal yang tersedia
                                        pada tanggal ini.
                                    </Text>
                                </View>
                            ) : (
                                <View
                                    style={[
                                        styles.timeGrid,
                                        isDesktop &&
                                            styles.timeGridDesktop,
                                    ]}
                                >
                                    {jadwalList.map(
                                        (jadwal) => {
                                            const id =
                                                String(
                                                    jadwal.id
                                                );

                                            const selected =
                                                id ===
                                                String(
                                                    selectedScheduleId
                                                );

                                            const jam =
                                                String(
                                                    jadwal.jam ||
                                                        ""
                                                ).substring(
                                                    0,
                                                    5
                                                );

                                            return (
                                                <TouchableOpacity
                                                    key={
                                                        jadwal.id
                                                    }
                                                    activeOpacity={
                                                        0.8
                                                    }
                                                    onPress={() =>
                                                        selectSchedule(
                                                            jadwal
                                                        )
                                                    }
                                                    style={[
                                                        styles.timeCard,
                                                        selected &&
                                                            styles.timeCardSelected,
                                                        isDesktop &&
                                                            styles.timeCardDesktop,
                                                    ]}
                                                >
                                                    <Ionicons
                                                        name="time-outline"
                                                        size={
                                                            19
                                                        }
                                                        color={
                                                            selected
                                                                ? "#fff"
                                                                : RED
                                                        }
                                                    />

                                                    <Text
                                                        style={[
                                                            styles.timeText,
                                                            selected &&
                                                                styles.timeTextSelected,
                                                        ]}
                                                    >
                                                        {
                                                            jam
                                                        }
                                                    </Text>

                                                    {selected && (
                                                        <Ionicons
                                                            name="checkmark-circle"
                                                            size={
                                                                19
                                                            }
                                                            color="#fff"
                                                        />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        }
                                    )}
                                </View>
                            )}
                        </>
                    ) : null}

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {Boolean(errorMessage) ? (
                        <View style={styles.errorBox}>
                            <Ionicons
                                name="alert-circle"
                                size={20}
                                color={RED}
                            />

                            <Text style={styles.errorText}>
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    {/* =================================================
                        SUMMARY
                    ================================================= */}

                    <View
                        style={[
                            styles.summaryCard,
                            isDesktop &&
                                styles.desktopCard,
                        ]}
                    >
                        <Text style={styles.summaryTitle}>
                            Ringkasan Jadwal
                        </Text>

                        <View style={styles.summaryRow}>
                            <Ionicons
                                name="business-outline"
                                size={21}
                                color="#888"
                            />

                            <Text style={styles.summaryText}>
                                {selectedBengkel
                                    ? selectedBengkel.nama_bengkel
                                    : "Belum dipilih"}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={21}
                                color="#888"
                            />

                            <Text
                                style={[
                                    styles.summaryText,
                                    !selectedDate &&
                                        styles.notSelected,
                                ]}
                            >
                                {selectedDate
                                    ? formatDateDisplay(
                                          selectedDate
                                      )
                                    : "Belum dipilih"}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Ionicons
                                name="time-outline"
                                size={21}
                                color="#888"
                            />

                            <Text
                                style={[
                                    styles.summaryText,
                                    !selectedJam &&
                                        styles.notSelected,
                                ]}
                            >
                                {selectedJam ||
                                    "Belum dipilih"}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* =================================================
                    BOTTOM BAR
                ================================================= */}

                <View
                    style={[
                        styles.bottomBar,
                        isDesktop &&
                            styles.bottomBarDesktop,
                    ]}
                >
                    <View style={styles.bottomInfo}>
                        <Text style={styles.bottomLabel}>
                            Jadwal Service
                        </Text>

                        <Text
                            style={[
                                styles.bottomValue,
                                !canContinue &&
                                    styles.bottomDisabled,
                            ]}
                            numberOfLines={1}
                        >
                            {canContinue
                                ? `${selectedDate} • ${selectedJam}`
                                : "Belum lengkap"}
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={
                            canContinue ? 0.8 : 1
                        }
                        disabled={!canContinue}
                        onPress={handleContinue}
                        style={[
                            styles.continueButton,
                            !canContinue &&
                                styles.continueDisabled,
                        ]}
                    >
                        <Text style={styles.continueText}>
                            Lanjutkan
                        </Text>

                        <Ionicons
                            name="arrow-forward"
                            size={21}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* =====================================================
                CALENDAR MODAL
            ===================================================== */}

            <Modal
                visible={showCalendar}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setShowCalendar(false)
                }
            >
                <View style={styles.modalOverlay}>
                    <AnimatedModalCard
                        style={[
                            styles.calendarModal,
                            isDesktop &&
                                styles.calendarModalDesktop,
                        ]}
                        visible={showCalendar}
                    >
                        {/* HEADER */}

                        <View style={styles.calendarHeader}>
                            <View>
                                <Text style={styles.calendarTitle}>
                                    Pilih Tanggal
                                </Text>

                                <Text
                                    style={
                                        styles.calendarSubtitle
                                    }
                                >
                                    Pilih tanggal service
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() =>
                                    setShowCalendar(false)
                                }
                                style={styles.closeButton}
                            >
                                <Ionicons
                                    name="close"
                                    size={21}
                                    color="#555"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* MONTH */}

                        <View style={styles.monthHeader}>
                            <TouchableOpacity
                                onPress={() =>
                                    changeMonth(-1)
                                }
                                style={styles.monthButton}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={20}
                                    color={RED}
                                />
                            </TouchableOpacity>

                            <Text style={styles.monthTitle}>
                                {
                                    monthName[
                                        calendarMonth.getMonth()
                                    ]
                                }{" "}
                                {
                                    calendarMonth.getFullYear()
                                }
                            </Text>

                            <TouchableOpacity
                                onPress={() =>
                                    changeMonth(1)
                                }
                                style={styles.monthButton}
                            >
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={RED}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* WEEK */}

                        <View style={styles.weekRow}>
                            {[
                                "Mg",
                                "Sn",
                                "Sl",
                                "Rb",
                                "Km",
                                "Jm",
                                "Sb",
                            ].map((item) => (
                                <Text
                                    key={item}
                                    style={styles.weekText}
                                >
                                    {item}
                                </Text>
                            ))}
                        </View>

                        {/* DAYS */}

                        <View style={styles.daysGrid}>
                            {getDaysInMonth().map(
                                (
                                    day,
                                    index
                                ) => (
                                    <TouchableOpacity
                                        key={
                                            index
                                        }
                                        disabled={
                                            !day ||
                                            isPastDate(
                                                day
                                            )
                                        }
                                        onPress={() =>
                                            selectDate(
                                                day
                                            )
                                        }
                                        style={[
                                            styles.dayCell,
                                            !day &&
                                                styles.emptyDay,
                                            isPastDate(
                                                day
                                            ) &&
                                                styles.pastDay,
                                            isSelectedDate(
                                                day
                                            ) &&
                                                styles.selectedDay,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                isPastDate(
                                                    day
                                                ) &&
                                                    styles.pastDayText,
                                                isSelectedDate(
                                                    day
                                                ) &&
                                                    styles.selectedDayText,
                                            ]}
                                        >
                                            {day || ""}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            )}
                        </View>

                        {/* SELECTED */}

                        <View
                            style={
                                styles.selectedDateInfo
                            }
                        >
                            <Ionicons
                                name="calendar"
                                size={18}
                                color={RED}
                            />

                            <Text
                                style={
                                    styles.selectedDateInfoText
                                }
                            >
                                {selectedDate
                                    ? formatDateDisplay(
                                          selectedDate
                                      )
                                    : "Belum dipilih"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={
                                styles.useDateButton
                            }
                            onPress={() =>
                                setShowCalendar(false)
                            }
                        >
                            <Text
                                style={
                                    styles.useDateText
                                }
                            >
                                Gunakan Tanggal
                            </Text>
                        </TouchableOpacity>
                    </AnimatedModalCard>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// =============================================================
// STYLE
// =============================================================

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F7F7F7",
    },

    container: {
        flex: 1,
    },

    // =========================================================
    // HEADER
    // =========================================================

    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 13,
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },

    headerDesktop: {
        paddingHorizontal: 32,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F3F3F3",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    headerTextBox: {
        flex: 1,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#1C1C1C",
    },

    headerSubtitle: {
        fontSize: 12,
        color: "#888888",
        marginTop: 2,
    },

    // =========================================================
    // SCROLL
    // =========================================================

    scrollContent: {
        paddingBottom: 135,
    },

    mobileContent: {
        width: "100%",
    },

    desktopContent: {
        width: "100%",
        maxWidth: 1100,
        alignSelf: "center",
    },

    // =========================================================
    // STEPPER
    // =========================================================

    stepContainer: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 14,
        paddingTop: 18,
        paddingBottom: 16,
    },

    stepContainerDesktop: {
        borderRadius: 18,
        marginTop: 20,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: "#EEEEEE",
    },

    stepItem: {
        flex: 1,
        alignItems: "center",
    },

    stepTop: {
        width: "100%",
        alignItems: "center",
        position: "relative",
    },

    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#E5E5E5",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
    },

    stepCircleActive: {
        backgroundColor: RED,
    },

    stepNumber: {
        color: "#888888",
        fontSize: 14,
        fontWeight: "800",
    },

    stepNumberActive: {
        color: "#FFFFFF",
    },

    stepLine: {
        position: "absolute",
        height: 2,
        backgroundColor: "#E0E0E0",
        width: "70%",
        left: "65%",
        top: 14,
        zIndex: 1,
    },

    stepLineActive: {
        backgroundColor: RED,
    },

    stepLabel: {
        fontSize: 10,
        color: "#888888",
        marginTop: 6,
        fontWeight: "600",
        textAlign: "center",
    },

    stepLabelActive: {
        color: RED,
        fontWeight: "900",
    },

    // =========================================================
    // GENERIC DESKTOP CARD
    // =========================================================

    desktopCard: {
        marginLeft: 20,
        marginRight: 20,
    },

    // =========================================================
    // VEHICLE
    // =========================================================

    vehicleCard: {
        marginHorizontal: 20,
        marginTop: 18,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
    },

    vehicleIcon: {
        width: 55,
        height: 55,
        borderRadius: 16,
        backgroundColor: "#FCEDED",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 13,
    },

    vehicleInfo: {
        flex: 1,
        minWidth: 0,
    },

    labelSmall: {
        fontSize: 12,
        color: "#999999",
        marginBottom: 2,
    },

    vehicleName: {
        fontSize: 16,
        fontWeight: "900",
        color: "#222222",
    },

    vehicleMeta: {
        fontSize: 13,
        color: "#888888",
        marginTop: 2,
    },

    vehicleCheck: {
        width: 29,
        height: 29,
        borderRadius: 15,
        backgroundColor: "#36A269",
        alignItems: "center",
        justifyContent: "center",
    },

    // =========================================================
    // SECTION
    // =========================================================

    sectionTitle: {
        fontSize: 15,
        fontWeight: "900",
        color: "#202020",
        marginHorizontal: 20,
        marginTop: 22,
        marginBottom: 10,
    },

    // =========================================================
    // LOCATION
    // =========================================================

    locationCard: {
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 13,
        borderRadius: 18,
        backgroundColor: "#FFF8F8",
        borderWidth: 1,
        borderColor: "#F1D6D6",
        flexDirection: "row",
        alignItems: "center",
    },

    locationIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: "#FCEDED",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    locationInfo: {
        flex: 1,
        minWidth: 0,
    },

    locationTitle: {
        fontSize: 14,
        fontWeight: "900",
        color: "#222222",
    },

    locationText: {
        fontSize: 11,
        color: "#888888",
        marginTop: 3,
        lineHeight: 16,
    },

    locationButton: {
        minWidth: 68,
        height: 38,
        paddingHorizontal: 12,
        borderRadius: 11,
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },

    locationButtonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "900",
    },

    locationErrorBox: {
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 11,
        borderRadius: 12,
        backgroundColor: "#FFF0F0",
        flexDirection: "row",
        alignItems: "center",
    },

    locationErrorText: {
        flex: 1,
        marginLeft: 7,
        fontSize: 11,
        color: RED,
        lineHeight: 16,
    },

    nearestLabel: {
        marginHorizontal: 20,
        marginBottom: 9,
        flexDirection: "row",
        alignItems: "center",
    },

    nearestLabelText: {
        marginLeft: 6,
        fontSize: 12,
        color: RED,
        fontWeight: "800",
    },

    // =========================================================
    // BENGKEL DESKTOP GRID
    // =========================================================

    desktopBengkelGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 10,
    },

    // =========================================================
    // BENGKEL CARD
    // =========================================================

    bengkelCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 14,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#E3E3E3",
    },

    bengkelCardDesktop: {
        width: "calc(50% - 20px)",
        marginHorizontal: 10,
    },

    bengkelCardSelected: {
        borderColor: RED,
        backgroundColor: "#FFF8F8",
    },

    bengkelTopRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    bengkelIconBox: {
        width: 58,
        height: 58,
        borderRadius: 16,
        backgroundColor: "#FFF0F0",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },

    bengkelMain: {
        flex: 1,
        minWidth: 0,
    },

    bengkelName: {
        fontSize: 15,
        fontWeight: "800",
        color: "#181818",
        lineHeight: 22,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 5,
        paddingRight: 4,
    },

    bengkelAddress: {
        flex: 1,
        marginLeft: 6,
        fontSize: 12,
        color: "#777777",
        lineHeight: 19,
    },

    bengkelExtra: {
        flex: 1,
        marginLeft: 6,
        fontSize: 12,
        color: "#888888",
        lineHeight: 17,
    },

    distanceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 7,
    },

    distanceText: {
        marginLeft: 5,
        fontSize: 13,
        fontWeight: "800",
        color: RED,
    },

    nearestBadge: {
        alignSelf: "flex-start",
        marginTop: 8,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: RED,
    },

    nearestBadgeText: {
        fontSize: 9,
        fontWeight: "900",
        color: "#FFFFFF",
    },

    bengkelActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: 13,
        paddingTop: 11,
        borderTopWidth: 1,
        borderTopColor: "#F0E5E5",
        gap: 8,
    },

    mapsButton: {
        height: 42,
        paddingHorizontal: 17,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: "#E8CACA",
        backgroundColor: "#FFF8F8",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    mapsButtonText: {
        marginLeft: 7,
        fontSize: 13,
        fontWeight: "900",
        color: RED,
    },

    selectBengkelButton: {
        height: 42,
        minWidth: 92,
        paddingHorizontal: 17,
        borderRadius: 13,
        backgroundColor: "#F1F1F1",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },

    selectBengkelButtonActive: {
        backgroundColor: RED,
        borderColor: RED,
    },

    selectBengkelText: {
        color: RED,
        fontSize: 13,
        fontWeight: "900",
    },

    selectBengkelTextActive: {
        color: "#FFFFFF",
    },

    // =========================================================
    // DATE
    // =========================================================

    dateCard: {
        marginHorizontal: 20,
        minHeight: 86,
        padding: 14,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#E3E3E3",
        flexDirection: "row",
        alignItems: "center",
    },

    cardSelected: {
        borderColor: RED,
        backgroundColor: "#FFF8F8",
    },

    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "#FCEDED",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    dateInfo: {
        flex: 1,
        minWidth: 0,
    },

    dateValue: {
        fontSize: 16,
        color: "#222222",
        fontWeight: "800",
    },

    notSelected: {
        color: "#999999",
        fontWeight: "500",
    },

    // =========================================================
    // TIME
    // =========================================================

    timeGrid: {
        paddingHorizontal: 20,
        flexDirection: "row",
        flexWrap: "wrap",
    },

    timeGridDesktop: {
        paddingHorizontal: 20,
    },

    timeCard: {
        width: "47.5%",
        minHeight: 53,
        marginRight: "2.5%",
        marginBottom: 10,
        borderRadius: 15,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#E1E1E1",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },

    timeCardDesktop: {
        width: "23.5%",
        marginRight: "1.5%",
    },

    timeCardSelected: {
        backgroundColor: RED,
        borderColor: RED,
    },

    timeText: {
        color: RED,
        fontSize: 15,
        fontWeight: "900",
    },

    timeTextSelected: {
        color: "#FFFFFF",
    },

    // =========================================================
    // LOADING / EMPTY
    // =========================================================

    loadingMargin: {
        marginVertical: 20,
    },

    loadingCard: {
        marginHorizontal: 20,
        padding: 22,
        borderRadius: 17,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
    },

    loadingText: {
        color: "#888888",
        marginTop: 7,
        fontSize: 13,
    },

    emptyCard: {
        marginHorizontal: 20,
        padding: 22,
        borderRadius: 17,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
    },

    emptyTitle: {
        marginTop: 7,
        fontSize: 15,
        fontWeight: "800",
        color: "#444444",
    },

    emptyText: {
        marginTop: 4,
        fontSize: 12,
        color: "#999999",
        textAlign: "center",
    },

    // =========================================================
    // ERROR
    // =========================================================

    errorBox: {
        marginHorizontal: 20,
        marginTop: 15,
        padding: 12,
        borderRadius: 13,
        backgroundColor: "#FFF0F0",
        flexDirection: "row",
        alignItems: "center",
    },

    errorText: {
        flex: 1,
        color: RED,
        fontSize: 13,
        marginLeft: 8,
        fontWeight: "700",
    },

    // =========================================================
    // SUMMARY
    // =========================================================

    summaryCard: {
        marginHorizontal: 20,
        marginTop: 20,
        padding: 17,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E4E4E4",
    },

    summaryTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#222222",
        marginBottom: 13,
    },

    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 11,
    },

    summaryText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: "#555555",
    },

    // =========================================================
    // BOTTOM BAR
    // =========================================================

    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E8E8E8",
        paddingHorizontal: 18,
        paddingVertical: 11,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },

    bottomBarDesktop: {
        paddingHorizontal: 30,
        paddingVertical: 13,
    },

    bottomInfo: {
        flex: 1,
        minWidth: 0,
    },

    bottomLabel: {
        fontSize: 11,
        color: "#999999",
    },

    bottomValue: {
        fontSize: 12,
        color: RED,
        fontWeight: "800",
        marginTop: 2,
        maxWidth: 250,
    },

    bottomDisabled: {
        color: "#999999",
    },

    continueButton: {
        height: 53,
        paddingHorizontal: 25,
        borderRadius: 16,
        backgroundColor: RED,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    continueDisabled: {
        backgroundColor: "#D0D0D0",
    },

    continueText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "900",
    },

    // =========================================================
    // CALENDAR MODAL
    // =========================================================

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },

    calendarModal: {
        width: "100%",
        maxWidth: 430,
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 18,
    },

    calendarModalDesktop: {
        maxWidth: 470,
    },

    calendarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    calendarTitle: {
        fontSize: 20,
        fontWeight: "900",
        color: "#222222",
    },

    calendarSubtitle: {
        fontSize: 12,
        color: "#999999",
        marginTop: 2,
    },

    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F2F2F2",
        alignItems: "center",
        justifyContent: "center",
    },

    monthHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 17,
        marginBottom: 13,
    },

    monthButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FCEDED",
        alignItems: "center",
        justifyContent: "center",
    },

    monthTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#222222",
    },

    weekRow: {
        flexDirection: "row",
        marginBottom: 5,
    },

    weekText: {
        width: "14.285%",
        textAlign: "center",
        fontSize: 11,
        color: "#999999",
        fontWeight: "800",
    },

    daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },

    dayCell: {
        width: "14.285%",
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
    },

    emptyDay: {
        backgroundColor: "transparent",
    },

    pastDay: {
        opacity: 0.3,
    },

    selectedDay: {
        backgroundColor: RED,
    },

    dayText: {
        fontSize: 13,
        color: "#333333",
        fontWeight: "700",
    },

    pastDayText: {
        color: "#AAAAAA",
    },

    selectedDayText: {
        color: "#FFFFFF",
        fontWeight: "900",
    },

    selectedDateInfo: {
        marginTop: 13,
        padding: 11,
        borderRadius: 12,
        backgroundColor: "#FFF4F4",
        flexDirection: "row",
        alignItems: "center",
    },

    selectedDateInfoText: {
        flex: 1,
        marginLeft: 8,
        color: RED,
        fontSize: 12,
        fontWeight: "800",
    },

    useDateButton: {
        height: 48,
        borderRadius: 14,
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },

    useDateText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },
});