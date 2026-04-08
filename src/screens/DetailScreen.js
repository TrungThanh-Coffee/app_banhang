import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';

export default function DetailScreen({ route }) {
  const { product } = route.params;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: product.image_url }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.name}>{product.product_name}</Text>
        <Text style={styles.price}>
          {product.price.toLocaleString('vi-VN')} đ
        </Text>

        <Text style={styles.label}>Mô tả sản phẩm</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Mã sản phẩm: SP{product.product_id}</Text>
          <Text style={styles.infoText}>Mã danh mục: {product.category_id}</Text>
          <Text style={styles.infoText}>Số lượng tồn: {product.stock}</Text>
          <Text style={styles.infoText}>
            Trạng thái: {product.status === 'active' ? 'Còn bán' : 'Ngừng bán'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf8f5',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 18,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2b2b2b',
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    color: '#b05b3b',
    fontWeight: '700',
    marginBottom: 18,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2b2b2b',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#5d4a3f',
    lineHeight: 24,
    marginBottom: 18,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    elevation: 2,
  },
  infoText: {
    fontSize: 15,
    color: '#4a3b33',
    marginBottom: 8,
  },
});