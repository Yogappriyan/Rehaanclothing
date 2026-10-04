import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import type { Product, Category, ProductSize } from '../types';

interface ShopProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  onNavigate: (route: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const Shop: React.FC<ShopProps> = ({
  products,
  categories,
  initialCategory,
  onNavigate,
  onQuickView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || 'All'
  );
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [selectedFabric, setSelectedFabric] = useState<string>('All');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Derive unique filter lists
  const availableFabrics = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.fabric) list.add(p.fabric);
    });
    return Array.from(list);
  }, [products]);

  const availableOccasions = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.occasion) {
        p.occasion.split(',').forEach((o) => list.add(o.trim()));
      }
    });
    return Array.from(list);
  }, [products]);

  const allSizes: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.status !== 'active') return false;

        // Category matching by exact name or slug/normalized format
        if (selectedCategory !== 'All') {
          const matchName = p.category.toLowerCase() === selectedCategory.toLowerCase();
          const targetSlug = selectedCategory.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
          const productCatSlug = p.category.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
          const matchSlug = productCatSlug === targetSlug || productCatSlug.includes(targetSlug) || targetSlug.includes(productCatSlug);
          if (!matchName && !matchSlug) {
            return false;
          }
        }

        // Size
        if (selectedSize !== 'All' && (!p.sizes || !p.sizes.includes(selectedSize as ProductSize))) {
          return false;
        }

        // Fabric
        if (selectedFabric !== 'All' && p.fabric !== selectedFabric) {
          return false;
        }

        // Occasion
        if (
          selectedOccasion !== 'All' &&
          (!p.occasion || !p.occasion.toLowerCase().includes(selectedOccasion.toLowerCase()))
        ) {
          return false;
        }

        // Price
        const effPrice = p.salePrice || p.price;
        if (effPrice > priceRange) return false;

        // Stock
        if (onlyInStock) {
          const totalStock = p.sizeStock
            ? Object.values(p.sizeStock).reduce((a, b) => a + b, 0)
            : 1;
          if (totalStock <= 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.salePrice || a.price;
        const priceB = b.salePrice || b.price;

        if (sortBy === 'price-low-high') return priceA - priceB;
        if (sortBy === 'price-high-low') return priceB - priceA;
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'popular') return (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0);
        // default featured
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [
    products,
    selectedCategory,
    selectedSize,
    selectedFabric,
    selectedOccasion,
    priceRange,
    onlyInStock,
    sortBy,
  ]);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedSize('All');
    setSelectedFabric('All');
    setSelectedOccasion('All');
    setOnlyInStock(false);
    setPriceRange(10000);
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedSize !== 'All' ||
    selectedFabric !== 'All' ||
    selectedOccasion !== 'All' ||
    onlyInStock ||
    priceRange < 10000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="border-b border-[#E9DFD0] pb-8 mb-8">
        <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
          House Of Rehaan
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#292522] mt-1 font-normal">
          Shop Women's Collection
        </h1>
        <p className="text-xs sm:text-sm text-[#766F68] mt-2 max-w-xl">
          Carefully selected contemporary dresses, handcrafted kurtis, timeless sarees, and polished
          co-ords.
        </p>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E9DFD0]/60 mb-8">
        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 border border-[#E9DFD0] bg-white rounded-xs text-xs font-medium text-[#292522] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#9A8568]" />
            <span>Filters {hasActiveFilters && '• Active'}</span>
          </button>

          <span className="text-xs text-[#766F68]">
            Showing <strong className="text-[#292522]">{filteredProducts.length}</strong> styles
          </span>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#9A8568] hover:underline font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#766F68]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-[#E9DFD0] text-[#292522] rounded-xs px-3 py-1.5 focus:outline-hidden focus:border-[#9A8568] cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest Arrivals</option>
            <option value="popular">Best Sellers</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout (Sidebar + Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block space-y-7 pr-4 border-r border-[#E9DFD0]/60">
          {/* Category Filter */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#292522] mb-3">
              Category
            </h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`block w-full text-left py-1 transition-colors cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'text-[#9A8568] font-bold'
                    : 'text-[#766F68] hover:text-[#292522]'
                }`}
              >
                All Categories
              </button>
              {categories
                .filter((c) => c.active)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`block w-full text-left py-1 transition-colors cursor-pointer ${
                      selectedCategory === cat.name
                        ? 'text-[#9A8568] font-bold'
                        : 'text-[#766F68] hover:text-[#292522]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="pt-4 border-t border-[#E9DFD0]/60">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#292522] mb-3">
              Size
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSize('All')}
                className={`px-2.5 py-1 text-xs rounded-xs border transition-all cursor-pointer ${
                  selectedSize === 'All'
                    ? 'bg-[#292522] text-white border-[#292522]'
                    : 'bg-white text-[#766F68] border-[#E9DFD0] hover:border-[#9A8568]'
                }`}
              >
                All
              </button>
              {allSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`px-2.5 py-1 text-xs rounded-xs border transition-all cursor-pointer ${
                    selectedSize === s
                      ? 'bg-[#292522] text-white border-[#292522]'
                      : 'bg-white text-[#766F68] border-[#E9DFD0] hover:border-[#9A8568]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price Max Slider */}
          <div className="pt-4 border-t border-[#E9DFD0]/60">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-[#292522] mb-2">
              <span>Max Price</span>
              <span>₹{priceRange.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="250"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-[#9A8568] cursor-pointer"
            />
          </div>

          {/* Fabric Filter */}
          {availableFabrics.length > 0 && (
            <div className="pt-4 border-t border-[#E9DFD0]/60">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#292522] mb-3">
                Fabric
              </h4>
              <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
                <button
                  onClick={() => setSelectedFabric('All')}
                  className={`block w-full text-left py-0.5 cursor-pointer ${
                    selectedFabric === 'All'
                      ? 'text-[#9A8568] font-bold'
                      : 'text-[#766F68] hover:text-[#292522]'
                  }`}
                >
                  All Fabrics
                </button>
                {availableFabrics.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFabric(f)}
                    className={`block w-full text-left py-0.5 truncate cursor-pointer ${
                      selectedFabric === f
                        ? 'text-[#9A8568] font-bold'
                        : 'text-[#766F68] hover:text-[#292522]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In-Stock Toggle */}
          <div className="pt-4 border-t border-[#E9DFD0]/60">
            <label className="flex items-center gap-2.5 text-xs text-[#292522] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 accent-[#9A8568] rounded-xs"
              />
              <span>In-stock items only</span>
            </label>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="p-16 text-center bg-white border border-[#E9DFD0] rounded-md space-y-3">
              <h3 className="font-editorial text-xl text-[#292522]">
                No products available matching your criteria.
              </h3>
              <p className="text-xs text-[#766F68] max-w-sm mx-auto">
                Try clearing some filters or exploring another category from House Of Rehaan.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-2 px-6 py-2.5 bg-[#9A8568] hover:bg-[#292522] text-white text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onNavigate={onNavigate}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom-sheet Filter */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F4] w-full max-h-[85vh] rounded-t-xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9DFD0]">
              <h3 className="font-editorial text-lg text-[#292522]">Filter Collection</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full text-[#766F68]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#292522] block mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-[#E9DFD0] p-2.5 text-xs rounded-xs"
              >
                <option value="All">All Categories</option>
                {categories
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Sizes */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#292522] block mb-2">
                Size
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSize('All')}
                  className={`px-3 py-1.5 text-xs border rounded-xs ${
                    selectedSize === 'All' ? 'bg-[#292522] text-white' : 'bg-white text-[#766F68]'
                  }`}
                >
                  All
                </button>
                {allSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 text-xs border rounded-xs ${
                      selectedSize === s ? 'bg-[#292522] text-white' : 'bg-white text-[#766F68]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="flex items-center gap-2 text-xs text-[#292522]">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 accent-[#9A8568]"
                />
                <span>In-stock only</span>
              </label>
            </div>

            <div className="pt-4 border-t border-[#E9DFD0] flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3 border border-[#E9DFD0] text-xs font-semibold uppercase tracking-wider text-[#766F68] rounded-xs"
              >
                Clear
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 bg-[#292522] text-white text-xs font-semibold uppercase tracking-wider rounded-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
