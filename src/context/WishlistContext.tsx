'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import type { WishlistItemWithProduct } from '@/types/database';

interface WishlistContextType {
  wishlistItems: WishlistItemWithProduct[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<{ success: boolean; isWishlisted?: boolean; error?: string }>;
  itemCount: number;
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistItems: [],
  isInWishlist: () => false,
  toggleWishlist: async () => ({ success: false }),
  itemCount: 0,
  isLoading: false,
  refreshWishlist: async () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createClient();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wishlist_items')
        .select(`
          *,
          product:products (
            *,
            product_images (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wishlist:', error);
      } else if (data) {
        setWishlistItems(data as unknown as WishlistItemWithProduct[]);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlistItems.some((item) => item.product_id === productId);
    },
    [wishlistItems]
  );

  const toggleWishlist = async (
    productId: string
  ): Promise<{ success: boolean; isWishlisted?: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Please sign in to save items to your wishlist' };
    }

    try {
      const existing = wishlistItems.find((item) => item.product_id === productId);

      if (existing) {
        const { error } = await supabase
          .from('wishlist_items')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;

        setWishlistItems((prev) => prev.filter((item) => item.id !== existing.id));
        return { success: true, isWishlisted: false };
      } else {
        const { data, error } = await supabase
          .from('wishlist_items')
          .insert({
            user_id: user.id,
            product_id: productId,
          })
          .select(`
            *,
            product:products (
              *,
              product_images (*)
            )
          `)
          .single();

        if (error) throw error;

        if (data) {
          setWishlistItems((prev) => [data as unknown as WishlistItemWithProduct, ...prev]);
        }
        return { success: true, isWishlisted: true };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update wishlist';
      return { success: false, error: errorMsg };
    }
  };

  const itemCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isInWishlist,
        toggleWishlist,
        itemCount,
        isLoading,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
