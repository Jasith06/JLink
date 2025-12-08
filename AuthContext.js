import React, { createContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { ref, set, onValue, get, update } from 'firebase/database';
import { auth, rtdb } from './firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deviceStatus, setDeviceStatus] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Optimized auth state listener
    useEffect(() => {
        let unsubscribeAuth;
        let unsubscribeDevice;

        const initializeAuth = async () => {
            try {
                unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
                    console.log("Auth state changed:", firebaseUser ? firebaseUser.uid : "No user");

                    if (firebaseUser) {
                        // Set basic user info immediately
                        const userData = {
                            email: firebaseUser.email,
                            userId: firebaseUser.uid,
                            fullName: '',
                            mobileNumber: '',
                            location: null
                        };
                        setUser(userData);

                        // Fetch additional user data from Realtime Database
                        try {
                            const userRef = ref(rtdb, `users/${firebaseUser.uid}/profile`);
                            const snapshot = await get(userRef);

                            if (snapshot.exists()) {
                                const userDataFromRTDB = snapshot.val();
                                console.log("User data found in RTDB:", userDataFromRTDB);

                                setUser(prev => ({
                                    ...prev,
                                    fullName: userDataFromRTDB.name || '',
                                    mobileNumber: userDataFromRTDB.phoneNumber || '',
                                    location: userDataFromRTDB.businessAddress || null
                                }));
                            } else {
                                console.log("User data does not exist in RTDB, creating...");
                                // Create user data in RTDB if it doesn't exist
                                await set(ref(rtdb, `users/${firebaseUser.uid}/profile`), {
                                    name: '',
                                    email: firebaseUser.email,
                                    phoneNumber: '',
                                    businessName: '',
                                    businessAddress: '',
                                    taxId: '',
                                    userId: firebaseUser.uid,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                });
                            }
                        } catch (rtdbError) {
                            console.error("RTDB user data error:", rtdbError);
                        }

                        // Set up device listener
                        if (rtdb) {
                            try {
                                unsubscribeDevice = onValue(ref(rtdb, 'switch/key1'), (snapshot) => {
                                    const value = snapshot.val();
                                    setDeviceStatus(value === 1);
                                });
                            } catch (rtdbError) {
                                console.warn("RTDB listener error:", rtdbError);
                            }
                        }
                    } else {
                        setUser(null);
                        if (unsubscribeDevice) {
                            unsubscribeDevice();
                        }
                    }

                    setIsLoading(false);
                    setAuthChecked(true);
                });
            } catch (error) {
                console.error("Auth initialization error:", error);
                setIsLoading(false);
                setAuthChecked(true);
            }
        };

        initializeAuth();

        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
            if (unsubscribeDevice) unsubscribeDevice();
        };
    }, []);

    const login = async (email, password) => {
        try {
            setIsLoading(true);
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result;
        } catch (error) {
            console.error("Login error:", error);
            setIsLoading(false);
            throw error;
        }
    };

    const signup = async (email, password, fullName) => {
        try {
            setIsLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Create user data in Realtime Database
            await set(ref(rtdb, `users/${userCredential.user.uid}/profile`), {
                name: fullName,
                email: email,
                phoneNumber: '',
                businessName: '',
                businessAddress: '',
                taxId: '',
                userId: userCredential.user.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return userCredential.user;
        } catch (error) {
            console.error("Signup error:", error);
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
            setIsLoading(false);
            throw error;
        }
    };

    // FIXED: Update Profile Function for Realtime Database
    const updateProfile = async (profileData) => {
        console.log("Starting profile update in RTDB...");
        console.log("User ID:", user?.userId);
        console.log("Profile data:", profileData);

        if (!user || !user.userId) {
            throw new Error('No user logged in');
        }

        try {
            const userProfileRef = ref(rtdb, `users/${user.userId}/profile`);

            // Prepare update data according to your RTDB structure
            const updateData = {
                updatedAt: new Date().toISOString()
            };

            // Map the fields to your RTDB structure
            if (profileData.fullName !== undefined) {
                updateData.name = profileData.fullName.trim();
            }
            if (profileData.mobileNumber !== undefined) {
                updateData.phoneNumber = profileData.mobileNumber.trim();
            }
            // Note: location field might need to be mapped to businessAddress
            if (profileData.location !== undefined) {
                updateData.businessAddress = profileData.location;
            }

            console.log("RTDB update data:", updateData);

            // Update Realtime Database using update() for partial updates
            await update(userProfileRef, updateData);

            // Update local state - map back to our app's field names
            setUser(prev => ({
                ...prev,
                fullName: updateData.name || prev.fullName,
                mobileNumber: updateData.phoneNumber || prev.mobileNumber,
                location: updateData.businessAddress || prev.location
            }));

            console.log("Profile updated successfully in RTDB");
            return true;

        } catch (error) {
            console.error("Profile update error in RTDB:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            throw error;
        }
    };

    const toggleDevice = async (status) => {
        try {
            await set(ref(rtdb, 'switch/key1'), status ? 1 : 0);
        } catch (error) {
            console.error("Error toggling device:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            authChecked,
            login,
            signup,
            logout,
            updateProfile,
            deviceStatus,
            toggleDevice
        }}>
            {children}
        </AuthContext.Provider>
    );
};