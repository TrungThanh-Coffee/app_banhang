import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      if (!email || !password) {
        Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu');
        return;
      }

      setLoading(true);
      await login(email, password);
    } catch (error) {
      Alert.alert('Lỗi đăng nhập', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>App Bán Hàng</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục mua sắm</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mật khẩu"
          secureTextEntry
          style={styles.input}
        />

        <AppButton title="Đăng nhập" loading={loading} onPress={handleLogin} />

        <Pressable
          onPress={function () {
            navigation.navigate('Register');
          }}
        >
          <Text style={styles.link}>Chưa có tài khoản? Đăng ký ngay</Text>
        </Pressable>
        
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8F1E7',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  logo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#8B5E3C',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  link: {
    color: '#8B5E3C',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '700',
  },
  hintBox: {
    marginTop: 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 12,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginVertical: 2,
  },
});