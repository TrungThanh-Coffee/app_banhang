import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import ClothingBanner from '../components/ClothingBanner';
import SectionTitle from '../components/SectionTitle';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ClothingBanner />

        <SectionTitle
          title="Giới thiệu ứng dụng"
          subtitle="Thông tin về app bán quần áo"
        />

        <View style={styles.card}>
          <Text style={styles.text}>Tên ứng dụng: Fashion Store App</Text>
          <Text style={styles.text}>
            Chức năng: Xem danh sách và chi tiết sản phẩm quần áo
          </Text>
          <Text style={styles.text}>Được phát triển bởi: nhóm 11</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf8f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  text: {
    fontSize: 15,
    color: '#4a3b33',
    marginBottom: 10,
    lineHeight: 22,
  },
});