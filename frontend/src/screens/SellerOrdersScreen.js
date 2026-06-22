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

export default function SellerOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadOrders() {
    const data = await apiRequest('/seller/orders');
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

  async function updateStatus(order, status) {
    try {
      await apiRequest('/seller/orders/' + order.order_id + '/status', {
        method: 'PATCH',
        body: JSON.stringify({
          order_status: status,
        }),
      });

      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng');
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

        <Text style={styles.total}>Doanh thu shop: {formatMoney(item.seller_total)}</Text>

        <View style={styles.row}>
          <Text style={styles.badge}>{item.order_status}</Text>
          <Text style={styles.badge}>{item.payment_status}</Text>
        </View>

        <View style={styles.statusActions}>
          <Pressable
            style={styles.statusButton}
            onPress={function () {
              updateStatus(item, 'CONFIRMED');
            }}
          >
            <Text style={styles.statusText}>Xác nhận</Text>
          </Pressable>

          <Pressable
            style={styles.statusButton}
            onPress={function () {
              updateStatus(item, 'SHIPPING');
            }}
          >
            <Text style={styles.statusText}>Giao hàng</Text>
          </Pressable>

          <Pressable
            style={styles.statusButton}
            onPress={function () {
              updateStatus(item, 'COMPLETED');
            }}
          >
            <Text style={styles.statusText}>Hoàn tất</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.page}
      data={orders}
      contentContainerStyle={styles.listContent}
      keyExtractor={function (item) {
        return String(item.order_id);
      }}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshOrders} />}
      ListEmptyComponent={<Text style={styles.empty}>Chưa có đơn hàng nào</Text>}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F1E7',
    paddingTop: 58,
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
    color: '#8B5E3C',
    fontWeight: '900',
    fontSize: 16,
    marginTop: 10,
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
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statusButton: {
    backgroundColor: '#8B5E3C',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 132,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6B7280',
  },
});