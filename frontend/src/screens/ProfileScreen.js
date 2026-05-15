import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.avatar}>
          {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
        </Text>

        <Text style={styles.name}>{user.full_name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.info}>Vai trò: {user.role}</Text>
          <Text style={styles.info}>SĐT: {user.phone || 'Chưa cập nhật'}</Text>
          <Text style={styles.info}>Địa chỉ: {user.address || 'Chưa cập nhật'}</Text>
          <Text style={styles.info}>Trạng thái: {user.status}</Text>
        </View>

        <AppButton title="Đăng xuất" variant="danger" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F1E7',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#8B5E3C',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 76,
    fontSize: 30,
    fontWeight: '900',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginTop: 14,
  },
  email: {
    color: '#6B7280',
    marginTop: 4,
  },
  infoBox: {
    alignSelf: 'stretch',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    marginVertical: 18,
  },
  info: {
    color: '#374151',
    marginVertical: 4,
  },
});