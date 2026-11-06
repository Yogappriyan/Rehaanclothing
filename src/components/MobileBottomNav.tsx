import React from 'react';
import { Home, ShoppingBag, Heart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentRoute: string;
  onNavigate: (route: string, param?: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const { items, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const isHome = currentRoute === 'home' || currentRoute === '';
  const isShop = currentRoute === 'shop' || currentRoute === 'new-arrivals' || currentRoute === 'collections';
  const isWishlist = currentRoute === 'wishlist';
  const isProfile = currentRoute === 'account' || currentRoute === 'admin' || currentRoute === 'orders';

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E9DFD0] shadow-lg lg:hidden px-2 py-1.5 transition-all select-none"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-around">
        {/* 1. HOME */}
        <button
          type="button"
          id="mobile-nav-home"
          onClick={() => {
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 px-1 cursor-pointer group"
          aria-label="Home"
        >
          <div
            className={`w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isHome
                ? 'bg-[#F4EFE6] text-[#9A8568] shadow-2xs'
                : 'text-[#766F68] group-hover:text-[#292522]'
            }`}
          >
            <Home className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span
            className={`text-[9.5px] uppercase font-bold tracking-wider mt-0.5 transition-colors ${
              isHome ? 'text-[#9A8568]' : 'text-[#8E877F] group-hover:text-[#292522]'
            }`}
          >
            HOME
          </span>
        </button>

        {/* 2. SHOP */}
        <button
          type="button"
          id="mobile-nav-shop"
          onClick={() => {
            onNavigate('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 px-1 cursor-pointer group"
          aria-label="Shop"
        >
          <div
            className={`w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isShop
                ? 'bg-[#F4EFE6] text-[#9A8568] shadow-2xs'
                : 'text-[#766F68] group-hover:text-[#292522]'
            }`}
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span
            className={`text-[9.5px] uppercase font-bold tracking-wider mt-0.5 transition-colors ${
              isShop ? 'text-[#9A8568]' : 'text-[#8E877F] group-hover:text-[#292522]'
            }`}
          >
            SHOP
          </span>
        </button>

        {/* 3. WISHLIST */}
        <button
          type="button"
          id="mobile-nav-wishlist"
          onClick={() => {
            onNavigate('wishlist');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 px-1 cursor-pointer group relative"
          aria-label="Wishlist"
        >
          <div
            className={`w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
              isWishlist
                ? 'bg-[#F4EFE6] text-[#9A8568] shadow-2xs'
                : 'text-[#766F68] group-hover:text-[#292522]'
            }`}
          >
            <Heart className={`w-5 h-5 stroke-[1.8] ${isWishlist ? 'fill-[#9A8568]' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#9A8568] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {wishlist.length}
              </span>
            )}
          </div>
          <span
            className={`text-[9.5px] uppercase font-bold tracking-wider mt-0.5 transition-colors ${
              isWishlist ? 'text-[#9A8568]' : 'text-[#8E877F] group-hover:text-[#292522]'
            }`}
          >
            WISHLIST
          </span>
        </button>

        {/* 4. PROFILE */}
        <button
          type="button"
          id="mobile-nav-profile"
          onClick={() => {
            onNavigate('account');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 px-1 cursor-pointer group"
          aria-label="Profile"
        >
          <div
            className={`w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
              isProfile
                ? 'bg-[#F4EFE6] text-[#9A8568] shadow-2xs'
                : 'text-[#766F68] group-hover:text-[#292522]'
            }`}
          >
            <User className="w-5 h-5 stroke-[1.8]" />
            {user && (
              <span className="absolute bottom-1 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
            )}
          </div>
          <span
            className={`text-[9.5px] uppercase font-bold tracking-wider mt-0.5 transition-colors ${
              isProfile ? 'text-[#9A8568]' : 'text-[#8E877F] group-hover:text-[#292522]'
            }`}
          >
            PROFILE
          </span>
        </button>

        {/* 5. BAG */}
        <button
          type="button"
          id="mobile-nav-bag"
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-1 cursor-pointer group relative"
          aria-label="Shopping Bag"
        >
          <div className="w-11 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 relative text-[#766F68] group-hover:text-[#292522]">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {totalCartCount > 0 && (
              <span className="absolute -top-0.5 right-1 bg-[#9A8568] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {totalCartCount}
              </span>
            )}
          </div>
          <span className="text-[9.5px] uppercase font-bold tracking-wider mt-0.5 text-[#8E877F] group-hover:text-[#292522] transition-colors">
            BAG
          </span>
        </button>
      </div>
    </nav>
  );
};
