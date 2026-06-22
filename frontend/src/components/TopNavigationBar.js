import React, { memo, useEffect } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AnimatedPressable from './AnimatedPressable';
import { colors, radius, shadows } from '../theme/theme';

function TopNavigationBar({
  keyword,
  onChangeKeyword,
  onSubmitSearch,
  onCartPress,
  cartCount = 0,
  scrollY,
  placeholder = 'Tìm sản phẩm yêu thích...',
}) {
  const insets = useSafeAreaInsets();
  const badgeScale = useSharedValue(1);

  useEffect(
    function () {
      if (cartCount > 0) {
        badgeScale.value = withSequence(
          withSpring(1.28, { damping: 8, stiffness: 380 }),
          withSpring(1, { damping: 10, stiffness: 280 })
        );
      }
    },
    [cartCount]
  );

  const separatorStyle = useAnimatedStyle(
    function () {
      return {
        opacity: scrollY ? interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP) : 0,
      };
    },
    [scrollY]
  );

  const badgeAnimatedStyle = useAnimatedStyle(function () {
    return {
      transform: [{ scale: badgeScale.value }],
    };
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingTop: insets.top + 8, height: insets.top + 82 },
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 72 : 55}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <Animated.View pointerEvents="none" style={[styles.separator, separatorStyle]} />

      <View style={styles.row}>
        <AnimatedPressable activeScale={0.985} style={styles.searchShell} onPress={onSubmitSearch}>
          <Ionicons name="search" size={20} color={colors.textSoft} />
          <TextInput
            value={keyword}
            onChangeText={onChangeKeyword}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </AnimatedPressable>

        <AnimatedPressable activeScale={0.92} style={styles.cartButton} onPress={onCartPress}>
          <Ionicons name="bag-handle-outline" size={25} color={colors.primaryDark} />
          {cartCount > 0 ? (
            <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
              <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </Animated.View>
          ) : null}
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
  },
  separator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchShell: {
    flex: 1,
    minHeight: 50,
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    ...shadows.soft,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  cartButton: {
    width: 50,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.96)',
    ...shadows.soft,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
});

export default memo(TopNavigationBar);
