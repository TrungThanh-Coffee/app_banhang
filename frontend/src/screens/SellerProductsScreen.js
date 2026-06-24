import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

import { apiRequest } from '../api/apiClient';
import AppButton from '../components/AppButton';
import { colors, radius, shadows } from '../theme/theme';
import { formatMoney } from '../utils/format';

function ProductThumb({ imageUrl }) {
  if (!imageUrl) {
    return (
      <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
        <Ionicons name="image-outline" size={26} color={colors.textSoft} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.thumbnail}
      resizeMode="cover"
    />
  );
}

function StatusBadge({ status }) {
  const isActive = status === 'active';

  return (
    <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
      <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotInactive]} />
      <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
        {isActive ? 'Đang bán' : 'Đã ẩn'}
      </Text>
    </View>
  );
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
        <ProductThumb imageUrl={item.image_url} />

        <View style={styles.infoCol}>
          <View style={styles.cardTopRow}>
            <Text numberOfLines={2} style={styles.name}>{item.product_name}</Text>
            <StatusBadge status={item.status} />
          </View>

          <Text numberOfLines={1} style={styles.category}>{item.category_name}</Text>

          <View style={styles.metaRow}>
            <Text numberOfLines={1} style={styles.price}>{formatMoney(item.price)}</Text>
            <View style={styles.stockPill}>
              <Ionicons name="cube-outline" size={12} color={colors.secondary} />
              <Text style={styles.stockText}>Kho: {item.stock}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.editButton}
              onPress={function () {
                navigation.navigate('SellerProductForm', { product: item });
              }}
            >
              <Ionicons name="create-outline" size={15} color="#fff" />
              <Text style={styles.actionText}>Sửa</Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={function () {
                deleteProduct(item);
              }}
            >
              <Ionicons name="eye-off-outline" size={15} color="#fff" />
              <Text style={styles.actionText}>Ẩn</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sản phẩm của shop</Text>
          <Text style={styles.headerSub}>Quản lý nhanh hình ảnh, giá bán và tồn kho</Text>
        </View>

        <AppButton
          title="Thêm"
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
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="cube-outline" size={30} color={colors.textSoft} />
            <Text style={styles.empty}>Chưa có sản phẩm nào</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 58,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  headerSub: {
    marginTop: 4,
    color: colors.textSoft,
    fontSize: 12.5,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 22,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,222,210,0.78)',
    ...shadows.soft,
  },
  thumbnail: {
    width: 86,
    height: 86,
    borderRadius: 18,
    backgroundColor: colors.muted,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCol: {
    flex: 1,
    minHeight: 86,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontWeight: '900',
    fontSize: 15.5,
    lineHeight: 20,
    color: colors.text,
  },
  category: {
    color: colors.textSoft,
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: '700',
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  price: {
    flex: 1,
    color: colors.primary,
    fontWeight: '900',
    fontSize: 15.5,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E9F7F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  stockText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '900',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  statusDotActive: {
    backgroundColor: '#16A34A',
  },
  statusDotInactive: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#4B5563',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 132,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 52,
    gap: 8,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSoft,
    fontWeight: '800',
  },
});
