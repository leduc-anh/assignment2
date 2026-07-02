import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useCart } from '../context/CartContext';
import colors from '../constants/colors';

const TEST_PRODUCT = { id: 9999, title: 'Debug Product', price: 9.99, thumbnail: '' };

export default function CartScreen() {
  const { items, totalCount, totalPrice, addItem, increment, decrement } = useCart();
  const debugQty = items[TEST_PRODUCT.id]?.qty ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Cart items: {totalCount}</Text>
      <Text style={styles.text}>Cart total: ${totalPrice.toFixed(2)}</Text>
      <Text style={styles.text}>Debug product qty: {debugQty}</Text>
      <Button title="Add debug item" onPress={() => addItem(TEST_PRODUCT)} />
      <Button title="Increment" onPress={() => increment(TEST_PRODUCT.id)} />
      <Button title="Decrement" onPress={() => decrement(TEST_PRODUCT.id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    color: colors.text,
    fontSize: 16,
  },
});
