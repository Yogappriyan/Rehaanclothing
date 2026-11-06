import React, { useState } from 'react';
import { Sparkles, ArrowRight, ChevronRight, Layers, Tag } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { getNormalizedCategoryKey } from '../firebase/db';
import type { Product, Category } from '../types';

interface CollectionsProps {
  categories: Category[];
  products: Product[];
  onNavigate: (route: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const Collections: React.FC<CollectionsProps> = ({
  categories,
  products,
  onNavigate,
  onQuickView,
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<string>('all');

  // Strictly deduplicate active categories
  const activeCategories = Array.from(
    categories
      .filter((c) => c.active !== false)
      .reduce((map, cat) => {
        const key = getNormalizedCategoryKey(cat);
        if (!map.has(key)) {
          map.set(key, cat);
        } else {
          const existing = map.get(key)!;
          if (
            (cat.name && cat.name.length > (existing.name?.length || 0)) ||
            (cat.image && !existing.image)
          ) {
            map.set(key, cat);
          }
        }
        return map;
      }, new Map<string, Category>())
      .values()
  );

  // Grouped edits
  const curatedEdits = [
    {
      id: 'festive',
      title: 'The Festive & Heritage Edit',
      tagline: 'Authentic South Indian artistry, zari drapes, and ceremonial elegance',
      categoryKeywords: ['Sarees', 'Ethnic Wear'],
      coverImage:
        activeCategories.find((c) => c.name.toLowerCase().includes('saree'))?.image ||
        '/assets/aistudio/hero-festive.jpg',
    },
    {
      id: 'contemporary',
      title: 'Modern Silhouette & Co-ords',
      tagline: 'Sharp tailored coordinates, flowing trench jackets, and effortless sets',
      categoryKeywords: ['Co-ord Sets', 'Western Wear'],
      coverImage:
        activeCategories.find((c) => c.name.toLowerCase().includes('co-ord'))?.image ||
        '/assets/aistudio/hero-modern.jpg',
    },
    {
      id: 'casual-grace',
      title: 'Everyday Grace & Dresses',
      tagline: 'Breathable linens, breezy maxis, and timeless daily silhouettes',
      categoryKeywords: ['Dresses', 'Kurtis'],
      coverImage:
        activeCategories.find((c) => c.name.toLowerCase().includes('dress'))?.image ||
        '/assets/aistudio/hero-daily.jpg',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 space-y-16 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-[#766F68] flex items-center gap-2 mb-2" aria-label="Breadcrumb">
        <button
          onClick={() => {
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="hover:text-[#292522] transition-colors cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-[#9A8568]" />
        <span className="text-[#292522] font-semibold">Collections</span>
      </nav>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#9A8568]" />
          <span>Curated Boutique Edits</span>
        </span>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#292522] font-normal tracking-wide">
          Explore Our Collections
        </h1>
        <p className="text-sm text-[#766F68] max-w-xl mx-auto font-light leading-relaxed">
          From heritage South Indian hand-embroidered silks to breathable contemporary linens, each
          collection is crafted to offer timeless poise and comfort.
        </p>
      </div>

      {/* 1. Category Vault Cards */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E9DFD0] pb-4">
          <div>
            <h2 className="font-editorial text-2xl text-[#292522]">Signature Categories</h2>
            <p className="text-xs text-[#766F68]">Select any category to explore in the boutique shop</p>
          </div>
          <button
            onClick={() => {
              onNavigate('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#9A8568] hover:text-[#292522] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All ({products.filter((p) => p.status === 'active').length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {activeCategories.map((cat) => {
            const count = products.filter(
              (p) =>
                p.status !== 'archived' &&
                p.status !== 'draft' &&
                (p.category.toLowerCase() === cat.name.toLowerCase() ||
                  p.category.toLowerCase().includes(cat.name.toLowerCase()))
            ).length;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  onNavigate('shop', cat.name);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative flex flex-col rounded-t-[80px] sm:rounded-t-[110px] rounded-b-xl overflow-hidden bg-[#FAF8F4] border border-[#E9DFD0]/90 shadow-2xs hover:shadow-lg hover:border-[#9A8568] transition-all duration-400 cursor-pointer"
              >
                <div className="aspect-[3/4.2] w-full overflow-hidden bg-[#F4EFE6] relative">
                  <ImageWithFallback
                    src={cat.image}
                    alt={cat.name}
                    category={cat.name}
                    className="w-full h-full object-cover object-center transition-transform duration-600 ease-out group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
                  <div className="absolute inset-x-2 bottom-3 text-center text-white">
                    <span className="block font-editorial text-sm sm:text-base font-medium tracking-wide">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-[#FAF8F4]/80 tracking-wider uppercase">
                      {count} {count === 1 ? 'Design' : 'Designs'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Curated Editorial Showcases */}
      <section className="space-y-16 pt-4">
        {curatedEdits.map((edit) => {
          // Find active products matching these keywords
          const matchedProducts = products.filter(
            (p) =>
              p.status !== 'archived' &&
              p.status !== 'draft' &&
              edit.categoryKeywords.some(
                (k) =>
                  p.category.toLowerCase().includes(k.toLowerCase()) ||
                  k.toLowerCase().includes(p.category.toLowerCase())
              )
          );

          if (matchedProducts.length === 0) return null;

          return (
            <div key={edit.id} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#E9DFD0] pb-4 gap-2">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#9A8568] font-semibold">
                    Thematic Edit
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl text-[#292522] mt-0.5">
                    {edit.title}
                  </h3>
                  <p className="text-xs text-[#766F68] mt-1 font-light">{edit.tagline}</p>
                </div>
                <button
                  onClick={() => {
                    onNavigate('shop', edit.categoryKeywords[0]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-[#292522] hover:text-[#9A8568] flex items-center gap-1.5 self-start sm:self-end transition-colors cursor-pointer"
                >
                  <span>Explore {edit.categoryKeywords.join(' & ')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {matchedProducts.slice(0, 4).map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onNavigate={onNavigate}
                    onQuickView={onQuickView}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Bottom Boutique Promise strip */}
      <section className="bg-white border border-[#E9DFD0] rounded-md p-8 sm:p-10 text-center space-y-4">
        <h3 className="font-editorial text-2xl text-[#292522]">Looking for Custom Boutique Tailoring?</h3>
        <p className="text-xs sm:text-sm text-[#766F68] max-w-xl mx-auto leading-relaxed">
          Need custom blouse stitching, fall & pico, or styling recommendations for your special occasions?
          Our Trichy studio team assists directly on WhatsApp or in-store.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => {
              onNavigate('contact');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-2.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
          >
            Visit Studio
          </button>
          <button
            onClick={() => {
              onNavigate('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-2.5 border border-[#E9DFD0] hover:border-[#9A8568] text-[#292522] text-xs font-semibold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
          >
            All Products
          </button>
        </div>
      </section>
    </div>
  );
};
