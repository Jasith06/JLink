import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { AuthContext } from '../AuthContext';

export default function CreateAccountScreen({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useContext(AuthContext);

    const handleSignUp = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords don't match");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            await signup(email, password, fullName);
            // Navigation will be handled by AuthContext state change
        } catch (error) {
            console.log("Signup error:", error);
            let errorMessage = "Signup failed";

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            }

            Alert.alert("Error", errorMessage);
        } finally {
            setIsLoading(false);
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
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.overlay}>
                        <Text style={styles.title}>Create Account</Text>

                        <TextInput
                            placeholder="Full Name"
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            placeholderTextColor="#aaa"
                            editable={!isLoading}
                        />

                        <TextInput
                            placeholder="Email"
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#aaa"
                            editable={!isLoading}
                        />

                        <TextInput
                            placeholder="Password (min. 6 characters)"
                            secureTextEntry
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor="#aaa"
                            editable={!isLoading}
                        />

                        <TextInput
                            placeholder="Confirm Password"
                            secureTextEntry
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholderTextColor="#aaa"
                            editable={!isLoading}
                        />

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            disabled={isLoading}
                        >
                            <Text style={styles.linkText}>
                                Already have an account? <Text style={styles.link}>Log In</Text>
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        color: 'white',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
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
    linkText: {
        marginTop: 15,
        color: 'white',
        textAlign: 'center',
    },
    link: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
});