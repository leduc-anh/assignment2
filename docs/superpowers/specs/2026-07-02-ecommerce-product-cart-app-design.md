# Assignment 2 — E-Commerce Product App with Pagination and Cart State

**Date:** 2026-07-02
**Status:** Approved

## Goal

Build a React Native (Expo) app that browses products from a public API, shows product
details, and manages a shopping cart with live totals — using pagination/infinite scroll
and a custom `useCart` hook, matching the course's Assignment 2 requirements.

## Stack

- Expo (managed workflow), plain JavaScript (no TypeScript) — consistent with Assignment1.
- `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`.
- Data source: **DummyJSON** (`https://dummyjson.com/products`). Chosen over FakeStoreAPI
  because it natively supports `limit`/`skip` pagination and a `/products/search?q=`
  endpoint, matching the infinite-scroll + search requirements without client-side slicing.
- State management: Context API + `useReducer` for cart (no Redux) — consistent with
  Assignment1's use of Context API, sufficient for this scope.
- No TypeScript, no automated test framework requested; verification is manual (Expo Go /
  emulator) per project convention.

## Out of scope (this pass)

Bonus features are explicitly deferred: local-storage caching, wishlist/favorites, and any
GeminiAI/Maps/ImagePicker integration. The design below does not add scaffolding for these
to avoid speculative abstraction; they would be a separate follow-up spec if picked up later.

## Navigation

```
NavigationContainer
  CartProvider
    Tab.Navigator (bottom tabs)
      "Products" -> Stack.Navigator
                      - ProductListScreen
                      - ProductDetailScreen
      "Cart"     -> CartScreen (tab badge shows totalCount from useCart)
```

- `ProductDetailScreen` is pushed on the Products stack so the tab bar stays visible on the
  list but the detail screen still gets a native back gesture/header.
- Cart tab shows a numeric badge bound to `useCart().totalCount`.

## Folder structure

```
src/
  api/
    productsApi.js       # fetchProducts({limit, skip}), searchProducts({q, limit, skip})
  context/
    CartContext.js        # CartProvider, cart reducer, useCart hook
  navigation/
    RootNavigator.js       # Tab + Stack wiring
  screens/
    ProductListScreen.js
    ProductDetailScreen.js
    CartScreen.js
  components/
    ProductCard.js
    CartItem.js
    PriceSummary.js
    SearchBar.js
    LoadingFooter.js
    EmptyState.js
    ErrorState.js
  hooks/
    useProducts.js         # pagination + search fetch logic
  utils/
    format.js              # currency formatting helper
  constants/
    colors.js
```

## Data flow

### Product listing & pagination (`useProducts`)

- Hook owns: `products` (array), `skip`, `total`, `loading` (initial), `loadingMore`
  (pagination), `error`, current `searchQuery`.
- `loadMore()`: no-op if `loading || loadingMore || products.length >= total`; otherwise
  fetches next page (`skip += limit`) and appends results. Wired to `FlatList`'s
  `onEndReached` (`onEndReachedThreshold: 0.5`).
- Changing `searchQuery` (debounced ~400ms in `SearchBar`) resets `skip` to 0, clears
  `products`, and refetches via `/products/search?q=...` instead of `/products`.
- `refresh()` re-runs the current query from `skip: 0` — used by pull-to-refresh and the
  error retry button.

### Cart (`useCart` / `CartContext`)

- State shape: `{ items: { [productId]: { product, qty } } }` (object map, not array, for
  O(1) add/remove/update lookups).
- Reducer actions: `ADD_ITEM` (adds or increments), `REMOVE_ITEM`, `INCREMENT`,
  `DECREMENT` (removes item when qty would drop to 0), `CLEAR_CART`.
- `useCart()` returns `{ items, addItem, removeItem, increment, decrement, totalPrice,
  totalCount }`; `totalPrice`/`totalCount` are derived via `useMemo` over `items` so every
  consumer re-renders with live totals — no separate "recalculate" step.

## Components

| Component | Responsibility |
|---|---|
| `ProductCard` | Thumbnail, title, price; `TouchableOpacity` navigates to Detail. |
| `CartItem` | Row with image, title, unit price, qty stepper (+/-), remove, line subtotal. |
| `PriceSummary` | Sticky footer on CartScreen: total item count + total price. |
| `SearchBar` | Debounced `TextInput` with clear button, drives `useProducts`. |
| `LoadingFooter` | Small `ActivityIndicator` rendered as `FlatList.ListFooterComponent` while `loadingMore`. |
| `EmptyState` | Reusable icon+message, optional CTA button (e.g. "Browse products"). |
| `ErrorState` | Message + "Retry" button calling `refresh()`. |

## Loading / error / empty states

- **Initial product load:** full-screen `ActivityIndicator` in place of the list.
- **Fetch error (initial or search):** `ErrorState` with Retry.
- **Pagination fetch error:** keep existing list, show inline retry in footer (don't blow
  away already-loaded products).
- **No search results:** `EmptyState` ("No products found").
- **Empty cart:** `EmptyState` ("Your cart is empty") with CTA back to Products tab.
- **End of pagination:** `loadMore()` becomes a silent no-op — no spinner, no error.

## Error handling boundaries

Network/API errors are caught in `useProducts` (try/catch around fetch) and exposed as
`error` state — screens render `ErrorState`, they don't handle fetch failures themselves.
No retries/backoff beyond the manual Retry button; this is a course assignment, not a
production client.

## Verification plan

No automated test suite is requested by the assignment. Verification is manual:
1. `npx expo start`, open in Expo Go / Android emulator.
2. Products load, scroll triggers pagination (`onEndReached`) until `total` is reached.
3. Search filters the list and resets pagination correctly (including empty-result case).
4. Tapping a product opens `ProductDetailScreen` with correct title/image/description/price.
5. Add to cart from Detail (or card), verify Cart tab badge and totals update live.
6. Cart quantity +/- and remove update `PriceSummary` correctly; removing last unit removes
   the row; clearing all items shows the empty-cart state.
7. Kill and restart the app to confirm there's no state persistence expected (cache is
   explicitly out of scope) — cart resets, which is correct for this pass.
