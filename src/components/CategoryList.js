import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function CategoryList({ categories }) {
  const renderCategoryItem = ({ item }) => {
    return (
      <TouchableOpacity style={styles.categoryItem}>
        <Text style={styles.categoryText}>{item.category_name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh mục quần áo</Text>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.category_id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2b2b2b',
    marginBottom: 12,
  },
  listContent: {
    paddingRight: 8,
  },
  categoryItem: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e4d9d2',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b05b3b',
  },
});