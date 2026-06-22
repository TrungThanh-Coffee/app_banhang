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
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { apiRequest } from '../api/apiClient';
import BannerCarousel from '../components/BannerCarousel';
import ProductCard from '../components/ProductCard';
import ProductCategories from '../components/ProductCategories';
import SkeletonProductGrid from '../components/SkeletonProductGrid';
import TopNavigationBar from '../components/TopNavigationBar';
import { colors } from '../theme/theme';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const TOP_SPACE = 108;

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(function () {
    return (width - 44) / 2;
  }, [width]);

  const scrollY = useSharedValue(0);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: function (event) {
      scrollY.value = event.contentOffset.y;
    },
  });

  async function loadCategories() {
    const data = await apiRequest('/categories');
    setCategories(data);
  }

  async function loadProducts(nextKeyword = keyword, nextCategoryId = categoryId) {
    const params = [];

    if (nextKeyword) params.push('q=' + encodeURIComponent(nextKeyword.trim()));
    if (nextCategoryId) params.push('category_id=' + nextCategoryId);

    const query = params.length > 0 ? '?' + params.join('&') : '';
    const data = await apiRequest('/products' + query);
    setProducts(data);
  }

  async function loadCartCount() {
    try {
      const data = await apiRequest('/cart');
      const count = (data.items || []).reduce(function (sum, item) {
        return sum + Number(item.quantity || 0);
      }, 0);
      setCartCount(count);
    } catch (error) {
      setCartCount(0);
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([loadCategories(), loadProducts('', ''), loadCartCount()]);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await Promise.all([loadProducts(), loadCartCount()]);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSearch() {
    try {
      setLoading(true);
      await loadProducts(keyword, categoryId);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectCategory(nextCategoryId) {
    try {
      setCategoryId(nextCategoryId);
      setLoading(true);
      await loadProducts(keyword, nextCategoryId);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
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

      setCartCount(function (count) {
        return count + 1;
      });
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  }

  useEffect(function () {
    loadData();
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

  const listHeader = useMemo(
    function () {
      return (
        <View>
          <View style={styles.heroTextBox}>
            <Text style={styles.greeting}>Coffee nè Store</Text>
            <Text style={styles.headline}>Tìm món hay, mua ngay trong vài chạm.</Text>
          </View>

          <BannerCarousel />

          <ProductCategories
            categories={categories}
            selectedId={categoryId}
            onSelect={handleSelectCategory}
          />

          <View style={styles.productHeader}>
            <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
            <Text style={styles.productCount}>{products.length} sản phẩm</Text>
          </View>
        </View>
      );
    },
    [categories, categoryId, products.length, keyword]
  );

  return (
    <View style={styles.page}>
      <AnimatedFlatList
        data={loading ? [] : products}
        key="product-grid-2"
        numColumns={2}
        keyExtractor={function (item) {
          return String(item.product_id);
        }}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading ? <SkeletonProductGrid /> : <Text style={styles.empty}>Không có sản phẩm phù hợp</Text>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.columnWrapper}
      />

      <TopNavigationBar
        keyword={keyword}
        onChangeKeyword={setKeyword}
        onSubmitSearch={handleSearch}
        cartCount={cartCount}
        scrollY={scrollY}
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
  productList: {
    paddingTop: TOP_SPACE,
    paddingBottom: 132,
  },
  columnWrapper: {
    paddingHorizontal: 10,
  },
  heroTextBox: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  greeting: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  headline: {
    marginTop: 5,
    maxWidth: 320,
    color: colors.text,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
  },
  productHeader: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 19,
    color: colors.text,
    fontWeight: '900',
  },
  productCount: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  empty: {
    textAlign: 'center',
    color: colors.textSoft,
    marginTop: 42,
    fontWeight: '700',
  },
});
