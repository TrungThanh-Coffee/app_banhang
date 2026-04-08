import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function ProductCard({ item, onPressDetail }) {
  return (
    <View style={styles.card}>
      <Image source={item.image_url} style={styles.image} />

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.product_name}</Text>
        <Text style={styles.price}>{item.price.toLocaleString('vi-VN')} đ</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => onPressDetail(item)}
        >
          <Text style={styles.buttonText}>Xem chi tiết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 14,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2b2b2b',
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    color: '#b05b3b',
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#b05b3b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});