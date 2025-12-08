import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';

export default function ProfileSettingsScreen({ navigation }) {
    const { user, updateProfile } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        mobileNumber: user?.mobileNumber || '',
    });

    const handleUpdate = async () => {
        try {
            await updateProfile({
                fullName: formData.fullName,
                mobileNumber: formData.mobileNumber,
            });
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Profile Settings</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={formData.fullName}
                    onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                    placeholder="Enter your full name"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                    style={styles.input}
                    value={formData.mobileNumber}
                    onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
                    placeholder="Enter your mobile number"
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.readOnlyField}>{user?.email || 'Not available'}</Text>
            </View>

            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdate}
            >
                <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f7f7f7',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#333',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#555',
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    readOnlyField: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 8,
        fontSize: 16,
        color: '#666',
    },
    saveButton: {
        backgroundColor: '#4285F4',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});