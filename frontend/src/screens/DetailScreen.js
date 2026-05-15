import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { apiRequest } from '../api/apiClient';
import AppButton from '../components/AppButton';

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

export default function DetailScreen({ route }) {
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function loadProduct() {
    try {
      setLoading(true);
      const data = await apiRequest('/products/' + productId);
      setProduct(data);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart() {
    try {
      setAdding(true);

      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.product_id,
          quantity: 1,
        }),
      });

      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng');
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setAdding(false);
    }
  }

  useEffect(function () {
    loadProduct();
  }, []);

  if (loading || !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5E3C" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page}>
      <Image
        source={{
          uri: product.image_url || 'https://via.placeholder.com/600x400.png?text=Product',
        }}
        style={styles.image}
      />

      <View style={styles.card}>
        <Text style={styles.name}>{product.product_name}</Text>
        <Text style={styles.price}>{formatMoney(product.price)}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.info}>Danh mục: {product.category_name}</Text>
          <Text style={styles.info}>Cửa hàng: {product.store_name}</Text>
          <Text style={styles.info}>Tồn kho: {product.stock}</Text>
        </View>

        <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
        <Text style={styles.description}>
          {product.description || 'Sản phẩm chưa có mô tả.'}
        </Text>

        <AppButton
          title="Thêm vào giỏ hàng"
          loading={adding}
          onPress={addToCart}
          style={{ marginTop: 18 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F1E7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 320,
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 18,
    borderRadius: 22,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: '#8B5E3C',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
  },
  info: {
    color: '#374151',
    marginVertical: 3,
  },
  sectionTitle: {
    marginTop: 18,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    marginTop: 8,
    color: '#4B5563',
    lineHeight: 22,
  },
});