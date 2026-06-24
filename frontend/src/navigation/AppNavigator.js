import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import AuthStackNavigator from './AuthStackNavigator';
import CustomerTabNavigator from './CustomerTabNavigator';
import SellerTabNavigator from './SellerTabNavigator';

import DetailScreen from '../screens/DetailScreen';
import ShopDetailScreen from '../screens/ShopDetailScreen';
import SellerProductFormScreen from '../screens/SellerProductFormScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#8B5E3C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStackNavigator />
      ) : user.role === 'SELLER' ? (
        <Stack.Navigator>
          <Stack.Screen
            name="SellerTabs"
            component={SellerTabNavigator}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="SellerProductForm"
            component={SellerProductFormScreen}
            options={{ title: 'Thông tin sản phẩm' }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen
            name="CustomerTabs"
            component={CustomerTabNavigator}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Detail"
            component={DetailScreen}
            options={{ title: 'Chi tiết sản phẩm' }}
          />

          <Stack.Screen
            name="ShopDetail"
            component={ShopDetailScreen}
            options={{ title: 'Thông tin shop' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}