import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BusinessSettings } from '../types';

interface HeroCarouselProps {
  settings: BusinessSettings;
  onNavigate: (route: string, param?: string) => void;
}

interface SlideData {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaRoute: string;
  primaryCtaParam?: string;
  secondaryCtaText: string;
  secondaryCtaRoute: string;
  secondaryCtaParam?: string;
  image: string;
  accentColor?: string;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ settings, onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // 4 curated boutique moving slides
  const slides: SlideData[] = [
    {
      id: 1,
      badge: "Trichy's Curated Women's Boutique",
      title: settings.heroTitle || 'Style That Feels Like You',
      subtitle:
        settings.heroSubtitle ||
        "Discover thoughtfully selected women's fashion from House Of Rehaan.",
      primaryCtaText: 'Shop Collection',
      primaryCtaRoute: 'shop',
      secondaryCtaText: 'Explore New Arrivals',
      secondaryCtaRoute: 'new-arrivals',
      image: '/hero-banner.jpg',
    },
    {
      id: 2,
      badge: 'Festive & Wedding Edit',
      title: 'Elegance in Every Thread',
      subtitle:
        'Bespoke festive kurtis, rich Chanderi silks & hand-embroidered ensembles crafted for celebrations.',
      primaryCtaText: 'Explore Festive',
      primaryCtaRoute: 'shop',
      primaryCtaParam: 'Festive',
      secondaryCtaText: 'View Lookbook',
      secondaryCtaRoute: 'lookbook',
      image:
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&q=85',
    },
    {
      id: 3,
      badge: 'Everyday Luxury',
      title: 'Pure Cottons & Breathable Linens',
      subtitle:
        "Effortless silhouettes tailored for Trichy's tropical days, combining supreme ease with artisanal charm.",
      primaryCtaText: 'Shop Kurtis & Tops',
      primaryCtaRoute: 'shop',
      primaryCtaParam: 'Kurtis',
      secondaryCtaText: 'Discover Co-ords',
      secondaryCtaRoute: 'shop',
      secondaryCtaParam: 'Co-ord Sets',
      image:
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1800&q=85',
    },
    {
      id: 4,
      badge: 'Artisanal Drapes',
      title: 'Timeless Sarees & Occasion Wear',
      subtitle:
        'Traditional South Indian craftsmanship reimagined with contemporary grace for the modern woman.',
      primaryCtaText: 'Discover Sarees',
      primaryCtaRoute: 'shop',
      primaryCtaParam: 'Sarees',
      secondaryCtaText: 'Boutique Stylist Consult',
      secondaryCtaRoute: 'contact',
      image: '/lookbook-banner.jpg',
    },
  ];

  // Auto-play timer (slides move automatically every 5.5s)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      id="hero-carousel-section"
      className="relative min-h-[82vh] flex items-center justify-center overflow-hidden bg-[#F6F1EA] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Featured Boutique Collections Carousel"
    >
      {/* Moving Background Slides */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full object-cover object-center transform transition-transform duration-7000 ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />
              {/* Refined editorial overlay for high-contrast typography */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F4]/90 via-[#FAF8F4]/65 to-black/15" />
            </div>
          );
        })}
      </div>

      {/* Slide Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          if (!isActive) return null;

          return (
            <div
              key={slide.id}
              className="max-w-xl space-y-6 animate-fade-in transition-all duration-700"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F4]/90 backdrop-blur-xs border border-[#E9DFD0] text-[#9A8568] text-xs font-semibold uppercase tracking-widest shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#9A8568]" />
                <span>{slide.badge}</span>
              </div>

              {/* Headline */}
              <h1
                className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal text-[#292522] tracking-tight leading-[1.12]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {slide.title}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#554F49] font-light leading-relaxed max-w-md">
                {slide.subtitle}
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  type="button"
                  id={`hero-slide-${slide.id}-primary-cta`}
                  onClick={() => onNavigate(slide.primaryCtaRoute, slide.primaryCtaParam)}
                  className="px-8 py-4 bg-[#292522] hover:bg-[#9A8568] text-[#FAF8F4] text-xs uppercase tracking-widest font-semibold rounded-xs shadow-sm transition-all duration-300 flex items-center gap-2 cursor-pointer hover:shadow-md"
                >
                  <span>{slide.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  id={`hero-slide-${slide.id}-secondary-cta`}
                  onClick={() => onNavigate(slide.secondaryCtaRoute, slide.secondaryCtaParam)}
                  className="px-7 py-4 bg-[#FAF8F4]/95 hover:bg-white text-[#292522] border border-[#E9DFD0] text-xs uppercase tracking-widest font-semibold rounded-xs transition-all duration-300 cursor-pointer shadow-2xs"
                >
                  {slide.secondaryCtaText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrow Controls: Previous & Next */}
      <div className="absolute inset-y-0 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={goToPrev}
          aria-label="Previous Slide"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FAF8F4]/80 hover:bg-white text-[#292522] hover:text-[#9A8568] border border-[#E9DFD0] backdrop-blur-xs flex items-center justify-center pointer-events-auto transition-all duration-200 cursor-pointer shadow-sm hover:scale-105"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={goToNext}
          aria-label="Next Slide"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FAF8F4]/80 hover:bg-white text-[#292522] hover:text-[#9A8568] border border-[#E9DFD0] backdrop-blur-xs flex items-center justify-center pointer-events-auto transition-all duration-200 cursor-pointer shadow-sm hover:scale-105"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Indicators & Page Counter */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-30 flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none">
        {/* 4 Page Moving Bars */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {slides.map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`group relative h-2 transition-all duration-300 rounded-full cursor-pointer overflow-hidden ${
                  isActive ? 'w-10 bg-[#9A8568]' : 'w-3 bg-[#292522]/25 hover:bg-[#292522]/50'
                }`}
              >
                {isActive && !isPaused && (
                  <span className="absolute inset-0 bg-[#292522]/30 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Editorial Page Number (e.g., 01 / 04) */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F4]/80 backdrop-blur-xs border border-[#E9DFD0] text-[11px] font-mono tracking-widest text-[#292522]">
          <span className="font-bold text-[#9A8568]">0{currentSlide + 1}</span>
          <span className="text-[#766F68]">/</span>
          <span className="text-[#766F68]">0{slides.length}</span>
        </div>
      </div>
    </section>
  );
};
