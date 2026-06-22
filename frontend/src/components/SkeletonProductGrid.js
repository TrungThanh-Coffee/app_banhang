import React, { memo, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius } from '../theme/theme';

function SkeletonBlock({ style }) {
  const progress = useSharedValue(0);

  useEffect(function () {
    progress.value = withRepeat(withTiming(1, { duration: 1100 }), -1, false);
  }, []);

  const shimmerStyle = useAnimatedStyle(function () {
    return {
      opacity: interpolate(progress.value, [0, 0.5, 1], [0.35, 0.75, 0.35]),
      transform: [{ translateX: interpolate(progress.value, [0, 1], [-70, 170]) }],
    };
  });

  return (
    <View style={[styles.block, style]}>
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
    </View>
  );
}

function SkeletonCard({ width }) {
  return (
    <View style={[styles.card, { width }]}> 
      <SkeletonBlock style={styles.image} />
      <View style={styles.body}>
        <SkeletonBlock style={styles.lineWide} />
        <SkeletonBlock style={styles.lineMedium} />
        <SkeletonBlock style={styles.button} />
      </View>
    </View>
  );
}

function SkeletonProductGrid({ count = 6 }) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 44) / 2;

  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map(function (_, index) {
        return <SkeletonCard key={index} width={cardWidth} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  body: {
    padding: 12,
    gap: 9,
  },
  block: {
    overflow: 'hidden',
    backgroundColor: '#E9E0D7',
  },
  shimmer: {
    width: 70,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.58)',
    transform: [{ skewX: '-12deg' }],
  },
  image: {
    height: 148,
  },
  lineWide: {
    height: 15,
    borderRadius: 8,
  },
  lineMedium: {
    width: '68%',
    height: 15,
    borderRadius: 8,
  },
  button: {
    marginTop: 4,
    height: 34,
    borderRadius: 12,
  },
});

export default memo(SkeletonProductGrid);
