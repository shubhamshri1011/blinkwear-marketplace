'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import type { CartItemWithProduct, PurchaseType } from '@/types/database';

interface AddToCartParams {
  productId: string;
  purchaseType: PurchaseType;
  quantity?: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  rentalDays?: number | null;
}

interface CartContextType {
  cartItems: CartItemWithProduct[];
  itemCount: number;
  isLoading: boolean;
  addToCart: (params: AddToCartParams) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  itemCount: 0,
  isLoading: false,
  addToCart: async () => ({ success: false }),
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createClient();

  const fetchCart = useCallback(async () => {
    if (!user) {
      // Local storage guest cart
      try {
        const saved = localStorage.getItem('blinkwear_guest_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCartItems(parsed);
        } else {
          setCartItems([]);
        }
      } catch {
        setCartItems([]);
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products (
            id, seller_id, category_id, subcategory_id, title, description, brand,
            size, color, condition, listing_type, sale_price, discount_price,
            rent_price_per_day, security_deposit, delivery_charge, city, status,
            view_count, stock_quantity, min_rental_days, max_rental_days, search_tags,
            video_url, featured, featured_sort_order, locked_until, created_at, updated_at,
            product_images (id, image_url, sort_order)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cart:', error);
      } else if (data) {
        setCartItems(data as unknown as CartItemWithProduct[]);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (params: AddToCartParams): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Please sign in to add items to your bag' };
    }

    try {
      // Check if product exists and is active
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('id, title, status, listing_type, stock_quantity')
        .eq('id', params.productId)
        .single();

      if (prodErr || !product || product.status !== 'active') {
        return { success: false, error: 'Product is unavailable' };
      }

      if (params.purchaseType === 'buy' && product.listing_type === 'rent') {
        return { success: false, error: 'This item is available for rent only' };
      }
      if (params.purchaseType === 'rent' && product.listing_type === 'sale') {
        return { success: false, error: 'This item is available for purchase only' };
      }

      // Check if duplicate exists for buy item
      if (params.purchaseType === 'buy') {
        const existing = cartItems.find(
          (c) =>
            c.product_id === params.productId &&
            c.purchase_type === 'buy' &&
            c.selected_size === (params.selectedSize ?? null) &&
            c.selected_color === (params.selectedColor ?? null)
        );

        if (existing) {
          const newQty = existing.quantity + (params.quantity || 1);
          if (product.stock_quantity != null && newQty > product.stock_quantity) {
            return { success: false, error: `Only ${product.stock_quantity} available in stock` };
          }
          await supabase
            .from('cart_items')
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          await fetchCart();
          return { success: true };
        }
      }

      // Check if duplicate exists for rental item (same product, dates, variant)
      if (params.purchaseType === 'rent') {
        const existing = cartItems.find(
          (c) =>
            c.product_id === params.productId &&
            c.purchase_type === 'rent' &&
            c.selected_size === (params.selectedSize ?? null) &&
            c.selected_color === (params.selectedColor ?? null) &&
            (c.rental_start_date ?? null) === (params.rentalStartDate ?? null) &&
            (c.rental_end_date ?? null) === (params.rentalEndDate ?? null)
        );

        if (existing) {
          // Retain or update existing row
          await supabase
            .from('cart_items')
            .update({
              rental_start_date: params.rentalStartDate ?? existing.rental_start_date,
              rental_end_date: params.rentalEndDate ?? existing.rental_end_date,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          await fetchCart();
          return { success: true };
        }
      }

      const { error } = await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: params.productId,
        purchase_type: params.purchaseType,
        quantity: params.quantity || 1,
        selected_size: params.selectedSize ?? null,
        selected_color: params.selectedColor ?? null,
        rental_start_date: params.rentalStartDate ?? null,
        rental_end_date: params.rentalEndDate ?? null,
      });

      if (error) {
        // If conflict occurs due to concurrent insert, refresh and succeed gracefully
        if (error.code === '23505') {
          await fetchCart();
          return { success: true };
        }
        return { success: false, error: error.message };
      }

      await fetchCart();
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add item to bag';
      return { success: false, error: errorMsg };
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!user) {
      setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
      return;
    }

    try {
      await supabase.from('cart_items').delete().eq('id', cartItemId);
      await fetchCart();
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    if (!user) {
      setCartItems((prev) =>
        prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i))
      );
      return;
    }

    try {
      await supabase
        .from('cart_items')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', cartItemId);
      await fetchCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const clearCart = async () => {
    if (!user) {
      setCartItems([]);
      localStorage.removeItem('blinkwear_guest_cart');
      return;
    }

    try {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
