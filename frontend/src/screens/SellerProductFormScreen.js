import React, { useEffect, useState } from 'react';
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

import { apiRequest } from '../api/apiClient';
import AppButton from '../components/AppButton';

export default function SellerProductFormScreen({ navigation, route }) {
  const product = route.params ? route.params.product : null;
  const isEdit = Boolean(product);

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(product ? String(product.category_id) : '');
  const [productName, setProductName] = useState(product ? product.product_name : '');
  const [description, setDescription] = useState(product ? product.description || '' : '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [imageUrl, setImageUrl] = useState(product ? product.image_url || '' : '');
  const [loading, setLoading] = useState(false);

  async function loadCategories() {
    try {
      const data = await apiRequest('/categories');
      setCategories(data);

      if (!categoryId && data.length > 0) {
        setCategoryId(String(data[0].category_id));
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    }
  }

  async function saveProduct() {
    try {
      if (!categoryId || !productName || !price || !stock) {
        Alert.alert('Thông báo', 'Vui lòng nhập danh mục, tên, giá và tồn kho');
        return;
      }

      const payload = {
        category_id: Number(categoryId),
        product_name: productName,
        description,
        price: Number(price),
        stock: Number(stock),
        image_url: imageUrl,
        status: 'active',
      };

      setLoading(true);

      if (isEdit) {
        await apiRequest('/seller/products/' + product.product_id, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/seller/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      Alert.alert('Thành công', isEdit ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadCategories();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</Text>

        <Text style={styles.label}>Danh mục</Text>

        <View style={styles.categoryWrap}>
          {categories.map(function (item) {
            const active = String(categoryId) === String(item.category_id);

            return (
              <Pressable
                key={String(item.category_id)}
                onPress={function () {
                  setCategoryId(String(item.category_id));
                }}
                style={[styles.categoryChip, active && styles.categoryActive]}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {item.category_name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={productName}
          onChangeText={setProductName}
          placeholder="Tên sản phẩm"
          style={styles.input}
        />

        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Giá"
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          value={stock}
          onChangeText={setStock}
          placeholder="Tồn kho"
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="Link hình ảnh"
          style={styles.input}
        />

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả"
          multiline
          style={[styles.input, styles.textArea]}
        />

        <AppButton
          title={isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
          loading={loading}
          onPress={saveProduct}
        />
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryActive: {
    backgroundColor: '#8B5E3C',
    borderColor: '#8B5E3C',
  },
  categoryText: {
    color: '#374151',
    fontWeight: '700',
  },
  categoryTextActive: {
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
});