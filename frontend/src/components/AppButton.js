import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

export default function AppButton({ title, onPress, loading, variant = 'primary', style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#8B5E3C',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  secondary: {
    backgroundColor: '#374151',
  },
  danger: {
    backgroundColor: '#DC2626',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});