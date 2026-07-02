import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import PriceSummary from '../components/PriceSummary';
import EmptyState from '../components/EmptyState';
import colors from '../constants/colors';

export default function CartScreen() {
  const navigation = useNavigation();
  const { items, totalCount, totalPrice, increment, decrement, removeItem } = useCart();
  const entries = Object.values(items);

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Your cart is empty"
          actionLabel="Browse products"
          onAction={() => navigation.navigate('Products')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(entry) => String(entry.product.id)}
        renderItem={({ item }) => (
          <CartItem
            product={item.product}
            qty={item.qty}
            onIncrement={() => increment(item.product.id)}
            onDecrement={() => decrement(item.product.id)}
            onRemove={() => removeItem(item.product.id)}
          />
        )}
      />
      <PriceSummary totalCount={totalCount} totalPrice={totalPrice} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
