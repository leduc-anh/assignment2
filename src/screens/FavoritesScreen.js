import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import colors from '../constants/colors';

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const renderItem = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        onPress={() =>
          navigation.navigate('Products', { screen: 'ProductDetail', params: { product: item } })
        }
        isFavorite={isFavorite(item.id)}
        onToggleFavorite={() => toggleFavorite(item)}
      />
    ),
    [navigation, isFavorite, toggleFavorite]
  );

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState title="No favorites yet" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
});
