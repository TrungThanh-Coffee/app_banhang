import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { apiRequest } from '../api/apiClient';
import ProductCard from '../components/ProductCard';
import SkeletonProductGrid from '../components/SkeletonProductGrid';
import { colors, radius, shadows } from '../theme/theme';

function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function InfoMetric({ icon, label, value, color }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color.bg }]}>
        <Ionicons name={icon} size={18} color={color.fg} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function ShopDetailScreen({ route, navigation }) {
  const { sellerId } = route.params;
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(function () {
    return (width - 44) / 2;
  }, [width]);

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadShop() {
    const [shopData, productData] = await Promise.all([
      apiRequest('/shops/' + sellerId),
      apiRequest('/shops/' + sellerId + '/products'),
    ]);

    setShop(shopData);
    setProducts(Array.isArray(productData) ? productData : []);
  }

  async function loadData() {
    try {
      setLoading(true);
      await loadShop();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    try {
      setRefreshing(true);
      await loadShop();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(function () {
    loadData();
  }, []);

  const renderProduct = useCallback(
    function ({ item }) {
      return (
        <ProductCard
          product={item}
          cardWidth={cardWidth}
          onPress={function () {
            navigation.navigate('Detail', { productId: item.product_id });
          }}
        />
      );
    },
    [cardWidth, navigation]
  );

  const header = useMemo(
    function () {
      if (!shop) return null;

      return (
        <View>
          <View style={styles.heroCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="storefront-outline" size={34} color="#FFFFFF" />
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.kicker}>Thông tin shop</Text>
              <Text style={styles.storeName}>{shop.store_name}</Text>
              <Text style={styles.description} numberOfLines={3}>
                {shop.store_description || 'Shop chưa cập nhật mô tả gian hàng.'}
              </Text>

              <View style={styles.sellerRow}>
                <Ionicons name="person-outline" size={14} color="#FDEBD3" />
                <Text style={styles.sellerText}>{shop.seller_name || 'Người bán'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metricGrid}>
            <InfoMetric
              icon="cube-outline"
              label="Sản phẩm"
              value={formatNumber(shop.total_products)}
              color={{ bg: '#E9F7F2', fg: '#2F5D50' }}
            />
            <InfoMetric
              icon="star-outline"
              label="Đánh giá"
              value={Number(shop.avg_rating || 0) > 0 ? Number(shop.avg_rating).toFixed(1) : '0.0'}
              color={{ bg: '#FEF3C7', fg: '#D97706' }}
            />
            <InfoMetric
              icon="bag-check-outline"
              label="Đã bán"
              value={formatNumber(shop.total_sold)}
              color={{ bg: '#EEF2FF', fg: '#4F46E5' }}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sản phẩm đang bày bán</Text>
            <Text style={styles.sectionCount}>{products.length} sản phẩm</Text>
          </View>
        </View>
      );
    },
    [shop, products.length]
  );

  if (loading && !shop) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải shop...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={loading ? [] : products}
        key="shop-products-grid"
        numColumns={2}
        keyExtractor={function (item) {
          return String(item.product_id);
        }}
        renderItem={renderProduct}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? <SkeletonProductGrid /> : <Text style={styles.empty}>Shop chưa có sản phẩm đang bán</Text>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSoft,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 120,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    borderRadius: 28,
    backgroundColor: colors.primaryDark,
    marginBottom: 14,
    ...shadows.floating,
  },
  avatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroInfo: {
    flex: 1,
  },
  kicker: {
    color: '#FDEBD3',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storeName: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
  },
  description: {
    marginTop: 8,
    color: '#F8E7D6',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  sellerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerText: {
    color: '#FDEBD3',
    fontWeight: '800',
    fontSize: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    ...shadows.soft,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    marginTop: 3,
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '900',
  },
  sectionCount: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  empty: {
    marginTop: 42,
    textAlign: 'center',
    color: colors.textSoft,
    fontWeight: '700',
  },
});
