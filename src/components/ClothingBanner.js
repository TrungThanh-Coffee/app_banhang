import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ClothingBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Fashion Store App</Text>
      <Text style={styles.subtitle}>
        Khám phá các mẫu quần áo thời trang mới nhất mỗi ngày
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#b05b3b',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff2eb',
    lineHeight: 20,
  },
});