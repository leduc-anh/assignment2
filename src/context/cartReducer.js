export const initialCartState = { items: {} };

export function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product } = action;
      const existing = state.items[product.id];
      const qty = existing ? existing.qty + 1 : 1;
      return {
        items: {
          ...state.items,
          [product.id]: { product, qty },
        },
      };
    }
    case 'INCREMENT': {
      const existing = state.items[action.id];
      if (!existing) return state;
      return {
        items: {
          ...state.items,
          [action.id]: { ...existing, qty: existing.qty + 1 },
        },
      };
    }
    case 'DECREMENT': {
      const existing = state.items[action.id];
      if (!existing) return state;
      if (existing.qty <= 1) {
        const nextItems = { ...state.items };
        delete nextItems[action.id];
        return { items: nextItems };
      }
      return {
        items: {
          ...state.items,
          [action.id]: { ...existing, qty: existing.qty - 1 },
        },
      };
    }
    case 'REMOVE_ITEM': {
      const nextItems = { ...state.items };
      delete nextItems[action.id];
      return { items: nextItems };
    }
    case 'CLEAR_CART':
      return initialCartState;
    default:
      return state;
  }
}

export function selectCartTotals(state) {
  const values = Object.values(state.items);
  const totalCount = values.reduce((sum, entry) => sum + entry.qty, 0);
  const totalPrice = values.reduce((sum, entry) => sum + entry.qty * entry.product.price, 0);
  return { totalCount, totalPrice };
}
