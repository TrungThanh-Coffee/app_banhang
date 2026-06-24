import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

import { apiRequest } from '../api/apiClient';
import { colors, radius, shadows } from '../theme/theme';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const defaultDashboard = {
  summary: {
    total_products: 0,
    total_stock: 0,
    total_orders: 0,
    pending_orders: 0,
    confirmed_orders: 0,
    shipping_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    revenue: 0,
  },
  revenue_trend: [],
  order_status_chart: [],
  top_products: [],
};

function StatCard({ title, value, subtitle, icon, tone, children }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTopRow}>
        <View style={[styles.statIcon, { backgroundColor: tone.bg }]}>
          <Ionicons name={icon} size={19} color={tone.fg} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>

      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
        {value}
      </Text>

      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function StatusMiniPill({ label, value, color }) {
  return (
    <View style={styles.statusMiniPill}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={styles.statusMiniText}>{label}</Text>
      <Text style={styles.statusMiniValue}>{value}</Text>
    </View>
  );
}

function RevenueBarChart({ data }) {
  const maxRevenue = useMemo(
    function () {
      return Math.max(...data.map(function (item) {
        return Number(item.revenue || 0);
      }), 0);
    },
    [data]
  );

  return (
    <View style={styles.barChartWrap}>
      <View style={styles.chartGridLine} />
      <View style={[styles.chartGridLine, styles.chartGridMiddle]} />

      <View style={styles.barRow}>
        {data.map(function (item) {
          const revenue = Number(item.revenue || 0);
          const height = maxRevenue > 0 ? Math.max(10, Math.round((revenue / maxRevenue) * 108)) : 10;

          return (
            <View key={item.date} style={styles.barItem}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height,
                      backgroundColor: revenue > 0 ? colors.primary : '#E8DED2',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function OrderStatusDonut({ items }) {
  const total = items.reduce(function (sum, item) {
    return sum + Number(item.value || 0);
  }, 0);
  const segments = 44;
  const visibleItems = items.filter(function (item) {
    return Number(item.value || 0) > 0;
  });

  function getColorByIndex(index) {
    if (total <= 0 || visibleItems.length === 0) {
      return '#E8DED2';
    }

    const target = (index + 0.5) / segments;
    let accumulated = 0;

    for (let i = 0; i < visibleItems.length; i += 1) {
      const item = visibleItems[i];
      accumulated += Number(item.value || 0) / total;

      if (target <= accumulated) {
        return item.color;
      }
    }

    return visibleItems[visibleItems.length - 1].color;
  }

  return (
    <View style={styles.donutWrap}>
      {Array.from({ length: segments }).map(function (_, index) {
        const angle = (360 / segments) * index;

        return (
          <View
            key={String(index)}
            style={[
              styles.donutSegment,
              {
                backgroundColor: getColorByIndex(index),
                transform: [{ rotate: angle + 'deg' }, { translateY: -48 }],
              },
            ]}
          />
        );
      })}

      <View style={styles.donutCenter}>
        <Text style={styles.donutNumber}>{total}</Text>
        <Text style={styles.donutLabel}>đơn</Text>
      </View>
    </View>
  );
}

export default function SellerDashboardScreen() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(defaultDashboard);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard() {
    const data = await apiRequest('/seller/dashboard');
    setDashboard({
      summary: data.summary || defaultDashboard.summary,
      revenue_trend: data.revenue_trend || [],
      order_status_chart: data.order_status_chart || [],
      top_products: data.top_products || [],
    });
  }

  useFocusEffect(
    useCallback(function () {
      loadDashboard().catch(function () {});
    }, [])
  );

  async function refreshDashboard() {
    try {
      setRefreshing(true);
      await loadDashboard();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setRefreshing(false);
    }
  }

  const summary = dashboard.summary;
  const trendTotal = dashboard.revenue_trend.reduce(function (sum, item) {
    return sum + Number(item.revenue || 0);
  }, 0);

  const statusChart = dashboard.order_status_chart.length > 0
    ? dashboard.order_status_chart
    : [
        { key: 'PENDING', label: 'Chờ xử lý', value: 0, color: '#F59E0B' },
        { key: 'SHIPPING', label: 'Đang giao', value: 0, color: '#3B82F6' },
        { key: 'COMPLETED', label: 'Đã giao', value: 0, color: '#10B981' },
      ];

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshDashboard} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.kickerRow}>
            <Ionicons name="storefront-outline" size={16} color="#FDEBD3" />
            <Text style={styles.kicker}>Seller Dashboard</Text>
          </View>

          <Text style={styles.title}>Xin chào, {user?.full_name || 'Seller'}</Text>
          <Text style={styles.subtitle}>
            Theo dõi nhanh sản phẩm, đơn hàng và doanh thu của gian hàng.
          </Text>
        </View>

        <View style={styles.heroBadge}>
          <Ionicons name="analytics-outline" size={28} color="#fff" />
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard
          title="Sản phẩm active"
          value={summary.total_products}
          subtitle={'Tồn kho: ' + summary.total_stock + ' sản phẩm'}
          icon="cube-outline"
          tone={{ bg: '#E9F7F2', fg: '#2F5D50' }}
        />

        <StatCard
          title="Tổng đơn hàng"
          value={summary.total_orders}
          subtitle="Theo trạng thái xử lý"
          icon="receipt-outline"
          tone={{ bg: '#EEF2FF', fg: '#4F46E5' }}
        >
          <View style={styles.orderBreakdown}>
            <StatusMiniPill label="Chờ" value={Number(summary.pending_orders || 0) + Number(summary.confirmed_orders || 0)} color="#F59E0B" />
            <StatusMiniPill label="Giao" value={summary.shipping_orders} color="#3B82F6" />
            <StatusMiniPill label="Xong" value={summary.completed_orders} color="#10B981" />
          </View>
        </StatCard>

        <View style={styles.revenueCard}>
          <View style={styles.revenueIcon}>
            <Ionicons name="wallet-outline" size={21} color="#B45309" />
          </View>
          <Text style={styles.revenueLabel}>Doanh thu đã giao</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.revenueValue}>
            {formatMoney(summary.revenue)}
          </Text>
          <Text style={styles.revenueHint}>Tính từ các đơn COMPLETED của shop</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Xu hướng doanh thu</Text>
            <Text style={styles.sectionSub}>7 ngày gần nhất</Text>
          </View>
          <View style={styles.totalPill}>
            <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
            <Text style={styles.totalPillText}>{formatMoney(trendTotal)}</Text>
          </View>
        </View>

        <RevenueBarChart data={dashboard.revenue_trend} />
      </View>

      <View style={styles.insightGrid}>
        <View style={styles.pieCard}>
          <Text style={styles.sectionTitle}>Tỷ lệ đơn hàng</Text>
          <Text style={styles.sectionSub}>Theo trạng thái</Text>

          <View style={styles.pieBody}>
            <OrderStatusDonut items={statusChart} />

            <View style={styles.legendList}>
              {statusChart.map(function (item) {
                return (
                  <View key={item.key} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text numberOfLines={1} style={styles.legendLabel}>{item.label}</Text>
                    <Text style={styles.legendValue}>{item.value}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.topProductsCard}>
          <Text style={styles.sectionTitle}>Top sản phẩm</Text>
          <Text style={styles.sectionSub}>Bán chạy theo số lượng</Text>

          {dashboard.top_products.length === 0 ? (
            <View style={styles.emptyTopProduct}>
              <Ionicons name="sparkles-outline" size={22} color={colors.textSoft} />
              <Text style={styles.emptyText}>Chưa có dữ liệu bán hàng</Text>
            </View>
          ) : dashboard.top_products.map(function (item, index) {
            return (
              <View key={String(item.product_id)} style={styles.topProductRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.topProductName}>{item.product_name}</Text>
                  <Text style={styles.topProductMeta}>{item.sold_quantity} đã bán</Text>
                </View>
                <Text style={styles.topProductRevenue}>{formatMoney(item.revenue)}</Text>
              </View>
            );
          })}
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
    paddingHorizontal: 16,
    paddingTop: 68,
    paddingBottom: 132,
  },
  heroCard: {
    minHeight: 162,
    borderRadius: 30,
    padding: 20,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadows.floating,
  },
  heroContent: {
    flex: 1,
    paddingRight: 12,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  kicker: {
    color: '#FDEBD3',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    marginTop: 12,
    color: '#fff',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
    fontWeight: '700',
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 146,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,222,210,0.78)',
    ...shadows.soft,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    flex: 1,
    color: colors.textSoft,
    fontSize: 12.5,
    fontWeight: '800',
  },
  statValue: {
    marginTop: 14,
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  statSubtitle: {
    marginTop: 5,
    color: colors.textSoft,
    fontWeight: '700',
    fontSize: 12.5,
  },
  orderBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  statusMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8F5F0',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  statusMiniText: {
    color: colors.textSoft,
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusMiniValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  revenueCard: {
    flexBasis: '100%',
    borderRadius: 28,
    padding: 18,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    ...shadows.soft,
  },
  revenueIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueLabel: {
    marginTop: 12,
    color: '#9A3412',
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  revenueValue: {
    marginTop: 6,
    color: '#7C2D12',
    fontSize: 34,
    fontWeight: '900',
  },
  revenueHint: {
    marginTop: 5,
    color: '#B45309',
    fontWeight: '700',
  },
  chartCard: {
    marginTop: 16,
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,222,210,0.78)',
    ...shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  sectionSub: {
    marginTop: 4,
    color: colors.textSoft,
    fontSize: 12.5,
    fontWeight: '700',
  },
  totalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  totalPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  barChartWrap: {
    height: 164,
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 16,
    height: 1,
    backgroundColor: '#F1E7DA',
  },
  chartGridMiddle: {
    top: 72,
  },
  barRow: {
    height: 142,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 7,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    height: 116,
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#F8F1E7',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  barLabel: {
    marginTop: 8,
    color: colors.textSoft,
    fontSize: 10,
    fontWeight: '800',
  },
  insightGrid: {
    gap: 12,
    marginTop: 16,
  },
  pieCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,222,210,0.78)',
    ...shadows.soft,
  },
  pieBody: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  donutWrap: {
    width: 122,
    height: 122,
    borderRadius: 61,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutSegment: {
    position: 'absolute',
    left: 59,
    top: 55,
    width: 4,
    height: 18,
    borderRadius: 99,
  },
  donutCenter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1E7DA',
  },
  donutNumber: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  donutLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '800',
  },
  legendList: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
  },
  legendLabel: {
    flex: 1,
    color: colors.textSoft,
    fontWeight: '800',
    fontSize: 12.5,
  },
  legendValue: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 13,
  },
  topProductsCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,222,210,0.78)',
    ...shadows.soft,
  },
  topProductRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#F8F1E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: colors.primary,
    fontWeight: '900',
  },
  topProductName: {
    color: colors.text,
    fontWeight: '900',
  },
  topProductMeta: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  topProductRevenue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12.5,
  },
  emptyTopProduct: {
    marginTop: 16,
    minHeight: 76,
    borderRadius: radius.lg,
    backgroundColor: '#F8F5F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    color: colors.textSoft,
    fontWeight: '800',
  },
});
