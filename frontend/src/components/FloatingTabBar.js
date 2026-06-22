import React, { memo, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AnimatedPressable from './AnimatedPressable';
import { colors, shadows } from '../theme/theme';
import { useNotifications } from '../context/NotificationContext';

const ICONS = {
  Home: ['home-outline', 'home'],
  Shopping: ['bag-outline', 'bag'],
  Search: ['search-outline', 'search'],
  Notifications: ['notifications-outline', 'notifications'],
  Profile: ['person-outline', 'person'],
  SellerHome: ['stats-chart-outline', 'stats-chart'],
  SellerProducts: ['cube-outline', 'cube'],
  SellerOrders: ['receipt-outline', 'receipt'],
};

function TabItem({ route, descriptor, focused, onPress, badgeCount = 0 }) {
  const scale = useSharedValue(focused ? 1 : 0);
  const options = descriptor.options || {};
  const label = options.tabBarLabel || options.title || route.name;
  const names = ICONS[route.name] || ['ellipse-outline', 'ellipse'];

  useEffect(
    function () {
      scale.value = withSpring(focused ? 1 : 0, { damping: 13, stiffness: 260 });
    },
    [focused]
  );

  const iconStyle = useAnimatedStyle(function () {
    return {
      transform: [{ scale: 1 + scale.value * 0.16 }],
    };
  });

  const labelStyle = useAnimatedStyle(function () {
    return {
      opacity: 0.55 + scale.value * 0.45,
      transform: [{ translateY: (1 - scale.value) * 2 }],
    };
  });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      activeScale={0.91}
      onPress={onPress}
      style={styles.tabItem}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name={focused ? names[1] : names[0]} size={24} color={focused ? colors.primary : '#8A8178'} />
      </Animated.View>
      {badgeCount > 0 ? (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      ) : null}

      <Animated.Text numberOfLines={1} style={[styles.tabLabel, focused && styles.tabLabelActive, labelStyle]}>
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const notificationStore = useNotifications();
  const unreadCount = notificationStore?.unreadCount || 0;
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorX = useSharedValue(0);

  const tabWidth = useMemo(
    function () {
      return containerWidth > 0 ? containerWidth / state.routes.length : 0;
    },
    [containerWidth, state.routes.length]
  );

  useEffect(
    function () {
      if (tabWidth > 0) {
        indicatorX.value = withSpring(state.index * tabWidth + tabWidth / 2 - 16, {
          damping: 18,
          stiffness: 230,
          mass: 0.65,
        });
      }
    },
    [state.index, tabWidth]
  );

  const indicatorStyle = useAnimatedStyle(function () {
    return {
      transform: [{ translateX: indicatorX.value }],
    };
  });

  return (
    <View pointerEvents="box-none" style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 12) }]}> 
      <View
        style={styles.container}
        onLayout={function (event) {
          setContainerWidth(event.nativeEvent.layout.width);
        }}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 78 : 48} tint="light" style={StyleSheet.absoluteFill} />

        {tabWidth > 0 ? <Animated.View pointerEvents="none" style={[styles.activeGlow, indicatorStyle]} /> : null}

        <View style={styles.tabsRow}>
          {state.routes.map(function (route, index) {
            const descriptor = descriptors[route.key];
            const focused = state.index === index;

            function handlePress() {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }

            return (
              <TabItem
                key={route.key}
                route={route}
                descriptor={descriptor}
                focused={focused}
                onPress={handlePress}
                badgeCount={route.name === 'Notifications' ? unreadCount : 0}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  container: {
    width: '92%',
    maxWidth: 520,
    height: 72,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    ...shadows.floating,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    color: '#8A8178',
    fontWeight: '800',
  },
  tabLabelActive: {
    color: colors.primaryDark,
  },

  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 18,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  activeGlow: {
    position: 'absolute',
    bottom: 7,
    width: 32,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});

export default memo(FloatingTabBar);
