import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ImageBackground,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

export default function SalesScreen({ navigation }) {
    return (
        <ImageBackground
            source={require('../assets/app_bg.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar backgroundColor={Theme.colors.primary} />

                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={Theme.colors.dark} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Sales Records</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.contentContainer}>
                        <Text style={styles.comingSoon}>Sales Management</Text>
                        <Text style={styles.subtitle}>Coming Soon...</Text>
                        <Text style={styles.description}>
                            This screen will display all your sales records, transaction history, and revenue analytics.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        ...Theme.shadows.sm,
    },
    backButton: {
        padding: Theme.spacing.sm,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.colors.dark,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: Theme.spacing.md,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.xl,
        margin: Theme.spacing.lg,
        alignItems: 'center',
        ...Theme.shadows.md,
    },
    comingSoon: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.colors.primary,
        marginBottom: Theme.spacing.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: Theme.colors.muted,
        marginBottom: Theme.spacing.lg,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: Theme.colors.muted,
        textAlign: 'center',
        lineHeight: 24,
    },
});