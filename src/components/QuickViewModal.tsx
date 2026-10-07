import React, { useState } from 'react';
import { X, Heart, ShoppingBag, ArrowRight, Check, Ruler } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { SizeGuideModal } from './SizeGuideModal';
import type { Product, ProductSize } from '../types';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onNavigate: (route: string, param?: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onNavigate,
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[0]?.name || ''
  );
  const [selectedSize, setSelectedSize] = useState<ProductSize>(() => {
    const firstAvailable = product.sizes?.find(
      (s) => (product.sizeStock?.[s] ?? 1) > 0
    );
    return firstAvailable || product.sizes?.[0] || 'Free Size';
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);

  const isFavorited = isInWishlist(product.id);
  const currentStock = product.sizeStock?.[selectedSize] ?? 5;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart({
      productId: product.id,
      productName: product.name,
      image: product.images?.[0] || product.thumbnail,
      price: product.salePrice || product.price,
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div
      id="quick-view-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="quick-view-dialog"
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#FAF8F4] w-full max-w-3xl rounded-md shadow-2xl border border-[#E9DFD0] overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#FAF8F4]/80 text-[#292522] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Gallery Preview */}
        <div className="relative aspect-3/4 md:aspect-auto h-72 md:h-full bg-[#F4EFE6] overflow-hidden">
          <img
            src={product.images?.[0] || product.thumbnail}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
          {product.salePrice && product.salePrice < product.price && (
            <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-[#9A8568] text-white text-[8px] sm:text-[10px] font-semibold px-1.5 py-0.5 sm:px-2.5 sm:py-1 uppercase tracking-wider rounded-xs shadow-2xs">
              SALE
            </span>
          )}
        </div>

        {/* Details & Selectors */}
        <div className="p-6 md:p-8 flex flex-col justify-between space-y-5 overflow-y-auto max-h-[85vh]">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#9A8568] font-semibold">
              {product.category}
            </span>
            <h2 className="font-editorial text-2xl font-normal text-[#292522] mt-1 leading-snug">
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-center gap-3 mt-3">
              {product.salePrice && product.salePrice < product.price ? (
                <>
                  <span className="text-xl font-semibold text-[#292522]">
                    ₹{product.salePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-[#766F68] line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.discountPercentage && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs font-medium">
                      Save {product.discountPercentage}%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xl font-medium text-[#292522]">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-xs text-[#766F68] leading-relaxed mt-3">
              {product.shortDescription || product.description}
            </p>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-[#292522] mb-1.5 uppercase tracking-wider">
                  Color: <span className="font-normal text-[#766F68]">{selectedColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                        selectedColor === c.name ? 'border-[#9A8568] scale-110' : 'border-[#FAF8F4]'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes & Stock status */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#292522] uppercase tracking-wider">
                    Select Size
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#9A8568] hover:text-[#292522] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      <Ruler className="w-3 h-3 text-[#9A8568]" />
                      <span>Size Guide</span>
                    </button>
                    <span
                      className={`text-[11px] font-medium ${
                        isOutOfStock ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {isOutOfStock ? 'Out of Stock' : `${currentStock} pieces left`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const stock = product.sizeStock?.[s] ?? 5;
                    const unavailable = stock <= 0;
                    return (
                      <button
                        key={s}
                        disabled={unavailable}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-xs border transition-all cursor-pointer ${
                          selectedSize === s
                            ? 'bg-[#9A8568] text-white border-[#9A8568]'
                            : unavailable
                            ? 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through cursor-not-allowed'
                            : 'bg-white text-[#292522] border-[#E9DFD0] hover:border-[#9A8568]'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!isOutOfStock && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-semibold text-[#292522] uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center border border-[#E9DFD0] rounded-xs bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1 text-sm text-[#766F68] hover:text-[#292522]"
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-medium text-[#292522]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="px-2.5 py-1 text-sm text-[#766F68] hover:text-[#292522]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-3 border-t border-[#E9DFD0]">
            <div className="flex items-center gap-3">
              <button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-4 text-xs font-semibold uppercase tracking-widest rounded-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : addedNotice
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#292522] hover:bg-[#9A8568] text-white'
                }`}
              >
                {addedNotice ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xs border transition-colors cursor-pointer ${
                  isFavorited
                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                    : 'border-[#E9DFD0] bg-white text-[#292522] hover:border-[#9A8568]'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                onNavigate('product-details', product.slug || product.id);
              }}
              className="w-full text-center text-xs text-[#766F68] hover:text-[#9A8568] font-medium tracking-wide flex items-center justify-center gap-1.5 py-1"
            >
              <span>View Full Details & Sizing Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category}
        productName={product.name}
      />
    </div>
  );
};
