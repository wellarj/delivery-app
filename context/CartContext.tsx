import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, notes?: string) => void;
  updateCartItem: (tempId: string, quantity: number, notes?: string) => void;
  removeFromCart: (tempId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart_items');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart");
      }
    }
  }, []);

  // Save cart to local storage on change
  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number, notes: string = '') => {
    const newItem: CartItem = {
      tempId: Date.now().toString() + Math.random().toString(),
      product,
      quantity,
      notes
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateCartItem = (tempId: string, quantity: number, notes?: string) => {
    setItems(prev => prev.map(item => {
        if (item.tempId === tempId) {
            return { ...item, quantity, notes: notes !== undefined ? notes : item.notes };
        }
        return item;
    }));
  };

  const removeFromCart = (tempId: string) => {
    setItems(prev => prev.filter(item => item.tempId !== tempId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartTotal = items.reduce((acc, item) => {
    return acc + (item.product.price * item.quantity);
  }, 0);

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, updateCartItem, removeFromCart, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);