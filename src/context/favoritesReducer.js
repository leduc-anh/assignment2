export const initialFavoritesState = { items: {} };

export function favoritesReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_FAVORITE': {
      const { product } = action;
      const nextItems = { ...state.items };
      if (nextItems[product.id]) {
        delete nextItems[product.id];
      } else {
        nextItems[product.id] = product;
      }
      return { items: nextItems };
    }
    default:
      return state;
  }
}
