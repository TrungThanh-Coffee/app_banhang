import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2b2b2b',
  },
  subtitle: {
    fontSize: 14,
    color: '#7a6f68',
    marginTop: 4,
  },
});