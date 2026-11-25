import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { adminApi } from "../../services/adminApi";

export default function AdminIndex() {
    useEffect(() => {
        let isMounted = true;
        const check = async () => {
            const admin = await adminApi.getStoredAdmin();
            if (!isMounted) return;
            if (admin && admin.role === "admin") {
                router.replace("/admin/dashboard");
            } else {
                router.replace("/login");
            }
        };
        check();
        return () => {
            isMounted = false;
        };
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
        backgroundColor: "#F9FAFB",
    },
});
