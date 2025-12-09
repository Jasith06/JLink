import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import {
    Ionicons,
    MaterialIcons,
    FontAwesome,
    MaterialCommunityIcons
} from '@expo/vector-icons';
import { AuthContext } from '../AuthContext';

export default function SettingsScreen({ navigation }) {
    const { user, logout } = useContext(AuthContext);

    const menuItems = [
        {
            title: 'Profile Settings',
            icon: <Ionicons name="person" size={24} color="#4285F4" />,
            screen: 'ProfileSettings'
        },
        {
            title: 'Inventory',
            icon: <MaterialIcons name="inventory" size={24} color="#34A853" />,
            screen: 'Inventory'
        },
        {
            title: 'Sales',
            icon: <FontAwesome name="money" size={24} color="#FBBC05" />,
            screen: 'Sales'
        },
        {
            title: 'Reports',
            icon: <MaterialCommunityIcons name="chart-bar" size={24} color="#EA4335" />,
            screen: 'Reports'
        },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Settings</Text>

            <ScrollView style={styles.scrollContainer}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        <View style={styles.iconContainer}>
                            {item.icon}
                        </View>
                        <Text style={styles.menuText}>{item.title}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={logout}
                >
                    <Ionicons name="log-out-outline" size={24} color="#EA4335" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
        padding: 20
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333'
    },
    scrollContainer: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    iconContainer: {
        width: 30,
        alignItems: 'center',
    },
    menuText: {
        marginLeft: 15,
        fontSize: 16,
        flex: 1,
        color: '#333'
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    logoutText: {
        marginLeft: 15,
        fontSize: 16,
        color: '#EA4335',
        fontWeight: '500'
    },
});