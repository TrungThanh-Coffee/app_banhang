import React, { memo, useCallback } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { colors, defaultBanners, radius, shadows } from '../theme/theme';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

function PaginationDot({ index, scrollX, pageWidth }) {
  const dotStyle = useAnimatedStyle(function () {
    const inputRange = [(index - 1) * pageWidth, index * pageWidth, (index + 1) * pageWidth];

    return {
      width: interpolate(scrollX.value, inputRange, [7, 24, 7], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

function BannerItem({ item, width }) {
  return (
    <View style={[styles.itemOuter, { width }]}>
      <View style={[styles.banner, { backgroundColor: item.bg }]}> 
        <View style={[styles.decorCircle, { backgroundColor: item.accent }]} />
        <View style={[styles.decorCircleSmall, { backgroundColor: item.accent }]} />

        <View style={styles.bannerTextBox}>
          <Text style={[styles.eyebrow, { color: item.accent }]}>{item.eyebrow}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>

        <View style={[styles.iconBubble, { backgroundColor: item.accent }]}> 
          <Ionicons name={item.icon || 'sparkles-outline'} size={42} color="#fff" />
        </View>
      </View>
    </View>
  );
}

function BannerCarousel({ data = defaultBanners }) {
  const { width } = useWindowDimensions();
  const pageWidth = width - 32;
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: function (event) {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderItem = useCallback(
    function ({ item }) {
      return <BannerItem item={item} width={pageWidth} />;
    },
    [pageWidth]
  );

  return (
    <View style={styles.wrapper}>
      <AnimatedFlatList
        data={data}
        keyExtractor={function (item) {
          return String(item.id);
        }}
        horizontal
        pagingEnabled={false}
        snapToInterval={pageWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        bounces={false}
        renderItem={renderItem}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={function (_, index) {
          return { length: pageWidth, offset: pageWidth * index, index };
        }}
      />

      <View style={styles.pagination} pointerEvents="none">
        {data.map(function (item, index) {
          return <PaginationDot key={item.id} index={index} scrollX={scrollX} pageWidth={pageWidth} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
    marginBottom: 14,
  },
  itemOuter: {
    paddingHorizontal: 16,
  },
  banner: {
    height: 158,
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.soft,
  },
  bannerTextBox: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  title: {
    marginTop: 6,
    color: colors.text,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  iconBubble: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-7deg' }],
  },
  decorCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 80,
    opacity: 0.09,
    right: -40,
    top: -44,
  },
  decorCircleSmall: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 40,
    opacity: 0.1,
    right: 82,
    bottom: -20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  dot: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});

export default memo(BannerCarousel);
