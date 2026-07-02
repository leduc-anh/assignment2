import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { cartReducer, initialCartState, selectCartTotals } from './cartReducer';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const addItem = useCallback((product) => dispatch({ type: 'ADD_ITEM', product }), []);
  const increment = useCallback((id) => dispatch({ type: 'INCREMENT', id }), []);
  const decrement = useCallback((id) => dispatch({ type: 'DECREMENT', id }), []);
  const removeItem = useCallback((id) => dispatch({ type: 'REMOVE_ITEM', id }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const { totalCount, totalPrice } = useMemo(() => selectCartTotals(state), [state]);

  const value = useMemo(
    () => ({
      items: state.items,
      addItem,
      increment,
      decrement,
      removeItem,
      clearCart,
      totalCount,
      totalPrice,
    }),
    [state.items, addItem, increment, decrement, removeItem, clearCart, totalCount, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
