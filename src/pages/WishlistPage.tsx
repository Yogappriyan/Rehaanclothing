import React from 'react';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../types';

interface WishlistPageProps {
  products: Product[];
  onNavigate: (route: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  products,
  onNavigate,
  onQuickView,
}) => {
  const { wishlist, clearWishlist } = useWishlist();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex items-center justify-between pb-6 border-b border-[#E9DFD0] mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
            Saved Styles
          </span>
          <h1 className="font-editorial text-3xl text-[#292522] mt-1 font-normal">
            Your Wishlist ({wishlistedProducts.length})
          </h1>
        </div>

        {wishlistedProducts.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-xs text-[#766F68] hover:text-rose-600 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="py-20 text-center bg-white border border-[#E9DFD0] rounded-md space-y-4">
          <Heart className="w-12 h-12 text-[#9A8568] mx-auto opacity-70" />
          <h3 className="font-editorial text-xl text-[#292522]">Your Wishlist is Empty</h3>
          <p className="text-xs text-[#766F68] max-w-sm mx-auto">
            Tap the heart icon on any dress, kurti, or saree you adore to save it here for later.
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="px-6 py-2.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer"
          >
            Explore Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onNavigate={onNavigate}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}
    </div>
  );
};
