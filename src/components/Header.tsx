import React, { useState, useEffect } from 'react';
import {
  Search as SearchIcon,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  Phone,
} from 'lucide-react';
import { Logo } from './Logo';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import type { BusinessSettings } from '../types';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string, param?: string) => void;
  settings: BusinessSettings;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  settings,
  onOpenSearch,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin } = useAuth();

  const totalCartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', route: 'home' },
    { label: 'Shop', route: 'shop' },
    { label: 'New Arrivals', route: 'new-arrivals' },
    { label: 'Collections', route: 'collections' },
    { label: 'Sale', route: 'sale' },
    { label: 'About', route: 'about' },
    { label: 'Contact', route: 'contact' },
  ];

  return (
    <>
      {/* Announcement Bar */}
      {settings.announcement && (
        <div
          id="announcement-bar"
          className="bg-[#9A8568] text-[#FAF8F4] text-xs py-2 px-4 text-center tracking-wider font-medium flex items-center justify-center gap-4 transition-all"
        >
          <span>{settings.announcement}</span>
          <span className="hidden md:inline-block opacity-40">|</span>
          <a
            href={`tel:${settings.phone}`}
            className="hidden md:inline-flex items-center gap-1.5 opacity-90 hover:opacity-100 underline decoration-white/30"
          >
            <Phone className="w-3 h-3" />
            <span>{settings.phone}</span>
          </a>
        </div>
      )}

      {/* Sticky Header */}
      <header
        id="main-header"
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF8F4]/95 backdrop-blur-md shadow-xs border-b border-[#E9DFD0]/60 py-2.5'
            : 'bg-[#FAF8F4] py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
          {/* LEFT: Logo links back to home */}
          <button
            id="nav-logo-btn"
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center gap-1.5 sm:gap-2 cursor-pointer focus:outline-hidden shrink-0"
            aria-label="Rehaan Clothing Home"
          >
            <Logo size={isScrolled ? 'sm' : 'md'} />
          </button>

          {/* CENTER: Desktop Navigation */}
          <nav id="desktop-nav" className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              const active = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  id={`nav-link-${link.route}`}
                  onClick={() => {
                    onNavigate(link.route);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`text-sm tracking-wide transition-colors duration-200 cursor-pointer relative py-1 ${
                    active
                      ? 'text-[#292522] font-semibold'
                      : 'text-[#766F68] hover:text-[#9A8568]'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#9A8568] animate-in fade-in" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Actions (Moved firmly to right, tight mobile spacing, sleek smaller icons) */}
          <div className="ml-auto flex items-center justify-end gap-1 sm:gap-2.5 md:gap-3 shrink-0">
            {/* Search */}
            <button
              id="header-search-btn"
              onClick={onOpenSearch}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center p-0 text-[#292522] hover:text-[#9A8568] transition-colors cursor-pointer rounded-full hover:bg-[#E9DFD0]/40 shrink-0"
              aria-label="Search clothing"
            >
              <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Wishlist */}
            <button
              id="header-wishlist-btn"
              onClick={() => onNavigate('wishlist')}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center p-0 text-[#292522] hover:text-[#9A8568] transition-colors cursor-pointer relative rounded-full hover:bg-[#E9DFD0]/40 shrink-0"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#9A8568] text-white text-[8px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Account */}
            <button
              id="header-account-btn"
              onClick={() => onNavigate('account')}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center p-0 text-[#292522] hover:text-[#9A8568] transition-colors cursor-pointer rounded-full hover:bg-[#E9DFD0]/40 relative shrink-0"
              aria-label="My Account"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              {user && (
                <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full ring-1 sm:ring-2 ring-white" />
              )}
            </button>

            {/* Cart */}
            <button
              id="header-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center p-0 text-[#292522] hover:text-[#9A8568] transition-colors cursor-pointer relative rounded-full hover:bg-[#E9DFD0]/40 shrink-0"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#292522] text-white text-[8px] sm:text-[10px] w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center font-bold">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center p-0 text-[#292522] hover:text-[#9A8568] transition-colors cursor-pointer rounded-full hover:bg-[#E9DFD0]/40 shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5 sm:w-6 sm:h-6" /> : <Menu className="w-4.5 h-4.5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="lg:hidden bg-[#FAF8F4] border-b border-[#E9DFD0] px-6 py-6 space-y-4 animate-in slide-in-from-top duration-300 shadow-md"
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <button
                  key={link.route}
                  onClick={() => {
                    onNavigate(link.route);
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`text-left text-base py-2 font-medium tracking-wide transition-colors ${
                    currentRoute === link.route ? 'text-[#9A8568] font-bold' : 'text-[#292522]'
                  }`}
                >
                  {link.label}
                </button>
              ))}

              <div className="pt-2 border-t border-[#E9DFD0]/80 space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#766F68] font-semibold">
                  Categories
                </span>
                <div className="grid grid-cols-2 gap-2 text-sm text-[#766F68]">
                  {['Dresses', 'Kurtis', 'Sarees', 'Western Wear', 'Ethnic Wear', 'Co-ord Sets'].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          onNavigate('shop', cat);
                          setMobileMenuOpen(false);
                        }}
                        className="text-left py-1 hover:text-[#9A8568]"
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E9DFD0]/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    onNavigate('account');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium text-[#292522] flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-[#9A8568]" />
                  <span>{user ? user.displayName || 'My Account' : 'Sign In / Account'}</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs font-semibold px-3 py-1 bg-[#9A8568] text-white rounded-full"
                  >
                    Admin Panel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
