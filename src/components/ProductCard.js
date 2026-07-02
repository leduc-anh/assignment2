import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../constants/colors';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: colors.primarySoft,
  },
  info: {
    padding: 8,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 36,
  },
  price: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
});
