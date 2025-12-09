import React, { useContext, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';
import { Theme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomTabBarSpacer from '../components/BottomTabBarSpacer';

export default function ProfileScreen({ navigation }) {
    const {
        user,
        logout,
        updateProfile,
    } = useContext(AuthContext);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form data when user data changes
    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setMobileNumber(user.mobileNumber || '');
            setBusinessAddress(user.location || '');
        }
    }, [user]);

    const handleLogout = async () => {
        Alert.alert(
            "Confirm Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            Alert.alert("Error", "Logout failed. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const handleSaveProfile = async () => {
        // Validate input
        if (!fullName || !fullName.trim()) {
            Alert.alert("Error", "Please enter your full name");
            return;
        }

        if (fullName.trim().length < 2) {
            Alert.alert("Error", "Full name must be at least 2 characters long");
            return;
        }

        setIsSaving(true);

        try {
            const profileData = {
                fullName: fullName.trim(),
                mobileNumber: mobileNumber.trim(),
                location: businessAddress.trim()
            };

            console.log("Saving profile data to RTDB:", profileData);

            // Call updateProfile
            await updateProfile(profileData);

            // If we reach here, update was successful
            setEditModalVisible(false);
            Alert.alert("Success", "Profile updated successfully");

        } catch (error) {
            console.error("Profile update error:", error);
            Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        // Reset form to original user data
        setFullName(user?.fullName || '');
        setMobileNumber(user?.mobileNumber || '');
        setBusinessAddress(user?.location || '');
        setEditModalVisible(false);
    };

    return (
        <ImageBackground
            source={require('../assets/app_bg.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.header}>Profile</Text>

                    <View style={styles.card}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{user?.email || 'No email'}</Text>

                        <Text style={styles.label}>Full Name:</Text>
                        <Text style={styles.value}>{user?.fullName || 'Not set'}</Text>

                        <Text style={styles.label}>Mobile Number:</Text>
                        <Text style={styles.value}>{user?.mobileNumber || 'Not set'}</Text>

                        <Text style={styles.label}>Business Address:</Text>
                        <Text style={styles.value}>{user?.location || 'Not set'}</Text>
                    </View>

                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.settingsButton]}
                            onPress={() => setEditModalVisible(true)}
                        >
                            <Ionicons name="settings-outline" size={20} color="white" />
                            <Text style={styles.buttonText}>Edit Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.logoutButton]}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={20} color="white" />
                            <Text style={styles.buttonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Add spacer at the bottom for Android */}
                    <BottomTabBarSpacer />

                    {/* Edit Profile Modal */}
                    <Modal
                        animationType="slide"
                        transparent={false}
                        visible={editModalVisible}
                        onRequestClose={handleCancelEdit}
                    >
                        <SafeAreaView style={styles.modalSafeArea}>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                style={styles.modalContainer}
                                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
                            >
                                <ScrollView
                                    contentContainerStyle={styles.modalScrollView}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {/* Modal Header */}
                                    <View style={styles.modalHeader}>
                                        <TouchableOpacity
                                            style={styles.backButton}
                                            onPress={handleCancelEdit}
                                            disabled={isSaving}
                                        >
                                            <Ionicons name="arrow-back" size={24} color={Theme.colors.dark} />
                                        </TouchableOpacity>
                                        <Text style={styles.modalTitle}>Edit Profile</Text>
                                        <View style={styles.placeholder} />
                                    </View>

                                    {/* Form Fields */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Full Name *</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={fullName}
                                            onChangeText={setFullName}
                                            placeholder="Enter your full name"
                                            placeholderTextColor={Theme.colors.muted}
                                            editable={!isSaving}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Mobile Number</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={mobileNumber}
                                            onChangeText={setMobileNumber}
                                            placeholder="Enter your mobile number"
                                            keyboardType="phone-pad"
                                            placeholderTextColor={Theme.colors.muted}
                                            editable={!isSaving}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Business Address</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            value={businessAddress}
                                            onChangeText={setBusinessAddress}
                                            placeholder="Enter your business address"
                                            placeholderTextColor={Theme.colors.muted}
                                            editable={!isSaving}
                                            multiline={true}
                                            numberOfLines={3}
                                        />
                                    </View>

                                    {/* Save Button or Loading Indicator */}
                                    {isSaving ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="large" color={Theme.colors.primary} />
                                            <Text style={styles.loadingText}>Saving changes...</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={handleSaveProfile}
                                        >
                                            <Text style={styles.saveButtonText}>Save Changes</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            </KeyboardAvoidingView>
                        </SafeAreaView>
                    </Modal>
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
    container: {
        flex: 1,
        padding: 20,
    },
    modalSafeArea: {
        flex: 1,
        backgroundColor: Theme.colors.light,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: Theme.colors.white,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        ...Theme.shadows.md,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Theme.colors.muted,
        marginTop: 12,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: Theme.colors.dark,
        marginBottom: 8,
    },
    buttonsContainer: {
        marginTop: 20
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        ...Theme.shadows.sm,
    },
    settingsButton: {
        backgroundColor: Theme.colors.primary,
    },
    logoutButton: {
        backgroundColor: Theme.colors.danger,
    },
    buttonText: {
        color: Theme.colors.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Theme.colors.light,
    },
    modalScrollView: {
        flexGrow: 1,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: Platform.OS === 'ios' ? 10 : 20,
    },
    backButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Theme.colors.dark,
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    placeholder: {
        width: 40,
    },
    inputGroup: {
        marginBottom: 24
    },
    inputLabel: {
        fontSize: 16,
        marginBottom: 8,
        color: Theme.colors.dark,
        fontWeight: '600',
    },
    input: {
        backgroundColor: Theme.colors.white,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        fontSize: 16,
        color: Theme.colors.dark,
        ...Theme.shadows.sm,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: Theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        ...Theme.shadows.md,
    },
    saveButtonText: {
        color: Theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 20,
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: Theme.colors.muted,
        fontSize: 14,
    },
});