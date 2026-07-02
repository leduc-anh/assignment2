import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';

export default function CartScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Cart coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.muted,
    fontSize: 16,
  },
});
