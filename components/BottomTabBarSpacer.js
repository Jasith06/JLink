// components/BottomTabBarSpacer.js
import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomTabBarSpacer() {
    const insets = useSafeAreaInsets();

    if (Platform.OS === 'ios') {
        return null; // iOS handles this automatically
    }

    // For Android, add spacing based on safe area insets
    return (
        <View style={[styles.spacer, { height: insets.bottom > 0 ? insets.bottom : 10 }]} />
    );
}

const styles = StyleSheet.create({
    spacer: {
        backgroundColor: 'transparent',
    },
});