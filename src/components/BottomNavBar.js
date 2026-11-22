import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";

// =========================================================
// TAB DEFINITIONS
// =========================================================
const TABS = [
    {
        id: "home",
        title: "Home",
        icon: "home",
        outlineIcon: "home-outline",
        route: "/home",
    },
    {
        id: "kendaraan",
        title: "Kendaraan",
        icon: "car",
        outlineIcon: "car-outline",
        route: "/kendaraan",
    },
    {
        id: "booking",
        title: "Booking",
        icon: "calendar",
        outlineIcon: "calendar-outline",
        route: "/booking",
    },
    {
        id: "profil",
        title: "Profil",
        icon: "person",
        outlineIcon: "person-outline",
        route: "/profil",
    },
];

const INDICATOR_WIDTH = 26;

// =========================================================
// INDIVIDUAL TAB ITEM WITH ICON ANIMATIONS
// =========================================================
function TabItem({ item, active, onPress }) {
    const scaleAnim = useRef(new Animated.Value(active ? 1.08 : 1)).current;
    const colorAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

    useEffect(() => {
        if (active) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1.08,
                    friction: 5,
                    tension: 90,
                    useNativeDriver: Platform.OS !== "web",
                }),
                Animated.timing(colorAnim, {
                    toValue: 1,
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 180,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: Platform.OS !== "web",
                }),
                Animated.timing(colorAnim, {
                    toValue: 0,
                    duration: 180,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [active]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            friction: 7,
            tension: 100,
            useNativeDriver: Platform.OS !== "web",
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: active ? 1.08 : 1,
            friction: 5,
            tension: 80,
            useNativeDriver: Platform.OS !== "web",
        }).start();
    };

    const textColor = colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#999999", "#F20D18"],
    });

    return (
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.85}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.iconWrapper,
                    {
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Ionicons
                    name={active ? item.icon : item.outlineIcon}
                    size={21}
                    color={active ? "#F20D18" : "#999999"}
                />
            </Animated.View>

            <Animated.Text
                style={[
                    styles.navText,
                    active && styles.navTextActive,
                    { color: textColor },
                ]}
            >
                {item.title}
            </Animated.Text>
        </TouchableOpacity>
    );
}

// =========================================================
// BOTTOM NAVIGATION BAR (SMOOTH & CENTRALIZED)
// =========================================================
export default function BottomNavBar({ activeTab }) {
    const initialIndex = TABS.findIndex((tab) => tab.id === activeTab);
    const windowWidth = Dimensions.get("window").width;
    const [barWidth, setBarWidth] = useState(windowWidth);

    const tabWidth = barWidth / 4;
    const getIndicatorPos = (idx) => {
        if (idx < 0) return 0;
        return idx * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;
    };

    const indicatorAnim = useRef(
        new Animated.Value(getIndicatorPos(initialIndex >= 0 ? initialIndex : 0))
    ).current;
    const indicatorOpacity = useRef(
        new Animated.Value(initialIndex >= 0 ? 1 : 0)
    ).current;

    useEffect(() => {
        const idx = TABS.findIndex((tab) => tab.id === activeTab);
        if (idx >= 0) {
            const targetPos = getIndicatorPos(idx);
            Animated.parallel([
                Animated.spring(indicatorAnim, {
                    toValue: targetPos,
                    friction: 7,
                    tension: 70,
                    useNativeDriver: Platform.OS !== "web",
                }),
                Animated.timing(indicatorOpacity, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: Platform.OS !== "web",
                }),
            ]).start();
        } else {
            Animated.timing(indicatorOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: Platform.OS !== "web",
            }).start();
        }
    }, [activeTab, barWidth]);

    const handleTabPress = (tab) => {
        if (activeTab === tab.id) {
            return;
        }
        router.replace(tab.route);
    };

    return (
        <View
            style={styles.bottomNav}
            onLayout={(e) => {
                const width = e.nativeEvent.layout.width;
                if (width > 0 && width !== barWidth) {
                    setBarWidth(width);
                }
            }}
        >
            {/* Smooth Sliding Active Indicator Bar */}
            <Animated.View
                style={[
                    styles.indicator,
                    {
                        width: INDICATOR_WIDTH,
                        opacity: indicatorOpacity,
                        transform: [{ translateX: indicatorAnim }],
                    },
                ]}
            />

            {TABS.map((tab) => (
                <TabItem
                    key={tab.id}
                    item={tab}
                    active={activeTab === tab.id}
                    onPress={() => handleTabPress(tab)}
                />
            ))}
        </View>
    );
}

// =========================================================
// BACKWARD COMPATIBLE MobileNav EXPORT
// =========================================================
export function MobileNav({
    icon,
    title,
    active = false,
    onPress,
}) {
    const scaleAnim = useRef(new Animated.Value(active ? 1.08 : 1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: active ? 1.08 : 1,
            friction: 6,
            tension: 80,
            useNativeDriver: Platform.OS !== "web",
        }).start();
    }, [active]);

    return (
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Animated.View
                style={[
                    styles.iconWrapper,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <Ionicons
                    name={icon}
                    size={21}
                    color={active ? "#F20D18" : "#999999"}
                />
            </Animated.View>

            <Text
                style={[
                    styles.navText,
                    active && styles.navTextActive,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}

// =========================================================
// STYLES
// =========================================================
const styles = StyleSheet.create({
    bottomNav: {
        height: 64,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        position: "relative",
    },
    indicator: {
        position: "absolute",
        top: 0,
        left: 0,
        height: 3,
        backgroundColor: "#F20D18",
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        zIndex: 10,
    },
    navItem: {
        width: "25%",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
    },
    iconWrapper: {
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
});
