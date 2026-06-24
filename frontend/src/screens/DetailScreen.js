import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

import { apiRequest } from '../api/apiClient';
import AppButton from '../components/AppButton';
import { colors, radius, shadows } from '../theme/theme';

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function Stars({ value, onChange, size = 20, readonly = false }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(function (star) {
        const active = Number(value || 0) >= star;

        return (
          <Pressable
            key={String(star)}
            disabled={readonly}
            hitSlop={8}
            onPress={function () {
              if (onChange) onChange(star);
            }}
          >
            <Ionicons
              name={active ? 'star' : 'star-outline'}
              size={size}
              color={active ? '#F59E0B' : '#D1D5DB'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function ReviewItem({ item }) {
  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>
          {String(item.customer_name || 'U').trim().slice(0, 1).toUpperCase()}
        </Text>
      </View>

      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text numberOfLines={1} style={styles.reviewName}>{item.customer_name || 'Khách hàng'}</Text>
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
        </View>

        <Stars value={item.rating} readonly size={15} />

        <Text style={styles.reviewText}>
          {item.review_text || 'Khách hàng chỉ đánh sao cho sản phẩm.'}
        </Text>
      </View>
    </View>
  );
}

export default function DetailScreen({ route, navigation }) {
  const { productId } = route.params;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  async function loadProduct() {
    const [productData, reviewData] = await Promise.all([
      apiRequest('/products/' + productId),
      apiRequest('/products/' + productId + '/reviews'),
    ]);

    setProduct(productData);
    setReviews(Array.isArray(reviewData?.reviews) ? reviewData.reviews : []);
  }

  async function loadData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      await loadProduct();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      if (showLoading) setLoading(false);
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

  async function submitReview() {
    try {
      setSubmittingReview(true);

      const data = await apiRequest('/products/' + productId + '/reviews', {
        method: 'POST',
        body: JSON.stringify({
          rating,
          review_text: reviewText.trim(),
        }),
      });

      Alert.alert('Thành công', data.message || 'Đã gửi đánh giá');
      setReviewText('');
      await loadProduct();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  useEffect(function () {
    loadData(true);
  }, []);

  useFocusEffect(
    useCallback(function () {
      loadData(false);
    }, [productId])
  );

  const ratingLabel = useMemo(
    function () {
      const avg = Number(product?.avg_rating || 0);
      const count = Number(product?.review_count || 0);

      if (count <= 0) return 'Chưa có đánh giá';

      return avg.toFixed(1) + '/5 · ' + count + ' đánh giá';
    },
    [product]
  );

  if (loading || !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Image
        source={{
          uri: product.image_url || 'https://via.placeholder.com/600x400.png?text=Product',
        }}
        style={styles.image}
      />

      <View style={styles.card}>
        <Text style={styles.name}>{product.product_name}</Text>
        <Text style={styles.price}>{formatMoney(product.price)}</Text>

        <View style={styles.ratingSummaryRow}>
          <Stars value={Math.round(Number(product.avg_rating || 0))} readonly size={18} />
          <Text style={styles.ratingSummaryText}>{ratingLabel}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.info}>Danh mục: {product.category_name}</Text>
          <Text style={styles.info}>Tồn kho: {product.stock}</Text>
        </View>

        <Pressable
          onPress={function () {
            navigation.navigate('ShopDetail', { sellerId: product.seller_id });
          }}
          style={({ pressed }) => [styles.shopCard, pressed && styles.pressedCard]}
        >
          <View style={styles.shopIcon}>
            <Ionicons name="storefront-outline" size={22} color={colors.primaryDark} />
          </View>

          <View style={styles.shopInfo}>
            <Text style={styles.shopLabel}>Thông tin shop</Text>
            <Text numberOfLines={1} style={styles.shopName}>{product.store_name}</Text>
            <Text numberOfLines={2} style={styles.shopDescription}>
              {product.store_description || 'Nhấn để xem các sản phẩm shop đang bày bán.'}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textSoft} />
        </Pressable>

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

      <View style={styles.reviewCard}>
        <View style={styles.reviewTitleRow}>
          <View>
            <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>
            <Text style={styles.reviewSubtitle}>Chia sẻ cảm nhận để shop cải thiện sản phẩm.</Text>
          </View>
          <View style={styles.reviewCountBadge}>
            <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.primary} />
            <Text style={styles.reviewCountText}>{reviews.length}</Text>
          </View>
        </View>

        <View style={styles.reviewForm}>
          <Text style={styles.formLabel}>Bạn đánh giá sản phẩm này mấy sao?</Text>
          <Stars value={rating} onChange={setRating} size={28} />

          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Viết nhận xét của bạn..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            style={styles.reviewInput}
            textAlignVertical="top"
          />

          <AppButton
            title="Gửi đánh giá"
            loading={submittingReview}
            onPress={submitReview}
            style={styles.reviewButton}
          />
        </View>

        <View style={styles.reviewList}>
          {reviews.length === 0 ? (
            <View style={styles.emptyReviewBox}>
              <Ionicons name="star-outline" size={30} color="#D1D5DB" />
              <Text style={styles.emptyReviewText}>Chưa có đánh giá nào cho sản phẩm này.</Text>
            </View>
          ) : (
            reviews.map(function (item) {
              return <ReviewItem key={String(item.review_id)} item={item} />;
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 34,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: 320,
    backgroundColor: '#E5E7EB',
  },
  card: {
    backgroundColor: colors.surface,
    margin: 16,
    padding: 18,
    borderRadius: 24,
    ...shadows.soft,
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: colors.text,
  },
  price: {
    fontSize: 23,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 8,
  },
  ratingSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingSummaryText: {
    color: colors.textSoft,
    fontSize: 12.5,
    fontWeight: '800',
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  info: {
    color: '#374151',
    marginVertical: 3,
    fontWeight: '600',
  },
  shopCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressedCard: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  shopIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInfo: {
    flex: 1,
  },
  shopLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  shopName: {
    marginTop: 2,
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  shopDescription: {
    marginTop: 4,
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },
  description: {
    marginTop: 8,
    color: '#4B5563',
    lineHeight: 22,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 24,
    ...shadows.soft,
  },
  reviewTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  reviewSubtitle: {
    marginTop: 4,
    color: colors.textSoft,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  reviewCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  reviewCountText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  reviewForm: {
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  formLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 9,
  },
  reviewInput: {
    marginTop: 12,
    minHeight: 92,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  reviewButton: {
    marginTop: 12,
  },
  reviewList: {
    marginTop: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  reviewAvatarText: {
    color: colors.primary,
    fontWeight: '900',
  },
  reviewContent: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  reviewName: {
    flex: 1,
    color: colors.text,
    fontWeight: '900',
  },
  reviewDate: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  reviewText: {
    marginTop: 6,
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  emptyReviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyReviewText: {
    marginTop: 8,
    color: colors.textSoft,
    fontWeight: '700',
    textAlign: 'center',
  },
});
