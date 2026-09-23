import React, { useState } from 'react';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import type { Product, ProductSize } from '../types';

interface ProductCardProps {
  product: Product;
  onNavigate: (route: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  onQuickView,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isFavorited = isInWishlist(product.id);
  const hasMultipleImages = product.images && product.images.length > 1;
  const primaryImg = product.images?.[0] || product.thumbnail || '/placeholder-fashion.jpg';
  const secondaryImg = hasMultipleImages ? product.images[1] : primaryImg;

  // Calculate stock availability
  const totalStock = product.sizeStock
    ? Object.values(product.sizeStock).reduce((a, b) => a + b, 0)
    : 10;
  const isOutOfStock = totalStock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    // Pick first available size
    const availableSizes = product.sizes?.filter(
      (s) => (product.sizeStock?.[s] ?? 1) > 0
    ) || ['Free Size'];
    const selectedSize = (availableSizes[0] as ProductSize) || 'Free Size';

    addToCart({
      productId: product.id,
      productName: product.name,
      image: primaryImg,
      price: product.salePrice || product.price,
      size: selectedSize,
      color: product.colors?.[0]?.name,
      quantity: 1,
    });
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onNavigate('product-details', product.slug || product.id)}
      className="group relative flex flex-col bg-[#FAF8F4] border border-[#E9DFD0]/70 rounded-md overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
    >
      {/* Visual Image Container */}
      <div className="relative aspect-3/4 w-full overflow-hidden bg-[#F4EFE6]">
        {/* Main image */}
        <img
          src={isHovered && hasMultipleImages ? secondaryImg : primaryImg}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover object-center transition-all duration-700 ease-out ${
            isHovered ? 'scale-104' : 'scale-100'
          }`}
        />

        {/* Subtle taupe accent line on hover */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-[2px] bg-[#9A8568] transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.salePrice && product.salePrice < product.price && (
            <span className="bg-[#9A8568] text-[#FAF8F4] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-xs">
              SALE {product.discountPercentage ? `-${product.discountPercentage}%` : ''}
            </span>
          )}
          {product.newArrival && !isOutOfStock && (
            <span className="bg-[#FAF8F4]/90 backdrop-blur-xs text-[#292522] border border-[#E9DFD0] text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-xs font-medium">
              NEW
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-[#292522]/85 text-[#FAF8F4] text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-xs font-medium">
              OUT OF STOCK
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          id={`wishlist-toggle-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 z-20 cursor-pointer ${
            isFavorited
              ? 'bg-[#FAF8F4] text-rose-600 shadow-sm opacity-100'
              : 'bg-[#FAF8F4]/80 text-[#292522] hover:bg-[#FAF8F4] md:opacity-0 group-hover:opacity-100'
          }`}
          aria-label="Toggle Wishlist"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Quick View & Add to Bag Floating Action Bar */}
        <div
          className={`absolute inset-x-3 bottom-3 hidden md:flex items-center gap-2 transition-all duration-300 z-20 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 pointer-events-none'
          }`}
        >
          <button
            id={`quick-view-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex-1 bg-[#FAF8F4]/95 hover:bg-white text-[#292522] border border-[#E9DFD0] text-xs font-medium py-2.5 px-3 rounded-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#9A8568]" />
            <span>Quick View</span>
          </button>

          {!isOutOfStock && (
            <button
              id={`quick-add-btn-${product.id}`}
              onClick={handleQuickAdd}
              className="bg-[#292522] hover:bg-[#9A8568] text-white p-2.5 rounded-xs shadow-xs transition-colors cursor-pointer"
              title="Add to Bag"
              aria-label="Quick Add to Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3.5 flex flex-col flex-grow justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#766F68] uppercase tracking-wider mb-1">
            <span>{product.category}</span>
            {product.fabric && <span className="truncate max-w-[110px]">{product.fabric}</span>}
          </div>
          <h3 className="font-editorial text-base font-normal text-[#292522] leading-snug line-clamp-1 group-hover:text-[#9A8568] transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-2 pt-1">
          {product.salePrice && product.salePrice < product.price ? (
            <>
              <span className="text-sm font-semibold text-[#292522]">
                ₹{product.salePrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#766F68] line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-[#292522]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Available Sizes preview */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-[#766F68] pt-1">
            <span className="opacity-70">Sizes:</span>
            <div className="flex items-center gap-1 font-medium">
              {product.sizes.slice(0, 4).map((s) => {
                const isSizeAvailable = (product.sizeStock?.[s] ?? 1) > 0;
                return (
                  <span
                    key={s}
                    className={`px-1 py-0.2 rounded-xs ${
                      isSizeAvailable ? 'text-[#292522]' : 'line-through text-[#766F68]/50'
                    }`}
                  >
                    {s}
                  </span>
                );
              })}
              {product.sizes.length > 4 && <span>+{product.sizes.length - 4}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
