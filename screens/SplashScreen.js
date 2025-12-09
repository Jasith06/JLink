import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
            />
            <View style={styles.titleWrapper}>
                <View style={styles.topAccent} />
                <View style={styles.titleBox}>
                    <Text style={styles.titleMain}>LINK</Text>
                    <Text style={styles.titleAccent}>YOU</Text>
                    <Text style={styles.titleMain}>AGAIN</Text>
                </View>
                <View style={styles.bottomDesign}>
                    <View style={styles.diamondLeft} />
                    <View style={styles.centerBar} />
                    <View style={styles.diamondRight} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 143, 114, 0.39)',
    },
    logo: {
        width: 350,
        height: 350,
        marginBottom: 20,
    },
    titleWrapper: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 25,
        paddingHorizontal: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 12,
    },
    topAccent: {
        width: 60,
        height: 4,
        backgroundColor: '#FFD700',
        borderRadius: 2,
        marginBottom: 15,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    titleBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    titleMain: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 3,
        textShadowColor: 'rgba(139, 66, 40, 0.8)',
        textShadowOffset: { width: 2, height: 3 },
        textShadowRadius: 6,
    },
    titleAccent: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FF6B6B',
        letterSpacing: 3,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 2, height: 3 },
        textShadowRadius: 6,
    },
    bottomDesign: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        gap: 8,
    },
    diamondLeft: {
        width: 10,
        height: 10,
        backgroundColor: '#FF6B6B',
        transform: [{ rotate: '45deg' }],
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
    },
    centerBar: {
        width: 100,
        height: 3,
        backgroundColor: '#FFA500',
        borderRadius: 2,
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    diamondRight: {
        width: 10,
        height: 10,
        backgroundColor: '#FFD700',
        transform: [{ rotate: '45deg' }],
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
    },
});