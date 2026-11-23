import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function Index() {
    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            try {
                const userData = await AsyncStorage.getItem("autocare_user");
                if (!isMounted) return;

                if (userData) {
                    const parsed = JSON.parse(userData);
                    if (parsed && (parsed.id || parsed.email)) {
                        if (parsed.role === "admin") {
                            router.replace("/admin");
                        } else {
                            router.replace("/home");
                        }
                        return;
                    }
                }
                router.replace("/login");
            } catch (err) {
                if (isMounted) {
                    router.replace("/login");
                }
            }
        };

        const timer = setTimeout(checkSession, 1200);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    source={require("../../assets/images/autocare-logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.loadingWrapper}>
                <ActivityIndicator size="small" color="#C8102E" />
                <Text style={styles.loadingText}>
                    Memuat AutoCare...
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
    },

    logoContainer: {
        width: 190,
        height: 190,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },

    logo: {
        width: 180,
        height: 180,
    },

    loadingWrapper: {
        position: "absolute",
        bottom: 50,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    loadingText: {
        fontFamily: "Poppins_500Medium",
        fontSize: 13,
        fontWeight: "500",
        color: "#666666",
    },
});
