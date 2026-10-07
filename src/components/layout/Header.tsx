'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { CitySelectorModal } from './CitySelectorModal';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  MapPin,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Package,
  Calendar,
  LogOut,
  Store,
  Compass,
} from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { user, profile, sellerProfile, signOut } = useAuth();
  const { selectedCity } = useCity();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const categories = [
    { name: 'All Collection', href: '/products' },
    { name: 'Rentals Only', href: '/products?type=rent' },
    { name: 'Bridal & Lehengas', href: '/category/bridal-lehengas' },
    { name: 'Gowns & Dresses', href: '/category/gowns-dresses' },
    { name: 'Sherwanis & Suits', href: '/category/sherwanis-suits' },
    { name: 'Tuxedos & Blazers', href: '/category/tuxedos-blazers' },
    { name: 'Jewellery & Sets', href: '/category/jewellery' },
    { name: 'Buy Now', href: '/products?type=sale' },
  ];

  return (
    <>
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
      />

      {/* Top micro-announcement bar */}
      <div className="bg-neutral-950 text-neutral-300 text-xs py-2 px-4 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              100% Sanitized & Dry-Cleaned Fashion
            </span>
            <span className="hidden md:inline text-neutral-500">|</span>
            <span className="hidden md:inline text-neutral-400">
              Free Doorstep Delivery & Reverse Pickup
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCityModalOpen(true)}
              className="inline-flex items-center gap-1 text-neutral-300 hover:text-white transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Delivering to:</span>
              <span className="font-semibold text-white underline decoration-emerald-500 underline-offset-2">
                {selectedCity}
              </span>
            </button>
            <span className="text-neutral-600">|</span>
            <Link
              href="/become-a-seller"
              className="hidden sm:inline text-neutral-400 hover:text-emerald-400 font-medium transition-colors"
            >
              Lend & Earn as Seller
            </Link>
          </div>
        </div>
      </div>

      {/* Main sticky navigation bar */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-neutral-200/80 py-3'
            : 'bg-white border-b border-neutral-100 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 sm:gap-8">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg"
              aria-label="Open navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 group shrink-0">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 group-hover:text-neutral-800 transition-colors">
                Blink<span className="text-emerald-600 font-sans">Wear</span><span className="text-emerald-500 font-sans text-xl sm:text-2xl font-bold">.in</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-neutral-900 text-neutral-200 px-1.5 py-0.5 rounded-sm">
                Rental
              </span>
            </Link>

            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-lg relative"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={`Search designer lehengas, sherwanis, tuxedos in ${selectedCity}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 text-neutral-900 placeholder-neutral-400 text-sm rounded-full pl-10 pr-24 py-2.5 border border-neutral-200 focus:outline-hidden focus:border-neutral-900 focus:bg-white transition-all shadow-2xs"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-neutral-950 text-white text-xs font-medium px-4 py-1.5 rounded-full hover:bg-neutral-800 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* City quick pill for mobile */}
              <button
                onClick={() => setIsCityModalOpen(true)}
                className="md:hidden flex items-center gap-1 text-xs bg-neutral-100 px-2.5 py-1.5 rounded-full text-neutral-800 font-medium"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {selectedCity}
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-full transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart / Bag */}
              <Link
                href="/cart"
                className="relative p-2 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded-full transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                {user ? (
                  <div>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-neutral-200 hover:border-neutral-300 text-neutral-800 transition-all text-sm font-medium"
                    >
                      <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-semibold uppercase">
                        {profile?.full_name ? profile.full_name.charAt(0) : user.email?.charAt(0) || 'U'}
                      </div>
                      <span className="hidden sm:inline max-w-[100px] truncate">
                        {profile?.full_name || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                    </button>

                    {isUserMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                        onMouseLeave={() => setIsUserMenuOpen(false)}
                      >
                        <div className="px-4 py-2.5 border-b border-neutral-100">
                          <p className="text-xs text-neutral-400 font-medium">Signed in as</p>
                          <p className="text-sm font-semibold text-neutral-900 truncate">
                            {profile?.full_name || user.email}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium mt-0.5">
                            City: {profile?.city || selectedCity}
                          </p>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/rentals"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                          >
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            My Rentals
                          </Link>
                          <Link
                            href="/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                          >
                            <Package className="w-4 h-4 text-neutral-500" />
                            My Orders
                          </Link>
                          <Link
                            href="/addresses"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-neutral-500" />
                            Saved Addresses
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                          >
                            <User className="w-4 h-4 text-neutral-500" />
                            Account Settings
                          </Link>
                        </div>

                        {profile?.is_seller ? (
                          <div className="border-t border-neutral-100 py-1">
                            <Link
                              href="/seller/dashboard"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-emerald-700 font-medium hover:bg-emerald-50 transition-colors"
                            >
                              <Store className="w-4 h-4" />
                              Seller Dashboard
                            </Link>
                          </div>
                        ) : (
                          <div className="border-t border-neutral-100 py-1">
                            <Link
                              href="/become-a-seller"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                            >
                              <Store className="w-4 h-4 text-neutral-500" />
                              Become a Seller
                            </Link>
                          </div>
                        )}

                        <div className="border-t border-neutral-100 pt-1">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              signOut();
                            }}
                            className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="text-xs sm:text-sm font-semibold text-neutral-800 hover:text-neutral-950 px-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      className="hidden sm:inline-block bg-neutral-950 text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full hover:bg-neutral-800 transition-colors shadow-2xs"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="mt-3 md:hidden">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder={`Search in ${selectedCity}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 text-neutral-900 placeholder-neutral-400 text-sm rounded-full pl-9 pr-20 py-2 border border-neutral-200 focus:outline-hidden focus:border-neutral-900"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-neutral-950 text-white text-xs px-3 py-1 rounded-full font-medium"
              >
                Go
              </button>
            </form>
          </div>
        </div>

        {/* Horizontal Category Navigation Bar */}
        <div className="hidden lg:block border-t border-neutral-100 mt-3 pt-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-between gap-6 overflow-x-auto scrollbar-none py-1 text-xs font-medium text-neutral-600">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="whitespace-nowrap hover:text-neutral-950 hover:font-semibold transition-all py-1 border-b-2 border-transparent hover:border-neutral-950"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-serif text-2xl font-black text-neutral-950"
              >
                Blink<span className="text-emerald-600 font-sans">Wear</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50/50 border-b border-emerald-100/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-neutral-600">City:</span>
                <span className="text-xs font-bold text-neutral-900">{selectedCity}</span>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsCityModalOpen(true);
                }}
                className="text-xs font-semibold text-emerald-700 underline"
              >
                Change
              </button>
            </div>

            <div className="p-4 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Browse Collections
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-950 hover:pl-2 transition-all border-b border-neutral-50"
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            <div className="mt-auto p-4 border-t border-neutral-100 space-y-2 bg-neutral-50">
              <Link
                href="/become-a-seller"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-900 shadow-2xs"
              >
                <Store className="w-4 h-4 text-emerald-600" />
                Become a BlinkWear Seller
              </Link>

              {user ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-rose-600"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 bg-white"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 bg-neutral-950 text-white rounded-xl text-xs font-semibold"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
