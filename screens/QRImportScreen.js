import React, { useState, useContext, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    TextInput,
    SafeAreaView
} from 'react-native';
import { AuthContext } from '../AuthContext';
import { Theme } from '../theme';
import { ref, set } from 'firebase/database';
import { rtdb } from '../firebase';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function QRImportScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [importData, setImportData] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [driveLink, setDriveLink] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();

    // Use a ref to track if we've already scanned a QR code
    const hasScannedRef = useRef(false);

    // Safe navigation function - Navigate back to MainTabs and then to Inventory tab
    const goBackToInventory = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('MainTabs');
        }
    };

    // Handle QR Code Scan
    const handleQRScan = async () => {
        if (!cameraPermission?.granted) {
            const permission = await requestCameraPermission();
            if (!permission.granted) {
                Alert.alert('Camera Permission Required', 'Please allow camera access to scan QR codes');
                return;
            }
        }

        // Reset the scan flag when starting a new scan session
        hasScannedRef.current = false;
        setIsScanning(true);
    };

    // Handle QR Code Scan Result
    const handleBarCodeScanned = async ({ type, data }) => {
        // Prevent multiple scans of the same QR code
        if (hasScannedRef.current) {
            return;
        }

        hasScannedRef.current = true;

        // Pause scanning temporarily
        setIsScanning(false);

        console.log('📷 QR Code Scanned:', data);

        // Validate if it's a Google Drive link
        if (data.includes('drive.google.com')) {
            setDriveLink(data);
            Alert.alert(
                'QR Code Scanned',
                'Google Drive link detected! Do you want to import products from this link?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            // Reset scan flag and resume scanning after a delay
                            setTimeout(() => {
                                hasScannedRef.current = false;
                                setIsScanning(true);
                            }, 2000); // Wait 2 seconds before allowing another scan
                        }
                    },
                    {
                        text: 'Import',
                        onPress: async () => {
                            try {
                                await handleGoogleDriveImport(data);
                                // After import, don't resume scanning automatically
                                // User needs to manually start scanning again
                            } catch (error) {
                                // On error, allow scanning again
                                hasScannedRef.current = false;
                                setIsScanning(true);
                            }
                        }
                    }
                ]
            );
        } else {
            Alert.alert(
                'Invalid QR Code',
                'The scanned QR code does not contain a valid Google Drive link.\n\nPlease scan a QR code that contains a Google Drive link.',
                [{
                    text: 'OK',
                    onPress: () => {
                        // Allow scanning again after alert is dismissed
                        hasScannedRef.current = false;
                        setIsScanning(true);
                    }
                }]
            );
        }
    };

    // Method 1: Download from Google Drive (manual or from QR)
    const handleGoogleDriveImport = async (link = null) => {
        const targetLink = link || driveLink;

        if (!targetLink.trim()) {
            Alert.alert('Error', 'Please enter Google Drive link');
            return;
        }

        setIsDownloading(true);

        try {
            // Extract file ID from various Google Drive link formats
            let fileId = '';

            if (targetLink.includes('drive.google.com/uc?')) {
                // Direct download link format
                const match = targetLink.match(/id=([^&]+)/);
                if (match) fileId = match[1];
            } else if (targetLink.includes('drive.google.com/file/d/')) {
                // File view link format
                const match = targetLink.match(/\/d\/([^/]+)/);
                if (match) fileId = match[1];
            }

            if (!fileId) {
                throw new Error('Invalid Google Drive link format');
            }

            // Construct direct download URL
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

            console.log('📥 Downloading from:', downloadUrl);

            // Download the file
            const response = await fetch(downloadUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const jsonText = await response.text();

            // Validate JSON
            const products = JSON.parse(jsonText);

            if (!Array.isArray(products)) {
                throw new Error('Invalid format: Expected JSON array');
            }

            console.log(`✅ Downloaded ${products.length} products`);

            // Process the import
            await processImport(products);

        } catch (error) {
            console.error('Download error:', error);
            Alert.alert(
                'Download Failed',
                `Could not download from Google Drive:\n${error.message}\n\nPlease check:\n1. Link is correct\n2. File is shared publicly\n3. Internet connection is active`
            );
            throw error; // Re-throw to handle in the calling function
        } finally {
            setIsDownloading(false);
        }
    };

    // Method 2: Manual paste (existing method)
    const handleManualImport = async () => {
        if (!importData.trim()) {
            Alert.alert('Error', 'Please paste JSON data');
            return;
        }

        setIsImporting(true);

        try {
            const products = JSON.parse(importData);
            await processImport(products);
        } catch (error) {
            Alert.alert(
                'Import Error',
                error.message.includes('JSON')
                    ? 'Invalid JSON format. Please check your data.'
                    : 'Import failed. Please try again.'
            );
            console.error('Import error:', error);
        } finally {
            setIsImporting(false);
        }
    };

    // Common import processing function
    const processImport = async (products) => {
        if (!Array.isArray(products)) {
            throw new Error('Invalid format: Expected JSON array');
        }

        let successCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                // Validate required fields
                if (!product.productCode || !product.name || !product.price) {
                    console.warn('Skipping invalid product:', product);
                    errorCount++;
                    continue;
                }

                const productRef = ref(rtdb, `users/${user.userId}/products/${product.productCode}`);

                await set(productRef, {
                    productCode: product.productCode,
                    name: product.name,
                    price: parseFloat(product.price),
                    wholesalePrice: parseFloat(product.wholesalePrice) || 0,
                    quantity: parseInt(product.quantity) || 1,
                    lowStockThreshold: parseInt(product.lowStockThreshold) || 10,
                    category: product.category || 'GENERAL',
                    manufactureDate: product.manufactureDate || '',
                    expiryDate: product.expiryDate || '',
                    userId: user.userId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                successCount++;
                console.log(`✅ Imported: ${product.productCode}`);

            } catch (error) {
                console.error(`Failed to import ${product.productCode}:`, error);
                errorCount++;
            }
        }

        Alert.alert(
            'Import Complete',
            `Successfully imported ${successCount} products\nFailed: ${errorCount}`,
            [
                {
                    text: 'OK',
                    onPress: () => {
                        setImportData('');
                        setDriveLink('');
                        goBackToInventory();
                    }
                }
            ]
        );
    };

    // Render QR Scanner View
    if (isScanning) {
        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing='back'
                    onBarcodeScanned={handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                >
                    <View style={styles.cameraOverlay}>
                        <View style={styles.scanFrame}>
                            <View style={styles.scanCornerTL} />
                            <View style={styles.scanCornerTR} />
                            <View style={styles.scanCornerBL} />
                            <View style={styles.scanCornerBR} />
                        </View>
                        <Text style={styles.scanInstructions}>
                            Point camera at QR code containing Google Drive link
                        </Text>
                        <TouchableOpacity
                            style={styles.cancelScanButton}
                            onPress={() => {
                                hasScannedRef.current = false;
                                setIsScanning(false);
                            }}
                        >
                            <Text style={styles.cancelScanButtonText}>Cancel Scan</Text>
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={goBackToInventory}
                    >
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Import Products</Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                {/* METHOD 1: Google Drive Import (Manual) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Method 1: Google Drive (Manual)</Text>
                    <Text style={styles.sectionDesc}>
                        Paste the Google Drive link from your Python script output
                    </Text>

                    <TextInput
                        style={styles.linkInput}
                        value={driveLink}
                        onChangeText={setDriveLink}
                        placeholder="https://drive.google.com/uc?export=download&id=..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                    />

                    <TouchableOpacity
                        style={[styles.actionButton, styles.driveButton, isDownloading && styles.disabledButton]}
                        onPress={() => handleGoogleDriveImport()}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="white" size="small" />
                                <Text style={styles.buttonText}>Downloading...</Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>📥 Download & Import from Drive</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* METHOD 2: QR Scan */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Method 2: JSON QR Scan</Text>
                    <Text style={styles.sectionDesc}>
                        Scan QR code containing Google Drive link to import automatically
                    </Text>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.qrButton]}
                        onPress={handleQRScan}
                    >
                        <Text style={styles.buttonText}>📷 Scan QR Code</Text>
                    </TouchableOpacity>
                </View>

                {/* METHOD 3: Manual Paste */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Method 3: Manual Paste</Text>
                    <Text style={styles.sectionDesc}>
                        Copy and paste JSON content manually
                    </Text>

                    <TextInput
                        style={styles.textInput}
                        value={importData}
                        onChangeText={setImportData}
                        placeholder="Paste JSON data from inventory_import.json here..."
                        multiline
                        numberOfLines={8}
                        textAlignVertical="top"
                        placeholderTextColor="#999"
                    />

                    <TouchableOpacity
                        style={[styles.actionButton, styles.pasteButton, isImporting && styles.disabledButton]}
                        onPress={handleManualImport}
                        disabled={isImporting}
                    >
                        {isImporting ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="white" size="small" />
                                <Text style={styles.buttonText}>Importing...</Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>Import Pasted Data</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#4285f4',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        flex: 1,
    },
    headerPlaceholder: {
        width: 60,
    },
    section: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: Theme.colors.primary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.colors.primary,
        marginBottom: 8,
    },
    sectionDesc: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        lineHeight: 20,
    },
    linkInput: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        fontSize: 13,
        marginBottom: 15,
        fontFamily: 'monospace',
        minHeight: 60,
    },
    textInput: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        fontSize: 13,
        minHeight: 150,
        marginBottom: 15,
        fontFamily: 'monospace',
    },
    actionButton: {
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    driveButton: {
        backgroundColor: '#4285f4',
    },
    qrButton: {
        backgroundColor: '#9c27b0',
    },
    pasteButton: {
        backgroundColor: Theme.colors.primary,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    scanCornerTL: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#00ff00',
    },
    scanCornerTR: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#00ff00',
    },
    scanCornerBL: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#00ff00',
    },
    scanCornerBR: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#00ff00',
    },
    scanInstructions: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 30,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 8,
    },
    cancelScanButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginTop: 40,
    },
    cancelScanButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});