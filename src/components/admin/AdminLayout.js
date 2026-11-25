import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";
import { adminApi } from "../../services/adminApi";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({
    title,
    subtitle,
    children,
    onRefresh,
    refreshing = false,
}) {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [adminUser, setAdminUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            try {
                const stored = await adminApi.getStoredAdmin();
                if (!stored || stored.role !== "admin") {
                    router.replace("/login");
                    return;
                }
                if (isMounted) {
                    setAdminUser(stored);
                    setAuthChecking(false);
                }

                // Verify token with backend
                adminApi
                    .getMe()
                    .then((res) => {
                        if (isMounted) {
                            if (res && res.admin && res.admin.role === "admin") {
                                setAdminUser(res.admin);
                            } else {
                                router.replace("/login");
                            }
                        }
                    })
                    .catch(() => {
                        // If token expired or invalid, redirect to unified login
                        router.replace("/login");
                    });
            } catch {
                router.replace("/login");
            }
        };

        checkAuth();
        return () => {
            isMounted = false;
        };
    }, []);

    if (authChecking) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C8102E" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.body}>
                {/* DESKTOP SIDEBAR */}
                {!isMobile ? (
                    <AdminSidebar adminUser={adminUser} />
                ) : null}

                {/* MOBILE SIDEBAR DRAWER */}
                {isMobile ? (
                    <Modal
                        visible={mobileDrawerOpen}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setMobileDrawerOpen(false)}
                    >
                        <View style={styles.drawerOverlay}>
                            <View style={styles.drawerCard}>
                                <AdminSidebar
                                    adminUser={adminUser}
                                    onClose={() => setMobileDrawerOpen(false)}
                                />
                            </View>
                            <View
                                style={styles.drawerBackdrop}
                                onTouchEnd={() => setMobileDrawerOpen(false)}
                            />
                        </View>
                    </Modal>
                ) : null}

                {/* MAIN CONTENT AREA */}
                <View style={styles.mainContent}>
                    <AdminHeader
                        title={title}
                        subtitle={subtitle}
                        onToggleSidebar={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                        onRefresh={onRefresh}
                        refreshing={refreshing}
                        adminUser={adminUser}
                    />
                    <View style={styles.contentBody}>{children}</View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
    },
    body: {
        flex: 1,
        flexDirection: "row",
    },
    mainContent: {
        flex: 1,
        flexDirection: "column",
        backgroundColor: "#F9FAFB",
    },
    contentBody: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    drawerOverlay: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    drawerCard: {
        width: 280,
        height: "100%",
        backgroundColor: "#FFFFFF",
    },
    drawerBackdrop: {
        flex: 1,
    },
});
