import { Stack } from "expo-router";
import React from "react";

export default function AdminStackLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "fade",
                animationDuration: 200,
                contentStyle: { backgroundColor: "#F9FAFB" },
            }}
        />
    );
}
