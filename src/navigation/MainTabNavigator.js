import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import AboutScreen from '../screens/AboutScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#b05b3b',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#b05b3b',
        tabBarInactiveTintColor: '#8d8d8d',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Trang chủ', tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="AboutTab"
        component={AboutScreen}
        options={{ title: 'Giới thiệu', tabBarLabel: 'About' }}
      />
    </Tab.Navigator>
  );
}