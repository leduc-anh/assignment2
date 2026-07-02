import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../constants/colors';

export default function PriceFilter({ minPrice, maxPrice, onChangeMinPrice, onChangeMaxPrice, onClear }) {
  const hasFilter = minPrice !== '' || maxPrice !== '';

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Min $"
        placeholderTextColor={colors.muted}
        value={minPrice}
        onChangeText={onChangeMinPrice}
        keyboardType="numeric"
      />
      <Text style={styles.separator}>–</Text>
      <TextInput
        style={styles.input}
        placeholder="Max $"
        placeholderTextColor={colors.muted}
        value={maxPrice}
        onChangeText={onChangeMaxPrice}
        keyboardType="numeric"
      />
      {hasFilter && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 14,
  },
  separator: {
    marginHorizontal: 8,
    color: colors.muted,
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
