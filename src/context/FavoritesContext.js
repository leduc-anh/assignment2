import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { favoritesReducer, initialFavoritesState } from './favoritesReducer';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [state, dispatch] = useReducer(favoritesReducer, initialFavoritesState);

  const toggleFavorite = useCallback(
    (product) => dispatch({ type: 'TOGGLE_FAVORITE', product }),
    []
  );

  const favorites = useMemo(() => Object.values(state.items), [state.items]);

  const isFavorite = useCallback((id) => Boolean(state.items[id]), [state.items]);

  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite }),
    [favorites, toggleFavorite, isFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }
  return context;
}
