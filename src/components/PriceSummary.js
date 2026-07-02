import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';
import { formatPrice } from '../utils/format';

export default function PriceSummary({ totalCount, totalPrice }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{totalCount} item{totalCount === 1 ? '' : 's'}</Text>
      <Text style={styles.total}>{formatPrice(totalPrice)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
  },
  total: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
