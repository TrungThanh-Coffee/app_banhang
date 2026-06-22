import React, { useCallback, useEffect, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';

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

export default function ProfileScreen() {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(function () {
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
    setAvatarUri(user?.avatar_url || null);
  }, [user]);

  // useFocusEffect(
  //   useCallback(function () {
  //     refreshUser().catch(function () {});
  //   }, [refreshUser])
  // );

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

    const oldAvatar = user?.avatar_url || null;

    // Optimistic UI: đổi ảnh ngay trên giao diện
    setAvatarUri(localUri);
    updateUser({ avatar_url: localUri });
    setUploadingAvatar(true);

    const formData = new FormData();

    /**
     * Expo Web cần gửi Blob.
     * Nếu gửi object { uri, name, type } trên web thì multer thường không nhận được req.file.
     */
    if (Platform.OS === 'web') {
      const imageResponse = await fetch(localUri);
      const imageBlob = await imageResponse.blob();

      formData.append(
        'avatar',
        imageBlob,
        selected.fileName || getImageName(localUri)
      );
    } else {
      /**
       * Android/iOS dùng object { uri, name, type }.
       */
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

    // Rollback nếu upload lỗi
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
            <Ionicons name={user?.role === 'SELLER' ? 'storefront-outline' : 'person-outline'} size={15} color={colors.primary} />
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Thông tin cá nhân</Text>
          <Text style={styles.formSubtitle}>Cập nhật thông tin để đặt hàng nhanh hơn.</Text>

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
            label="Địa chỉ giao hàng"
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ giao hàng"
            multiline
          />

          <AppButton title="Lưu thay đổi" loading={saving} onPress={saveProfile} />
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="shield-checkmark-outline" label="Trạng thái tài khoản" value={user?.status || 'active'} />
          <InfoRow icon="mail-outline" label="Email đăng nhập" value={user?.email || 'Chưa cập nhật'} />
        </View>

        <AppButton title="Đăng xuất" variant="danger" onPress={logout} style={styles.logoutButton} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    minHeight: 88,
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
    minHeight: 60,
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
  },
  logoutButton: {
    marginTop: 14,
  },
});
