import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../constants/colors';

export default function SearchBar({ onSearch }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => {
      onSearch(text.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [text, onSearch]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search products"
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        autoCorrect={false}
      />
      {text.length > 0 && (
        <TouchableOpacity onPress={() => setText('')} style={styles.clearButton}>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
