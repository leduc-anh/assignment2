import React, { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { getProductAdvice } from '../api/geminiApi';
import colors from '../constants/colors';
import { formatPrice } from '../utils/format';

export default function ProductDetailScreen({ route }) {
  const { product } = route.params;
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(product.id);

  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState(null);

  useEffect(() => {
    setAdvice(null);
    setAdviceLoading(false);
    setAdviceError(null);
  }, [product.id]);

  const fetchAdvice = async () => {
    setAdviceLoading(true);
    setAdviceError(null);
    try {
      const text = await getProductAdvice(product);
      setAdvice(text);
    } catch (err) {
      setAdviceError(err.message || 'Something went wrong');
    } finally {
      setAdviceLoading(false);
    }
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={[product]}
      keyExtractor={(item) => String(item.id)}
      renderItem={() => (
        <>
          <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="cover" />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.title}</Text>
            <TouchableOpacity
              onPress={() => toggleFavorite(product)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={24}
                color={favorited ? colors.danger : colors.muted}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={styles.description}>{product.description}</Text>
          <TouchableOpacity style={styles.button} onPress={() => addItem(product)}>
            <Text style={styles.buttonText}>Add to Cart</Text>
          </TouchableOpacity>

          {adviceLoading ? (
            <ActivityIndicator style={styles.adviceLoader} color={colors.primary} />
          ) : advice ? (
            <View style={styles.adviceCard}>
              <Text style={styles.adviceLabel}>✨ AI Advisor</Text>
              <Text style={styles.adviceText}>{advice}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.aiButton} onPress={fetchAdvice}>
              <Text style={styles.aiButtonText}>✨ AI Advisor</Text>
            </TouchableOpacity>
          )}
          {adviceError && (
            <View style={styles.adviceErrorRow}>
              <Text style={styles.adviceErrorText}>{adviceError}</Text>
              <TouchableOpacity onPress={fetchAdvice}>
                <Text style={styles.adviceRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 12,
  },
  price: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  aiButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  aiButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  adviceLoader: {
    marginTop: 16,
  },
  adviceCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  adviceLabel: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  adviceText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  adviceErrorRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  adviceErrorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 4,
  },
  adviceRetryText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
