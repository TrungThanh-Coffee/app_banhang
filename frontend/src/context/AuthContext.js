import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, setCurrentUser } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  function setUser(userData) {
    setUserState(userData);
    setCurrentUser(userData);
  }

  useEffect(function () {
    async function restoreUser() {
      const savedUser = await AsyncStorage.getItem('user');

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }

      setLoading(false);
    }

    restoreUser();
  }, []);

  async function login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    setUser(data.user);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
  }

  async function register(payload, role) {
    const path = role === 'SELLER' ? '/auth/register-seller' : '/auth/register';

    const data = await apiRequest(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setUser(data.user);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
  }

  async function logout() {
    setUser(null);
    await AsyncStorage.removeItem('user');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}