import React from 'react';
import { View, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, AuthContext } from './AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Screens (keep all imports as before)
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import CreateAccountScreen from './screens/CreateAccountScreen';
import FeedScreen from './screens/FeedScreen';
import SettingsScreen from './screens/SettingsScreen';
import InventoryScreen from './screens/InventoryScreen';
import SalesScreen from './screens/SalesScreen';
import ReportsScreen from './screens/ReportsScreen';
import ProfileSettingsScreen from './screens/ProfileSettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import QRImportScreen from './screens/QRImportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4285F4',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 85 : 65, // Adjusted heights
          paddingBottom: Platform.OS === 'ios' ? 25 : 8, // Adjusted padding
          paddingTop: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          // Android specific shadow
          ...(Platform.OS === 'android' && {
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 6,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sales"
        component={SalesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen name="QRImport" component={QRImportScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, isLoading, authChecked } = React.useContext(AuthContext);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
