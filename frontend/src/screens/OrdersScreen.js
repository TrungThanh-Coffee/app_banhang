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

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadOrders() {
    const data = await apiRequest('/orders/my');
    setOrders(data);
  }

  useFocusEffect(
    useCallback(function () {
      loadOrders().catch(function () {});
    }, [])
  );

  async function refreshOrders() {
    try {
      setRefreshing(true);
      await loadOrders();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function payOrder(order) {
    try {
      await apiRequest('/orders/' + order.order_id + '/pay', {
        method: 'PATCH',
      });

      Alert.alert('Thành công', 'Thanh toán thành công');
      await loadOrders();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Đơn #{item.order_id}</Text>
        <Text style={styles.meta}>Người nhận: {item.receiver_name}</Text>
        <Text style={styles.meta}>SĐT: {item.receiver_phone}</Text>
        <Text style={styles.meta}>Địa chỉ: {item.shipping_address}</Text>
        <Text style={styles.total}>{formatMoney(item.total_amount)}</Text>

        <View style={styles.row}>
          <Text style={styles.badge}>{item.order_status}</Text>
          <Text style={styles.badge}>{item.payment_status}</Text>
        </View>

        {item.payment_status === 'UNPAID' ? (
          <Pressable
            style={styles.payButton}
            onPress={function () {
              payOrder(item);
            }}
          >
            <Text style={styles.payText}>Thanh toán</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.page}
      data={orders}
      keyExtractor={function (item) {
        return String(item.order_id);
      }}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshOrders} />}
      ListEmptyComponent={<Text style={styles.empty}>Bạn chưa có đơn hàng nào</Text>}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F1E7',
  },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  meta: {
    color: '#4B5563',
    marginTop: 5,
  },
  total: {
    marginTop: 10,
    color: '#8B5E3C',
    fontWeight: '900',
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    color: '#374151',
    fontWeight: '800',
    fontSize: 12,
  },
  payButton: {
    marginTop: 12,
    backgroundColor: '#8B5E3C',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  payText: {
    color: '#fff',
    fontWeight: '800',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6B7280',
  },
});