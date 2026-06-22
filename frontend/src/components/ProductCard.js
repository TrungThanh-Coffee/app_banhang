import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import AnimatedPressable from './AnimatedPressable';
import { colors, radius, shadows } from '../theme/theme';
import { formatMoney } from '../utils/format';

function ProductCard({ product, onPress, onAdd, cardWidth }) {
  return (
    <AnimatedPressable activeScale={0.975} style={[styles.card, cardWidth ? { width: cardWidth } : null]} onPress={onPress}>
      <View style={styles.imageWrap}>
        <Image
          source={{
            uri: product.image_url || 'https://via.placeholder.com/500x500.png?text=Product',
          }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.stockPill}>
          <Ionicons name="cube-outline" size={12} color={colors.secondary} />
          <Text style={styles.stockText}>{Number(product.stock || 0)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {product.product_name}
        </Text>

        <Text numberOfLines={1} style={styles.store}>
          {product.store_name || product.category_name || 'Shop'}
        </Text>

        <View style={styles.bottomRow}>
          <Text numberOfLines={1} style={styles.price}>{formatMoney(product.price)}</Text>

          {onAdd ? (
            <AnimatedPressable
              activeScale={0.86}
              style={styles.addButton}
              onPress={function (event) {
                if (event && event.stopPropagation) event.stopPropagation();
                onAdd(product);
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </AnimatedPressable>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    margin: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...shadows.soft,
  },
  imageWrap: {
    height: 150,
    backgroundColor: colors.muted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  stockPill: {
    position: 'absolute',
    left: 9,
    bottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stockText: {
    color: colors.secondary,
    fontWeight: '900',
    fontSize: 11,
  },
  body: {
    padding: 12,
  },
  name: {
    minHeight: 39,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '900',
    color: colors.text,
  },
  store: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSoft,
    fontWeight: '700',
  },
  bottomRow: {
    marginTop: 10,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  price: {
    flex: 1,
    color: colors.primary,
    fontSize: 15.5,
    fontWeight: '900',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(ProductCard);
