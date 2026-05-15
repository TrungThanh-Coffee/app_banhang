import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

export default function ProductCard({ product, onPress, onAdd }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image
        source={{
          uri: product.image_url || 'https://via.placeholder.com/400x400.png?text=Product',
        }}
        style={styles.image}
      />

      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {product.product_name}
        </Text>

        <Text style={styles.price}>{formatMoney(product.price)}</Text>

        <Text numberOfLines={1} style={styles.meta}>
          Tồn kho: {product.stock}
        </Text>

        {onAdd ? (
          <Pressable style={styles.addButton} onPress={onAdd}>
            <Text style={styles.addText}>Thêm giỏ</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    margin: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  body: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    minHeight: 40,
  },
  price: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '800',
    color: '#8B5E3C',
  },
  meta: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
  },
  addButton: {
    marginTop: 10,
    backgroundColor: '#8B5E3C',
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  addText: {
    color: '#fff',
    fontWeight: '700',
  },
});