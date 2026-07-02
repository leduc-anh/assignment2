import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProducts } from '../hooks/useProducts';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import PriceFilter from '../components/PriceFilter';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import colors from '../constants/colors';

export default function ProductListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const { products, loading, error, loadMore, refresh } = useProducts({
    searchQuery,
    minPrice,
    maxPrice,
  });
  const { isFavorite, toggleFavorite } = useFavorites();

  const renderItem = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        isFavorite={isFavorite(item.id)}
        onToggleFavorite={() => toggleFavorite(item)}
      />
    ),
    [navigation, isFavorite, toggleFavorite]
  );

  const hasActiveFilter = minPrice !== '' || maxPrice !== '';

  return (
    <View style={styles.container}>
      <SearchBar onSearch={setSearchQuery} />
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilter((current) => !current)}
      >
        <Text style={styles.filterToggleText}>
          {showFilter ? 'Hide filter' : 'Filter'}
          {hasActiveFilter ? ' •' : ''}
        </Text>
      </TouchableOpacity>
      {showFilter && (
        <PriceFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          onChangeMinPrice={setMinPrice}
          onChangeMaxPrice={setMaxPrice}
          onClear={() => {
            setMinPrice('');
            setMaxPrice('');
          }}
        />
      )}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
      ) : error && products.length === 0 ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterToggle: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterToggleText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  loader: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
});
