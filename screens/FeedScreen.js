import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    ImageBackground,
    Modal,
    Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';
import { Theme } from '../theme';
import { ref, onValue, get } from 'firebase/database';
import { rtdb } from '../firebase';
import { WebView } from 'react-native-webview';

export default function FeedScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [salesData, setSalesData] = useState({
        today: 0,
        week: 0,
        month: 0
    });
    const [inventoryStatus, setInventoryStatus] = useState({
        totalItems: 0,
        lowStockItems: 0,
        expiredItems: 0,
        expiringSoonItems: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showWebPOS, setShowWebPOS] = useState(false);

    const fetchDashboardData = async () => {
        if (!user || !rtdb) return;

        try {
            setLoading(true);

            // Fetch sales data from Realtime Database
            const today = new Date();
            const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

            try {
                const salesRef = ref(rtdb, `users/${user.userId}/sales`);
                const salesSnapshot = await get(salesRef);

                let todayTotal = 0;
                if (salesSnapshot.exists()) {
                    const salesData = salesSnapshot.val();

                    // Calculate today's sales
                    Object.values(salesData).forEach(sale => {
                        if (sale.saleDate && sale.saleDate.includes(todayDateString)) {
                            todayTotal += parseFloat(sale.totalAmount || 0);
                        }
                    });
                }

                // Calculate week and month totals (simplified for now)
                const weekTotal = todayTotal * 3; // Placeholder
                const monthTotal = todayTotal * 10; // Placeholder

                setSalesData({
                    today: todayTotal,
                    week: weekTotal,
                    month: monthTotal
                });
            } catch (salesError) {
                console.log("No sales data found, using defaults");
                setSalesData({
                    today: 0,
                    week: 0,
                    month: 0
                });
            }

            // Fetch inventory status from Realtime Database
            try {
                const productsRef = ref(rtdb, `users/${user.userId}/products`);
                const productsSnapshot = await get(productsRef);

                let totalItems = 0;
                let lowStockItems = 0;
                let expiredItems = 0;
                let expiringSoonItems = 0;

                if (productsSnapshot.exists()) {
                    const productsData = productsSnapshot.val();
                    totalItems = Object.keys(productsData).length;

                    Object.values(productsData).forEach(product => {
                        // Check for low stock
                        if (product.quantity <= (product.lowStockThreshold || 10)) {
                            lowStockItems++;
                        }

                        // Check for expiring items (within 15 days)
                        if (product.expiryDate) {
                            const expiryDate = new Date(product.expiryDate);
                            const today = new Date();
                            const diffTime = Math.abs(expiryDate - today);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays <= 15 && expiryDate > today) {
                                expiringSoonItems++;
                            }

                            if (expiryDate < today) {
                                expiredItems++;
                            }
                        }
                    });
                }

                setInventoryStatus({
                    totalItems,
                    lowStockItems,
                    expiredItems,
                    expiringSoonItems
                });

            } catch (inventoryError) {
                console.log("No inventory data found, using defaults");
                setInventoryStatus({
                    totalItems: 0,
                    lowStockItems: 0,
                    expiredItems: 0,
                    expiringSoonItems: 0
                });
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            // Set default values on error
            setSalesData({
                today: 0,
                week: 0,
                month: 0
            });
            setInventoryStatus({
                totalItems: 0,
                lowStockItems: 0,
                expiredItems: 0,
                expiringSoonItems: 0
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // Set up real-time listeners for sales and products
        if (user && rtdb) {
            const salesRef = ref(rtdb, `users/${user.userId}/sales`);
            const productsRef = ref(rtdb, `users/${user.userId}/products`);

            const unsubscribeSales = onValue(salesRef, () => {
                fetchDashboardData();
            });

            const unsubscribeProducts = onValue(productsRef, () => {
                fetchDashboardData();
            });

            return () => {
                unsubscribeSales();
                unsubscribeProducts();
            };
        }
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    if (loading) {
        return (
            <ImageBackground
                source={require('../assets/app_bg.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar backgroundColor={Theme.colors.primary} />
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Theme.colors.primary} />
                        <Text style={styles.loadingText}>Loading dashboard...</Text>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground
            source={require('../assets/app_bg.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar backgroundColor={Theme.colors.primary} />
                <ScrollView
                    style={styles.container}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.greeting}>Hello, {user?.fullName || 'User'}</Text>
                            <Text style={styles.subtitle}>Here's your business overview</Text>
                        </View>
                        <TouchableOpacity style={styles.notificationButton}>
                            <Ionicons name="notifications-outline" size={24} color={Theme.colors.dark} />
                            {(inventoryStatus.lowStockItems > 0 || inventoryStatus.expiredItems > 0 || inventoryStatus.expiringSoonItems > 0) && (
                                <View style={styles.notificationBadge} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Sales Summary Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Sales Summary</Text>
                            <TouchableOpacity
                                style={styles.viewAllButton}
                                onPress={() => navigation.navigate('Sales')}
                            >
                                <Text style={styles.viewAllText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: Theme.colors.success + '20' }]}>
                                    <Ionicons name="today" size={24} color={Theme.colors.success} />
                                </View>
                                {/* REMOVED: LKR value display */}
                                <Text style={styles.statLabel}>Today</Text>
                                <TouchableOpacity
                                    style={styles.miniViewButton}
                                    onPress={() => navigation.navigate('Sales', { filter: 'today' })}
                                >
                                    <Text style={styles.miniViewButtonText}>View</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: Theme.colors.primary + '20' }]}>
                                    <Ionicons name="calendar" size={24} color={Theme.colors.primary} />
                                </View>
                                {/* REMOVED: LKR value display */}
                                <Text style={styles.statLabel}>This Week</Text>
                                <TouchableOpacity
                                    style={styles.miniViewButton}
                                    onPress={() => navigation.navigate('Sales', { filter: 'week' })}
                                >
                                    <Text style={styles.miniViewButtonText}>View</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: Theme.colors.secondary + '20' }]}>
                                    <Ionicons name="stats-chart" size={24} color={Theme.colors.secondary} />
                                </View>
                                {/* REMOVED: LKR value display */}
                                <Text style={styles.statLabel}>This Month</Text>
                                <TouchableOpacity
                                    style={styles.miniViewButton}
                                    onPress={() => navigation.navigate('Sales', { filter: 'month' })}
                                >
                                    <Text style={styles.miniViewButtonText}>View</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Inventory Status Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Inventory Status</Text>
                            <TouchableOpacity
                                style={styles.viewAllButton}
                                onPress={() => navigation.navigate('Inventory')}
                            >
                                <Text style={styles.viewAllText}>Manage</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: Theme.colors.accent + '20' }]}>
                                    <Ionicons name="cube" size={24} color={Theme.colors.accent} />
                                </View>
                                <Text style={styles.statValue}>{inventoryStatus.totalItems}</Text>
                                <Text style={styles.statLabel}>Total Items</Text>
                                <TouchableOpacity
                                    style={styles.miniViewButton}
                                    onPress={() => navigation.navigate('Inventory', { filter: 'all' })}
                                >
                                    <Text style={styles.miniViewButtonText}>View All</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.statCard, inventoryStatus.lowStockItems > 0 && styles.alertCard]}>
                                <View style={[styles.statIcon, { backgroundColor: Theme.colors.warning + '20' }]}>
                                    <Ionicons name="warning" size={24} color={Theme.colors.warning} />
                                </View>
                                <Text style={styles.statValue}>{inventoryStatus.lowStockItems}</Text>
                                <Text style={styles.statLabel}>Low Stock</Text>
                                <TouchableOpacity
                                    style={[styles.miniViewButton, inventoryStatus.lowStockItems > 0 && styles.alertMiniButton]}
                                    onPress={() => navigation.navigate('Inventory', { filter: 'lowStock' })}
                                >
                                    <Text style={[styles.miniViewButtonText, inventoryStatus.lowStockItems > 0 && styles.alertMiniButtonText]}>
                                        View
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.statCard, (inventoryStatus.expiringSoonItems > 0 || inventoryStatus.expiredItems > 0) && styles.dangerCard]}>
                                <View style={[styles.statIcon, { backgroundColor: Theme.colors.danger + '20' }]}>
                                    <Ionicons name="alert-circle" size={24} color={Theme.colors.danger} />
                                </View>
                                <Text style={styles.statValue}>{inventoryStatus.expiringSoonItems + inventoryStatus.expiredItems}</Text>
                                <Text style={styles.statLabel}>Expiry Alerts</Text>
                                <TouchableOpacity
                                    style={[styles.miniViewButton, (inventoryStatus.expiringSoonItems > 0 || inventoryStatus.expiredItems > 0) && styles.dangerMiniButton]}
                                    onPress={() => navigation.navigate('Inventory', { filter: 'expiring' })}
                                >
                                    <Text style={[styles.miniViewButtonText, (inventoryStatus.expiringSoonItems > 0 || inventoryStatus.expiredItems > 0) && styles.dangerMiniButtonText]}>
                                        Check
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Quick Actions Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: Theme.colors.primary }]}
                                onPress={() => navigation.navigate('Sales')}
                            >
                                <Ionicons name="cash" size={24} color={Theme.colors.white} />
                                <Text style={styles.actionButtonText}>New Sale</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: Theme.colors.success }]}
                                onPress={() => navigation.navigate('Inventory')}
                            >
                                <Ionicons name="add-circle" size={24} color={Theme.colors.white} />
                                <Text style={styles.actionButtonText}>Add Item</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#9c27b0' }]}
                                onPress={() => setShowWebPOS(true)}
                            >
                                <Ionicons name="globe" size={24} color={Theme.colors.white} />
                                <Text style={styles.actionButtonText}>Web POS</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* REMOVED: Reports & Analytics Section */}

                    {/* REMOVED: Recent Activity Section */}
                </ScrollView>

                {/* Web POS Modal */}
                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={showWebPOS}
                    onRequestClose={() => setShowWebPOS(false)}
                >
                    <SafeAreaView style={{ flex: 1, backgroundColor: Theme.colors.white }}>
                        <View style={styles.webPOSHeader}>
                            <TouchableOpacity
                                style={styles.closeWebPOSButton}
                                onPress={() => setShowWebPOS(false)}
                            >
                                <Ionicons name="close" size={28} color={Theme.colors.white} />
                            </TouchableOpacity>
                            <Text style={styles.webPOSHeaderTitle}>JLINK Web POS</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <WebView
                            source={{ uri: 'https://jlink-pos-web.vercel.app/' }}
                            style={{ flex: 1 }}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.webViewLoading}>
                                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                                    <Text style={styles.webViewLoadingText}>Loading Web POS...</Text>
                                </View>
                            )}
                            onError={(syntheticEvent) => {
                                const { nativeEvent } = syntheticEvent;
                                console.error('WebView error: ', nativeEvent);
                                Alert.alert('Error', 'Failed to load Web POS. Please check your internet connection.');
                            }}
                        />
                    </SafeAreaView>
                </Modal>
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
    container: {
        flex: 1,
        padding: Theme.spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    loadingText: {
        marginTop: Theme.spacing.md,
        color: Theme.colors.muted,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Theme.spacing.lg,
        paddingTop: Theme.spacing.sm,
    },
    headerContent: {
        flex: 1,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.colors.dark,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: Theme.colors.muted,
    },
    notificationButton: {
        padding: Theme.spacing.sm,
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Theme.colors.danger,
    },
    section: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.lg,
        marginBottom: Theme.spacing.lg,
        ...Theme.shadows.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Theme.colors.dark,
    },
    viewAllButton: {
        padding: Theme.spacing.xs,
    },
    viewAllText: {
        fontSize: 14,
        color: Theme.colors.primary,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        backgroundColor: Theme.colors.light,
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.md,
        alignItems: 'center',
        marginHorizontal: Theme.spacing.xs,
        position: 'relative',
    },
    alertCard: {
        backgroundColor: Theme.colors.warning + '10',
        borderWidth: 1,
        borderColor: Theme.colors.warning + '30',
    },
    dangerCard: {
        backgroundColor: Theme.colors.danger + '10',
        borderWidth: 1,
        borderColor: Theme.colors.danger + '30',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.spacing.sm,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.dark,
        marginBottom: Theme.spacing.xs,
    },
    statLabel: {
        fontSize: 12,
        color: Theme.colors.muted,
        textAlign: 'center',
        marginBottom: Theme.spacing.sm,
    },
    miniViewButton: {
        backgroundColor: Theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: Theme.borderRadius.sm,
        marginTop: Theme.spacing.xs,
        minWidth: 80, // Fixed minimum width
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniViewButtonText: {
        color: Theme.colors.white,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    alertMiniButton: {
        backgroundColor: Theme.colors.warning,
    },
    dangerMiniButton: {
        backgroundColor: Theme.colors.danger,
    },
    alertMiniButtonText: {
        color: Theme.colors.white,
    },
    dangerMiniButtonText: {
        color: Theme.colors.white,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        marginHorizontal: Theme.spacing.xs,
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.md,
    },
    actionButtonText: {
        color: Theme.colors.white,
        fontWeight: 'bold',
        marginTop: Theme.spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        padding: Theme.spacing.xl,
    },
    emptyStateText: {
        fontSize: 16,
        color: Theme.colors.muted,
        marginTop: Theme.spacing.md,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: Theme.colors.muted,
        marginTop: Theme.spacing.xs,
    },
    emptyStateButton: {
        backgroundColor: Theme.colors.primary,
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        marginTop: Theme.spacing.lg,
        ...Theme.shadows.sm,
    },
    emptyStateButtonText: {
        color: Theme.colors.white,
        fontWeight: 'bold',
    },
    webPOSHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Theme.colors.primary,
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        ...Theme.shadows.sm,
    },
    webPOSHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.white,
        flex: 1,
        textAlign: 'center',
    },
    closeWebPOSButton: {
        padding: Theme.spacing.xs,
    },
    webViewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    webViewLoadingText: {
        marginTop: Theme.spacing.md,
        fontSize: 16,
        color: Theme.colors.muted,
    },
});