import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    ImageBackground
} from 'react-native';
import { AuthContext } from '../AuthContext';
import { Theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { login, isLoading } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setIsLoggingIn(true);
        try {
            await login(email, password);
        } catch (error) {
            console.log("Login error:", error);
            let errorMessage = "Login failed";

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid login credentials';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection';
            }

            Alert.alert("Error", errorMessage);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/login-bg.jpg')}
            style={styles.background}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.overlay}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="cart" size={60} color="white" />
                            <Text style={styles.logoText}>  </Text>
                            <Text style={styles.subtitle}>Inventory Management System</Text>
                        </View>

                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.description}>Sign in to continue to your account</Text>

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#aaa" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Email Address"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#aaa"
                                editable={!isLoggingIn && !isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#aaa" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Password"
                                secureTextEntry
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholderTextColor="#aaa"
                                editable={!isLoggingIn && !isLoading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, (isLoggingIn || isLoading) && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoggingIn || isLoading}
                        >
                            {isLoggingIn ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('CreateAccount')}
                            disabled={isLoggingIn || isLoading}
                            style={styles.signupLink}
                        >
                            <Text style={styles.linkText}>
                                Don't have an account? <Text style={styles.link}>Create One</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    overlay: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 30,
        borderRadius: 15,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'white',
        opacity: 0.8,
        marginTop: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'white',
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        width: '100%',
    },
    inputIcon: {
        marginLeft: 15,
    },
    input: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: '#333',
    },
    button: {
        width: '100%',
        backgroundColor: '#4285F4',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#888',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    signupLink: {
        marginTop: 15,
    },
    linkText: {
        color: 'white',
        textAlign: 'center',
    },
    link: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
});