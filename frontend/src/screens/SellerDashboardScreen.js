import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import MetricCard from '../components/MetricCard';
import { colors, radius, shadows } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export default function SellerDashboardScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.page}>
      <View style={styles.heroCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="storefront-outline" size={28} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Kênh người bán</Text>
          <Text style={styles.title}>Xin chào, {user?.full_name || 'Seller'}</Text>
          <Text style={styles.subtitle}>Quản lý sản phẩm, đơn hàng và hiệu suất bán hàng tại một nơi.</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Sản phẩm" value="Quản lý" />
        <MetricCard label="Đơn hàng" value="Theo dõi" />
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Gợi ý UX</Text>
        <Text style={styles.tipBody}>Ảnh sản phẩm nên vuông, rõ sáng và có mô tả ngắn để tăng tỉ lệ bấm mua.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 72,
    paddingBottom: 130,
  },
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.primaryDark,
    borderRadius: 28,
    padding: 18,
    ...shadows.soft,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: '#FDEBD3',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    marginTop: 6,
    color: '#fff',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginTop: 16,
  },
  tipCard: {
    marginTop: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 16,
    ...shadows.soft,
  },
  tipTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  tipBody: {
    marginTop: 8,
    color: colors.textSoft,
    lineHeight: 21,
    fontWeight: '700',
  },
});
