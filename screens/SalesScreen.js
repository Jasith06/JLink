import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    ScrollView,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';
import { Theme } from '../theme';
import { ref, onValue, remove } from 'firebase/database';
import { rtdb } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBarSpacer from '../components/BottomTabBarSpacer';

export default function SalesScreen({ navigation, route }) {
    const { user } = useContext(AuthContext);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState(route?.params?.filter || 'today');
    const [salesStats, setSalesStats] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        transactionCount: 0,
        averageTransaction: 0
    });

    useEffect(() => {
        if (!user || !rtdb) {
            setLoading(false);
            return;
        }

        fetchSalesData();

        // Real-time listener
        const salesRef = ref(rtdb, `users/${user.userId}/sales`);
        const unsubscribe = onValue(salesRef, () => {
            fetchSalesData();
        });

        return () => unsubscribe();
    }, [user, activeFilter]);

    const fetchSalesData = async () => {
        if (!user || !rtdb) return;

        try {
            setLoading(true);
            const salesRef = ref(rtdb, `users/${user.userId}/sales`);

            const salesSnapshot = await new Promise((resolve) => {
                onValue(salesRef, (snapshot) => {
                    resolve(snapshot);
                }, { onlyOnce: true });
            });

            if (!salesSnapshot.exists()) {
                setSales([]);
                setSalesStats({
                    totalRevenue: 0,
                    totalProfit: 0,
                    transactionCount: 0,
                    averageTransaction: 0
                });
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const salesData = salesSnapshot.val();
            const salesArray = [];
            const now = new Date();

            let totalRevenue = 0;
            let totalProfit = 0;
            let transactionCount = 0;

            Object.keys(salesData).forEach(key => {
                const sale = salesData[key];
                const saleDate = new Date(sale.saleDate);
                let include = false;

                if (activeFilter === 'today') {
                    include = isSameDay(saleDate, now);
                } else if (activeFilter === 'week') {
                    include = isSameWeek(saleDate, now);
                } else if (activeFilter === 'month') {
                    include = isSameMonth(saleDate, now);
                } else if (activeFilter === 'all') {
                    include = true;
                }

                if (include) {
                    salesArray.push({ id: key, ...sale });
                    totalRevenue += sale.totalAmount || 0;
                    totalProfit += sale.profit || 0;
                    transactionCount++;
                }
            });

            // Sort by date descending
            salesArray.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));

            setSales(salesArray);
            setSalesStats({
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalProfit: parseFloat(totalProfit.toFixed(2)),
                transactionCount,
                averageTransaction: transactionCount > 0
                    ? parseFloat((totalRevenue / transactionCount).toFixed(2))
                    : 0
            });

        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const isSameDay = (date1, date2) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const isSameWeek = (date1, date2) => {
        // Get start of week (Monday) for both dates
        const getStartOfWeek = (date) => {
            const d = new Date(date);
            const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const weekStart1 = getStartOfWeek(date1);
        const weekStart2 = getStartOfWeek(date2);

        // Check if same week (same Monday) and same year
        return weekStart1.getTime() === weekStart2.getTime() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const isSameMonth = (date1, date2) => {
        return date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchSalesData();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDeleteSale = async (saleId) => {
        if (!user || !rtdb) return;

        try {
            const saleRef = ref(rtdb, `users/${user.userId}/sales/${saleId}`);
            await remove(saleRef);

            Alert.alert('Success', 'Sale record deleted');

        } catch (error) {
            console.error('Error deleting sale:', error);
            Alert.alert('Error', 'Failed to delete sale record');
        }
    };

    const renderSaleItem = ({ item }) => (
        <View style={styles.saleCard}>
            <View style={styles.saleHeader}>
                <View style={styles.saleInfo}>
                    <Text style={styles.saleId}>Sale #{item.saleId?.substring(0, 8)}</Text>
                    <Text style={styles.saleDate}>{formatDate(item.saleDate)}</Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={styles.saleAmount}>LKR {item.totalAmount.toFixed(2)}</Text>
                    {item.profit > 0 && (
                        <Text style={styles.profitBadge}>
                            Profit: LKR {item.profit.toFixed(2)}
                        </Text>
                    )}
                </View>
            </View>

            {item.customerName && (
                <View style={styles.customerInfo}>
                    <Ionicons name="person" size={14} color={Theme.colors.muted} />
                    <Text style={styles.customerText}>{item.customerName}</Text>
                </View>
            )}

            {item.customerEmail && (
                <View style={styles.customerInfo}>
                    <Ionicons name="mail" size={14} color={Theme.colors.muted} />
                    <Text style={styles.customerText}>{item.customerEmail}</Text>
                </View>
            )}

            <View style={styles.itemsList}>
                <Text style={styles.itemsTitle}>Items ({item.items?.length || 0}):</Text>
                {item.items && item.items.map((saleItem, index) => (
                    <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemText}>
                            {saleItem.name} x{saleItem.quantity}
                        </Text>
                        <Text style={styles.itemPrice}>
                            LKR {(saleItem.price * saleItem.quantity).toFixed(2)}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.saleFooter}>
                <View style={[styles.statusBadge, { backgroundColor: Theme.colors.success + '20' }]}>
                    <Text style={[styles.statusText, { color: Theme.colors.success }]}>
                        {item.status || 'Completed'}
                    </Text>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteSale(item.id)}
                >
                    <Ionicons name="trash-outline" size={16} color={Theme.colors.white} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <ImageBackground
                source={require('../assets/app_bg.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Theme.colors.primary} />
                        <Text style={styles.loadingText}>Loading sales...</Text>
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
                {/* Header */}
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

                {/* Stats Cards */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.statsContainer}
                    contentContainerStyle={styles.statsContentContainer}
                >
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>LKR {salesStats.totalRevenue.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>Total Revenue</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>LKR {salesStats.totalProfit.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>Total Profit</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{salesStats.transactionCount}</Text>
                        <Text style={styles.statLabel}>Transactions</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>LKR {salesStats.averageTransaction.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>Avg. Sale</Text>
                    </View>
                </ScrollView>

                {/* Filter Tabs */}
                <View style={styles.filterWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterContainer}
                        contentContainerStyle={styles.filterContentContainer}
                    >
                        <TouchableOpacity
                            style={[styles.filterTab, activeFilter === 'today' && styles.activeFilterTab]}
                            onPress={() => setActiveFilter('today')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'today' && styles.activeFilterText]}>
                                Today
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, activeFilter === 'week' && styles.activeFilterTab]}
                            onPress={() => setActiveFilter('week')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'week' && styles.activeFilterText]}>
                                This Week
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, activeFilter === 'month' && styles.activeFilterTab]}
                            onPress={() => setActiveFilter('month')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'month' && styles.activeFilterText]}>
                                This Month
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
                            onPress={() => setActiveFilter('all')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
                                All Time
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Sales List */}
                {sales.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="point-of-sale" size={64} color={Theme.colors.muted} />
                        <Text style={styles.emptyStateText}>No sales found</Text>
                        <Text style={styles.emptyStateSubtext}>
                            {activeFilter === 'today'
                                ? 'No sales recorded today'
                                : `No sales in ${activeFilter}`}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={sales}
                        keyExtractor={(item) => item.id}
                        renderItem={renderSaleItem}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={styles.resultsHeader}>
                                <Text style={styles.resultsTitle}>
                                    Showing {sales.length} sale{sales.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        }
                        ListFooterComponent={<BottomTabBarSpacer />}
                    />
                )}
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
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    statsContainer: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    statsContentContainer: {
        paddingRight: Theme.spacing.lg,
    },
    statCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: Theme.spacing.lg,
        borderRadius: Theme.borderRadius.md,
        marginRight: Theme.spacing.md,
        width: 160,
        minHeight: 90,
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.sm,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: Theme.colors.muted,
        textAlign: 'center',
        fontWeight: '500',
    },
    filterWrapper: {
        marginBottom: Theme.spacing.md,
    },
    filterContainer: {
        paddingHorizontal: Theme.spacing.lg,
    },
    filterContentContainer: {
        paddingRight: Theme.spacing.lg,
    },
    filterTab: {
        paddingHorizontal: Theme.spacing.xl,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.borderRadius.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        marginRight: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        minWidth: 110,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeFilterTab: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    filterText: {
        color: Theme.colors.muted,
        fontWeight: '600',
        fontSize: 15,
        textAlign: 'center',
    },
    activeFilterText: {
        color: Theme.colors.white,
    },
    listContent: {
        padding: Theme.spacing.lg,
        paddingTop: 0,
    },
    resultsHeader: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.md,
        marginBottom: Theme.spacing.md,
        alignItems: 'center',
        ...Theme.shadows.sm,
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.colors.dark,
        marginBottom: Theme.spacing.xs,
        textAlign: 'center',
    },
    saleCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
        ...Theme.shadows.sm,
    },
    saleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Theme.spacing.md,
    },
    saleInfo: {
        flex: 1,
        marginRight: Theme.spacing.sm,
    },
    saleId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.colors.dark,
        marginBottom: 4,
    },
    saleDate: {
        fontSize: 12,
        color: Theme.colors.muted,
    },
    amountContainer: {
        alignItems: 'flex-end',
        flexShrink: 0,
    },
    saleAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.success,
        marginBottom: 4,
        textAlign: 'right',
    },
    profitBadge: {
        fontSize: 11,
        color: Theme.colors.primary,
        fontWeight: '600',
        textAlign: 'right',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.spacing.xs,
    },
    customerText: {
        fontSize: 14,
        color: Theme.colors.muted,
        marginLeft: Theme.spacing.xs,
    },
    itemsList: {
        marginTop: Theme.spacing.md,
        paddingTop: Theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.colors.dark,
        marginBottom: Theme.spacing.sm,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.spacing.xs,
    },
    itemText: {
        fontSize: 14,
        color: Theme.colors.muted,
        flex: 1,
        marginRight: Theme.spacing.sm,
    },
    itemPrice: {
        fontSize: 14,
        color: Theme.colors.dark,
        fontWeight: '500',
        flexShrink: 0,
    },
    saleFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Theme.spacing.md,
    },
    statusBadge: {
        paddingVertical: Theme.spacing.xs,
        paddingHorizontal: Theme.spacing.sm,
        borderRadius: Theme.borderRadius.sm,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: Theme.colors.danger,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.sm,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.spacing.xl,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        margin: Theme.spacing.lg,
        borderRadius: Theme.borderRadius.lg,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: Theme.colors.muted,
        marginTop: Theme.spacing.lg,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: Theme.colors.muted,
        marginTop: Theme.spacing.sm,
        textAlign: 'center',
    },
});