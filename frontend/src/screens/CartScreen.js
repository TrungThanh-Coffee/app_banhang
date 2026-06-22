import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { apiRequest } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import AppButton from '../components/AppButton';
import { colors, radius, shadows } from '../theme/theme';
import { formatMoney } from '../utils/format';

export default function CartScreen() {
  const { height } = useWindowDimensions();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [receiverName, setReceiverName] = useState(user?.full_name || '');
  const [receiverPhone, setReceiverPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const sheetProgress = useSharedValue(0);

  const sheetHeight = Math.min(height * 0.78, 560);

  useEffect(function () {
    setReceiverName(user?.full_name || '');
    setReceiverPhone(user?.phone || '');
    setShippingAddress(user?.address || '');
  }, [user]);

  async function loadCart() {
    const data = await apiRequest('/cart');
    setCart(data);
  }

  useFocusEffect(
    useCallback(function () {
      loadCart().catch(function () {});
    }, [])
  );

  function openCheckout() {
    if (cart.items.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng đang trống');
      return;
    }

    setCheckoutVisible(true);
    sheetProgress.value = withSpring(1, { damping: 18, stiffness: 220 });
  }

  function closeCheckout() {
    sheetProgress.value = withTiming(0, { duration: 180 }, function (finished) {
      if (finished) {
        runOnJS(setCheckoutVisible)(false);
      }
    });
  }

  async function refreshCart() {
    try {
      setRefreshing(true);
      await loadCart();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function updateQuantity(item, quantity) {
    try {
      if (quantity <= 0) {
        await removeItem(item);
        return;
      }

      await apiRequest('/cart/items/' + item.product_id, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });

      await loadCart();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  }

  async function removeItem(item) {
    try {
      await apiRequest('/cart/items/' + item.product_id, {
        method: 'DELETE',
      });

      await loadCart();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  }

  async function createOrder() {
    try {
      if (cart.items.length === 0) {
        Alert.alert('Thông báo', 'Giỏ hàng đang trống');
        return;
      }

      if (!receiverName.trim() || !receiverPhone.trim() || !shippingAddress.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập đủ thông tin nhận hàng');
        return;
      }

      setLoadingOrder(true);

      const data = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          receiver_name: receiverName.trim(),
          receiver_phone: receiverPhone.trim(),
          shipping_address: shippingAddress.trim(),
          payment_method: 'COD',
        }),
      });

      Alert.alert('Đặt hàng thành công', 'Đơn hàng #' + data.order_id + ' đã được tạo. Bạn có thể theo dõi ở mục Thông báo.');
      closeCheckout();
      await Promise.all([loadCart(), refreshNotifications()]);
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoadingOrder(false);
    }
  }

  const overlayStyle = useAnimatedStyle(function () {
    return {
      opacity: interpolate(sheetProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

  const sheetStyle = useAnimatedStyle(function () {
    return {
      transform: [
        {
          translateY: interpolate(sheetProgress.value, [0, 1], [sheetHeight + 40, 0], Extrapolation.CLAMP),
        },
      ],
    };
  });

  function renderItem({ item }) {
    return (
      <View style={styles.item}>
        <View style={styles.productIcon}>
          <Ionicons name="cube-outline" size={22} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.product_name}</Text>
          <Text style={styles.price}>{formatMoney(item.price)}</Text>
          <Text style={styles.subtotal}>Tạm tính: {formatMoney(item.subtotal)}</Text>
        </View>

        <View style={styles.quantityBox}>
          <Pressable
            style={styles.qtyButton}
            onPress={function () {
              updateQuantity(item, item.quantity - 1);
            }}
          >
            <Text style={styles.qtyText}>-</Text>
          </Pressable>

          <Text style={styles.qtyNumber}>{item.quantity}</Text>

          <Pressable
            style={styles.qtyButton}
            onPress={function () {
              updateQuantity(item, item.quantity + 1);
            }}
          >
            <Text style={styles.qtyText}>+</Text>
          </Pressable>
        </View>

        <Pressable
          hitSlop={8}
          onPress={function () {
            removeItem(item);
          }}
        >
          <Ionicons name="trash-outline" size={21} color={colors.danger} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Giỏ hàng</Text>
        <Text style={styles.subtitle}>Chỉ hiển thị sản phẩm. Tổng tiền và thông tin nhận hàng nằm ở bước đặt hàng.</Text>
      </View>

      <FlatList
        data={cart.items}
        contentContainerStyle={styles.listContent}
        keyExtractor={function (item) {
          return String(item.cart_item_id);
        }}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshCart} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="bag-handle-outline" size={42} color={colors.textSoft} />
            <Text style={styles.empty}>Giỏ hàng đang trống</Text>
          </View>
        }
      />

      {cart.items.length > 0 ? (
        <View style={styles.floatingOrderBar}>
          <View>
            <Text style={styles.orderBarLabel}>{cart.items.length} sản phẩm trong giỏ</Text>
            <Text style={styles.orderBarHint}>Bấm Đặt ngay để xem tổng tiền</Text>
          </View>

          <Pressable style={styles.orderNowButton} onPress={openCheckout}>
            <Text style={styles.orderNowText}>Đặt ngay</Text>
            <Ionicons name="arrow-up-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      {checkoutVisible ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[styles.overlay, overlayStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeCheckout} />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetKeyboardView}
            pointerEvents="box-none"
          >
            <Animated.View style={[styles.checkoutSheet, { height: sheetHeight }, sheetStyle]}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Xác nhận đặt hàng</Text>
                  <Text style={styles.sheetSubtitle}>Kiểm tra thông tin trước khi gửi đơn.</Text>
                </View>

                <Pressable style={styles.closeButton} onPress={closeCheckout}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Tổng tiền cần thanh toán</Text>
                <Text style={styles.total}>{formatMoney(cart.total)}</Text>
                <Text style={styles.paymentHint}>Thanh toán khi nhận hàng · COD</Text>
              </View>

              <Text style={styles.formTitle}>Thông tin nhận hàng</Text>

              <CheckoutInput
                icon="person-outline"
                value={receiverName}
                onChangeText={setReceiverName}
                placeholder="Tên người nhận"
              />

              <CheckoutInput
                icon="call-outline"
                value={receiverPhone}
                onChangeText={setReceiverPhone}
                placeholder="Số điện thoại"
                keyboardType="phone-pad"
              />

              <CheckoutInput
                icon="location-outline"
                value={shippingAddress}
                onChangeText={setShippingAddress}
                placeholder="Địa chỉ giao hàng"
                multiline
              />

              <AppButton title="Xác nhận đặt hàng" loading={loadingOrder} onPress={createOrder} />
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </View>
  );
}

function CheckoutInput({ icon, multiline, ...props }) {
  return (
    <View style={[styles.inputShell, multiline && styles.inputShellMultiline]}>
      <Ionicons name={icon} size={19} color={colors.primary} />
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="#9CA3AF"
        style={[styles.input, multiline && styles.inputMultiline]}
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
    paddingBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSoft,
    fontWeight: '700',
    lineHeight: 20,
  },
  item: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadows.soft,
  },
  productIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  name: {
    fontWeight: '900',
    color: colors.text,
  },
  price: {
    marginTop: 4,
    color: colors.primary,
    fontWeight: '900',
  },
  subtotal: {
    color: colors.textSoft,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    padding: 4,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: '#fff',
    fontWeight: '900',
  },
  qtyNumber: {
    paddingHorizontal: 10,
    fontWeight: '900',
    color: colors.text,
  },
  listContent: {
    paddingBottom: 210,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
    gap: 10,
  },
  empty: {
    color: colors.textSoft,
    fontWeight: '800',
  },
  floatingOrderBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 102,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...shadows.floating,
  },
  orderBarLabel: {
    color: colors.text,
    fontWeight: '900',
  },
  orderBarHint: {
    marginTop: 3,
    color: colors.textSoft,
    fontWeight: '700',
    fontSize: 12,
  },
  orderNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  orderNowText: {
    color: '#fff',
    fontWeight: '900',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,20,20,0.36)',
  },
  sheetKeyboardView: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  checkoutSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 18,
    paddingBottom: 28,
    ...shadows.floating,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetTitle: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '900',
  },
  sheetSubtitle: {
    color: colors.textSoft,
    fontWeight: '700',
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  totalLabel: {
    color: colors.textSoft,
    fontWeight: '800',
  },
  total: {
    marginTop: 5,
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
  },
  paymentHint: {
    marginTop: 4,
    color: colors.textSoft,
    fontWeight: '700',
  },
  formTitle: {
    marginTop: 16,
    marginBottom: 10,
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputShellMultiline: {
    minHeight: 76,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: colors.text,
    fontWeight: '700',
  },
  inputMultiline: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
});
