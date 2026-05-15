import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MetricCard({ label, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    margin: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8B5E3C',
  },
  label: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 13,
  },
});