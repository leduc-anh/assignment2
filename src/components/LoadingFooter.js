import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import colors from '../constants/colors';

export default function LoadingFooter({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
});
