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
} from './firebase/db';
import type { Product, Category, Review, BusinessSettings } from './types';
import { MessageCircle } from 'lucide-react';

/**
 * Parses the current window location (pathname and hash) into an app route and param.
 * Supports /admin, /admin/, #admin, #/admin, /shop, etc.
 */
function getRouteFromLocation(): { route: string; param?: string } {
  try {
    const rawPath = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const rawHash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/+$/, '');
    const searchParams = new URLSearchParams(window.location.search);

    // Explicit check for /admin in path or hash
    if (
      rawPath === '/admin' ||
      rawPath.startsWith('/admin/') ||
      rawHash === 'admin' ||
      rawHash.startsWith('admin/')
    ) {
      return { route: 'admin' };
    }

    // Determine target from path or hash
    const target = rawHash || rawPath.replace(/^\//, '');
    const segments = target.split('/').filter(Boolean);
    const primary = segments[0] || 'home';
    const secondary = segments[1] ? decodeURIComponent(segments[1]) : undefined;

    if (primary === 'admin') return { route: 'admin' };
    if (primary === 'product' || primary === 'product-details') {
      return { route: 'product-details', param: secondary || searchParams.get('id') || undefined };
    }
    if (primary === 'shop') {
      return { route: 'shop', param: secondary || searchParams.get('category') || undefined };
    }
    if (primary === 'new-arrivals') return { route: 'new-arrivals' };
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

  // Firestore Realtime Collections State (Public Catalog Data Only)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

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
    setCurrentRoute(route);
    setRouteParam(param);

    // Sync browser URL bar so refreshing or bookmarking retains the route
    try {
      let targetPath = route === 'home' ? '/' : `/${route}`;
      if (param && (route === 'product-details' || route === 'shop')) {
        targetPath += `/${encodeURIComponent(param)}`;
      }
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ route, param }, '', targetPath);
      }
    } catch {
      // Fallback in restricted iframe environments
      try {
        window.location.hash = route === 'home' ? '' : `#${route}`;
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

        {currentRoute === 'contact' && <Contact settings={settings} />}

        {currentRoute === 'admin' && (
          <AdminDashboard
            products={products}
            categories={categories}
            reviews={reviews}
            settings={settings}
            onNavigate={handleNavigate}
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

      {/* 7. Floating WhatsApp Concierge Button */}
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
