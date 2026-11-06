import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Heart,
  ShoppingBag,
  Share2,
  Check,
  MessageCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Maximize2,
  X,
  Ruler,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { SizeGuideModal } from '../components/SizeGuideModal';
import { ProductCard } from '../components/ProductCard';
import { ImageWithFallback } from '../components/ImageWithFallback';
import type { Product, ProductSize, BusinessSettings } from '../types';

interface ProductDetailsProps {
  slugOrId: string;
  products: Product[];
  settings: BusinessSettings;
  onNavigate: (route: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  slugOrId,
  products,
  settings,
  onNavigate,
  onQuickView,
}) => {
  // Bulletproof product resolution: matches ID, slug, case-insensitive variants, or name slug
  const product = useMemo(() => {
    if (!slugOrId) return null;
    const clean = decodeURIComponent(slugOrId).trim();
    const cleanLower = clean.toLowerCase();

    // 1. Exact ID match (case-sensitive)
    let found = products.find((p) => p.id === clean);
    if (found) return found;

    // 2. Exact slug match
    found = products.find((p) => p.slug === clean);
    if (found) return found;

    // 3. Case-insensitive slug match
    found = products.find((p) => p.slug && p.slug.toLowerCase() === cleanLower);
    if (found) return found;

    // 4. Case-insensitive ID match
    found = products.find((p) => p.id && p.id.toLowerCase() === cleanLower);
    if (found) return found;

    // 5. Match by exact product name
    found = products.find((p) => p.name && p.name.toLowerCase() === cleanLower);
    if (found) return found;

    // 6. Match by slugified name (e.g. if slug differed slightly)
    found = products.find((p) => {
      if (!p.name) return false;
      const nameSlug = p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return nameSlug === cleanLower;
    });
    if (found) return found;

    // 7. Substring slug matching
    found = products.find(
      (p) =>
        (p.slug && cleanLower.includes(p.slug.toLowerCase())) ||
        (p.slug && p.slug.toLowerCase().includes(cleanLower))
    );
    if (found) return found;

    return null;
  }, [slugOrId, products]);

  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colors?.[0]?.name || ''
  );
  const [selectedSize, setSelectedSize] = useState<ProductSize>(() => {
    const firstAvailable = product?.sizes?.find(
      (s) => (product?.sizeStock?.[s] ?? 1) > 0
    );
    return firstAvailable || product?.sizes?.[0] || 'Free Size';
  });
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Carousel & scroll references for "You May Also Like"
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Reset product configuration and scroll to top when switching to a different product
  useEffect(() => {
    setActiveImageIndex(0);
    if (product) {
      setSelectedColor(product.colors?.[0]?.name || '');
      const firstAvailable = product.sizes?.find(
        (s) => (product.sizeStock?.[s] ?? 1) > 0
      );
      setSelectedSize(firstAvailable || product.sizes?.[0] || 'Free Size');
      setQuantity(1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product?.id, product?.slug, slugOrId]);

  // Suggest products similar to the currently viewed item
  const similarProducts = useMemo(() => {
    if (!product) return [];

    // 1. Same category first
    const sameCat = products.filter(
      (p) => p.id !== product.id && p.category === product.category
    );

    // 2. Same fabric or occasion
    const sameFabricOrOccasion = products.filter(
      (p) =>
        p.id !== product.id &&
        p.category !== product.category &&
        ((product.fabric && p.fabric === product.fabric) ||
          (product.occasion && p.occasion === product.occasion))
    );

    // 3. Other featured or trending items to ensure a rich scrolling selection
    const others = products.filter(
      (p) =>
        p.id !== product.id &&
        !sameCat.some((s) => s.id === p.id) &&
        !sameFabricOrOccasion.some((s) => s.id === p.id)
    );

    const merged = [...sameCat, ...sameFabricOrOccasion, ...others];
    return merged.slice(0, 12);
  }, [product, products]);

  const totalPages = Math.max(1, Math.ceil(similarProducts.length / 3));

  const checkScrollState = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      const page = Math.round((scrollLeft / maxScroll) * (totalPages - 1));
      setActivePageIndex(page);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScrollState();
    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState);
    return () => {
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [similarProducts, totalPages]);

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.85;
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.85;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToPage = (pageIdx: number) => {
    if (scrollContainerRef.current) {
      const maxScroll =
        scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
      if (maxScroll > 0) {
        const target = (pageIdx / (totalPages - 1)) * maxScroll;
        scrollContainerRef.current.scrollTo({ left: target, behavior: 'smooth' });
      }
    }
  };

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="font-editorial text-2xl text-[#292522]">Product Not Found</h2>
        <p className="text-xs text-[#766F68]">
          The style you are looking for may have been updated or moved.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-[#292522] text-white text-xs uppercase tracking-wider rounded-xs"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);
  const currentStock = product.sizeStock?.[selectedSize] ?? 5;
  const isOutOfStock = currentStock <= 0;
  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.thumbnail || '/placeholder-fashion.jpg'];

  const handleAddToCart = (openBag = true) => {
    if (isOutOfStock) return;
    addToCart({
      productId: product.id,
      productName: product.name,
      image: galleryImages[0],
      price: product.salePrice || product.price,
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
    if (openBag) {
      setIsCartOpen(true);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart(false);
    onNavigate('checkout');
  };

  const whatsappMessage = `Hello House Of Rehaan, I am interested in ${product.name} (Size: ${selectedSize}, Price: ₹${
    product.salePrice || product.price
  }). Please share the details.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      {/* Breadcrumb */}
      <nav className="text-xs text-[#766F68] flex items-center gap-2 mb-8">
        <button onClick={() => onNavigate('home')} className="hover:text-[#292522]">
          Home
        </button>
        <span>/</span>
        <button onClick={() => onNavigate('shop')} className="hover:text-[#292522]">
          Shop
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate('shop', product.category)}
          className="hover:text-[#292522]"
        >
          {product.category}
        </button>
        <span>/</span>
        <span className="text-[#292522] font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
        {/* LEFT: Image Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails list */}
          {galleryImages.length > 1 && (
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[600px] shrink-0">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-20 md:w-20 md:h-26 rounded-xs overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#9A8568] opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback
                    src={img}
                    alt={`${product.name} Thumbnail ${idx + 1}`}
                    category={product.category}
                    productName={product.name}
                    className="w-full h-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Large Image with continuous streaming fallback */}
          <div className="relative flex-1 aspect-3/4 rounded-md overflow-hidden bg-[#F4EFE6] border border-[#E9DFD0]">
            <ImageWithFallback
              src={galleryImages[activeImageIndex]}
              fallbackSrc={galleryImages[0]}
              category={product.category}
              productName={product.name}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-500 cursor-zoom-in"
              onClick={() => setFullscreenImage(galleryImages[activeImageIndex])}
            />

            {/* Badges - Compact on mobile */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1 sm:gap-2 pointer-events-none">
              {product.salePrice && product.salePrice < product.price && (
                <span className="bg-[#9A8568] text-white text-[9px] sm:text-xs font-semibold px-2 py-0.5 sm:px-3 sm:py-1 uppercase tracking-wider rounded-xs shadow-2xs">
                  SALE {product.discountPercentage ? `-${product.discountPercentage}%` : ''}
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-[#292522]/90 text-white text-[9px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 uppercase tracking-wider rounded-xs shadow-2xs">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Navigation arrows for multi-image viewing */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/85 hover:bg-white text-[#292522] shadow-sm flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs hover:scale-105"
                  aria-label="Previous garment image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/85 hover:bg-white text-[#292522] shadow-sm flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs hover:scale-105"
                  aria-label="Next garment image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Counter indicator pill */}
                <div className="absolute bottom-3 left-3 bg-[#292522]/80 text-[#FAF8F4] text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs pointer-events-none">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}

            {/* Fullscreen zoom expand icon */}
            <button
              onClick={() => setFullscreenImage(galleryImages[activeImageIndex])}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-[#FAF8F4]/80 backdrop-blur-xs text-[#292522] hover:bg-white transition-colors cursor-pointer"
              title="Inspect Image"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#9A8568]" />
            </button>
          </div>
        </div>

        {/* RIGHT: Product Details and Selectors */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9A8568] font-semibold uppercase tracking-widest">
              <span>{product.brand || 'House Of Rehaan'}</span>
              {product.sku && <span className="text-[#766F68] font-mono">SKU: {product.sku}</span>}
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl text-[#292522] font-normal mt-1 leading-snug">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4 mt-3">
              {product.salePrice && product.salePrice < product.price ? (
                <>
                  <span className="text-2xl sm:text-3xl font-semibold text-[#292522]">
                    ₹{product.salePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-base text-[#766F68] line-through">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.discountPercentage && (
                    <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xs font-medium">
                      Save {product.discountPercentage}%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-2xl sm:text-3xl font-medium text-[#292522]">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#766F68] mt-1">
              Inclusive of all taxes. Free shipping on orders above ₹1,999.
            </p>
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="pt-4 border-t border-[#E9DFD0]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#292522] mb-2">
                Color:{' '}
                <span className="font-normal text-[#766F68] normal-case">{selectedColor}</span>
              </label>
              <div className="flex items-center gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                      selectedColor === c.name
                        ? 'border-[#9A8568] scale-110 shadow-xs'
                        : 'border-[#FAF8F4]'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="pt-4 border-t border-[#E9DFD0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#292522]">
                  Select Size
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    id="product-size-guide-btn"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#9A8568] hover:text-[#292522] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5 text-[#9A8568]" />
                    <span>Size Guide</span>
                  </button>
                  <span
                    className={`text-xs font-medium ${
                      isOutOfStock ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {isOutOfStock ? 'Out of stock in this size' : `${currentStock} pieces left`}
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
                      className={`min-w-11 px-3.5 py-2 text-xs font-medium rounded-xs border transition-all cursor-pointer ${
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

          {/* Customization Available tag if enabled */}
          {product.customizationAvailable && (
            <div className="p-3 bg-[#E9DFD0]/40 border border-[#E9DFD0] rounded-xs text-xs text-[#292522] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9A8568]" />
              <span>Customization / Sizing adjustments available on request.</span>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="space-y-3 pt-4 border-t border-[#E9DFD0]">
            <div className="flex items-center gap-4">
              {/* Quantity */}
              {!isOutOfStock && (
                <div className="flex items-center border border-[#E9DFD0] rounded-xs bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-sm text-[#766F68] hover:text-[#292522]"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-medium text-[#292522]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="px-3 py-2 text-sm text-[#766F68] hover:text-[#292522]"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Add to Cart */}
              <button
                disabled={isOutOfStock}
                onClick={() => handleAddToCart(true)}
                className={`flex-1 py-3.5 px-6 text-xs uppercase tracking-widest font-semibold rounded-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : addedNotice
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#292522] hover:bg-[#9A8568] text-white shadow-xs'
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

              {/* Wishlist */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3.5 border rounded-xs transition-colors cursor-pointer ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-300 text-rose-600'
                    : 'bg-white border-[#E9DFD0] text-[#292522] hover:border-[#9A8568]'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-600' : ''}`} />
              </button>
            </div>

            {/* Buy Now Button */}
            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 bg-[#9A8568] hover:bg-[#7F6D54] text-white text-xs uppercase tracking-widest font-semibold rounded-xs transition-colors shadow-xs cursor-pointer"
              >
                Buy It Now
              </button>
            )}

            {/* WhatsApp Enquiry Button if enabled */}
            {settings.whatsappEnabled && settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                  whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enquire via WhatsApp</span>
              </a>
            )}
          </div>

          {/* Product Specifications & Care Accordion/List */}
          <div className="pt-6 border-t border-[#E9DFD0] space-y-4 text-xs">
            <div>
              <h4 className="font-semibold uppercase tracking-wider text-[#292522] mb-2">
                Description & Craftsmanship
              </h4>
              <p className="text-[#766F68] leading-relaxed whitespace-pre-line font-light">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#E9DFD0]/60 text-[#766F68]">
              {product.fabric && (
                <div>
                  <strong className="text-[#292522] block">Fabric:</strong>
                  <span>{product.fabric}</span>
                </div>
              )}
              {product.material && (
                <div>
                  <strong className="text-[#292522] block">Material:</strong>
                  <span>{product.material}</span>
                </div>
              )}
              {product.fit && (
                <div>
                  <strong className="text-[#292522] block">Fit:</strong>
                  <span>{product.fit}</span>
                </div>
              )}
              {product.occasion && (
                <div>
                  <strong className="text-[#292522] block">Occasion:</strong>
                  <span>{product.occasion}</span>
                </div>
              )}
            </div>

            {product.careInstructions && (
              <div>
                <strong className="text-[#292522] block mb-1">Care Instructions:</strong>
                <p className="text-[#766F68]">{product.careInstructions}</p>
              </div>
            )}
          </div>

          {/* Trust points */}
          <div className="pt-4 border-t border-[#E9DFD0] grid grid-cols-3 gap-3 text-center text-[10px] text-[#766F68]">
            <div className="space-y-1">
              <Truck className="w-4 h-4 text-[#9A8568] mx-auto" />
              <span>Reliable Delivery</span>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="w-4 h-4 text-[#9A8568] mx-auto" />
              <span>Direct Boutique Quality</span>
            </div>
            <div className="space-y-1">
              <RotateCcw className="w-4 h-4 text-[#9A8568] mx-auto" />
              <span>Easy Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* "You May Also Like" - Suggested Similar Products Carousel */}
      {similarProducts.length > 0 && (
        <section
          id="you-may-also-like-section"
          className="mt-16 sm:mt-24 pt-12 border-t border-[#E9DFD0]"
          aria-label="You May Also Like"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-[#9A8568]" />
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[#9A8568]">
                  Curated For You
                </span>
              </div>
              <h2 className="font-editorial font-serif text-2xl sm:text-3xl lg:text-4xl text-[#292522]">
                You May Also Like
              </h2>
              <p className="text-xs sm:text-sm text-[#766F68] mt-1 font-light">
                Thoughtfully curated styles that pair effortlessly with your wardrobe
              </p>
            </div>

            {/* Navigation and Carousel Page Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3 self-start sm:self-end">
              {/* Pagination Dots (Desktop / Tablet) */}
              <div className="hidden sm:flex items-center gap-1.5 mr-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToPage(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activePageIndex === idx
                        ? 'w-6 bg-[#9A8568]'
                        : 'w-2 bg-[#E9DFD0] hover:bg-[#9A8568]/50'
                    }`}
                    aria-label={`Scroll to recommendations page ${idx + 1}`}
                  />
                ))}
              </div>

              {/* View Category Link */}
              <button
                onClick={() => {
                  onNavigate('shop', product.category);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs text-[#292522] hover:text-[#9A8568] font-medium tracking-wide flex items-center gap-1.5 px-3 py-2 rounded-xs border border-[#E9DFD0] hover:border-[#9A8568] transition-colors cursor-pointer mr-1"
              >
                <span>View All {product.category}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Prev Carousel Page Button */}
              <button
                id="similar-prev-btn"
                onClick={scrollPrev}
                disabled={!canScrollLeft}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  canScrollLeft
                    ? 'border-[#292522] text-[#292522] hover:bg-[#292522] hover:text-white shadow-xs'
                    : 'border-[#E9DFD0] text-[#766F68]/40 cursor-not-allowed opacity-40'
                }`}
                aria-label="Previous similar items"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Next Carousel Page Button */}
              <button
                id="similar-next-btn"
                onClick={scrollNext}
                disabled={!canScrollRight}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  canScrollRight
                    ? 'border-[#292522] text-[#292522] hover:bg-[#292522] hover:text-white shadow-xs'
                    : 'border-[#E9DFD0] text-[#766F68]/40 cursor-not-allowed opacity-40'
                }`}
                aria-label="Next similar items"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Smooth Horizontal Carousel Track */}
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6 pt-1 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {similarProducts.map((simProduct) => (
                <div
                  key={simProduct.id}
                  className="snap-start shrink-0 w-[240px] sm:w-[270px] lg:w-[285px]"
                >
                  <ProductCard
                    product={simProduct}
                    onNavigate={(route, param) => {
                      onNavigate(route, param);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onQuickView={onQuickView}
                  />
                </div>
              ))}
            </div>

            {/* Mobile Swipe Hint & Page Dots */}
            <div className="sm:hidden flex items-center justify-between pt-2 px-1 text-xs text-[#766F68]">
              <span className="text-[11px] font-light">Swipe to explore ({similarProducts.length} styles)</span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToPage(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activePageIndex === idx ? 'w-4 bg-[#9A8568]' : 'w-1.5 bg-[#E9DFD0]'
                    }`}
                    aria-label={`Page ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Fullscreen Image Inspector Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 text-white p-2 rounded-full bg-white/20 hover:bg-white/40"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen zoom view"
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.category}
        productName={product.name}
      />

      {/* Mobile Sticky Add to Bag Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-[#FAF8F4]/95 backdrop-blur-md border-t border-[#E9DFD0] p-3 px-4 flex items-center justify-between gap-3 z-30 shadow-lg">
        <div>
          <span className="text-[10px] text-[#766F68] uppercase tracking-wider block">Total Price</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-[#292522]">
              ₹{(product.salePrice || product.price).toLocaleString('en-IN')}
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-[11px] text-[#766F68] line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddToCart(true)}
            disabled={isOutOfStock}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-[#E9DFD0] text-[#766F68] cursor-not-allowed'
                : 'bg-[#292522] active:bg-[#9A8568] text-white shadow-xs'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
          </button>

          {!isOutOfStock && (
            <button
              onClick={handleBuyNow}
              className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-all bg-[#9A8568] active:bg-[#292522] text-white shadow-xs cursor-pointer"
            >
              <span>Buy Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
