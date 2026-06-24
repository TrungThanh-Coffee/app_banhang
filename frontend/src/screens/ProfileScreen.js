import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

import { apiRequest } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';
import { colors, radius, shadows } from '../theme/theme';
import { getInitials } from '../utils/format';

function getImageName(uri) {
  const parts = String(uri || '').split('/');
  const fileName = parts[parts.length - 1] || 'avatar.jpg';
  return fileName.includes('.') ? fileName : fileName + '.jpg';
}

function getImageMimeType(uri) {
  const lower = String(uri || '').toLowerCase();

  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function getShopStatusLabel(status) {
  const labels = {
    pending: 'Chờ duyệt',
    approved: 'Đang hoạt động',
    blocked: 'Đã khóa',
  };

  return labels[status] || status || 'Đang hoạt động';
}

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const isSeller = user?.role === 'SELLER';

  const [activeTab, setActiveTab] = useState('personal');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [loadingShop, setLoadingShop] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopStatus, setShopStatus] = useState('approved');
  const [shopStats, setShopStats] = useState({
    active_products: 0,
    total_products: 0,
    avg_rating: 0,
    review_count: 0,
    total_sold: 0,
  });

  useEffect(function () {
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
    setAvatarUri(user?.avatar_url || null);

    if (user?.role !== 'SELLER') {
      setActiveTab('personal');
    }
  }, [user]);

  useEffect(function () {
    if (!isSeller) {
      return undefined;
    }

    let mounted = true;

    async function loadSellerProfile() {
      try {
        setLoadingShop(true);
        const data = await apiRequest('/seller/profile');

        if (!mounted) return;

        setShopName(data.store_name || '');
        setShopDescription(data.store_description || '');
        setShopStatus(data.store_status || 'approved');
        setShopStats(data.stats || {
          active_products: 0,
          total_products: 0,
          avg_rating: 0,
          review_count: 0,
          total_sold: 0,
        });
      } catch (error) {
        if (mounted) {
          Alert.alert('Lỗi', error.message || 'Không thể tải thông tin shop');
        }
      } finally {
        if (mounted) {
          setLoadingShop(false);
        }
      }
    }

    loadSellerProfile();

    return function cleanup() {
      mounted = false;
    };
  }, [isSeller]);

  async function pickAvatar() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Cần quyền truy cập ảnh',
          'Bạn cần cho phép ứng dụng truy cập thư viện ảnh để đổi avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selected = result.assets[0];
      const localUri = selected.uri;

      setAvatarUri(localUri);
      updateUser({ avatar_url: localUri });
      setUploadingAvatar(true);

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const imageResponse = await fetch(localUri);
        const imageBlob = await imageResponse.blob();

        formData.append(
          'avatar',
          imageBlob,
          selected.fileName || getImageName(localUri)
        );
      } else {
        formData.append('avatar', {
          uri: localUri,
          name: selected.fileName || getImageName(localUri),
          type: selected.mimeType || getImageMimeType(localUri),
        });
      }

      const data = await apiRequest('/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const nextAvatarUrl = data.avatar_url || data.user?.avatar_url || localUri;

      setAvatarUri(nextAvatarUrl);

      if (data.user) {
        updateUser(data.user);
      } else {
        updateUser({ avatar_url: nextAvatarUrl });
      }

      Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công.');
    } catch (error) {
      Alert.alert('Lỗi upload avatar', error.message || 'Không thể upload avatar.');
      setAvatarUri(user?.avatar_url || null);
      updateUser({ avatar_url: user?.avatar_url || null });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    try {
      if (!fullName.trim()) {
        Alert.alert('Thông báo', 'Họ tên không được bỏ trống');
        return;
      }

      setSaving(true);

      const data = await apiRequest('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        }),
      });

      updateUser(data.user);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân');
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveShopProfile() {
    try {
      if (!shopName.trim()) {
        Alert.alert('Thông báo', 'Tên shop không được bỏ trống');
        return;
      }

      setSavingShop(true);

      const data = await apiRequest('/seller/profile/shop', {
        method: 'PATCH',
        body: JSON.stringify({
          store_name: shopName.trim(),
          store_description: shopDescription.trim() || null,
        }),
      });

      if (data.shop) {
        setShopName(data.shop.store_name || '');
        setShopDescription(data.shop.store_description || '');
        setShopStatus(data.shop.store_status || 'approved');
      }

      Alert.alert('Thành công', 'Đã cập nhật thông tin shop');
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin shop');
    } finally {
      setSavingShop(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Pressable style={styles.avatarButton} onPress={pickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{getInitials(user?.full_name)}</Text>
              </View>
            )}

            <View style={styles.cameraBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={17} color="#fff" />
              )}
            </View>
          </Pressable>

          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.rolePill}>
            <Ionicons
              name={isSeller ? 'storefront-outline' : 'person-outline'}
              size={15}
              color={colors.primary}
            />
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>

        {isSeller ? (
          <View style={styles.tabShell}>
            <ProfileTab
              icon="person-outline"
              title="Cá nhân"
              active={activeTab === 'personal'}
              onPress={function () { setActiveTab('personal'); }}
            />
            <ProfileTab
              icon="storefront-outline"
              title="Shop"
              active={activeTab === 'shop'}
              onPress={function () { setActiveTab('shop'); }}
            />
          </View>
        ) : null}

        {activeTab === 'personal' ? (
          <PersonalProfileSection
            user={user}
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            address={address}
            setAddress={setAddress}
            saving={saving}
            saveProfile={saveProfile}
          />
        ) : (
          <ShopProfileSection
            loadingShop={loadingShop}
            shopName={shopName}
            setShopName={setShopName}
            shopDescription={shopDescription}
            setShopDescription={setShopDescription}
            shopStatus={shopStatus}
            shopStats={shopStats}
            savingShop={savingShop}
            saveShopProfile={saveShopProfile}
          />
        )}

        <AppButton title="Đăng xuất" variant="danger" onPress={logout} style={styles.logoutButton} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PersonalProfileSection({
  user,
  fullName,
  setFullName,
  phone,
  setPhone,
  address,
  setAddress,
  saving,
  saveProfile,
}) {
  return (
    <>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Thông tin cá nhân</Text>
        <Text style={styles.formSubtitle}>Cập nhật hồ sơ cá nhân và thông tin liên hệ của bạn.</Text>

        <ProfileInput
          icon="person-outline"
          label="Họ tên"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nhập họ tên của bạn"
        />

        <ProfileInput
          icon="call-outline"
          label="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
          placeholder="Nhập số điện thoại"
          keyboardType="phone-pad"
        />

        <ProfileInput
          icon="location-outline"
          label="Địa chỉ"
          value={address}
          onChangeText={setAddress}
          placeholder="Nhập địa chỉ"
          multiline
        />

        <AppButton title="Lưu thông tin cá nhân" loading={saving} onPress={saveProfile} />
      </View>

      <View style={styles.infoCard}>
        <InfoRow icon="shield-checkmark-outline" label="Trạng thái tài khoản" value={user?.status || 'active'} />
        <InfoRow icon="mail-outline" label="Email đăng nhập" value={user?.email || 'Chưa cập nhật'} />
      </View>
    </>
  );
}

function ShopProfileSection({
  loadingShop,
  shopName,
  setShopName,
  shopDescription,
  setShopDescription,
  shopStatus,
  shopStats,
  savingShop,
  saveShopProfile,
}) {
  if (loadingShop) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin shop...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.shopOverviewCard}>
        <View style={styles.shopOverviewTop}>
          <View style={styles.shopIconCircle}>
            <Ionicons name="storefront-outline" size={25} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopNamePreview}>{shopName || 'Tên shop của bạn'}</Text>
            <Text style={styles.shopStatusText}>{getShopStatusLabel(shopStatus)}</Text>
          </View>
        </View>

        <View style={styles.shopStatsGrid}>
          <ShopStat label="Sản phẩm active" value={shopStats?.active_products || 0} />
          <ShopStat label="Đã bán" value={shopStats?.total_sold || 0} />
          <ShopStat label="Đánh giá" value={(shopStats?.avg_rating || 0) + ' ★'} />
          <ShopStat label="Lượt review" value={shopStats?.review_count || 0} />
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Thông tin shop</Text>
        <Text style={styles.formSubtitle}>Thông tin này sẽ hiển thị khi khách hàng bấm vào shop của bạn.</Text>

        <ProfileInput
          icon="storefront-outline"
          label="Tên shop"
          value={shopName}
          onChangeText={setShopName}
          placeholder="Nhập tên shop"
        />

        <ProfileInput
          icon="document-text-outline"
          label="Mô tả shop"
          value={shopDescription}
          onChangeText={setShopDescription}
          placeholder="Ví dụ: Chuyên bán đồ gia dụng, giao nhanh trong ngày..."
          multiline
        />

        <AppButton title="Lưu thông tin shop" loading={savingShop} onPress={saveShopProfile} />
      </View>

      <View style={styles.infoCard}>
        <InfoRow icon="eye-outline" label="Hiển thị với khách hàng" value="Tên shop, mô tả, số sản phẩm, đánh giá và sản phẩm đang bán" />
        <InfoRow icon="lock-closed-outline" label="Không chỉnh tại đây" value="Trạng thái duyệt shop do hệ thống quản lý" />
      </View>
    </>
  );
}

function ProfileTab({ icon, title, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Ionicons name={icon} size={17} color={active ? '#fff' : colors.primaryDark} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text>
    </Pressable>
  );
}

function ProfileInput({ icon, label, style, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputShell, props.multiline && styles.inputShellMultiline, style]}>
        <Ionicons name={icon} size={19} color={colors.primary} />
        <TextInput
          {...props}
          placeholderTextColor="#9CA3AF"
          style={[styles.input, props.multiline && styles.inputMultiline]}
        />
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ShopStat({ label, value }) {
  return (
    <View style={styles.shopStatItem}>
      <Text style={styles.shopStatValue}>{value}</Text>
      <Text style={styles.shopStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 72,
    paddingBottom: 142,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 22,
    ...shadows.soft,
  },
  avatarButton: {
    width: 96,
    height: 96,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '900',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    marginTop: 14,
    fontSize: 23,
    fontWeight: '900',
    color: colors.text,
  },
  email: {
    marginTop: 4,
    color: colors.textSoft,
    fontWeight: '700',
  },
  rolePill: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  roleText: {
    color: colors.primaryDark,
    fontWeight: '900',
    fontSize: 12,
  },
  tabShell: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderRadius: 22,
    backgroundColor: '#EEE2D4',
  },
  tabButton: {
    flex: 1,
    height: 44,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.soft,
  },
  tabText: {
    color: colors.primaryDark,
    fontWeight: '900',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
  },
  formCard: {
    marginTop: 14,
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: 16,
    ...shadows.soft,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  formSubtitle: {
    marginTop: 5,
    marginBottom: 14,
    color: colors.textSoft,
    fontWeight: '700',
    lineHeight: 19,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    marginBottom: 7,
    color: colors.text,
    fontWeight: '900',
    fontSize: 13,
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputShellMultiline: {
    minHeight: 96,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  infoCard: {
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 12,
    ...shadows.soft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  infoValue: {
    marginTop: 2,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  loadingCard: {
    marginTop: 14,
    minHeight: 150,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    ...shadows.soft,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSoft,
    fontWeight: '800',
  },
  shopOverviewCard: {
    marginTop: 14,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    padding: 16,
    ...shadows.soft,
  },
  shopOverviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  shopNamePreview: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  shopStatusText: {
    marginTop: 4,
    color: '#D8F3E9',
    fontWeight: '800',
  },
  shopStatsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shopStatItem: {
    width: '48.6%',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 12,
  },
  shopStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  shopStatLabel: {
    marginTop: 4,
    color: '#D8F3E9',
    fontSize: 12,
    fontWeight: '800',
  },
  logoutButton: {
    marginTop: 14,
  },
});
