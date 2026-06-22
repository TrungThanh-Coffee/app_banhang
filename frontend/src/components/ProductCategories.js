import React, { memo, useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import AnimatedPressable from './AnimatedPressable';
import { categoryPalettes, colors } from '../theme/theme';

function normalizeCategory(item) {
  const name = String(item.category_name || '').toLowerCase();

  if (!item.category_id) return { icon: 'grid-outline', bg: '#F1E2D2', fg: colors.primary };
  if (name.includes('điện') || name.includes('phone') || name.includes('công nghệ')) {
    return { icon: 'phone-portrait-outline', bg: '#E0F2FE', fg: '#0369A1' };
  }
  if (name.includes('áo') || name.includes('thời') || name.includes('quần')) {
    return { icon: 'shirt-outline', bg: '#FDEBD3', fg: '#B45309' };
  }
  if (name.includes('ăn') || name.includes('food') || name.includes('bánh')) {
    return { icon: 'fast-food-outline', bg: '#FFE4E6', fg: '#BE123C' };
  }
  if (name.includes('sách') || name.includes('book')) {
    return { icon: 'book-outline', bg: '#EDE9FE', fg: '#6D28D9' };
  }

  const numericId = Number(item.category_id);
  const paletteIndex = Number.isFinite(numericId)
    ? Math.abs(numericId) % categoryPalettes.length
    : name.length % categoryPalettes.length;

  return categoryPalettes[paletteIndex];
}

function CategoryItem({ item, active, onPress }) {
  const palette = normalizeCategory(item);

  return (
    <AnimatedPressable activeScale={0.88} onPress={onPress} style={styles.item}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: active ? colors.primary : palette.bg, borderColor: active ? colors.primary : 'transparent' },
        ]}
      >
        <Ionicons name={palette.icon} size={24} color={active ? '#fff' : palette.fg} />
      </View>
      <Text numberOfLines={2} style={[styles.label, active && styles.labelActive]}>
        {item.category_name}
      </Text>
    </AnimatedPressable>
  );
}

function ProductCategories({ categories = [], selectedId = '', onSelect }) {
  const data = [{ category_id: '', category_name: 'Tất cả' }].concat(categories);

  const renderItem = useCallback(
    function ({ item }) {
      const active = String(selectedId) === String(item.category_id);

      return (
        <CategoryItem
          item={item}
          active={active}
          onPress={function () {
            onSelect(item.category_id);
          }}
        />
      );
    },
    [selectedId, onSelect]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Danh mục</Text>
        <Text style={styles.sectionHint}>Vuốt để xem thêm</Text>
      </View>

      <FlatList
        horizontal
        data={data}
        keyExtractor={function (item) {
          return String(item.category_id);
        }}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.text,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textSoft,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  item: {
    width: 74,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 8,
    minHeight: 34,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSoft,
    fontWeight: '800',
  },
  labelActive: {
    color: colors.primaryDark,
  },
});

export default memo(ProductCategories);
