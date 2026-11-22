import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform } from "react-native";

/**
 * AnimatedModalCard
 * Memberikan animasi transisi fade + scale yang halus ketika modal/popup dibuka.
 * Sesuai dengan spesifikasi: durasi 200-250ms, tidak lag, dan smooth di Android & Web.
 */
export default function AnimatedModalCard({
    children,
    style,
    visible = true,
    ...props
}) {
    const scaleAnim = useRef(new Animated.Value(0.92)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            scaleAnim.setValue(0.92);
            opacityAnim.setValue(0);

            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 7,
                    tension: 65,
                    useNativeDriver: Platform.OS !== "web",
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: Platform.OS !== "web",
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.92);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    return (
        <Animated.View
            style={[
                style,
                {
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
            {...props}
        >
            {children}
        </Animated.View>
    );
}
