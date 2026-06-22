import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { apiRequest } from '../api/apiClient';
import ProductCard from '../components/ProductCard';
import SkeletonProductGrid from '../components/SkeletonProductGrid';
import TopNavigationBar from '../components/TopNavigationBar';
import { colors } from '../theme/theme';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function SearchScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(function () {
    return (width - 44) / 2;
  }, [width]);

  const scrollY = useSharedValue(0);
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: function (event) {
      scrollY.value = event.contentOffset.y;
    },
  });

  async function loadCartCount() {
    try {
      const data = await apiRequest('/cart');
      setCartCount((data.items || []).reduce(function (sum, item) {
        return sum + Number(item.quantity || 0);
      }, 0));
    } catch (error) {
      setCartCount(0);
    }
  }

  async function searchProducts() {
    try {
      setLoading(true);
      const query = keyword.trim() ? '?q=' + encodeURIComponent(keyword.trim()) : '';
      const data = await apiRequest('/products' + query);
      setProducts(data);
      await loadCartCount();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProducts() {
    try {
      setRefreshing(true);
      await searchProducts();
    } finally {
      setRefreshing(false);
    }
  }

  async function addToCart(product) {
    try {
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.product_id, quantity: 1 }),
      });
      setCartCount(function (count) {
        return count + 1;
      });
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  }

  useEffect(function () {
    loadCartCount();
  }, []);

  const renderItem = useCallback(
    function ({ item }) {
      return (
        <ProductCard
          product={item}
          cardWidth={cardWidth}
          onPress={function () {
            navigation.navigate('Detail', { productId: item.product_id });
          }}
          onAdd={addToCart}
        />
      );
    },
    [cardWidth, navigation]
  );

  return (
    <View style={styles.page}>
      <AnimatedFlatList
        data={loading ? [] : products}
        key="search-grid-2"
        numColumns={2}
        keyExtractor={function (item) {
          return String(item.product_id);
        }}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.headerTextBox}>
            <Text style={styles.title}>Tìm kiếm</Text>
            <Text style={styles.subtitle}>Nhập tên sản phẩm rồi nhấn Search trên bàn phím.</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? <SkeletonProductGrid /> : <Text style={styles.empty}>Nhập từ khóa để tìm sản phẩm</Text>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshProducts} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
      />

      <TopNavigationBar
        keyword={keyword}
        onChangeKeyword={setKeyword}
        onSubmitSearch={searchProducts}
        cartCount={cartCount}
        scrollY={scrollY}
        placeholder="Bạn muốn mua gì?"
        onCartPress={function () {
          navigation.navigate('Shopping');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingTop: 108,
    paddingBottom: 132,
  },
  columnWrapper: {
    paddingHorizontal: 10,
  },
  headerTextBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: colors.textSoft,
    lineHeight: 21,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    marginTop: 60,
    color: colors.textSoft,
    fontWeight: '700',
  },
});
