import { router } from "expo-router";
import { useEffect } from "react";
import {
    Image,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function Index() {
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace("/login");
        }, 5000);

        return () => clearTimeout(timer);
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

            <Text style={styles.loadingText}>
                Memuat...
            </Text>
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
    },

    logo: {
    width: 180,
    height: 180,
    marginBotom: 80,
    },

    loadingText: {
        position: "absolute",
        bottom: 45,
        fontSize: 7,
        color: "#777777",
    },
});