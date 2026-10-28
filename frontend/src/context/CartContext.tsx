import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart } from '../types';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: number, quantity?: number, variantId?: number | null) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  notification: string | null;
  clearNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const clearNotification = () => setNotification(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const refreshCart = async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const data = await cartService.getCart();
      setCart(data);
    } catch {
      // User might be unauthenticated or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const addToCart = async (productId: number, quantity: number = 1, variantId?: number | null) => {
    if (!user) {
      showNotification('Please log in to add items to your cart.');
      return;
    }
    try {
      setLoading(true);
      const updatedCart = await cartService.addToCart(productId, quantity, variantId);
      setCart(updatedCart);
      showNotification('Item successfully added to cart!');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to add item to cart';
      showNotification(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      setLoading(true);
      const updatedCart = await cartService.updateCartItem(itemId, quantity);
      setCart(updatedCart);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update item quantity';
      showNotification(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      setLoading(true);
      const updatedCart = await cartService.removeCartItem(itemId);
      setCart(updatedCart);
      showNotification('Item removed from cart.');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to remove item';
      showNotification(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      const updatedCart = await cartService.clearCart();
      setCart(updatedCart);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to clear cart';
      showNotification(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cartCount = cart?.total_items || 0;
  const cartSubtotal = Number(cart?.subtotal || 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount,
        cartSubtotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        notification,
        clearNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
