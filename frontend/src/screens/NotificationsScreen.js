import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useNotifications } from '../context/NotificationContext';

function formatDateTime(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'ORDER_CREATED':
      return {
        name: 'bag-check-outline',
        backgroundColor: '#DCFCE7',
        color: '#16A34A',
      };

    case 'ORDER_STATUS':
      return {
        name: 'cube-outline',
        backgroundColor: '#DBEAFE',
        color: '#2563EB',
      };

    case 'ORDER_CANCELLED':
      return {
        name: 'close-circle-outline',
        backgroundColor: '#FEE2E2',
        color: '#DC2626',
      };

    default:
      return {
        name: 'notifications-outline',
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
      };
  }
}

function NotificationItem({ item, onRead, onDelete }) {
  const icon = getNotificationIcon(item.type);

  const isRead = Boolean(item.is_read);

  const handlePress = () => {
    if (!isRead) {
      onRead(item.notification_id);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc muốn xóa thông báo này không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => onDelete(item.notification_id),
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.notificationCard,
        !isRead && styles.unreadCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.itemRow}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: icon.backgroundColor,
            },
          ]}
        >
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>

        <View style={styles.contentBox}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[styles.title, !isRead && styles.unreadTitle]}
            >
              {item.title || 'Thông báo'}
            </Text>

            {!isRead ? <View style={styles.unreadDot} /> : null}
          </View>

          <Text numberOfLines={3} style={styles.message}>
            {item.message || 'Bạn có thông báo mới.'}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.timeText}>
              {formatDateTime(item.created_at || item.updated_at)}
            </Text>

            {item.order_id ? (
              <Text style={styles.orderText}>Đơn #{item.order_id}</Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={handleDelete}
          hitSlop={10}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
        >
          <Ionicons name="trash-outline" size={19} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const handleMarkAllAsRead = () => {
    if (unreadCount <= 0) {
      return;
    }

    markAllAsRead();
  };

  const renderItem = ({ item }) => (
    <NotificationItem
      item={item}
      onRead={markAsRead}
      onDelete={deleteNotification}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Thông báo</Text>
            <Text style={styles.headerSubtitle}>
              Theo dõi đơn hàng và cập nhật mới nhất
            </Text>
          </View>

          <Pressable
            onPress={handleMarkAllAsRead}
            disabled={unreadCount <= 0}
            style={({ pressed }) => [
              styles.readAllButton,
              unreadCount <= 0 && styles.readAllButtonDisabled,
              pressed && unreadCount > 0 && styles.readAllButtonPressed,
            ]}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={18}
              color={unreadCount > 0 ? '#2563EB' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.readAllText,
                unreadCount <= 0 && styles.readAllTextDisabled,
              ]}
            >
              Đọc hết
            </Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="notifications" size={22} color="#FFFFFF" />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              {unreadCount > 0
                ? `Bạn có ${unreadCount} thông báo chưa đọc`
                : 'Không có thông báo chưa đọc'}
            </Text>

            <Text style={styles.summaryText}>
              Thông báo sẽ cập nhật khi bạn vào lại màn hình này.
            </Text>
          </View>
        </View>

        {loading && notifications.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Đang tải thông báo...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) =>
              String(item.notification_id || item.id || item.order_id)
            }
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              notifications.length === 0 && styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchNotifications}
                tintColor="#2563EB"
                colors={['#2563EB']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={42}
                    color="#9CA3AF"
                  />
                </View>

                <Text style={styles.emptyTitle}>Chưa có thông báo</Text>

                <Text style={styles.emptyText}>
                  Khi bạn đặt hàng thành công hoặc đơn hàng được cập nhật trạng
                  thái, thông báo sẽ hiển thị tại đây.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },

  readAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
  },

  readAllButtonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: '#DBEAFE',
  },

  readAllButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },

  readAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  readAllTextDisabled: {
    color: '#9CA3AF',
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
    marginBottom: 14,
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  summaryText: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },

  listContent: {
    paddingBottom: 120,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  notificationCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 2,
  },

  unreadCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
  },

  cardPressed: {
    transform: [{ scale: 0.99 }],
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  contentBox: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },

  unreadTitle: {
    color: '#111827',
    fontWeight: '900',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#EF4444',
  },

  message: {
    marginTop: 5,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },

  metaRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  orderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },

  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: '#FEF2F2',
  },

  deleteButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: '#FEE2E2',
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
  },
});