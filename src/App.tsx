import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { QuickViewModal } from './components/QuickViewModal';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Collections } from './pages/Collections';
import { ProductDetails } from './pages/ProductDetails';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { Account } from './pages/Account';
import { WishlistPage } from './pages/WishlistPage';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { AdminDashboard } from './pages/AdminDashboard';
import {
  subscribeProducts,
  subscribeCategories,
  subscribeReviews,
  subscribeSettings,
  seedInitialDatabaseIfEmpty,
  DEFAULT_SETTINGS,
  ALL_SAMPLE_PRODUCTS,
  SAMPLE_CATEGORIES,
} from './firebase/db';
import type { Product, Category, Review, BusinessSettings } from './types';
import { MessageCircle, ChevronUp } from 'lucide-react';

/**
 * Parses the current window location (pathname, hash, and search query) into an app route and param.
 * Preserves parameter casing and guarantees seamless routing in iframe and standard environments.
 */
function getRouteFromLocation(): { route: string; param?: string } {
  try {
    const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
    const searchParams = new URLSearchParams(window.location.search);

    // Explicit check for /admin in path or hash
    if (
      rawPath.toLowerCase() === '/admin' ||
      rawPath.toLowerCase().startsWith('/admin/') ||
      rawHash.toLowerCase() === 'admin' ||
      rawHash.toLowerCase().startsWith('admin/')
    ) {
      return { route: 'admin' };
    }

    // Determine target prioritizing hash if it contains a route, otherwise path
    let target = '';
    if (rawHash && rawHash !== '/' && rawHash !== 'home') {
      target = rawHash;
    } else {
      target = rawPath.replace(/^\//, '');
    }

    const segments = target.split('/').filter(Boolean);
    const primary = (segments[0] || 'home').toLowerCase();
    // Keep secondary parameter intact with original case and decoded
    const secondary = segments[1] ? decodeURIComponent(segments[1]) : undefined;

    if (primary === 'admin') return { route: 'admin' };
    if (primary === 'product' || primary === 'product-details') {
      return {
        route: 'product-details',
        param: secondary || searchParams.get('id') || searchParams.get('slug') || undefined,
      };
    }
    if (primary === 'shop') {
      return {
        route: 'shop',
        param: secondary || searchParams.get('category') || undefined,
      };
    }
    if (primary === 'new-arrivals') return { route: 'new-arrivals' };
    if (primary === 'collections') return { route: 'collections' };
    if (primary === 'checkout') return { route: 'checkout' };
    if (primary === 'orders') return { route: 'orders' };
    if (primary === 'account') return { route: 'account' };
    if (primary === 'wishlist') return { route: 'wishlist' };
    if (primary === 'about') return { route: 'about' };
    if (primary === 'contact') return { route: 'contact' };

    return { route: 'home' };
  } catch {
    return { route: 'home' };
  }
}

function MainApp() {
  const { user, isAdmin } = useAuth();

  // Navigation State initialized directly from browser URL
  const initialLocation = getRouteFromLocation();
  const [currentRoute, setCurrentRoute] = useState<string>(initialLocation.route);
  const [routeParam, setRouteParam] = useState<string | undefined>(initialLocation.param);

  // Firestore Realtime Collections State (Initialized with full sample catalog to eliminate any disappearing product frames)
  const [products, setProducts] = useState<Product[]>(() =>
    ALL_SAMPLE_PRODUCTS.map((p, idx: number) => ({
      id: `sample-${idx + 1}`,
      ...p,
      status: (p.status as Product['status']) || 'active',
    }))
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    SAMPLE_CATEGORIES.map((c, idx: number) => ({
      id: `cat-${idx + 1}`,
      ...c,
      active: true,
    }))
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subscriptions to Firestore Public Collections
  useEffect(() => {
    seedInitialDatabaseIfEmpty();

    const unsubProducts = subscribeProducts((p) => setProducts(p));
    const unsubCategories = subscribeCategories((c) => setCategories(c));
    const unsubReviews = subscribeReviews((r) => setReviews(r), true);
    const unsubSettings = subscribeSettings((s: BusinessSettings) => setSettings(s));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubReviews();
      unsubSettings();
    };
  }, []);

  // Listen to browser navigation (back/forward, URL changes, popstate, hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      const loc = getRouteFromLocation();
      setCurrentRoute(loc.route);
      setRouteParam(loc.param);
    };

    // Ensure immediate sync on mount
    handleUrlChange();

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleNavigate = (route: string, param?: string) => {
    // 1. Immediately update React state for instant, rock-solid response
    setCurrentRoute(route);
    setRouteParam(param);

    // 2. Synchronize URL bar gracefully
    try {
      const formattedParam = param ? encodeURIComponent(param) : '';
      let targetPath = route === 'home' ? '/' : `/${route}`;
      if (param && (route === 'product-details' || route === 'shop')) {
        targetPath += `/${formattedParam}`;
      }

      // Format hash that preserves the parameter
      const targetHash =
        route === 'home'
          ? ''
          : param && (route === 'product-details' || route === 'shop')
          ? `#/${route}/${formattedParam}`
          : `#/${route}`;

      // Update history if supported
      if (window.history && window.history.pushState) {
        window.history.pushState({ route, param }, '', targetPath);
      }

      // Sync hash if needed for iframe sandbox bookmarking/reload
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    } catch {
      // Fallback in restricted iframe environments: always retain the parameter!
      try {
        const formattedParam = param ? encodeURIComponent(param) : '';
        const targetHash =
          route === 'home'
            ? ''
            : param && (route === 'product-details' || route === 'shop')
            ? `#/${route}/${formattedParam}`
            : `#/${route}`;
        window.location.hash = targetHash;
      } catch {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#292522] selection:bg-[#9A8568] selection:text-white">
      {/* 1. Header Navigation Bar */}
      <Header
        onNavigate={handleNavigate}
        currentRoute={currentRoute}
        settings={settings}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Main Viewport Router */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <Home
            products={products}
            categories={categories}
            settings={settings}
            reviews={reviews}
            onNavigate={handleNavigate}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {currentRoute === 'shop' && (
          <Shop
            products={products}
            categories={categories}
            initialCategory={routeParam}
            onNavigate={handleNavigate}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {currentRoute === 'new-arrivals' && (
          <Shop
            products={products.filter((p) => p.newArrival)}
            categories={categories}
            onNavigate={handleNavigate}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {currentRoute === 'collections' && (
          <Collections
            categories={categories}
            products={products}
            onNavigate={handleNavigate}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {currentRoute === 'sale' && (
          <Shop
            products={products.filter((p) => p.salePrice && p.salePrice < p.price)}
            categories={categories}
            onNavigate={handleNavigate}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {currentRoute === 'product-details' && (
          <ProductDetails
            slugOrId={routeParam || ''}
            products={products}
            settings={settings}
            onNavigate={handleNavigate}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {currentRoute === 'checkout' && <Checkout onNavigate={handleNavigate} />}

        {currentRoute === 'orders' && <Orders onNavigate={handleNavigate} />}

        {currentRoute === 'account' && <Account onNavigate={handleNavigate} />}

        {currentRoute === 'wishlist' && (
          <WishlistPage
            products={products}
            onNavigate={handleNavigate}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {currentRoute === 'about' && <About settings={settings} onNavigate={handleNavigate} />}

        {currentRoute === 'contact' && <Contact settings={settings} onNavigate={handleNavigate} />}

        {currentRoute === 'admin' && (
          <AdminDashboard
            products={products}
            categories={categories}
            reviews={reviews}
            settings={settings}
            onNavigate={handleNavigate}
          />
        )}

        {/* Fallback route if route is unrecognized */}
        {!['home', 'shop', 'new-arrivals', 'collections', 'sale', 'product-details', 'checkout', 'orders', 'account', 'wishlist', 'about', 'contact', 'admin'].includes(currentRoute) && (
          <Home
            products={products}
            categories={categories}
            settings={settings}
            reviews={reviews}
            onNavigate={handleNavigate}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}
      </main>

      {/* 3. Footer */}
      <Footer onNavigate={handleNavigate} settings={settings} />

      {/* 4. Sliding Cart Drawer */}
      <CartDrawer onNavigate={handleNavigate} />

      {/* 5. Live Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onNavigate={handleNavigate}
      />

      {/* 6. Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onNavigate={handleNavigate}
      />

      {/* 7. Floating Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-22 right-6 z-40 bg-white/95 hover:bg-[#292522] text-[#292522] hover:text-white border border-[#E9DFD0] p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer animate-in fade-in"
          title="Back to Top"
          aria-label="Back to Top"
        >
          <ChevronUp className="w-5 h-5 text-[#9A8568]" />
        </button>
      )}

      {/* 8. Floating WhatsApp Concierge Button */}
      {settings.whatsappEnabled && (
        <a
          href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
            'Hello House Of Rehaan, I would like styling or order assistance.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
          title="Chat with House Of Rehaan Boutique Trichy"
          aria-label="WhatsApp Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
