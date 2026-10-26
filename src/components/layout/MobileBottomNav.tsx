'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user } = useAuth();

  // Hide on product details, cart, and checkout pages
  const shouldHide =
    pathname.startsWith('/products/') ||
    pathname.startsWith('/product/') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout');

  if (shouldHide) {
    return null;
  }

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Categories',
      href: '/categories',
      icon: LayoutGrid,
      isActive: pathname.startsWith('/category') || pathname === '/categories',
    },
    {
      label: 'Wishlist',
      href: '/wishlist',
      icon: Heart,
      badge: wishlistCount > 0 ? wishlistCount : null,
      isActive: pathname.startsWith('/wishlist'),
    },
    {
      label: 'Bag',
      href: '/cart',
      icon: ShoppingBag,
      badge: cartCount > 0 ? cartCount : null,
      isActive: pathname.startsWith('/cart'),
    },
    {
      label: user ? 'Account' : 'Login',
      href: user ? '/profile' : '/login',
      icon: User,
      isActive:
        pathname.startsWith('/profile') ||
        pathname.startsWith('/account') ||
        pathname.startsWith('/login'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] pt-1 px-2"
    >
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-1 relative transition-colors ${
                item.isActive
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-orange-600 text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${item.isActive ? 'text-neutral-950' : 'text-neutral-500'}`}>
                {item.label}
              </span>
              {item.isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-orange-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
