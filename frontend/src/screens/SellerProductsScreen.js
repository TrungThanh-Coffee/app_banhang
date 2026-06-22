import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { apiRequest } from '../api/apiClient';
import AppButton from '../components/AppButton';

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

export default function SellerProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadProducts() {
    const data = await apiRequest('/seller/products');
    setProducts(data);
  }

  useFocusEffect(
    useCallback(function () {
      loadProducts().catch(function () {});
    }, [])
  );

  async function refreshProducts() {
    try {
      setRefreshing(true);
      await loadProducts();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function deleteProduct(product) {
    try {
      await apiRequest('/seller/products/' + product.product_id, {
        method: 'DELETE',
      });

      Alert.alert('Thành công', 'Đã ẩn sản phẩm');
      await loadProducts();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.product_name}</Text>
          <Text style={styles.category}>{item.category_name}</Text>
          <Text style={styles.price}>{formatMoney(item.price)}</Text>
          <Text style={styles.meta}>
            Tồn kho: {item.stock} | Trạng thái: {item.status}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.editButton}
            onPress={function () {
              navigation.navigate('SellerProductForm', { product: item });
            }}
          >
            <Text style={styles.actionText}>Sửa</Text>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={function () {
              deleteProduct(item);
            }}
          >
            <Text style={styles.actionText}>Ẩn</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <AppButton
          title="Thêm sản phẩm"
          onPress={function () {
            navigation.navigate('SellerProductForm');
          }}
        />
      </View>

      <FlatList
        data={products}
        contentContainerStyle={styles.listContent}
        keyExtractor={function (item) {
          return String(item.product_id);
        }}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshProducts} />}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có sản phẩm nào</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F1E7',
    paddingTop: 58,
  },
  header: {
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
  },
  name: {
    fontWeight: '900',
    fontSize: 16,
    color: '#111827',
  },
  category: {
    color: '#6B7280',
    marginTop: 4,
  },
  price: {
    color: '#8B5E3C',
    fontWeight: '900',
    marginTop: 4,
  },
  meta: {
    color: '#6B7280',
    marginTop: 4,
    fontSize: 12,
  },
  actions: {
    justifyContent: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 132,
  },
  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
  },
});