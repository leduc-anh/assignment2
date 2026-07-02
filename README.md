# Assignment 2 — E-Commerce Product App

React Native/Expo app for browsing products with pagination and search, and managing a
shopping cart with live totals.

## Features

- Bottom-tab navigation: Products (list → detail) and Cart, with a live item-count badge.
- Product list with infinite-scroll pagination and debounced search (DummyJSON API).
- Product detail screen: image, title, description, price, Add to Cart.
- Cart screen: quantity controls, remove, live total price and item count.
- Cart state via Context API + `useReducer` (`useCart` hook).
- Loading, error (with retry), and empty states on both product list and cart.

## Run

```bash
npm install
npm start
```

Open the app with Expo Go, Android emulator, or iOS simulator.
