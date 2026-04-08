import React from 'react';
import { SafeAreaView, FlatList, StyleSheet } from 'react-native';

import SectionTitle from '../components/SectionTitle';
import ProductCard from '../components/ProductCard';
import ClothingBanner from '../components/ClothingBanner';
import CategoryList from '../components/CategoryList';

import products from '../data/mockData';
import categories from '../data/categoryData';

export default function HomeScreen({ navigation }) {
  const handleGoToDetail = (product) => {
    navigation.navigate('Detail', { product });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.product_id.toString()}
        renderItem={({ item }) => (
          <ProductCard item={item} onPressDetail={handleGoToDetail} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <ClothingBanner />

            <CategoryList categories={categories} />

            <SectionTitle
              title="Danh sách quần áo"
              subtitle="Chọn sản phẩm để xem chi tiết"
            />
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf8f5',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
});