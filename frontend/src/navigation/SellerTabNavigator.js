import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SellerProductsScreen from '../screens/SellerProductsScreen';
import SellerOrdersScreen from '../screens/SellerOrdersScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FloatingTabBar from '../components/FloatingTabBar';

const Tab = createBottomTabNavigator();

export default function SellerTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={function (props) {
        return <FloatingTabBar {...props} />;
      }}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="SellerHome" component={SellerDashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="SellerProducts" component={SellerProductsScreen} options={{ title: 'Sản phẩm' }} />
      <Tab.Screen name="SellerOrders" component={SellerOrdersScreen} options={{ title: 'Đơn hàng' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
