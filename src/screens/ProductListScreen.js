import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import LoadingFooter from '../components/LoadingFooter';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import colors from '../constants/colors';

export default function ProductListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { products, loading, loadingMore, error, loadMore, refresh } = useProducts(searchQuery);

  const renderItem = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      />
    ),
    [navigation]
  );

  const renderFooter = () => {
    if (loadingMore) return <LoadingFooter visible />;
    if (error && products.length > 0) {
      return (
        <View style={styles.footerError}>
          <Text style={styles.footerErrorText}>{error}</Text>
          <TouchableOpacity onPress={loadMore}>
            <Text style={styles.footerRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <SearchBar onSearch={setSearchQuery} />
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
          ListFooterComponent={renderFooter}
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
  loader: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  footerError: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerErrorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 6,
  },
  footerRetryText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
