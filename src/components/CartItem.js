import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../constants/colors';
import { formatPrice } from '../utils/format';

export default function CartItem({ product, qty, onIncrement, onDecrement, onRemove }) {
  return (
    <View style={styles.row}>
      <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.unitPrice}>{formatPrice(product.price)} each</Text>
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepButton} onPress={onDecrement}>
            <Text style={styles.stepButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{qty}</Text>
          <TouchableOpacity style={styles.stepButton} onPress={onIncrement}>
            <Text style={styles.stepButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.subtotal}>{formatPrice(product.price * qty)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  unitPrice: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  qty: {
    marginHorizontal: 10,
    fontSize: 14,
    color: colors.text,
    minWidth: 18,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 16,
  },
  removeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  subtotal: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});
