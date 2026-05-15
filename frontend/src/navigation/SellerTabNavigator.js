import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SellerProductsScreen from '../screens/SellerProductsScreen';
import SellerOrdersScreen from '../screens/SellerOrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function SellerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#8B5E3C' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#8B5E3C',
      }}
    >
      
      <Tab.Screen
        name="SellerProducts"
        component={SellerProductsScreen}
        options={{ title: 'Sản phẩm' }}
      />

      <Tab.Screen
        name="SellerOrders"
        component={SellerOrdersScreen}
        options={{ title: 'Đơn hàng' }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Tài khoản' }}
      />
    </Tab.Navigator>
  );
}