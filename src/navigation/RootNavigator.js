import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import colors from '../constants/colors';
import { useCart } from '../context/CartContext';

const ProductsStack = createNativeStackNavigator();

function ProductsStackNavigator() {
  return (
    <ProductsStack.Navigator>
      <ProductsStack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ title: 'Products' }}
      />
      <ProductsStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params.product.title })}
      />
    </ProductsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

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
