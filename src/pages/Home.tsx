import React, { useState } from 'react';
import { ArrowRight, Sparkles, Compass, Truck, ShieldCheck, HeartHandshake, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { HeroCarousel } from '../components/HeroCarousel';
import { getNormalizedCategoryKey } from '../firebase/db';
import type { Product, Category, BusinessSettings, Review } from '../types';

interface HomeProps {
  products: Product[];
  categories: Category[];
  settings: BusinessSettings;
  reviews: Review[];
  onNavigate: (route: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const Home: React.FC<HomeProps> = ({
  products,
  categories,
  settings,
  reviews,
  onNavigate,
  onQuickView,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');

  // Filter products
  const newArrivals = products.filter((p) => p.newArrival && p.status === 'active');
  const featuredProducts = products.filter((p) => p.featured && p.status === 'active');
  
  // Strictly deduplicate active categories so every category is displayed exactly once
  const activeCategories = Array.from(
    categories
      .filter((c) => c.active !== false)
      .reduce((map, cat) => {
        const key = getNormalizedCategoryKey(cat);
        if (!map.has(key)) {
          map.set(key, cat);
        } else {
          // Keep the one with longer/more descriptive name or valid image
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

  const occasions = ['All', 'Everyday', 'Festive', 'Party', 'Casual'];

  const occasionProducts = products.filter((p) => {
    if (p.status !== 'active') return false;
    if (selectedOccasion === 'All') return true;
    return p.occasion?.toLowerCase().includes(selectedOccasion.toLowerCase());
  });

  return (
    <div className="pb-20">
      {/* 1. 4-PAGE MOVING HERO CAROUSEL */}
      <HeroCarousel settings={settings} onNavigate={onNavigate} />

      {/* 2. TRUST / BRAND STRIP - Compact spacing above and below */}
      <section id="trust-strip" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 sm:mt-4 mb-8 sm:mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-3.5 sm:py-4 border-y border-[#E9DFD0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568] shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#292522] uppercase tracking-wider">
                Curated Fashion
              </h4>
              <p className="text-[11px] text-[#766F68]">Thoughtfully selected pieces</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568] shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#292522] uppercase tracking-wider">
                Delivery Available
              </h4>
              <p className="text-[11px] text-[#766F68]">Across Trichy & PAN India</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#292522] uppercase tracking-wider">
                Easy Shopping
              </h4>
              <p className="text-[11px] text-[#766F68]">Secure & seamless ordering</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568] shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#292522] uppercase tracking-wider">
                Personal Style
              </h4>
              <p className="text-[11px] text-[#766F68]">Direct boutique styling help</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections with Balanced Rhythm */}
      <div className="space-y-16 sm:space-y-24">
        {/* 3. SHOP BY CATEGORY EDITS (Arched Vault Silhouette) */}
        <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Centered Editorial Header matching reference style */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
              Curated Collections
            </span>
            <h2
              className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#292522] font-normal tracking-wide uppercase"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              SHOP BY CATEGORY EDITS
            </h2>
            <p className="text-xs sm:text-sm text-[#766F68] font-light max-w-md mx-auto">
              Timeless silhouettes hand-picked for effortless grace, premium South Indian craft, and modern comfort.
            </p>
          </div>

          {/* Arched Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {activeCategories.map((cat) => (
              <div
                key={cat.id}
                id={`category-card-${cat.slug || cat.id}`}
                onClick={() => onNavigate('shop', cat.name)}
                className="group relative flex flex-col rounded-t-[100px] sm:rounded-t-[140px] lg:rounded-t-[170px] rounded-b-2xl overflow-hidden bg-[#FAF8F4] border border-[#E9DFD0]/90 shadow-2xs hover:shadow-xl hover:border-[#9A8568]/50 transition-all duration-500 cursor-pointer"
              >
                <div className="aspect-[3/4.4] w-full overflow-hidden bg-[#F4EFE6] relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                    loading="lazy"
                  />

                  {/* Refined Dark Gradient for High-Contrast Typography */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                  {/* Arched Inner Glow Accent on Hover */}
                  <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 rounded-t-[100px] sm:rounded-t-[140px] lg:rounded-t-[170px] rounded-b-2xl transition-all duration-500 pointer-events-none" />

                  {/* Category Details at Card Bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-center flex flex-col items-center justify-end z-10">
                    <h3 className="font-editorial text-base sm:text-lg lg:text-xl font-normal text-white tracking-wide leading-tight">
                      {cat.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] sm:text-[11px] font-semibold text-[#E9DFD0] uppercase tracking-widest opacity-90 group-hover:text-white group-hover:opacity-100 transition-all">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Secondary Action */}
          <div className="text-center mt-10">
            <button
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#292522] hover:text-white hover:bg-[#292522] py-2.5 px-6 border border-[#292522] rounded-full transition-all bg-transparent cursor-pointer shadow-2xs"
            >
              <span>Explore All Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

      {/* 4. NEW ARRIVALS */}
      <section id="new-arrivals-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
              Fresh Off The Rack
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#292522] mt-1 font-normal">
              New Arrivals
            </h2>
          </div>
          <button
            onClick={() => onNavigate('new-arrivals')}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9A8568] hover:text-[#292522] transition-colors mt-2"
          >
            <span>View All New Arrivals</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {newArrivals.length === 0 ? (
          <div className="p-12 text-center text-[#766F68] bg-[#F6F1EA] rounded-md">
            <p className="font-editorial text-lg text-[#292522]">
              New styles arriving soon at House Of Rehaan.
            </p>
            <p className="text-xs mt-1">Check back shortly for our latest pieces.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. THE HOUSE OF REHAAN EDIT - EDITORIAL LOOKBOOK SECTION */}
      <section id="lookbook-section" className="bg-[#F6F1EA] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left large visual */}
            <div className="lg:col-span-7 relative overflow-hidden rounded-md shadow-md aspect-4/3 bg-[#E9DFD0]">
              <img
                src="/lookbook-banner.jpg"
                alt="The House Of Rehaan Edit"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Right text & fashion quote */}
            <div className="lg:col-span-5 space-y-6 lg:pl-6">
              <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
                Curated Lookbook
              </span>
              <h2 className="font-editorial text-3xl sm:text-5xl text-[#292522] font-normal leading-tight">
                THE HOUSE OF REHAAN EDIT
              </h2>
              <p className="text-sm sm:text-base text-[#766F68] leading-relaxed font-light">
                An ode to graceful ease. Each piece in our boutique is chosen for its fabric breathability,
                timeless cut, and effortless versatility — transitioning naturally from Trichy mornings to evening celebrations.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('shop')}
                  className="px-7 py-3.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-widest rounded-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Explore The Edit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED PRODUCTS ("SELECTED FOR YOU") */}
      {featuredProducts.length > 0 && (
        <section id="featured-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
              Handpicked Essentials
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl text-[#292522] mt-1 font-normal">
              Selected For You
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* 7. SHOP BY OCCASION */}
      <section id="occasion-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-[#E9DFD0] gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
              Wardrobe Moods
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#292522] font-normal">
              Shop By Occasion
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {occasions.map((occ) => (
              <button
                key={occ}
                onClick={() => setSelectedOccasion(occ)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                  selectedOccasion === occ
                    ? 'bg-[#292522] text-white'
                    : 'bg-[#FAF8F4] text-[#766F68] border border-[#E9DFD0] hover:border-[#9A8568]'
                }`}
              >
                {occ}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {occasionProducts.slice(0, 4).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onNavigate={onNavigate}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </section>

      {/* 8. ABOUT HOUSE OF REHAAN SNAPSHOT */}
      <section id="about-snapshot" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
          About Us
        </span>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#292522] font-normal max-w-2xl mx-auto">
          House Of Rehaan
        </h2>
        <p className="text-sm sm:text-base text-[#766F68] leading-relaxed max-w-2xl mx-auto font-light">
          House Of Rehaan is a women's fashion brand based in Trichy, offering a curated online
          shopping experience for contemporary and traditional women's clothing.
        </p>
        <div>
          <button
            onClick={() => onNavigate('about')}
            className="text-xs uppercase tracking-widest font-semibold text-[#9A8568] hover:text-[#292522] inline-flex items-center gap-1.5 pb-1 border-b border-[#9A8568]"
          >
            <span>Read Our Full Story</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 9. CUSTOMER REVIEWS (Approved only) */}
      {reviews.length > 0 && (
        <section id="reviews-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
              Words of Appreciation
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#292522] mt-1 font-normal">
              Customer Experiences
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="p-6 bg-white border border-[#E9DFD0] rounded-md space-y-3 shadow-2xs"
              >
                <div className="flex items-center text-amber-500 text-xs">
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </div>
                <p className="text-xs text-[#292522] italic leading-relaxed">
                  "{r.review}"
                </p>
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-[#766F68]">
                  <span className="font-semibold text-[#292522]">{r.customerName}</span>
                  {r.product && <span className="opacity-75">{r.product}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
};
