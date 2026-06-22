import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [role, setRole] = useState('CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    try {
      const payload = {
        role,
        full_name: fullName,
        email,
        password,
        phone,
        address,
        store_name: storeName,
        store_description: storeDescription,
      };

      setLoading(true);
      await register(payload);
    } catch (error) {
      Alert.alert('Lỗi đăng ký', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Chọn vai trò phù hợp để sử dụng hệ thống</Text>

        <View style={styles.roleRow}>
          <Pressable
            onPress={function () {
              setRole('CUSTOMER');
            }}
            style={[styles.roleButton, role === 'CUSTOMER' && styles.roleActive]}
          >
            <Text style={[styles.roleText, role === 'CUSTOMER' && styles.roleTextActive]}>
              Customer
            </Text>
          </Pressable>

          <Pressable
            onPress={function () {
              setRole('SELLER');
            }}
            style={[styles.roleButton, role === 'SELLER' && styles.roleActive]}
          >
            <Text style={[styles.roleText, role === 'SELLER' && styles.roleTextActive]}>
              Seller
            </Text>
          </Pressable>
        </View>

        <TextInput placeholder="Họ tên" value={fullName} onChangeText={setFullName} style={styles.input} />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TextInput placeholder="Số điện thoại" value={phone} onChangeText={setPhone} style={styles.input} />

        <TextInput placeholder="Địa chỉ" value={address} onChangeText={setAddress} style={styles.input} />

        {role === 'SELLER' ? (
          <>
            <TextInput
              placeholder="Tên cửa hàng"
              value={storeName}
              onChangeText={setStoreName}
              style={styles.input}
            />

            <TextInput
              placeholder="Mô tả cửa hàng"
              value={storeDescription}
              onChangeText={setStoreDescription}
              style={[styles.input, styles.textArea]}
              multiline
            />
          </>
        ) : null}

        <AppButton title="Đăng ký" loading={loading} onPress={handleRegister} />

        <Pressable
          onPress={function () {
            navigation.goBack();
          }}
        >
          <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F1E7',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#8B5E3C',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  roleRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 16,
    marginBottom: 14,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  roleActive: {
    backgroundColor: '#8B5E3C',
  },
  roleText: {
    color: '#6B7280',
    fontWeight: '700',
  },
  roleTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  link: {
    marginTop: 12,
    textAlign: 'center',
    color: '#8B5E3C',
    fontWeight: '700',
  },
});