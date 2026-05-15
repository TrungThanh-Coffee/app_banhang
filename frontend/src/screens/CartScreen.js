import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { apiRequest } from '../api/apiClient';
import AppButton from '../components/AppButton';

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

export default function CartScreen() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [receiverName, setReceiverName] = useState('Nguyễn Văn A');
  const [receiverPhone, setReceiverPhone] = useState('0987654321');
  const [shippingAddress, setShippingAddress] = useState('TP.HCM');
  const [loadingOrder, setLoadingOrder] = useState(false);

  async function loadCart() {
    const data = await apiRequest('/cart');
    setCart(data);
  }

  useFocusEffect(
    useCallback(function () {
      loadCart().catch(function () {});
    }, [])
  );

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
        body: JSON.stringify({
          quantity,
        }),
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

      if (!receiverName || !receiverPhone || !shippingAddress) {
        Alert.alert('Thông báo', 'Vui lòng nhập đủ thông tin nhận hàng');
        return;
      }

      setLoadingOrder(true);

      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          receiver_name: receiverName,
          receiver_phone: receiverPhone,
          shipping_address: shippingAddress,
          payment_method: 'COD',
        }),
      });

      Alert.alert('Thành công', 'Đặt hàng thành công');
      await loadCart();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoadingOrder(false);
    }
  }

  function renderItem({ item }) {
    return (
      <View style={styles.item}>
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
          onPress={function () {
            removeItem(item);
          }}
        >
          <Text style={styles.remove}>Xóa</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={cart.items}
        keyExtractor={function (item) {
          return String(item.cart_item_id);
        }}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshCart} />}
        ListEmptyComponent={<Text style={styles.empty}>Giỏ hàng đang trống</Text>}
        ListFooterComponent={
          <View style={styles.checkout}>
            <Text style={styles.total}>Tổng tiền: {formatMoney(cart.total)}</Text>

            <Text style={styles.formTitle}>Thông tin nhận hàng</Text>

            <TextInput
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="Tên người nhận"
              style={styles.input}
            />

            <TextInput
              value={receiverPhone}
              onChangeText={setReceiverPhone}
              placeholder="Số điện thoại"
              style={styles.input}
            />

            <TextInput
              value={shippingAddress}
              onChangeText={setShippingAddress}
              placeholder="Địa chỉ giao hàng"
              style={styles.input}
            />

            <AppButton title="Đặt hàng COD" loading={loadingOrder} onPress={createOrder} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F1E7',
  },
  item: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '800',
    color: '#111827',
  },
  price: {
    marginTop: 4,
    color: '#8B5E3C',
    fontWeight: '800',
  },
  subtotal: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
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
    backgroundColor: '#8B5E3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: '#fff',
    fontWeight: '900',
  },
  qtyNumber: {
    paddingHorizontal: 10,
    fontWeight: '800',
  },
  remove: {
    color: '#DC2626',
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6B7280',
  },
  checkout: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 20,
  },
  total: {
    fontSize: 20,
    fontWeight: '900',
    color: '#8B5E3C',
    marginBottom: 14,
  },
  formTitle: {
    fontWeight: '800',
    marginBottom: 10,
    color: '#111827',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
});