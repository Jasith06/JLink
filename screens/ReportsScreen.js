import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    ImageBackground
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Theme } from '../theme';

export default function ReportsScreen({ navigation }) {
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
                    <Text style={styles.title}>Analytics Reports</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.contentContainer}
                >
                    {/* Sales Reports Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sales Reports</Text>

                        <View style={styles.reportsGrid}>
                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: Theme.colors.primary + '20' }]}>
                                    <Ionicons name="today" size={24} color={Theme.colors.primary} />
                                </View>
                                <Text style={styles.reportTitle}>Daily Sales</Text>
                                <Text style={styles.reportDescription}>Today's sales summary</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: Theme.colors.success + '20' }]}>
                                    <Ionicons name="calendar" size={24} color={Theme.colors.success} />
                                </View>
                                <Text style={styles.reportTitle}>Weekly Report</Text>
                                <Text style={styles.reportDescription}>This week's performance</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: Theme.colors.secondary + '20' }]}>
                                    <MaterialIcons name="bar-chart" size={24} color={Theme.colors.secondary} />
                                </View>
                                <Text style={styles.reportTitle}>Monthly Report</Text>
                                <Text style={styles.reportDescription}>Monthly sales analytics</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: Theme.colors.accent + '20' }]}>
                                    <Ionicons name="stats-chart" size={24} color={Theme.colors.accent} />
                                </View>
                                <Text style={styles.reportTitle}>Yearly Overview</Text>
                                <Text style={styles.reportDescription}>Annual performance</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Inventory Reports Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Inventory Reports</Text>

                        <View style={styles.reportsGrid}>
                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: Theme.colors.warning + '20' }]}>
                                    <Ionicons name="warning" size={24} color={Theme.colors.warning} />
                                </View>
                                <Text style={styles.reportTitle}>Low Stock</Text>
                                <Text style={styles.reportDescription}>Items below threshold</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: Theme.colors.danger + '20' }]}>
                                    <Ionicons name="alert-circle" size={24} color={Theme.colors.danger} />
                                </View>
                                <Text style={styles.reportTitle}>Expiry Report</Text>
                                <Text style={styles.reportDescription}>Expiring soon items</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: Theme.colors.success + '20' }]}>
                                    <MaterialIcons name="inventory" size={24} color={Theme.colors.success} />
                                </View>
                                <Text style={styles.reportTitle}>Stock Value</Text>
                                <Text style={styles.reportDescription}>Total inventory worth</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: Theme.colors.primary + '20' }]}>
                                    <Ionicons name="trending-up" size={24} color={Theme.colors.primary} />
                                </View>
                                <Text style={styles.reportTitle}>Fast Movers</Text>
                                <Text style={styles.reportDescription}>Best selling products</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Profit Reports Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Profit Reports</Text>

                        <View style={styles.reportsGrid}>
                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                                    <Ionicons name="cash" size={24} color="#4CAF50" />
                                </View>
                                <Text style={styles.reportTitle}>Daily Profit</Text>
                                <Text style={styles.reportDescription}>Today's profit margin</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.reportCard}>
                                <View style={[styles.reportIcon, { backgroundColor: '#2196F3' + '20' }]}>
                                    <Ionicons name="calculator" size={24} color="#2196F3" />
                                </View>
                                <Text style={styles.reportTitle}>Monthly Profit</Text>
                                <Text style={styles.reportDescription}>Monthly profit analysis</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Coming Soon Features */}
                    <View style={styles.comingSoonSection}>
                        <MaterialIcons name="analytics" size={64} color={Theme.colors.muted} />
                        <Text style={styles.comingSoonTitle}>More Analytics Coming Soon</Text>
                        <Text style={styles.comingSoonText}>
                            We're working on advanced analytics features including:
                        </Text>
                        <View style={styles.featureList}>
                            <Text style={styles.featureItem}>• Customer purchase patterns</Text>
                            <Text style={styles.featureItem}>• Seasonal trends analysis</Text>
                            <Text style={styles.featureItem}>• Product performance metrics</Text>
                            <Text style={styles.featureItem}>• Revenue forecasting</Text>
                        </View>
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
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: Theme.spacing.lg,
        paddingBottom: Theme.spacing.xl,
    },
    section: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.lg,
        marginBottom: Theme.spacing.lg,
        ...Theme.shadows.sm,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Theme.colors.dark,
        marginBottom: Theme.spacing.md,
    },
    reportsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    reportCard: {
        width: '48%',
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.md,
        alignItems: 'center',
        marginBottom: Theme.spacing.md,
        ...Theme.shadows.sm,
    },
    reportIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.spacing.sm,
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.colors.dark,
        textAlign: 'center',
        marginBottom: Theme.spacing.xs,
    },
    reportDescription: {
        fontSize: 12,
        color: Theme.colors.muted,
        textAlign: 'center',
        lineHeight: 16,
    },
    comingSoonSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.xl,
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
        ...Theme.shadows.sm,
    },
    comingSoonTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.primary,
        marginTop: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
        textAlign: 'center',
    },
    comingSoonText: {
        fontSize: 14,
        color: Theme.colors.muted,
        textAlign: 'center',
        marginBottom: Theme.spacing.md,
        lineHeight: 20,
    },
    featureList: {
        alignSelf: 'stretch',
        paddingHorizontal: Theme.spacing.md,
    },
    featureItem: {
        fontSize: 14,
        color: Theme.colors.muted,
        marginBottom: Theme.spacing.xs,
        lineHeight: 20,
    },
});