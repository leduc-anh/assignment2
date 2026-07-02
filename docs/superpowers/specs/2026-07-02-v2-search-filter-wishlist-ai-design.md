# Assignment 2 v2 — Accurate Search, Price Filter, Cart Layout Fix, Wishlist, Gemini AI Advisor

**Date:** 2026-07-02
**Status:** Approved

## Goal

Fix two reported defects (search returning unrelated products, Cart screen content
flush against the top of the device) and add three features requested as a follow-up:
a price filter, a wishlist/favorites tab, and a Gemini-powered "AI advisor" on the
product detail screen.

## Root cause investigation

Verified directly against the live API before designing the fix:

- `GET https://dummyjson.com/products/search?q=table` returns 41 results, but only 2
  ("Bedside Table African Cherry", "Table Lamp") actually contain "table" in the title —
  the rest ("Chicken Meat", "Cooking Oil", "Calvin Klein CK One", ...) are unrelated.
  DummyJSON's search endpoint matches loosely across multiple fields, not just title.
- The full catalog is only 194 products, and `GET /products?limit=194` returns ~300KB —
  small enough to fetch once per session instead of fighting the unreliable search API.
- `RootNavigator`'s `Tab.Navigator` currently sets `headerShown: false` in its shared
  `screenOptions`, which applies to every tab. The Products tab still gets a header
  because it renders a nested `Stack.Navigator` with its own header. The Cart tab is a
  bare `Tab.Screen` with no nested stack, so it has no header at all — its content starts
  directly under the status bar/notch with no top inset, which is the "pushed to the top"
  bug.

## Change 1: Client-side catalog fetch, filter, and pagination

Replace `useProducts`'s server-driven pagination with a fetch-once, filter-and-paginate-
client-side model:

- On mount, fetch the entire catalog once: `fetchProducts({ limit: 194, skip: 0 })` (one
  request, cached in a ref for the component's lifetime — not refetched on every
  search/filter change).
- Derive the visible list via `useMemo` over the cached catalog: filter by
  `title.toLowerCase().includes(query.toLowerCase())` when a search query is present, and
  by `price >= minPrice && price <= maxPrice` when a price filter is active. Both filters
  compose (AND).
- Paginate the *filtered* result client-side: track a `visibleCount` (starts at 10,
  `PAGE_SIZE`), `loadMore()` increases it by `PAGE_SIZE` (clamped to the filtered length),
  no network call involved.
- `loading` only applies to the one-time initial catalog fetch; `error` covers that fetch
  failing (with a Retry that re-fetches the catalog). There is no more per-page network
  error state, since pagination no longer hits the network — this removes the
  footer-retry/race-condition complexity from `useProducts` v1 entirely.
- `productsApi.js` keeps `fetchProducts`; `searchProducts` (the DummyJSON
  `/products/search` endpoint) is no longer used and is removed — search is now a pure
  client-side title filter over the cached catalog.

## Change 2: Price filter

- A collapsible filter row below `SearchBar`, toggled by a "Filter" button next to the
  search input. Two numeric `TextInput`s (Min / Max price). Empty means unbounded on that
  side.
- Filtering is applied live (no explicit "Apply" button needed — it's an in-memory
  `useMemo`, cheap enough to run on every keystroke). A "Clear filter" affordance resets
  both fields.
- Lives in `ProductListScreen`, feeding `minPrice`/`maxPrice` state into the same
  client-side filter `useMemo` described in Change 1.

## Change 3: Cart tab header (layout fix)

- Remove `headerShown: false` from the `Tab.Navigator`'s shared `screenOptions`.
- Set `headerShown: false` explicitly only on the **Products** `Tab.Screen`'s own
  `options` (since its nested stack already renders a header — avoids a double header).
- The Cart tab then gets react-navigation's default header with title "Cart", which
  handles safe-area insets automatically. No manual margin/padding hack needed.

## Change 4: Wishlist / Favorites

- New `src/context/FavoritesContext.js` + `src/context/favoritesReducer.js`, mirroring
  the existing `CartContext`/`cartReducer` pattern: `useFavorites()` hook exposing
  `favoriteIds` (a `Set`/map of product ids), `toggleFavorite(product)`,
  `isFavorite(id)`, `favorites` (array of favorited product objects).
- `FavoritesProvider` wraps the app alongside `CartProvider` in `App.js`.
- A heart-icon overlay (top-right corner) on `ProductCard` and a heart button on
  `ProductDetailScreen`, both calling `toggleFavorite(product)` — filled heart when
  favorited, outline otherwise.
- New third bottom tab, **"Favorites"**, showing `FavoritesScreen`: a grid of favorited
  products (reusing `ProductCard`, navigating into the same `ProductDetail` route), with
  `EmptyState` ("No favorites yet") when empty. In-memory only, matching Cart's current
  (non-persisted) behavior — no AsyncStorage in this pass.

## Change 5: Gemini AI product advisor

- New `src/api/geminiApi.js`: a thin `fetch` wrapper calling the Gemini REST API's
  `models/{model}:generateContent` endpoint (`https://generativelanguage.googleapis.com/v1beta/`)
  with the API key as a query param, sending the product's title/description/price as a
  prompt and asking for a 2-3 sentence summary plus a "best suited for" recommendation.
  Exact model id is confirmed against current Gemini API docs at implementation time
  (a current stable flash-tier model, e.g. `gemini-2.0-flash` or newer) rather than
  frozen here, since model availability changes over time. No SDK dependency — a single
  REST call keeps this consistent with the project's existing API-client pattern
  (`productsApi.js`).
- API key read from `process.env.EXPO_PUBLIC_GEMINI_API_KEY` (Expo's standard
  client-exposed env var convention — prefixed vars are inlined at build time). A
  `.env.example` file documents the variable name; the real `.env` is gitignored and never
  committed.
- On `ProductDetailScreen`, a "✨ AI Advisor" button below "Add to Cart". Tapping it calls
  the Gemini API, shows a small loading spinner in place of the button while waiting, then
  renders the returned text in a card. Errors (missing key, network failure, API error)
  show an inline message with a Retry button — this is an optional enhancement, not core
  purchase flow, so a failure here must never block Add to Cart or navigation.

## Out of scope (this pass)

Maps integration, ImagePicker/visual search, AsyncStorage persistence for
cart/favorites/catalog cache — all still deferred, consistent with the original spec's
bonus scoping.

## Verification plan

Manual, via `npx expo start` + Expo Go (no emulator available in this environment, same
constraint as the original build):

1. Search "table" — only titles containing "table" (case-insensitive) appear; "Chicken
   Meat" and similarly unrelated items do not.
2. Set a price filter (e.g. min 20, max 50) — only in-range products show, combined
   correctly with an active search query.
3. Open the Cart tab (with items or empty) — a "Cart" header is visible at the top, content
   is not flush against the status bar.
4. Tap the heart icon on a product card and on its detail screen — it fills in, the
   product appears on the Favorites tab; un-favoriting removes it, and an empty
   favorites list shows the empty state.
5. On a product detail screen, tap "AI Advisor" — a summary appears within a few seconds;
   test once with an intentionally invalid key to confirm the error+retry path doesn't
   crash or block Add to Cart.
