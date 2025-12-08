function RootNavigator() {
    const { user, isLoading, authChecked, firebaseError } = React.useContext(AuthContext);

    // Show loading only until auth is checked for the first time
    if (!authChecked) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={{ marginTop: 16 }}>Loading...</Text>
            </View>
        );
    }

    // Show error if Firebase failed to initialize
    if (firebaseError) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Ionicons name="alert-circle" size={64} color="#EA4335" />
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
                    Firebase Initialization Error
                </Text>
                <Text style={{ color: '#666', marginTop: 8, textAlign: 'center' }}>
                    {firebaseError}
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: '#4285F4', padding: 12, borderRadius: 8, marginTop: 20 }}
                    onPress={() => window.location.reload()}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
    );
}