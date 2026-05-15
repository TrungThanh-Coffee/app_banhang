import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { apiRequest } from '../api/apiClient';
import ProductCard from '../components/ProductCard';

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 760 ? 3 : 2;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadCategories() {
    const data = await apiRequest('/categories');
    setCategories(data);
  }

  async function loadProducts() {
    const params = [];

    if (keyword) {
      params.push('q=' + encodeURIComponent(keyword));
    }

    if (categoryId) {
      params.push('category_id=' + categoryId);
    }

    const query = params.length > 0 ? '?' + params.join('&') : '';
    const data = await apiRequest('/products' + query);
    setProducts(data);
  }

  async function loadData() {
    try {
      setLoading(true);
      await loadCategories();
      await loadProducts();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadProducts();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function addToCart(product) {
    try {
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.product_id,
          quantity: 1,
        }),
      });

      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng');
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  }

  useEffect(function () {
    loadData();
  }, []);

  useEffect(function () {
    loadProducts().catch(function () {});
  }, [categoryId]);

  const renderItem = useCallback(function ({ item }) {
    return (
      <ProductCard
        product={item}
        onPress={function () {
          navigation.navigate('Detail', { productId: item.product_id });
        }}
        onAdd={function () {
          addToCart(item);
        }}
      />
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5E3C" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.searchBox}>
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm sản phẩm..."
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={loadProducts}
        />

        <Pressable onPress={loadProducts} style={styles.searchButton}>
          <Text style={styles.searchText}>Tìm</Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={[{ category_id: '', category_name: 'Tất cả' }].concat(categories)}
        keyExtractor={function (item) {
          return String(item.category_id);
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={function ({ item }) {
          const active = String(categoryId) === String(item.category_id);

          return (
            <Pressable
              onPress={function () {
                setCategoryId(item.category_id);
              }}
              style={[styles.categoryChip, active && styles.categoryActive]}
            >
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                {item.category_name}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        key={numColumns}
        data={products}
        numColumns={numColumns}
        keyExtractor={function (item) {
          return String(item.product_id);
        }}
        renderItem={renderItem}
        contentContainerStyle={styles.productList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Không có sản phẩm phù hợp</Text>}
      />
    </View>
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
  searchBox: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchButton: {
    backgroundColor: '#8B5E3C',
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchText: {
    color: '#fff',
    fontWeight: '800',
  },
  categoryList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryActive: {
    backgroundColor: '#8B5E3C',
    borderColor: '#8B5E3C',
  },
  categoryText: {
    color: '#374151',
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#fff',
  },
  productList: {
    padding: 6,
    paddingBottom: 30,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6B7280',
  },
});