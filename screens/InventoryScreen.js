import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Modal,
    FlatList,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    ImageBackground,
    RefreshControl,
    Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';
import { Theme } from '../theme';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { rtdb } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBarSpacer from '../components/BottomTabBarSpacer';

const { width } = Dimensions.get('window');

// Helper function to parse DD.MM.YYYY format
const parseDate = (dateString) => {
    if (!dateString) return null;

    const parts = dateString.split('.');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }

    return null;
};

// Helper function to format date as DD.MM.YYYY for display
const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';

    const date = parseDate(dateString);
    if (date && !isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    return dateString;
};

// Helper function to check if date is expired
const isDateExpired = (dateString) => {
    const date = parseDate(dateString);
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    return date < today;
};

// Helper function to check if date is expiring soon (within 15 days)
const isDateExpiringSoon = (dateString) => {
    const date = parseDate(dateString);
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(date - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 15 && date >= today;
};

export default function InventoryScreen({ navigation, route }) {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [groupedProducts, setGroupedProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [filteredGroupedProducts, setFilteredGroupedProducts] = useState({});
    const [activeFilter, setActiveFilter] = useState('all');
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [qrImportModalVisible, setQrImportModalVisible] = useState(false);
    const [manualProductCode, setManualProductCode] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({}); // Track which groups are expanded

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        productCode: '', // Added productCode field
        price: '',
        wholesalePrice: '',
        quantity: '',
        lowStockThreshold: '10',
        category: '',
        manufactureDate: '',
        expiryDate: ''
    });

    // Function to group products by name (excluding sold items with quantity = 0)
    const groupProductsByName = (productsList) => {
        return productsList.reduce((acc, product) => {
            // Skip sold products (quantity = 0) from display
            if (product.quantity <= 0) return acc;

            const baseName = product.name.trim();
            if (!acc[baseName]) {
                acc[baseName] = [];
            }
            acc[baseName].push(product);
            return acc;
        }, {});
    };

    // Function to flatten grouped products for filters and stats (excluding sold items)
    const getFlattenedProducts = (grouped) => {
        return Object.values(grouped).flat().filter(product => product.quantity > 0);
    };

    // Function to get all products including sold ones for statistics
    const getAllProductsIncludingSold = () => {
        return Object.values(groupedProducts).flat();
    };

    // Toggle group expansion
    const toggleGroupExpansion = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    // Expand all groups
    const expandAllGroups = () => {
        const allExpanded = {};
        Object.keys(filteredGroupedProducts).forEach(groupName => {
            allExpanded[groupName] = true;
        });
        setExpandedGroups(allExpanded);
    };

    // Collapse all groups
    const collapseAllGroups = () => {
        setExpandedGroups({});
    };

    useEffect(() => {
        if (!user || !rtdb) {
            console.log('User not authenticated or Database not available');
            setLoading(false);
            return;
        }

        console.log('Setting up Realtime Database listener for user:', user.userId);

        // Real-time listener for products from Realtime Database
        const productsRef = ref(rtdb, `users/${user.userId}/products`);

        const unsubscribe = onValue(productsRef,
            (snapshot) => {
                const productsData = snapshot.val();
                const productsList = [];

                if (productsData) {
                    Object.keys(productsData).forEach(key => {
                        productsList.push({ id: key, ...productsData[key] });
                    });
                }

                console.log('Products loaded:', productsList.length);
                setProducts(productsList);

                // Group products by name (excluding sold items)
                const grouped = groupProductsByName(productsList);
                setGroupedProducts(grouped);

                // Initialize filtered grouped products
                setFilteredGroupedProducts(grouped);
                setFilteredProducts(getFlattenedProducts(grouped));
                setLoading(false);
                setRefreshing(false);
            },
            (error) => {
                console.error('Error fetching products:', error);
                Alert.alert('Error', 'Failed to load products: ' + error.message);
                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        filterProducts();
    }, [searchQuery, activeFilter, groupedProducts]);

    const filterProducts = () => {
        let filteredGrouped = { ...groupedProducts };

        // Apply search filter
        if (searchQuery) {
            // Filter each group
            filteredGrouped = Object.keys(filteredGrouped).reduce((acc, groupName) => {
                const filteredGroup = filteredGrouped[groupName].filter(product =>
                    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.productCode?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredGroup.length > 0) {
                    acc[groupName] = filteredGroup;
                }
                return acc;
            }, {});
        }

        // Apply category/status filter (only for available products)
        if (activeFilter === 'lowStock') {
            filteredGrouped = Object.keys(filteredGrouped).reduce((acc, groupName) => {
                const filteredGroup = filteredGrouped[groupName].filter(product =>
                    product.quantity <= product.lowStockThreshold
                );

                if (filteredGroup.length > 0) {
                    acc[groupName] = filteredGroup;
                }
                return acc;
            }, {});
        } else if (activeFilter === 'expiring') {
            filteredGrouped = Object.keys(filteredGrouped).reduce((acc, groupName) => {
                const filteredGroup = filteredGrouped[groupName].filter(product =>
                    product.expiryDate && isDateExpiringSoon(product.expiryDate)
                );

                if (filteredGroup.length > 0) {
                    acc[groupName] = filteredGroup;
                }
                return acc;
            }, {});
        } else if (activeFilter === 'expired') {
            filteredGrouped = Object.keys(filteredGrouped).reduce((acc, groupName) => {
                const filteredGroup = filteredGrouped[groupName].filter(product =>
                    product.expiryDate && isDateExpired(product.expiryDate)
                );

                if (filteredGroup.length > 0) {
                    acc[groupName] = filteredGroup;
                }
                return acc;
            }, {});
        } else if (activeFilter !== 'all') {
            filteredGrouped = Object.keys(filteredGrouped).reduce((acc, groupName) => {
                const filteredGroup = filteredGrouped[groupName].filter(product =>
                    product.category === activeFilter
                );

                if (filteredGroup.length > 0) {
                    acc[groupName] = filteredGroup;
                }
                return acc;
            }, {});
        }

        setFilteredGroupedProducts(filteredGrouped);
        setFilteredProducts(getFlattenedProducts(filteredGrouped));
    };

    const handleAddProduct = async () => {
        if (!formData.name || !formData.price) {
            Alert.alert('Error', 'Please fill in required fields (Name, Price)');
            return;
        }

        if (!rtdb) {
            Alert.alert('Error', 'Database not available');
            return;
        }

        if (!user || !user.userId) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        setSaving(true);

        try {
            // Validate numeric fields
            const price = parseFloat(formData.price);
            const wholesalePrice = parseFloat(formData.wholesalePrice || 0);
            const quantity = parseInt(formData.quantity || 0);
            const lowStockThreshold = parseInt(formData.lowStockThreshold || 10);

            if (isNaN(price) || price < 0) {
                Alert.alert('Error', 'Please enter a valid price');
                setSaving(false);
                return;
            }

            // Validate dates
            if (formData.manufactureDate && !parseDate(formData.manufactureDate)) {
                Alert.alert('Error', 'Please enter manufacture date in DD.MM.YYYY format');
                setSaving(false);
                return;
            }

            if (formData.expiryDate && !parseDate(formData.expiryDate)) {
                Alert.alert('Error', 'Please enter expiry date in DD.MM.YYYY format');
                setSaving(false);
                return;
            }

            // Generate product code if not provided
            const productCode = formData.productCode || generateProductCode(formData.name);

            const productData = {
                name: formData.name.trim(),
                productCode: productCode, // Include product code
                price: price,
                wholesalePrice: wholesalePrice,
                quantity: quantity,
                lowStockThreshold: lowStockThreshold,
                category: formData.category.trim(),
                manufactureDate: formData.manufactureDate,
                expiryDate: formData.expiryDate,
                userId: user.userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('Saving product data:', productData);

            if (editingProduct) {
                // Update existing product in Realtime Database
                const productRef = ref(rtdb, `users/${user.userId}/products/${editingProduct.id}`);
                await update(productRef, productData);
                console.log('Product updated successfully');
                Alert.alert('Success', 'Product updated successfully');
            } else {
                // Add new product to Realtime Database
                const productsRef = ref(rtdb, `users/${user.userId}/products`);
                const newProductRef = push(productsRef);
                await set(newProductRef, productData);
                console.log('Product added successfully with ID:', newProductRef.key);
                Alert.alert('Success', 'Product added successfully');
            }

            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error('Error saving product:', error);
            let errorMessage = 'Failed to save product';

            if (error.code === 'PERMISSION_DENIED') {
                errorMessage = 'Permission denied. Please check database security rules.';
            } else {
                errorMessage = error.message || 'Failed to save product';
            }

            Alert.alert('Error', errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const generateProductCode = (productName) => {
        // Generate a simple product code from name and timestamp
        const prefix = productName.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        return `${prefix}-${timestamp}`;
    };

    const resetForm = () => {
        setFormData({
            name: '',
            productCode: '',
            price: '',
            wholesalePrice: '',
            quantity: '',
            lowStockThreshold: '10',
            category: '',
            manufactureDate: '',
            expiryDate: ''
        });
        setEditingProduct(null);
    };

    const editProduct = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            productCode: product.productCode || '', // Include product code
            price: product.price?.toString() || '',
            wholesalePrice: product.wholesalePrice?.toString() || '',
            quantity: product.quantity?.toString() || '',
            lowStockThreshold: product.lowStockThreshold?.toString() || '10',
            category: product.category || '',
            manufactureDate: product.manufactureDate || '',
            expiryDate: product.expiryDate || ''
        });
        setModalVisible(true);
    };

    const deleteProduct = async (productId) => {
        if (!rtdb) {
            Alert.alert('Error', 'Database not available');
            return;
        }

        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this product permanently?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const productRef = ref(rtdb, `users/${user.userId}/products/${productId}`);
                            await remove(productRef);
                            Alert.alert('Success', 'Product deleted successfully');
                        } catch (error) {
                            console.error('Error deleting product:', error);
                            Alert.alert('Error', 'Failed to delete product: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleQRImport = () => {
        navigation.navigate('QRImport');
    };

    const handleQuickQRScan = () => {
        setQrImportModalVisible(true);
    };

    const handleManualProductCode = async () => {
        if (!manualProductCode.trim()) {
            Alert.alert('Error', 'Please enter a product code');
            return;
        }

        try {
            // Search for product by code from all products including sold ones
            const allProducts = getAllProductsIncludingSold();
            const product = allProducts.find(p =>
                p.productCode && p.productCode.toLowerCase() === manualProductCode.toLowerCase().trim()
            );

            if (product) {
                if (product.quantity <= 0) {
                    Alert.alert(
                        'Product Sold',
                        `Product: ${product.name}\nCode: ${product.productCode}\nStatus: Sold Out\n\nThis product is no longer in inventory as it has been sold.`,
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert(
                        'Product Found',
                        `Product: ${product.name}\nCode: ${product.productCode}\nPrice: LKR ${product.price}\nQuantity: ${product.quantity}`,
                        [{ text: 'OK' }]
                    );
                }
            } else {
                Alert.alert(
                    'Product Not Found',
                    `No product found with code: ${manualProductCode}\n\nWould you like to create a new product?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Create New',
                            onPress: () => {
                                setFormData(prev => ({
                                    ...prev,
                                    productCode: manualProductCode.trim()
                                }));
                                setModalVisible(true);
                                setQrImportModalVisible(false);
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to search for product: ' + error.message);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        // The useEffect will handle the refresh
    };

    const getStockStatus = (product) => {
        if (product.quantity <= product.lowStockThreshold) return { status: 'low-stock', text: 'Low Stock', color: '#f8961e' };
        if (product.expiryDate && isDateExpired(product.expiryDate)) return { status: 'expired', text: 'Expired', color: '#f94144' };
        if (product.expiryDate && isDateExpiringSoon(product.expiryDate)) return { status: 'expiring', text: 'Expiring Soon', color: '#f9c74f' };
        return { status: 'in-stock', text: 'In Stock', color: '#43aa8b' };
    };

    const getGroupStockStatus = (productsInGroup) => {
        let hasExpired = false;
        let hasLowStock = false;
        let hasExpiringSoon = false;

        productsInGroup.forEach(product => {
            if (product.quantity <= product.lowStockThreshold) hasLowStock = true;
            if (product.expiryDate && isDateExpired(product.expiryDate)) hasExpired = true;
            if (product.expiryDate && isDateExpiringSoon(product.expiryDate)) hasExpiringSoon = true;
        });

        // Priority: expired > low-stock > expiring > in-stock
        if (hasExpired) return { status: 'expired', text: 'Contains Expired', color: '#f94144' };
        if (hasLowStock) return { status: 'low-stock', text: 'Low Stock Items', color: '#f8961e' };
        if (hasExpiringSoon) return { status: 'expiring', text: 'Expiring Soon Items', color: '#f9c74f' };
        return { status: 'in-stock', text: 'All Good', color: '#43aa8b' };
    };

    if (loading) {
        return (
            <ImageBackground
                source={require('../assets/app_bg.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Theme.colors.primary} />
                        <Text style={styles.loadingText}>Loading products...</Text>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        );
    }

    // Get all products including sold ones for statistics
    const allProducts = getAllProductsIncludingSold();
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

    // Calculate statistics only for available products (quantity > 0)
    const availableProducts = allProducts.filter(p => p.quantity > 0);
    const totalProducts = availableProducts.length;
    const lowStockCount = availableProducts.filter(p => p.quantity <= p.lowStockThreshold).length;
    const expiredCount = availableProducts.filter(p => p.expiryDate && isDateExpired(p.expiryDate)).length;
    const expiringSoonCount = availableProducts.filter(p => p.expiryDate && isDateExpiringSoon(p.expiryDate)).length;

    return (
        <ImageBackground
            source={require('../assets/app_bg.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={20} color={Theme.colors.dark} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Inventory Management</Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={[styles.addButton, styles.qrButton]}
                            onPress={handleQuickQRScan}
                        >
                            <Ionicons name="qr-code" size={16} color={Theme.colors.white} />
                            <Text style={styles.addButtonText}>QR Scan</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Stats - Improved layout with better text visibility */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.statsContainer}
                    contentContainerStyle={styles.statsContentContainer}
                >
                    <View style={[styles.statCard, styles.availableCard]}>
                        <Text style={styles.statNumber}>{totalProducts}</Text>
                        <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>
                            Available
                        </Text>
                    </View>
                    <View style={[styles.statCard, styles.lowStockCardStat, lowStockCount > 0 && styles.statCardWarning]}>
                        <Text style={styles.statNumber}>{lowStockCount}</Text>
                        <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>
                            Low Stock
                        </Text>
                    </View>
                    <View style={[styles.statCard, styles.expiringCardStat, expiringSoonCount > 0 && styles.statCardWarning]}>
                        <Text style={styles.statNumber}>{expiringSoonCount}</Text>
                        <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>
                            Expiring Soon
                        </Text>
                    </View>
                    <View style={[styles.statCard, styles.expiredCardStat, expiredCount > 0 && styles.statCardDanger]}>
                        <Text style={styles.statNumber}>{expiredCount}</Text>
                        <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>
                            Expired
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.statCard, styles.importCard]}
                        onPress={handleQRImport}
                    >
                        <Ionicons name="download" size={22} color={Theme.colors.primary} style={styles.importIcon} />
                        <Text style={[styles.statLabel, styles.importLabel]} numberOfLines={2} adjustsFontSizeToFit>
                            QR Import
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={Theme.colors.muted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search available products by name, category, or code..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={Theme.colors.muted}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={Theme.colors.muted} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Filter Tabs - Fixed layout with proper sizing */}
                <View style={styles.filterWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterContainer}
                        contentContainerStyle={styles.filterContentContainer}
                    >
                        <TouchableOpacity
                            style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
                            onPress={() => setActiveFilter('all')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
                                All
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterTab, activeFilter === 'lowStock' && styles.activeFilterTab]}
                            onPress={() => setActiveFilter('lowStock')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'lowStock' && styles.activeFilterText]}>
                                Low Stock
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterTab, activeFilter === 'expiring' && styles.activeFilterTab]}
                            onPress={() => setActiveFilter('expiring')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'expiring' && styles.activeFilterText]}>
                                Expiring Soon
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterTab, activeFilter === 'expired' && styles.activeFilterTab]}
                            onPress={() => setActiveFilter('expired')}
                        >
                            <Text style={[styles.filterText, activeFilter === 'expired' && styles.activeFilterText]}>
                                Expired
                            </Text>
                        </TouchableOpacity>

                        {categories.map(category => (
                            <TouchableOpacity
                                key={category}
                                style={[styles.filterTab, activeFilter === category && styles.activeFilterTab]}
                                onPress={() => setActiveFilter(category)}
                            >
                                <Text style={[styles.filterText, activeFilter === category && styles.activeFilterText]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Info Banner about sold products */}
                {allProducts.length > availableProducts.length && (
                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={16} color={Theme.colors.primary} />
                        <Text style={styles.infoText}>
                            Note: {allProducts.length - availableProducts.length} sold product(s) are not shown in inventory
                        </Text>
                    </View>
                )}

                {/* Group Controls */}
                {Object.keys(filteredGroupedProducts).length > 0 && (
                    <View style={styles.groupControls}>
                        <TouchableOpacity
                            style={styles.groupControlButton}
                            onPress={expandAllGroups}
                        >
                            <Ionicons name="expand" size={16} color={Theme.colors.primary} />
                            <Text style={styles.groupControlText}>Expand All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.groupControlButton}
                            onPress={collapseAllGroups}
                        >
                            <Ionicons name="contract" size={16} color={Theme.colors.muted} />
                            <Text style={styles.groupControlText}>Collapse All</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Products List */}
                {filteredProducts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="inventory" size={64} color={Theme.colors.muted} />
                        <Text style={styles.emptyStateText}>
                            {searchQuery ? 'No products found' : 'No products available'}
                        </Text>
                        <Text style={styles.emptyStateSubtext}>
                            {searchQuery ? 'Try a different search term' : 'Import products using QR code to get started'}
                        </Text>
                        {!searchQuery && (
                            <View style={styles.emptyStateButtons}>
                                <TouchableOpacity
                                    style={[styles.emptyStateButton, styles.secondaryButton]}
                                    onPress={handleQRImport}
                                >
                                    <Text style={[styles.emptyStateButtonText, styles.secondaryButtonText]}>QR Import</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={Object.entries(filteredGroupedProducts)}
                        keyExtractor={([groupName]) => groupName}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        renderItem={({ item: [groupName, productsInGroup] }) => {
                            const totalQuantity = productsInGroup.reduce((sum, product) => sum + (product.quantity || 0), 0);
                            const totalPrice = productsInGroup.reduce((sum, product) => sum + (product.price || 0) * (product.quantity || 0), 0);
                            const lowestStockStatus = getGroupStockStatus(productsInGroup);
                            const isExpanded = expandedGroups[groupName] || false;

                            return (
                                <View style={[
                                    styles.groupContainer,
                                    lowestStockStatus.status === 'low-stock' && styles.lowStockGroupCard,
                                    lowestStockStatus.status === 'expired' && styles.expiredGroupCard,
                                    lowestStockStatus.status === 'expiring' && styles.expiringGroupCard
                                ]}>
                                    {/* Group Header - Clickable */}
                                    <TouchableOpacity
                                        style={styles.groupHeader}
                                        onPress={() => toggleGroupExpansion(groupName)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.groupInfo}>
                                            <View style={styles.groupNameRow}>
                                                <Text style={styles.groupName}>{groupName}</Text>
                                                <Ionicons
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={20}
                                                    color={Theme.colors.muted}
                                                />
                                            </View>
                                            <Text style={styles.groupCount}>
                                                {productsInGroup.length} variant{productsInGroup.length > 1 ? 's' : ''} • Total: {totalQuantity} units • LKR {totalPrice.toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={styles.groupStatus}>
                                            <View style={[styles.stockBadge, { backgroundColor: lowestStockStatus.color }]}>
                                                <Text style={styles.stockBadgeText}>{lowestStockStatus.text}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Products in Group - Only show when expanded */}
                                    {isExpanded && productsInGroup.map((product) => {
                                        const stockStatus = getStockStatus(product);
                                        const isExpired = product.expiryDate && isDateExpired(product.expiryDate);
                                        const isExpiringSoon = product.expiryDate && isDateExpiringSoon(product.expiryDate);

                                        return (
                                            <View key={product.id} style={styles.productItem}>
                                                <View style={styles.productHeader}>
                                                    <View style={styles.productInfo}>
                                                        {product.productCode && (
                                                            <Text style={styles.productCode}>Code: {product.productCode}</Text>
                                                        )}
                                                        {product.category && (
                                                            <Text style={styles.productCategory}>{product.category}</Text>
                                                        )}
                                                    </View>
                                                    <View style={styles.priceStockContainer}>
                                                        <Text style={styles.productPrice}>LKR {product.price.toFixed(2)}</Text>
                                                        <View style={[styles.productStockBadge, { backgroundColor: stockStatus.color }]}>
                                                            <Text style={styles.productStockBadgeText}>{stockStatus.text}</Text>
                                                        </View>
                                                    </View>
                                                </View>

                                                <View style={styles.productDetails}>
                                                    <View style={styles.detailRow}>
                                                        <Ionicons name="cube" size={16} color={Theme.colors.muted} />
                                                        <Text style={styles.detailText}>Quantity: {product.quantity}</Text>
                                                        {product.lowStockThreshold && (
                                                            <Text style={styles.thresholdText}>(Low: {product.lowStockThreshold})</Text>
                                                        )}
                                                    </View>

                                                    {product.manufactureDate && (
                                                        <View style={styles.detailRow}>
                                                            <Ionicons name="hammer" size={16} color={Theme.colors.muted} />
                                                            <Text style={styles.detailText}>
                                                                MFD: {formatDateForDisplay(product.manufactureDate)}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {product.expiryDate && (
                                                        <View style={styles.detailRow}>
                                                            <Ionicons name="calendar" size={16} color={Theme.colors.muted} />
                                                            <Text style={[
                                                                styles.detailText,
                                                                isExpired && styles.expiredText,
                                                                isExpiringSoon && styles.expiringText
                                                            ]}>
                                                                Expires: {formatDateForDisplay(product.expiryDate)}
                                                                {isExpired && ' (Expired)'}
                                                                {isExpiringSoon && !isExpired && ' (Soon)'}
                                                            </Text>
                                                        </View>
                                                    )}

                                                    {product.wholesalePrice > 0 && (
                                                        <View style={styles.detailRow}>
                                                            <Ionicons name="business" size={16} color={Theme.colors.muted} />
                                                            <Text style={styles.detailText}>
                                                                Cost: LKR {product.wholesalePrice.toFixed(2)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <View style={styles.productActions}>
                                                    <TouchableOpacity
                                                        style={styles.actionButton}
                                                        onPress={() => editProduct(product)}
                                                    >
                                                        <Ionicons name="create-outline" size={20} color={Theme.colors.primary} />
                                                        <Text style={styles.actionButtonText}>Edit</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, styles.deleteButton]}
                                                        onPress={() => deleteProduct(product.id)}
                                                    >
                                                        <Ionicons name="trash-outline" size={20} color={Theme.colors.danger} />
                                                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        }}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={<BottomTabBarSpacer />}
                    />
                )}

                {/* Quick QR Scan Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={qrImportModalVisible}
                    onRequestClose={() => setQrImportModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Quick Product Lookup</Text>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => {
                                            setQrImportModalVisible(false);
                                            setManualProductCode('');
                                        }}
                                    >
                                        <Ionicons name="close" size={24} color={Theme.colors.muted} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.modalDescription}>
                                    Enter a product code to quickly find product details
                                </Text>

                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Enter product code (e.g., RAPIDENE-001)"
                                    value={manualProductCode}
                                    onChangeText={setManualProductCode}
                                    autoCapitalize="characters"
                                    placeholderTextColor={Theme.colors.muted}
                                />

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => {
                                            setQrImportModalVisible(false);
                                            setManualProductCode('');
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.searchButton]}
                                        onPress={handleManualProductCode}
                                    >
                                        <Text style={styles.searchButtonText}>Search Product</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.fullImportButton}
                                    onPress={() => {
                                        setQrImportModalVisible(false);
                                        handleQRImport();
                                    }}
                                >
                                    <Text style={styles.fullImportButtonText}>Bulk QR Import →</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Edit Product Modal (Kept for editing existing products) */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(false);
                        resetForm();
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        Edit Product
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => {
                                            setModalVisible(false);
                                            resetForm();
                                        }}
                                        disabled={saving}
                                    >
                                        <Ionicons name="close" size={24} color={Theme.colors.muted} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.inputLabel}>Product Name *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter product name"
                                        value={formData.name}
                                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                                        editable={!saving}
                                    />

                                    <Text style={styles.inputLabel}>Product Code</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Auto-generated if empty"
                                        value={formData.productCode}
                                        onChangeText={(text) => setFormData({ ...formData, productCode: text })}
                                        editable={!saving}
                                        autoCapitalize="characters"
                                    />

                                    <View style={styles.inputRow}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Price (LKR) *</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChangeText={(text) => setFormData({ ...formData, price: text })}
                                                keyboardType="numeric"
                                                editable={!saving}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Wholesale Price</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="0.00"
                                                value={formData.wholesalePrice}
                                                onChangeText={(text) => setFormData({ ...formData, wholesalePrice: text })}
                                                keyboardType="numeric"
                                                editable={!saving}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputRow}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Quantity</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="0"
                                                value={formData.quantity}
                                                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                                                keyboardType="numeric"
                                                editable={!saving}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Low Stock Alert</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="10"
                                                value={formData.lowStockThreshold}
                                                onChangeText={(text) => setFormData({ ...formData, lowStockThreshold: text })}
                                                keyboardType="numeric"
                                                editable={!saving}
                                            />
                                        </View>
                                    </View>

                                    <Text style={styles.inputLabel}>Category</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Category"
                                        value={formData.category}
                                        onChangeText={(text) => setFormData({ ...formData, category: text })}
                                        editable={!saving}
                                    />

                                    <View style={styles.inputRow}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Manufacture Date</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="DD.MM.YYYY"
                                                value={formData.manufactureDate}
                                                onChangeText={(text) => setFormData({ ...formData, manufactureDate: text })}
                                                editable={!saving}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Expiry Date</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="DD.MM.YYYY"
                                                value={formData.expiryDate}
                                                onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
                                                editable={!saving}
                                            />
                                        </View>
                                    </View>

                                    {/* Date format hint */}
                                    <View style={styles.dateHint}>
                                        <Ionicons name="information-circle" size={16} color={Theme.colors.muted} />
                                        <Text style={styles.dateHintText}>Use DD.MM.YYYY format for dates (e.g., 02.01.2025)</Text>
                                    </View>

                                    {/* Inventory info */}
                                    <View style={styles.inventoryHint}>
                                        <Ionicons name="information-circle" size={16} color={Theme.colors.primary} />
                                        <Text style={styles.inventoryHintText}>
                                            Note: Products with quantity 0 (sold items) are automatically removed from inventory view
                                        </Text>
                                    </View>
                                </ScrollView>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => {
                                            setModalVisible(false);
                                            resetForm();
                                        }}
                                        disabled={saving}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                                        onPress={handleAddProduct}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <ActivityIndicator size="small" color={Theme.colors.white} />
                                        ) : (
                                            <Text style={styles.saveButtonText}>
                                                Update
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
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
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.dark,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: Theme.spacing.md,
    },
    headerButtons: {
        flexDirection: 'row',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.primary,
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        borderRadius: Theme.borderRadius.md,
        ...Theme.shadows.sm,
    },
    qrButton: {
        backgroundColor: Theme.colors.success,
    },
    addButtonText: {
        color: Theme.colors.white,
        fontWeight: 'bold',
        marginLeft: Theme.spacing.xs,
        fontSize: 14,
    },
    statsContainer: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    statsContentContainer: {
        paddingRight: Theme.spacing.lg,
        alignItems: 'center',
    },
    statCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        marginRight: Theme.spacing.md,
        width: 100, // Reduced width for better fit
        minHeight: 95, // Slightly increased for text wrapping
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.sm,
    },
    availableCard: {
        borderLeftWidth: 3,
        borderLeftColor: Theme.colors.primary,
    },
    lowStockCardStat: {
        borderLeftWidth: 3,
        borderLeftColor: Theme.colors.warning,
    },
    expiringCardStat: {
        borderLeftWidth: 3,
        borderLeftColor: Theme.colors.warning,
    },
    expiredCardStat: {
        borderLeftWidth: 3,
        borderLeftColor: Theme.colors.danger,
    },
    statCardWarning: {
        backgroundColor: 'rgba(248, 150, 30, 0.1)',
    },
    statCardDanger: {
        backgroundColor: 'rgba(249, 65, 68, 0.1)',
    },
    importCard: {
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        borderLeftWidth: 3,
        borderLeftColor: Theme.colors.primary,
        paddingVertical: Theme.spacing.md,
    },
    importIcon: {
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.colors.dark,
        marginBottom: 6,
        textAlign: 'center',
    },
    statLabel: {
        fontSize: 12, // Smaller font size
        color: Theme.colors.muted,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 14, // Better line height for readability
        flexWrap: 'wrap',
    },
    importLabel: {
        color: Theme.colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        margin: Theme.spacing.lg,
        paddingHorizontal: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    searchIcon: {
        marginRight: Theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        padding: Theme.spacing.md,
        fontSize: 16,
        color: Theme.colors.dark,
    },
    filterWrapper: {
        marginBottom: Theme.spacing.sm,
    },
    filterContainer: {
        paddingHorizontal: Theme.spacing.lg,
    },
    filterContentContainer: {
        paddingRight: Theme.spacing.lg,
    },
    filterTab: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.borderRadius.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        marginRight: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        minWidth: 110, // Increased minWidth for better text display
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
        fontSize: 14,
        textAlign: 'center',
    },
    activeFilterText: {
        color: Theme.colors.white,
    },
    // Info banner about sold products
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        padding: Theme.spacing.sm,
        marginHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.sm,
        borderRadius: Theme.borderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: Theme.colors.primary,
    },
    infoText: {
        fontSize: 12,
        color: Theme.colors.primary,
        marginLeft: Theme.spacing.sm,
        flex: 1,
    },
    // Group controls
    groupControls: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.sm,
    },
    groupControlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        marginLeft: Theme.spacing.md,
    },
    groupControlText: {
        fontSize: 12,
        color: Theme.colors.muted,
        marginLeft: Theme.spacing.xs,
    },
    listContent: {
        padding: Theme.spacing.lg,
        paddingTop: 0,
        paddingBottom: Platform.OS === 'ios' ? Theme.spacing.xl : Theme.spacing.xl * 1.2,
    },
    groupContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: Theme.borderRadius.md,
        marginBottom: Theme.spacing.md,
        ...Theme.shadows.sm,
        overflow: 'hidden',
    },
    groupHeader: {
        padding: Theme.spacing.lg,
        backgroundColor: 'rgba(248, 249, 250, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    groupInfo: {
        flex: 1,
    },
    groupNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.xs,
    },
    groupName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.dark,
        flex: 1,
    },
    groupCount: {
        fontSize: 14,
        color: Theme.colors.muted,
    },
    groupStatus: {
        position: 'absolute',
        top: Theme.spacing.lg,
        right: Theme.spacing.lg,
    },
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stockBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    productItem: {
        padding: Theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    lowStockGroupCard: {
        borderLeftWidth: 4,
        borderLeftColor: Theme.colors.warning,
    },
    expiredGroupCard: {
        borderLeftWidth: 4,
        borderLeftColor: Theme.colors.danger,
    },
    expiringGroupCard: {
        borderLeftWidth: 4,
        borderLeftColor: Theme.colors.warning,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Theme.spacing.md,
    },
    productInfo: {
        flex: 1,
    },
    productCode: {
        fontSize: 14,
        color: Theme.colors.primary,
        fontWeight: '500',
        marginBottom: Theme.spacing.xs,
    },
    productCategory: {
        fontSize: 14,
        color: Theme.colors.muted,
        marginBottom: Theme.spacing.xs,
    },
    priceStockContainer: {
        alignItems: 'flex-end',
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.primary,
        marginBottom: Theme.spacing.xs,
    },
    productStockBadge: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        marginTop: Theme.spacing.xs,
    },
    productStockBadgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    },
    productDetails: {
        marginBottom: Theme.spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.spacing.xs,
    },
    detailText: {
        fontSize: 14,
        color: Theme.colors.muted,
        marginLeft: Theme.spacing.xs,
    },
    thresholdText: {
        fontSize: 14,
        color: Theme.colors.warning,
        marginLeft: Theme.spacing.xs,
    },
    expiredText: {
        color: Theme.colors.danger,
        fontWeight: 'bold',
    },
    expiringText: {
        color: Theme.colors.warning,
        fontWeight: 'bold',
    },
    productActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.sm,
        marginLeft: Theme.spacing.md,
    },
    actionButtonText: {
        marginLeft: Theme.spacing.xs,
        color: Theme.colors.primary,
        fontWeight: '500',
        fontSize: 14,
    },
    deleteButtonText: {
        color: Theme.colors.danger,
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
    emptyStateButtons: {
        flexDirection: 'row',
        marginTop: Theme.spacing.lg,
    },
    emptyStateButton: {
        backgroundColor: Theme.colors.primary,
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        marginHorizontal: Theme.spacing.sm,
        ...Theme.shadows.sm,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Theme.colors.primary,
    },
    emptyStateButtonText: {
        color: Theme.colors.white,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: Theme.colors.primary,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: width * 0.9,
        maxHeight: '80%',
    },
    modalContent: {
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.lg,
        ...Theme.shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.colors.dark,
    },
    modalDescription: {
        fontSize: 14,
        color: Theme.colors.muted,
        marginBottom: Theme.spacing.lg,
        paddingHorizontal: Theme.spacing.lg,
        textAlign: 'center',
    },
    closeButton: {
        padding: Theme.spacing.xs,
    },
    formScroll: {
        padding: Theme.spacing.lg,
    },
    inputLabel: {
        fontSize: 14,
        color: Theme.colors.dark,
        fontWeight: '600',
        marginBottom: Theme.spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: Theme.colors.border,
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.md,
        marginBottom: Theme.spacing.lg,
        fontSize: 16,
        color: Theme.colors.dark,
        backgroundColor: Theme.colors.white,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: Theme.colors.border,
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.md,
        margin: Theme.spacing.lg,
        fontSize: 16,
        color: Theme.colors.dark,
        backgroundColor: Theme.colors.white,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputGroup: {
        flex: 1,
        marginRight: Theme.spacing.md,
    },
    dateHint: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.light,
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        marginBottom: Theme.spacing.lg,
    },
    dateHintText: {
        fontSize: 12,
        color: Theme.colors.muted,
        marginLeft: Theme.spacing.sm,
        fontStyle: 'italic',
    },
    inventoryHint: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        marginBottom: Theme.spacing.lg,
    },
    inventoryHintText: {
        fontSize: 12,
        color: Theme.colors.primary,
        marginLeft: Theme.spacing.sm,
        fontStyle: 'italic',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: Theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    modalButton: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        marginLeft: Theme.spacing.md,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Theme.colors.light,
    },
    saveButton: {
        backgroundColor: Theme.colors.primary,
    },
    searchButton: {
        backgroundColor: Theme.colors.primary,
    },
    saveButtonDisabled: {
        backgroundColor: Theme.colors.muted,
    },
    cancelButtonText: {
        color: Theme.colors.muted,
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: Theme.colors.white,
        fontWeight: 'bold',
    },
    searchButtonText: {
        color: Theme.colors.white,
        fontWeight: 'bold',
    },
    fullImportButton: {
        padding: Theme.spacing.md,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    fullImportButtonText: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
});