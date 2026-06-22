import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, setAuthToken } from '../api/apiClient';

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    async function restoreSession() {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

        if (!savedToken) {
          setLoading(false);
          return;
        }

        setAuthToken(savedToken);
        const currentUser = await apiRequest('/auth/me');
        setUser(currentUser);
      } catch (error) {
        setAuthToken(null);
        setUser(null);
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function saveTokenAndUser(token, userData) {
    setAuthToken(token);
    setUser(userData);
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  async function login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await saveTokenAndUser(data.token, data.user);
  }

  async function register(payload) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    await saveTokenAndUser(data.token, data.user);
  }

  function updateUser(nextUser) {
    setUser(function (currentUser) {
      return {
        ...(currentUser || {}),
        ...(nextUser || {}),
      };
    });
  }

  async function refreshUser() {
    const currentUser = await apiRequest('/profile');
    setUser(currentUser);
    return currentUser;
  }

  async function logout() {
    setAuthToken(null);
    setUser(null);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem('auth');
    await AsyncStorage.removeItem('user');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
