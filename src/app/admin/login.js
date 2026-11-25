import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function AdminLoginRedirect() {
    useEffect(() => {
        router.replace("/login");
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#C8102E" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
    },
});
