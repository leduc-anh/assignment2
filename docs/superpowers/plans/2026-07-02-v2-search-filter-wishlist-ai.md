# v2: Accurate Search, Price Filter, Cart Layout Fix, Wishlist, Gemini AI Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix search returning unrelated products and the Cart screen's missing top spacing, and add a price filter, a wishlist/favorites tab, and a Gemini-powered AI product advisor to the existing Assignment 2 app.

**Architecture:** Replace `useProducts`'s unreliable server-side search with a fetch-once (194-product catalog), filter-and-paginate-client-side model, driving both accurate title search and a new price filter from the same in-memory `useMemo`. Fix the Cart tab's missing header by scoping `headerShown: false` to only the Products tab. Add a `FavoritesContext` (Context + `useReducer`, mirroring the existing `CartContext` pattern exactly) surfaced via heart icons and a new Favorites tab. Add a thin REST client for the Gemini API (`generateContent` endpoint, no SDK) wired to a new "AI Advisor" button on the product detail screen.

**Tech Stack:** Same as the base app — Expo (SDK 54, plain JavaScript), React Navigation, Context API + `useReducer`, DummyJSON REST API, Gemini REST API (`generativelanguage.googleapis.com`).

## Global Constraints

- Plain JavaScript only — no TypeScript.
- All new state management follows the existing Context API + `useReducer` pattern (see `src/context/cartReducer.js` / `src/context/CartContext.js`) — no Redux, no new state library.
- No automated test framework — verification is manual/bundle-level (`npx expo export --platform android`), same as the base app. No emulator/device available in this environment.
- Currency formatting always via `formatPrice()` from `src/utils/format.js`.
- Gemini API key is read from `process.env.EXPO_PUBLIC_GEMINI_API_KEY` — **never** hardcoded in source and never committed. `.env` (real key) and `.env.example` (placeholder) already exist at the project root; `.env` is already gitignored. After any task that reads this env var, the dev server must be restarted with cache cleared (`npx expo start -c`) for Metro to pick up the value — `npx expo export` picks it up fresh each run, so no cache-clear is needed for that verification command specifically.
- DummyJSON's `/products/search` endpoint is unreliable (verified: searching "table" returns 41 results, most unrelated — e.g. "Chicken Meat") and must no longer be used. The full catalog is 194 products (~300KB via `GET /products?limit=194`), fetched once and filtered/paginated client-side instead.
- Gemini model id: `gemini-2.5-flash`. Endpoint verified working directly: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=API_KEY`, body `{"contents":[{"parts":[{"text":"..."}]}]}`, response text at `candidates[0].content.parts[0].text`.

---

### Task 1: Client-side catalog fetch, accurate search, and price filter

**Files:**
- Modify: `src/api/productsApi.js` (remove `searchProducts`, keep `fetchProducts`)
- Modify: `src/hooks/useProducts.js` (full rewrite: fetch-once + client-side filter/paginate)
- Create: `src/components/PriceFilter.js`
- Modify: `src/screens/ProductListScreen.js` (full rewrite: new hook shape, price filter UI, no more footer-retry)
- Delete: `src/components/LoadingFooter.js` (client-side pagination is synchronous — no per-page loading state exists anymore, so this component has no remaining caller)

**Interfaces:**
- Consumes: `fetchProducts({ limit, skip })` (unchanged signature) from `src/api/productsApi.js`; `colors` from `src/constants/colors.js`; `formatPrice` (unchanged, not touched by this task).
- Produces: `useProducts({ searchQuery, minPrice, maxPrice })` → `{ products, total, loading, error, loadMore(), refresh() }`. **`loadingMore` no longer exists in the return value** — later tasks and any reviewer comparing against the old hook shape should expect this removal, not treat it as a regression. `PriceFilter({ minPrice, maxPrice, onChangeMinPrice, onChangeMaxPrice, onClear })` (default export) — a presentational component, no new dependencies.

- [ ] **Step 1: Remove `searchProducts` from the API client**

Replace `src/api/productsApi.js` with:

```js
const BASE_URL = 'https://dummyjson.com';

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function fetchProducts({ limit = 10, skip = 0 } = {}) {
  return request(`/products?limit=${limit}&skip=${skip}`);
}
```

- [ ] **Step 2: Rewrite `useProducts` for client-side fetch/filter/paginate**

Replace `src/hooks/useProducts.js` with:

```js
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../api/productsApi';

const PAGE_SIZE = 10;
const CATALOG_SIZE = 194;

export function useProducts({ searchQuery, minPrice, maxPrice }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({ limit: CATALOG_SIZE, skip: 0 });
      setCatalog(data.products);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filtered = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase();
    const min = minPrice === '' || minPrice == null ? -Infinity : Number(minPrice);
    const max = maxPrice === '' || maxPrice == null ? Infinity : Number(maxPrice);
    return catalog.filter((product) => {
      const matchesQuery = query === '' || product.title.toLowerCase().includes(query);
      const matchesPrice = product.price >= min && product.price <= max;
      return matchesQuery && matchesPrice;
    });
  }, [catalog, searchQuery, minPrice, maxPrice]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, minPrice, maxPrice]);

  const products = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  const refresh = useCallback(() => {
    loadCatalog();
  }, [loadCatalog]);

  return { products, total: filtered.length, loading, error, loadMore, refresh };
}
```

- [ ] **Step 3: Create the price filter component**

Create `src/components/PriceFilter.js`:

```js
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../constants/colors';

export default function PriceFilter({ minPrice, maxPrice, onChangeMinPrice, onChangeMaxPrice, onClear }) {
  const hasFilter = minPrice !== '' || maxPrice !== '';

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Min $"
        placeholderTextColor={colors.muted}
        value={minPrice}
        onChangeText={onChangeMinPrice}
        keyboardType="numeric"
      />
      <Text style={styles.separator}>–</Text>
      <TextInput
        style={styles.input}
        placeholder="Max $"
        placeholderTextColor={colors.muted}
        value={maxPrice}
        onChangeText={onChangeMaxPrice}
        keyboardType="numeric"
      />
      {hasFilter && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 14,
  },
  separator: {
    marginHorizontal: 8,
    color: colors.muted,
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: Rewrite `ProductListScreen` for the new hook shape and the filter UI**

Replace `src/screens/ProductListScreen.js`:

```js
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProducts } from '../hooks/useProducts';
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

  const renderItem = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      />
    ),
    [navigation]
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
```

Note: this task's `ProductCard` usage is unchanged from before (no favorites props yet — Task 3 adds those). Don't add favorites-related props here; that would be scope creep into a later task.

- [ ] **Step 5: Delete the now-unused `LoadingFooter` component**

```bash
rm src/components/LoadingFooter.js
```

Confirm nothing else imports it:

```bash
grep -rn "LoadingFooter" src/
```

Expected: no output (no remaining references).

- [ ] **Step 6: Verify DummyJSON search accuracy is fixed (real API, no app needed)**

```bash
curl -s "https://dummyjson.com/products?limit=194" | node -e "
let data='';
process.stdin.on('data', d => data += d);
process.stdin.on('end', () => {
  const j = JSON.parse(data);
  const q = 'table';
  const matches = j.products.filter(p => p.title.toLowerCase().includes(q));
  console.log('title matches for \"table\":', matches.map(p => p.title));
});
"
```

Expected: only titles actually containing "table" (e.g. `Bedside Table African Cherry`, `Table Lamp`) — confirms the client-side filter logic (same substring/lowercase logic as `useProducts.js`) would correctly exclude unrelated items like "Chicken Meat".

- [ ] **Step 7: Verify the bundle compiles**

```bash
npx expo export --platform android
```

Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Fix inaccurate search and add price filter via client-side catalog filtering

DummyJSON's /products/search matched unrelated products (searching "table"
returned "Chicken Meat"). Fetch the 194-product catalog once and filter/
paginate client-side instead, which also enables an instant price filter.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Cart tab header (layout fix)

**Files:**
- Modify: `src/navigation/RootNavigator.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new. `Tab.Navigator`'s `screenOptions` no longer sets `headerShown: false` globally — later tasks adding new tabs (Task 3's Favorites tab) get a default header automatically unless they opt out.

- [ ] **Step 1: Scope `headerShown: false` to only the Products tab**

In `src/navigation/RootNavigator.js`, the current `RootNavigator` function is:

```js
export default function RootNavigator() {
  const { totalCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tab.Screen
        name="Products"
        component={ProductsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
          tabBarBadge: totalCount > 0 ? totalCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
}
```

Replace it with (moves `headerShown: false` out of `screenOptions` and into the Products `Tab.Screen`'s own `options`; nothing else changes):

```js
export default function RootNavigator() {
  const { totalCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tab.Screen
        name="Products"
        component={ProductsStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
          tabBarBadge: totalCount > 0 ? totalCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
}
```

Do not touch `ProductsStackNavigator`, the imports, or anything above `RootNavigator` in this file.

- [ ] **Step 2: Verify the bundle compiles**

```bash
npx expo export --platform android
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Give the Cart tab a native header so its content isn't flush against the top

headerShown:false was set globally on the Tab.Navigator; Products still had
a header because its nested Stack.Navigator provides its own, but Cart had
none at all, pushing content under the status bar. Scope headerShown:false
to only the Products tab instead.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wishlist / Favorites

**Files:**
- Create: `src/context/favoritesReducer.js`
- Create: `src/context/FavoritesContext.js`
- Create: `src/screens/FavoritesScreen.js`
- Modify: `src/components/ProductCard.js` (add heart icon overlay)
- Modify: `src/screens/ProductDetailScreen.js` (add heart button next to title)
- Modify: `src/navigation/RootNavigator.js` (register the Favorites tab)
- Modify: `src/screens/ProductListScreen.js` (pass favorites props to `ProductCard`)
- Modify: `App.js` (wrap with `FavoritesProvider`)

**Interfaces:**
- Consumes: `colors`, `formatPrice` (unchanged); `Tab`/`ProductsStack` navigators and `RootNavigator`'s current structure from Task 2's output (Products tab has `headerShown: false` in its own options, Cart tab unchanged).
- Produces: `useFavorites()` (named export from `src/context/FavoritesContext.js`) → `{ favorites: Product[], toggleFavorite(product), isFavorite(id) }`. `favorites` is a plain array of full product objects (not wrapped in `{product, qty}}` like cart — there's no quantity concept for favorites). `ProductCard`'s prop contract grows to `{ product, onPress, isFavorite, onToggleFavorite }` — **Task 4 (Gemini) does not touch `ProductCard`, so this is the final shape.**

- [ ] **Step 1: Create the pure favorites reducer**

Create `src/context/favoritesReducer.js`:

```js
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
```

- [ ] **Step 2: Create the context/provider/hook**

Create `src/context/FavoritesContext.js`:

```js
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
```

- [ ] **Step 3: Add the heart icon to `ProductCard`**

Replace `src/components/ProductCard.js`:

```js
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product, onPress, isFavorite, onToggleFavorite }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: product.thumbnail }} style={styles.image} resizeMode="cover" />
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={onToggleFavorite}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={20}
          color={isFavorite ? colors.danger : '#FFFFFF'}
        />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: colors.primarySoft,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 8,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 36,
  },
  price: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
});
```

- [ ] **Step 4: Add the heart button to `ProductDetailScreen`**

Replace `src/screens/ProductDetailScreen.js`:

```js
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import colors from '../constants/colors';
import { formatPrice } from '../utils/format';

export default function ProductDetailScreen({ route }) {
  const { product } = route.params;
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(product.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
    </ScrollView>
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
});
```

- [ ] **Step 5: Create the Favorites screen**

Create `src/screens/FavoritesScreen.js`:

```js
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
```

`navigation.navigate('Products', { screen: 'ProductDetail', params: { product: item } })` is react-navigation's standard pattern for navigating from one tab into a specific screen of a sibling tab's nested stack navigator — this is not a typo or shortcut, it's required because `FavoritesScreen` is a direct `Tab.Screen`, not nested inside the Products stack.

- [ ] **Step 6: Register the Favorites tab**

In `src/navigation/RootNavigator.js`, add the import:

```js
import FavoritesScreen from '../screens/FavoritesScreen';
```

And add a new `Tab.Screen` between the existing `"Products"` and `"Cart"` screens:

```js
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" color={color} size={size} />
          ),
        }}
      />
```

The full `Tab.Navigator` block should read, in order: `Products` (`headerShown: false` in its own options, from Task 2), then this new `Favorites` screen, then `Cart` (unchanged). Don't touch anything else in the file.

- [ ] **Step 7: Wire favorites props into `ProductListScreen`**

In `src/screens/ProductListScreen.js`, add the import:

```js
import { useFavorites } from '../context/FavoritesContext';
```

Add the hook call inside `ProductListScreen`, alongside the existing `useProducts` call:

```js
  const { isFavorite, toggleFavorite } = useFavorites();
```

Replace the `renderItem` callback with:

```js
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
```

Nothing else in this file changes.

- [ ] **Step 8: Wrap the app with `FavoritesProvider`**

Replace `App.js`:

```js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { CartProvider } from './src/context/CartContext';
import { FavoritesProvider } from './src/context/FavoritesContext';

export default function App() {
  return (
    <CartProvider>
      <FavoritesProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </FavoritesProvider>
    </CartProvider>
  );
}
```

- [ ] **Step 9: Verify the bundle compiles**

```bash
npx expo export --platform android
```

Expected: zero errors. If you see an error about `View` not being defined in `ProductDetailScreen.js`, you skipped the import fix called out in Step 4 — go back and add it.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add wishlist/favorites feature via useFavorites hook and a new tab

Mirrors the existing CartContext/cartReducer pattern (Context + useReducer).
Heart icon toggles favorite state on ProductCard and ProductDetailScreen;
a new Favorites tab lists favorited products with an empty state.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Gemini AI product advisor

**Files:**
- Create: `src/api/geminiApi.js`
- Modify: `src/screens/ProductDetailScreen.js` (add the AI Advisor button/card below Add to Cart)

**Interfaces:**
- Consumes: `product` (from `route.params`, already destructured in `ProductDetailScreen`); `colors` (unchanged).
- Produces: `getProductAdvice(product)` (named export from `src/api/geminiApi.js`) → `Promise<string>`, throws an `Error` with a readable `.message` on any failure (missing key, network error, non-2xx response, empty response). Nothing later depends on this — it's the final task.

- [ ] **Step 1: Create the Gemini API client**

Create `src/api/geminiApi.js`:

```js
const GEMINI_MODEL = 'gemini-2.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function getProductAdvice(product) {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY. Add it to your .env file.');
  }

  const prompt = `You are a shopping assistant. In 2-3 short sentences, summarize this product and say who it's best suited for.\n\nTitle: ${product.title}\nDescription: ${product.description}\nPrice: $${product.price}`;

  const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }
  return text.trim();
}
```

- [ ] **Step 2: Verify the real Gemini API call works (before wiring into the app)**

```bash
GEMINI_KEY=$(grep EXPO_PUBLIC_GEMINI_API_KEY .env | cut -d= -f2)
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Say OK if you can read this."}]}]}'
```

Expected: a JSON response containing `candidates[0].content.parts[0].text` with some text in it (e.g. `"OK"`). This confirms the API key in `.env` is valid and the endpoint/model id are correct — this was already verified once during planning, this step re-confirms nothing has changed.

- [ ] **Step 3: Add the AI Advisor UI to `ProductDetailScreen`**

Replace `src/screens/ProductDetailScreen.js` (this is the full file — it includes the favorites heart button from Task 3, plus the new AI Advisor section):

```js
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
    </ScrollView>
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
```

- [ ] **Step 4: Verify the bundle compiles**

```bash
npx expo export --platform android
```

Expected: zero errors. `process.env.EXPO_PUBLIC_GEMINI_API_KEY` is inlined by Expo's Metro config at bundle time (no extra babel plugin needed on SDK 54) — if the export fails specifically on that line, check that `.env` exists at the project root with that exact variable name.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add Gemini AI product advisor to the product detail screen

REST call to the generateContent endpoint (no SDK), reading the API key
from EXPO_PUBLIC_GEMINI_API_KEY. A failure here (missing key, network,
bad response) shows an inline error+retry and never blocks Add to Cart.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
