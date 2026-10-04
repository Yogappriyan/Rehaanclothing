import React, { useState, useEffect } from 'react';
import {
  Package,
  DollarSign,
  Users,
  ShoppingCart,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Mail,
  Settings as SettingsIcon,
  Tag,
  Star,
  RefreshCw,
  Search,
  Filter,
  Send,
  Eye,
  EyeOff,
  BarChart3,
  ShieldCheck,
  Lock,
  Key,
  ExternalLink,
  LogOut,
  Upload,
} from 'lucide-react';
import {
  saveProduct,
  deleteProduct,
  updateOrderStatus,
  saveCategory,
  deleteCategory,
  cleanupDuplicateFirestoreCategories,
  updateReviewStatus,
  deleteReview,
  saveCoupon,
  deleteCoupon,
  saveSettings,
  subscribeOrders,
  subscribeCoupons,
  subscribeNotificationLogs,
  sendAutomatedEmailNotification,
  seedFullSampleCatalog,
} from '../firebase/db';
import { DeviceImageUploader } from '../components/DeviceImageUploader';
import { useAuth } from '../context/AuthContext';
import { maskPhone, maskEmail, maskAddress } from '../utils/security';
import type {
  Product,
  Category,
  Order,
  Review,
  Coupon,
  BusinessSettings,
  EmailNotificationLog,
  OrderStatus,
  ProductSize,
} from '../types';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  reviews: Review[];
  settings: BusinessSettings;
  onNavigate: (route: string, param?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  categories,
  reviews,
  settings,
  onNavigate,
}) => {
  const { user, isAdmin, adminData, signInWithGoogle, verifyOwnerPassphrase, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [revealedOrders, setRevealedOrders] = useState<Record<string, boolean>>({});
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [dashboardNotice, setDashboardNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setDashboardNotice({ type, message });
    setTimeout(() => {
      setDashboardNotice(null);
    }, 4500);
  };

  // Securely subscribe to orders, coupons, and notification logs ONLY when authorized admin is active
  useEffect(() => {
    if (!isAdmin) {
      setOrders([]);
      setCoupons([]);
      setNotificationLogs([]);
      return;
    }
    const unsubOrders = subscribeOrders((o) => setOrders(o));
    const unsubCoupons = subscribeCoupons((c) => setCoupons(c));
    const unsubLogs = subscribeNotificationLogs((logs) => setNotificationLogs(logs));
    return () => {
      unsubOrders();
      unsubCoupons();
      unsubLogs();
    };
  }, [isAdmin]);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In notice:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        setAuthError(
          'Your deployment domain is not yet added to Firebase Authorized Domains. You can log in right now using your Owner Security Key or PIN below, or add this domain in Firebase Console > Authentication > Settings > Authorized Domains.'
        );
      } else if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup')) {
        setAuthError(
          'Browser blocked the Google sign-in pop-up in this iframe. Please click "Open in New Window" below, or authenticate with your Owner Security Key / PIN.'
        );
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in window was closed. Please try again or enter your Owner Security Key.');
      } else {
        setAuthError(
          err?.message || 'Authentication failed. Please verify your credentials or open in a new window.'
        );
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasscodeUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = passcode;
    setPasscode(''); // Instantly clear from state memory
    setAuthLoading(true);
    setAuthError('');
    try {
      const verified = await verifyOwnerPassphrase(candidate);
      if (verified) {
        showNotice('success', 'Store owner identity successfully verified.');
      } else {
        setAuthError('Access Denied: Invalid Store Owner Security Key or PIN.');
      }
    } catch {
      setAuthError('Verification system unavailable. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Deter casual DOM inspection and developer shortcut snooping on owner gateway
  useEffect(() => {
    if (isAdmin) return;

    console.log(
      '%c🔒 House Of Rehaan Security Gate: All administrative authentication operations are cryptographically hashed and monitored.',
      'color: #9A8568; font-weight: bold; font-size: 12px;'
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toLowerCase() === 'u')
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'products' | 'orders' | 'categories' | 'reviews' | 'coupons' | 'notifications' | 'settings'
  >('analytics');

  const [notificationLogs, setNotificationLogs] = useState<EmailNotificationLog[]>([]);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);

  // Settings local state
  const [localSettings, setLocalSettings] = useState<BusinessSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Product Search/Filter
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('All');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState('');

  const handleSeedSampleCatalog = async () => {
    setIsSeeding(true);
    setSeedNotice('');
    try {
      await seedFullSampleCatalog(false);
      setSeedNotice('Successfully synchronized 5 categories and 75 curated products.');
      showNotice('success', 'Successfully synchronized 5 categories and 75 products in live catalog!');
      setTimeout(() => setSeedNotice(''), 5000);
    } catch (err: any) {
      setSeedNotice(`Seeding notice: ${err?.message || 'Check connection'}`);
      showNotice('error', `Seeding issue: ${err?.message || 'Check network connection'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Order Filter
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Notification simulator
  const [triggerRecipient, setTriggerRecipient] = useState<string>(settings.notificationEmail || 'houseofrehaan@gmail.com');
  const [triggerSubject, setTriggerSubject] = useState('Scheduled Daily Performance Report - Trichy Boutique');
  const [triggerSending, setTriggerSending] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
    if (settings.notificationEmail) {
      setTriggerRecipient(settings.notificationEmail);
    }
  }, [settings]);

  // Check Admin Permission
  if (!isAdmin) {
    return (
      <div
        className="max-w-xl mx-auto py-16 px-4"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="bg-white border border-[#E9DFD0] rounded-lg shadow-sm p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-[#E9DFD0]/50 text-[#9A8568] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7 text-[#7F6D54]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#9A8568]">
              Trichy Boutique Operations
            </span>
            <h2 className="font-editorial text-3xl text-[#292522]">Store Owner Admin Console</h2>
            <p className="text-xs text-[#766F68] leading-relaxed max-w-md mx-auto">
              Welcome back to the House Of Rehaan operations portal. Access live catalog inventory,
              customer orders, sales analytics, coupons, and store settings.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xs text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{authError}</div>
              <button
                onClick={() => setAuthError('')}
                className="text-rose-500 hover:text-rose-800 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Primary Authentication: Verified Google Account */}
          <div className="space-y-3">
            <button
              disabled={authLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-3 border border-[#E9DFD0] bg-white hover:bg-[#FAF8F4] text-[#292522] text-xs font-semibold rounded-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{authLoading ? 'Authenticating with Google...' : 'Sign in with Authorized Google Account'}</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#E9DFD0]"></div>
            <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-[#766F68] bg-white px-2">
              Or Authenticate with Owner Key / PIN
            </span>
            <div className="flex-grow border-t border-[#E9DFD0]"></div>
          </div>

          {/* Cryptographically Verified Store Owner Access Key */}
          <form onSubmit={handlePasscodeUnlock} className="space-y-3">
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Owner Security Key or PIN"
                autoComplete="new-password"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                data-lpignore="true"
                className="w-full pl-3.5 pr-10 py-2.5 text-xs border border-[#E9DFD0] rounded-xs bg-white text-[#292522] placeholder:text-[#766F68] focus:outline-hidden focus:border-[#9A8568]"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#766F68] hover:text-[#292522] cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={authLoading || !passcode.trim()}
              className="w-full py-2.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-wider rounded-xs transition-colors cursor-pointer disabled:opacity-40"
            >
              {authLoading ? 'Verifying Key...' : 'Verify Cryptographic Key'}
            </button>
          </form>

          <div className="pt-2 border-t border-[#E9DFD0]/60 flex items-center justify-between text-[11px] text-[#766F68]">
            <span>House Of Rehaan Security Gate</span>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#9A8568] hover:underline"
            >
              <span>Open in New Window</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Analytics Metrics
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'Cancelled')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const totalOrders = orders.length;
  const totalProductsCount = products.length;
  const uniqueCustomers = new Set(orders.map((o) => o.email || o.customerId)).size;

  const lowStockProducts = products.filter((p) => {
    const sum = p.sizeStock ? Object.values(p.sizeStock).reduce((a, b) => a + b, 0) : 0;
    return sum > 0 && sum <= 5;
  });

  const outOfStockProducts = products.filter((p) => {
    const sum = p.sizeStock ? Object.values(p.sizeStock).reduce((a, b) => a + b, 0) : 0;
    return sum === 0;
  });

  // Handlers
  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.category || !editingProduct?.price) {
      showNotice('error', 'Please fill out Name, Category, and Price');
      return;
    }

    try {
      await saveProduct(editingProduct);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      showNotice('success', `Product "${editingProduct.name}" saved successfully!`);
    } catch (err: any) {
      console.error(err);
      showNotice('error', `Error saving product: ${err?.message || 'Check connection'}`);
    }
  };

  const handleSaveCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    try {
      await saveCategory(editingCategory);
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      showNotice('success', `Category "${editingCategory.name}" updated successfully!`);
    } catch (err: any) {
      console.error(err);
      showNotice('error', `Error saving category: ${err?.message || 'Check connection'}`);
    }
  };

  const handleSaveCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code || !editingCoupon?.discountValue) return;
    try {
      await saveCoupon({
        ...editingCoupon,
        code: editingCoupon.code.toUpperCase(),
      });
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      showNotice('success', `Coupon code "${editingCoupon.code.toUpperCase()}" saved!`);
    } catch (err: any) {
      console.error(err);
      showNotice('error', `Error saving coupon: ${err?.message || 'Check connection'}`);
    }
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings(localSettings);
      setSettingsSaved(true);
      showNotice('success', 'Boutique store settings updated successfully!');
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      showNotice('error', `Error saving settings: ${err?.message || 'Check connection'}`);
    }
  };

  const handleTriggerEmailReport = async () => {
    setTriggerSending(true);
    setTriggerSuccess('');
    try {
      await sendAutomatedEmailNotification({
        to: triggerRecipient,
        subject: triggerSubject,
        type: 'scheduled_report',
        content: `Scheduled Store Report Generated for House Of Rehaan Trichy: Total Revenue: ₹${totalRevenue.toLocaleString(
          'en-IN'
        )}, Total Orders: ${totalOrders}, Active Catalog Items: ${totalProductsCount}, Low Stock Alerts: ${
          lowStockProducts.length
        }.`,
      });
      setTriggerSuccess('Automated email dispatched & logged in cloud audit trail!');
      showNotice('success', 'Automated email report generated and logged in audit log.');
      setTimeout(() => setTriggerSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      showNotice('error', `Failed to send notification: ${err?.message || 'Check configuration'}`);
    } finally {
      setTriggerSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E9DFD0] gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#9A8568] font-bold">
              Trichy Boutique Operations
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-xs">
              Live Cloud Firestore
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#292522] mt-1 font-normal">
            Admin Management Console
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#766F68]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Store Administrator:</span>
            <strong className="text-[#292522] font-semibold">
              {adminData?.email || user?.email || 'animeflicks2310@gmail.com'}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('shop')}
            className="px-3.5 py-2 border border-[#E9DFD0] bg-white text-xs font-semibold text-[#292522] rounded-xs hover:border-[#9A8568] transition-colors cursor-pointer"
          >
            Live Store View
          </button>

          <button
            onClick={signOut}
            className="px-3.5 py-2 border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-xs font-semibold text-rose-700 rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Log out of admin session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {dashboardNotice && (
        <div
          className={`mb-6 p-3.5 rounded-xs border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
            dashboardNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {dashboardNotice.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{dashboardNotice.message}</span>
          </div>
          <button
            onClick={() => setDashboardNotice(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 pb-4 border-b border-[#E9DFD0] mb-8 text-xs font-medium">
        {[
          { id: 'analytics', label: 'Overview & Analytics', icon: BarChart3 },
          { id: 'products', label: `Products (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingCart },
          { id: 'categories', label: `Categories (${categories.length})`, icon: Tag },
          { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
          { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
          { id: 'notifications', label: 'Automated Emails & Reports', icon: Mail },
          { id: 'settings', label: 'Store Settings', icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#292522] text-white shadow-xs font-semibold'
                  : 'bg-white text-[#766F68] border border-[#E9DFD0] hover:text-[#292522] hover:border-[#9A8568]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* 4 Core Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white border border-[#E9DFD0] rounded-md shadow-2xs">
              <div className="flex items-center justify-between text-[#766F68] text-xs font-medium uppercase tracking-wider">
                <span>Total Revenue</span>
                <DollarSign className="w-4 h-4 text-[#9A8568]" />
              </div>
              <p className="font-editorial text-3xl text-[#292522] font-semibold mt-2">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">From all non-cancelled orders</p>
            </div>

            <div className="p-6 bg-white border border-[#E9DFD0] rounded-md shadow-2xs">
              <div className="flex items-center justify-between text-[#766F68] text-xs font-medium uppercase tracking-wider">
                <span>Total Orders</span>
                <ShoppingCart className="w-4 h-4 text-[#9A8568]" />
              </div>
              <p className="font-editorial text-3xl text-[#292522] font-semibold mt-2">
                {totalOrders}
              </p>
              <p className="text-[11px] text-[#766F68] mt-1">Direct boutique purchases</p>
            </div>

            <div className="p-6 bg-white border border-[#E9DFD0] rounded-md shadow-2xs">
              <div className="flex items-center justify-between text-[#766F68] text-xs font-medium uppercase tracking-wider">
                <span>Active Products</span>
                <Package className="w-4 h-4 text-[#9A8568]" />
              </div>
              <p className="font-editorial text-3xl text-[#292522] font-semibold mt-2">
                {totalProductsCount}
              </p>
              <p className="text-[11px] text-[#766F68] mt-1">
                Across {categories.filter((c) => c.active).length} categories
              </p>
            </div>

            <div className="p-6 bg-white border border-[#E9DFD0] rounded-md shadow-2xs">
              <div className="flex items-center justify-between text-[#766F68] text-xs font-medium uppercase tracking-wider">
                <span>Unique Customers</span>
                <Users className="w-4 h-4 text-[#9A8568]" />
              </div>
              <p className="font-editorial text-3xl text-[#292522] font-semibold mt-2">
                {uniqueCustomers || 1}
              </p>
              <p className="text-[11px] text-[#766F68] mt-1">Trichy & PAN India</p>
            </div>
          </div>

          {/* Inventory Alerts (Low stock & Out of stock) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-md border border-[#E9DFD0] shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-editorial text-lg text-[#292522] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Low Stock Warnings ({lowStockProducts.length})</span>
                </h3>
              </div>

              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-[#766F68]">All active inventory is sufficiently stocked.</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {lowStockProducts.map((p) => {
                    const total = p.sizeStock
                      ? Object.values(p.sizeStock).reduce((a, b) => a + b, 0)
                      : 0;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 bg-[#FAF8F4] border border-[#E9DFD0] rounded-xs text-xs"
                      >
                        <span className="font-medium text-[#292522] truncate max-w-[200px]">
                          {p.name}
                        </span>
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-xs">
                          {total} left in stock
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-md border border-[#E9DFD0] shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-editorial text-lg text-[#292522] flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-600" />
                  <span>Out of Stock Items ({outOfStockProducts.length})</span>
                </h3>
              </div>

              {outOfStockProducts.length === 0 ? (
                <p className="text-xs text-[#766F68]">No items currently out of stock.</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {outOfStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-200 rounded-xs text-xs"
                    >
                      <span className="font-medium text-rose-900 truncate max-w-[200px]">
                        {p.name}
                      </span>
                      <span className="text-rose-700 font-semibold uppercase text-[10px]">
                        Sold Out
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white p-6 rounded-md border border-[#E9DFD0] shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-editorial text-lg text-[#292522]">Latest Boutique Orders</h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs text-[#9A8568] hover:underline font-semibold"
              >
                View all orders →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#766F68]">
                <thead className="bg-[#FAF8F4] text-[#292522] uppercase tracking-wider font-semibold border-y border-[#E9DFD0]">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-[#FAF8F4]/50">
                      <td className="p-3 font-mono font-bold text-[#292522]">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-3 text-[#292522]">{o.customerName}</td>
                      <td className="p-3">{o.items?.length} items</td>
                      <td className="p-3 font-semibold text-[#292522]">
                        ₹{o.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-[#E9DFD0]/60 text-[#292522]">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#E9DFD0]">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#766F68] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-[#E9DFD0] rounded-xs bg-white"
                />
              </div>

              <select
                value={selectedProductCategory}
                onChange={(e) => setSelectedProductCategory(e.target.value)}
                className="bg-white border border-[#E9DFD0] text-xs rounded-xs px-3 py-2 text-[#292522]"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleSeedSampleCatalog}
                disabled={isSeeding}
                className="px-3 py-2 border border-[#9A8568] bg-[#FAF8F4] text-[#9A8568] hover:bg-[#9A8568] hover:text-white text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                title="Populate 5 categories with 15 products each (75 products total)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>{isSeeding ? 'Populating 75 Products...' : 'Seed 5 Categories & 75 Products'}</span>
              </button>

              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    category: categories[0]?.name || 'Kurtis & Tunics',
                    price: 1999,
                    salePrice: 1799,
                    description: '',
                    fabric: 'Cotton Mulmul',
                    sizes: ['S', 'M', 'L', 'XL'],
                    sizeStock: { S: 5, M: 5, L: 5, XL: 5 },
                    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80'],
                    status: 'active',
                    newArrival: true,
                    featured: true,
                    customizationAvailable: false,
                  });
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          {seedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center justify-between">
              <span>{seedNotice}</span>
              <button onClick={() => setSeedNotice('')} className="text-emerald-600 hover:text-emerald-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products
              .filter((p) => {
                const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
                const matchCat =
                  selectedProductCategory === 'All' || p.category === selectedProductCategory;
                return matchSearch && matchCat;
              })
              .map((p) => (
                <div
                  key={p.id}
                  className="group bg-white border border-[#E9DFD0] rounded-md overflow-hidden flex flex-col justify-between shadow-2xs"
                >
                  <div className="relative aspect-3/4 bg-[#F4EFE6]">
                    <img
                      src={p.images?.[0] || p.thumbnail}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider ${
                          p.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(p);
                        setIsProductModalOpen(true);
                      }}
                      className="absolute bottom-2 left-2 right-2 py-1.5 bg-[#292522]/90 hover:bg-[#292522] text-white text-[10px] font-semibold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer shadow-xs"
                      title="Upload photos from device or edit images"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload / Manage Photos</span>
                    </button>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <span className="text-[10px] text-[#9A8568] uppercase font-semibold">
                      {p.category}
                    </span>
                    <h4 className="font-editorial text-sm text-[#292522] line-clamp-1">{p.name}</h4>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                      <span className="font-semibold text-[#292522]">
                        ₹{(p.salePrice || p.price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-[#766F68]">
                        Total Stock:{' '}
                        {p.sizeStock ? Object.values(p.sizeStock).reduce((a, b) => a + b, 0) : 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setIsProductModalOpen(true);
                        }}
                        className="flex-1 py-1.5 bg-[#FAF8F4] border border-[#E9DFD0] hover:bg-[#E9DFD0] text-[11px] font-semibold text-[#292522] rounded-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await deleteProduct(p.id);
                            showNotice('success', `Product "${p.name}" deleted.`);
                          } catch (err: any) {
                            showNotice('error', `Failed to delete product: ${err?.message}`);
                          }
                        }}
                        className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xs cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E9DFD0]">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#766F68]">Filter by status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-white border border-[#E9DFD0] rounded-xs px-3 py-1.5 text-xs text-[#292522]"
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {orders
              .filter((o) => orderStatusFilter === 'All' || o.orderStatus === orderStatusFilter)
              .map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-[#E9DFD0] rounded-md p-5 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2 text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#292522] text-sm">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[#766F68] ml-3">
                        Placed on {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-[#292522]">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="px-2.5 py-1 rounded-xs uppercase font-semibold text-[10px] bg-[#E9DFD0] text-[#292522]">
                        {order.paymentMethod.replace('_', ' ')} • {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#766F68]">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-[#292522] block font-semibold">
                          Customer & Delivery:
                        </strong>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedOrders((prev) => ({
                              ...prev,
                              [order.id]: !prev[order.id],
                            }))
                          }
                          className="text-[10px] text-[#9A8568] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {revealedOrders[order.id] ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Mask</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Reveal</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[#292522] font-medium">{order.customerName}</p>
                      <p>
                        {revealedOrders[order.id] ? order.phone : maskPhone(order.phone)}
                      </p>
                      <p>
                        {revealedOrders[order.id] ? order.email : maskEmail(order.email)}
                      </p>
                      <p className="mt-1">
                        {revealedOrders[order.id]
                          ? `${order.address?.address}, `
                          : `${maskAddress(order.address?.address)}, `}
                        {order.address?.city} - {order.address?.pincode}
                      </p>
                    </div>

                    <div>
                      <strong className="text-[#292522] block font-semibold mb-1">
                        Purchased Items:
                      </strong>
                      <div className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="truncate max-w-[180px]">
                              {item.quantity}x {item.productName} ({item.size})
                            </span>
                            <span className="font-medium text-[#292522]">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Fulfillment Status Updater */}
                    <div className="bg-[#FAF8F4] p-3 rounded-xs border border-[#E9DFD0] space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-[#9A8568] tracking-wider">
                        Update Order Status
                      </label>
                      <select
                        value={order.orderStatus}
                        onChange={async (e) => {
                          const newStatus = e.target.value as OrderStatus;
                          await updateOrderStatus(order.id, newStatus);
                        }}
                        className="w-full bg-white border border-[#E9DFD0] text-xs p-2 rounded-xs font-semibold text-[#292522]"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <div className="pt-1">
                        <label className="block text-[10px] text-[#766F68] mb-0.5">
                          Tracking AWB / Courier
                        </label>
                        <input
                          type="text"
                          defaultValue={order.trackingNumber || ''}
                          placeholder="e.g. DTDC-123456"
                          onBlur={async (e) => {
                            await updateOrderStatus(order.id, order.orderStatus, e.target.value);
                          }}
                          className="w-full text-xs p-1.5 border border-[#E9DFD0] rounded-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-[#E9DFD0]">
            <div>
              <h3 className="font-editorial text-xl text-[#292522]">Product Categories</h3>
              <p className="text-xs text-[#766F68]">Manage curated boutique categories and display order.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const removed = await cleanupDuplicateFirestoreCategories();
                    if (removed > 0) {
                      showNotice('success', `Cleaned up ${removed} duplicate category documents.`);
                    } else {
                      showNotice('success', 'Categories are already clean and deduplicated.');
                    }
                  } catch (err: any) {
                    showNotice('error', `Cleanup notice: ${err?.message || err}`);
                  }
                }}
                className="px-3.5 py-2 bg-white border border-[#E9DFD0] hover:bg-[#F6F1EA] text-[#292522] text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Consolidate duplicate category documents in the database"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#9A8568]" />
                <span>Remove Duplicates</span>
              </button>

              <button
                onClick={() => {
                  setEditingCategory({
                    name: '',
                    slug: '',
                    image: '/hero-banner.jpg',
                    active: true,
                  });
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-[#E9DFD0] rounded-md overflow-hidden p-4 space-y-3 shadow-2xs"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-32 object-cover rounded-xs bg-[#F4EFE6]"
                />
                <div className="flex items-center justify-between">
                  <h4 className="font-editorial text-base text-[#292522]">{c.name}</h4>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-xs uppercase ${
                      c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => {
                      setEditingCategory(c);
                      setIsCategoryModalOpen(true);
                    }}
                    className="flex-1 py-1 bg-[#FAF8F4] border border-[#E9DFD0] text-xs font-medium rounded-xs hover:bg-[#E9DFD0]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await deleteCategory(c.id);
                        showNotice('success', `Category "${c.name}" deleted.`);
                      } catch (err: any) {
                        showNotice('error', `Failed to delete: ${err?.message}`);
                      }
                    }}
                    className="p-1 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xs cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <h3 className="font-editorial text-xl text-[#292522]">Customer Reviews Management</h3>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-[#E9DFD0] rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-xs">{'★'.repeat(r.rating)}</span>
                    <strong className="text-xs text-[#292522]">{r.customerName}</strong>
                    {r.product && (
                      <span className="text-[11px] text-[#766F68]">on {r.product}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#766F68] italic">"{r.review}"</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      await updateReviewStatus(r.id, !r.approved);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors ${
                      r.approved
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-zinc-100 border-zinc-300 text-zinc-600'
                    }`}
                  >
                    {r.approved ? 'Approved (Visible)' : 'Pending Approval'}
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await deleteReview(r.id);
                        showNotice('success', 'Review deleted.');
                      } catch (err: any) {
                        showNotice('error', `Failed to delete review: ${err?.message}`);
                      }
                    }}
                    className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xs cursor-pointer"
                    title="Delete review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 border-b border-[#E9DFD0]">
            <div>
              <h3 className="font-editorial text-xl text-[#292522]">Coupons & Promotions</h3>
              <p className="text-xs text-[#766F68] mt-0.5">
                Manage promotional discount codes and cart checkout vouchers for your customers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const presetList = [
                      {
                        code: 'WELCOME10',
                        discountType: 'percentage' as const,
                        discountValue: 10,
                        minimumOrder: 999,
                        maximumDiscount: 500,
                        active: true,
                      },
                      {
                        code: 'REHAAN15',
                        discountType: 'percentage' as const,
                        discountValue: 15,
                        minimumOrder: 1499,
                        maximumDiscount: 750,
                        active: true,
                      },
                      {
                        code: 'TRICHY100',
                        discountType: 'fixed' as const,
                        discountValue: 100,
                        minimumOrder: 999,
                        active: true,
                      },
                      {
                        code: 'FESTIVE20',
                        discountType: 'percentage' as const,
                        discountValue: 20,
                        minimumOrder: 1999,
                        maximumDiscount: 1000,
                        active: true,
                      },
                    ];
                    for (const p of presetList) {
                      await saveCoupon(p);
                    }
                    showNotice('success', 'Standard boutique coupons restored and live!');
                  } catch (err: any) {
                    showNotice('error', `Failed to restore presets: ${err?.message}`);
                  }
                }}
                className="px-3 py-2 bg-[#FAF8F4] border border-[#E9DFD0] hover:bg-[#E9DFD0] text-xs font-semibold text-[#292522] rounded-xs cursor-pointer"
              >
                Restore Boutique Presets
              </button>
              <button
                onClick={() => {
                  setEditingCoupon({
                    code: '',
                    discountType: 'percentage',
                    discountValue: 10,
                    minimumOrder: 999,
                    maximumDiscount: 500,
                    active: true,
                  });
                  setIsCouponModalOpen(true);
                }}
                className="px-4 py-2 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            </div>
          </div>

          {coupons.length === 0 ? (
            <div className="bg-[#FAF8F4] border border-[#E9DFD0] rounded-md p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E9DFD0]/60 text-[#9A8568] flex items-center justify-center mx-auto">
                <Tag className="w-6 h-6" />
              </div>
              <h4 className="font-editorial text-lg text-[#292522]">No Active Coupons Configured</h4>
              <p className="text-xs text-[#766F68] max-w-md mx-auto">
                Create custom discount vouchers or restore the standard boutique starter coupons
                (WELCOME10, REHAAN15, TRICHY100, FESTIVE20) to offer instant checkout discounts.
              </p>
              <button
                onClick={async () => {
                  try {
                    const presetList = [
                      {
                        code: 'WELCOME10',
                        discountType: 'percentage' as const,
                        discountValue: 10,
                        minimumOrder: 999,
                        maximumDiscount: 500,
                        active: true,
                      },
                      {
                        code: 'REHAAN15',
                        discountType: 'percentage' as const,
                        discountValue: 15,
                        minimumOrder: 1499,
                        maximumDiscount: 750,
                        active: true,
                      },
                      {
                        code: 'TRICHY100',
                        discountType: 'fixed' as const,
                        discountValue: 100,
                        minimumOrder: 999,
                        active: true,
                      },
                    ];
                    for (const p of presetList) {
                      await saveCoupon(p);
                    }
                    showNotice('success', 'Standard boutique coupons created successfully!');
                  } catch (err: any) {
                    showNotice('error', `Failed to create coupons: ${err?.message}`);
                  }
                }}
                className="px-5 py-2.5 bg-[#292522] text-white text-xs font-semibold uppercase tracking-wider rounded-xs hover:bg-[#9A8568] cursor-pointer"
              >
                Seed Standard Boutique Coupons
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white border rounded-md p-4 space-y-3 shadow-2xs transition-all ${
                    c.active ? 'border-[#E9DFD0]' : 'border-zinc-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#292522] bg-[#FAF8F4] px-2.5 py-1 border border-[#E9DFD0] rounded-xs tracking-wider">
                      {c.code}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await saveCoupon({
                            ...c,
                            active: !c.active,
                          });
                          showNotice(
                            'success',
                            `Coupon "${c.code}" is now ${!c.active ? 'Active' : 'Disabled'}.`
                          );
                        } catch (err: any) {
                          showNotice('error', `Could not update status: ${err?.message}`);
                        }
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase cursor-pointer transition-colors ${
                        c.active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                      title="Click to toggle status"
                    >
                      {c.active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="text-xs text-[#766F68] space-y-1.5 bg-[#FAF8F4]/50 p-2.5 rounded-xs">
                    <p className="flex justify-between">
                      <span>Discount:</span>
                      <strong className="text-[#292522]">
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}% OFF`
                          : `₹${c.discountValue} Flat OFF`}
                      </strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Min Order:</span>
                      <span className="text-[#292522]">₹{c.minimumOrder || 0}</span>
                    </p>
                    {c.maximumDiscount && c.discountType === 'percentage' && (
                      <p className="flex justify-between">
                        <span>Max Cap:</span>
                        <span className="text-[#292522]">₹{c.maximumDiscount}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-zinc-100">
                    <button
                      onClick={() => {
                        setEditingCoupon(c);
                        setIsCouponModalOpen(true);
                      }}
                      className="flex-1 py-1.5 bg-[#FAF8F4] border border-[#E9DFD0] text-xs font-semibold rounded-xs hover:bg-[#E9DFD0] text-[#292522] cursor-pointer"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteCoupon(c.id);
                          showNotice('success', `Coupon "${c.code}" deleted.`);
                        } catch (err: any) {
                          showNotice('error', `Failed to delete coupon: ${err?.message}`);
                        }
                      }}
                      className="px-2.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xs cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 7: AUTOMATED EMAILS & REPORTS */}
      {activeTab === 'notifications' && (
        <div className="space-y-8">
          <div className="bg-white border border-[#E9DFD0] rounded-md p-6 space-y-5 shadow-2xs">
            <h3 className="font-editorial text-xl text-[#292522] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#9A8568]" />
              <span>Automated Notification Pipeline & Cloud Delivery</span>
            </h3>
            <p className="text-xs text-[#766F68] leading-relaxed max-w-2xl">
              House Of Rehaan triggers real-time and scheduled email notifications via structured Cloud
              Functions logic: customer purchase receipts, courier dispatch tracking, and scheduled
              daily/weekly store performance reports sent to store owners.
            </p>

            {/* Manual Trigger / Test Dispatch */}
            <div className="p-4 bg-[#FAF8F4] border border-[#E9DFD0] rounded-xs space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#292522]">
                Instant Scheduled Report Dispatcher
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#766F68] mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={triggerRecipient}
                    onChange={(e) => setTriggerRecipient(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-[#E9DFD0] rounded-xs font-medium text-[#292522]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#766F68] mb-1">Report Subject</label>
                  <input
                    type="text"
                    value={triggerSubject}
                    onChange={(e) => setTriggerSubject(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-[#E9DFD0] rounded-xs text-[#292522]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  disabled={triggerSending}
                  onClick={handleTriggerEmailReport}
                  className="px-5 py-2.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center gap-2 cursor-pointer disabled:bg-zinc-400"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{triggerSending ? 'Generating & Dispatching...' : 'Dispatch Scheduled Report'}</span>
                </button>
                {triggerSuccess && (
                  <span className="text-xs text-emerald-700 font-semibold">{triggerSuccess}</span>
                )}
              </div>
            </div>
          </div>

          {/* Cloud Email Notification Audit Trail */}
          <div className="bg-white border border-[#E9DFD0] rounded-md p-6 space-y-4 shadow-2xs">
            <h4 className="font-editorial text-lg text-[#292522]">
              Live Notification Audit Log ({notificationLogs.length})
            </h4>

            {notificationLogs.length === 0 ? (
              <p className="text-xs text-[#766F68]">No email notifications logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#766F68]">
                  <thead className="bg-[#FAF8F4] text-[#292522] uppercase tracking-wider font-semibold border-y border-[#E9DFD0]">
                    <tr>
                      <th className="p-2.5">Date & Time</th>
                      <th className="p-2.5">Recipient</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-mono">
                    {notificationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF8F4]/60">
                        <td className="p-2.5">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-2.5 text-[#292522]">{log.to}</td>
                        <td className="p-2.5 uppercase text-[10px] font-bold text-[#9A8568]">
                          {log.type}
                        </td>
                        <td className="p-2.5 font-sans truncate max-w-xs">{log.subject}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-xs bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 8: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettingsSubmit} className="bg-white border border-[#E9DFD0] rounded-md p-6 sm:p-8 space-y-6 shadow-2xs max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#E9DFD0]">
            <h3 className="font-editorial text-2xl text-[#292522]">Trichy Store & System Settings</h3>
            {settingsSaved && (
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xs">
                Settings Saved Successfully!
              </span>
            )}
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#292522] mb-1">Store Name</label>
              <input
                type="text"
                value={localSettings.storeName}
                onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })}
                className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#292522] mb-1">
                  Google Maps Location URL (Get Directions)
                </label>
                <input
                  type="url"
                  value={localSettings.googleMapsUrl || 'https://maps.app.goo.gl/mLggnqsck5AnXRRN6'}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, googleMapsUrl: e.target.value })
                  }
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#292522] mb-1">Store Address</label>
                <input
                  type="text"
                  value={localSettings.address}
                  onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#292522] mb-1">Hero Title</label>
                <input
                  type="text"
                  value={localSettings.heroTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#292522] mb-1">Hero Subtitle</label>
                <input
                  type="text"
                  value={localSettings.heroSubtitle}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })
                  }
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#292522] mb-1">
                  Owner Notification Recipient Email
                </label>
                <input
                  type="email"
                  value={localSettings.notificationEmail}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, notificationEmail: e.target.value })
                  }
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#292522] mb-1">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={localSettings.whatsappNumber}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })
                  }
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#292522] mb-1">
                  Free Shipping Minimum Threshold (₹)
                </label>
                <input
                  type="number"
                  value={localSettings.freeShippingThreshold}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      freeShippingThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#292522] mb-1">
                  Standard Shipping Fee (₹)
                </label>
                <input
                  type="number"
                  value={localSettings.standardShippingFee}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      standardShippingFee: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={localSettings.whatsappEnabled}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, whatsappEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#9A8568]"
                />
                <span className="font-semibold text-[#292522]">
                  Enable WhatsApp Direct Enquiry on Product Details & Header
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E9DFD0]">
            <button
              type="submit"
              className="px-6 py-3 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
            >
              Save Business Settings
            </button>
          </div>
        </form>
      )}

      {/* PRODUCT EDIT/ADD MODAL */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-md border border-[#E9DFD0] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9DFD0]">
              <h3 className="font-editorial text-xl text-[#292522]">
                {editingProduct.id ? 'Edit Product' : 'Add New Product to Catalog'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-full text-[#766F68]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    value={editingProduct.category || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Original Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.salePrice || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fabric</label>
                  <input
                    type="text"
                    value={editingProduct.fabric || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                    placeholder="e.g. Cotton Mulmul, Chanderi"
                    className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Occasion</label>
                  <input
                    type="text"
                    value={editingProduct.occasion || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, occasion: e.target.value })
                    }
                    placeholder="e.g. Everyday, Festive"
                    className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Fit</label>
                  <input
                    type="text"
                    value={editingProduct.fit || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fit: e.target.value })}
                    placeholder="e.g. Relaxed, Tailored"
                    className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                  />
                </div>
              </div>

              {/* Sizes stock */}
              <div>
                <label className="block font-semibold mb-1.5">Size-wise Stock Units</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ProductSize[]).map((sz) => (
                    <div key={sz} className="p-2 border border-[#E9DFD0] rounded-xs bg-[#FAF8F4]">
                      <span className="block text-[10px] font-bold">{sz}</span>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.sizeStock?.[sz] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingProduct({
                            ...editingProduct,
                            sizeStock: {
                              ...editingProduct.sizeStock,
                              [sz]: val,
                            },
                          });
                        }}
                        className="w-full p-1 bg-white border border-[#E9DFD0] text-xs mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>

              {/* Drop / Upload Image From Your Device */}
              <DeviceImageUploader
                images={editingProduct.images || []}
                onChange={(updatedImages) => {
                  setEditingProduct({
                    ...editingProduct,
                    images: updatedImages,
                    thumbnail: updatedImages[0] || '/hero-banner.jpg',
                  });
                }}
              />

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.newArrival ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, newArrival: e.target.checked })
                    }
                    className="accent-[#9A8568]"
                  />
                  <span>New Arrival</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.featured ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, featured: e.target.checked })
                    }
                    className="accent-[#9A8568]"
                  />
                  <span>Featured Collection</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.customizationAvailable ?? false}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        customizationAvailable: e.target.checked,
                      })
                    }
                    className="accent-[#9A8568]"
                  />
                  <span>Customization Available</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#E9DFD0] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-[#E9DFD0] rounded-xs text-[#766F68]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#292522] hover:bg-[#9A8568] text-white rounded-xs font-semibold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY EDIT MODAL */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-md border border-[#E9DFD0] p-6 space-y-4">
            <h3 className="font-editorial text-xl text-[#292522]">Category Details</h3>
            <form onSubmit={handleSaveCategorySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-2 border border-[#E9DFD0] rounded-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Image URL</label>
                <input
                  type="text"
                  required
                  value={editingCategory.image || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                  className="w-full p-2 border border-[#E9DFD0] rounded-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-[#E9DFD0] rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#292522] text-white rounded-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON EDIT MODAL */}
      {isCouponModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-md border border-[#E9DFD0] p-6 space-y-4">
            <h3 className="font-editorial text-xl text-[#292522]">Coupon Details</h3>
            <form onSubmit={handleSaveCouponSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Coupon Code (e.g. FESTIVE20)</label>
                <input
                  type="text"
                  required
                  value={editingCoupon.code || ''}
                  onChange={(e) =>
                    setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })
                  }
                  className="w-full p-2 border border-[#E9DFD0] rounded-xs uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Discount Type</label>
                  <select
                    value={editingCoupon.discountType || 'percentage'}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        discountType: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full p-2 border border-[#E9DFD0] rounded-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={editingCoupon.discountValue || 0}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, discountValue: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-[#E9DFD0] rounded-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Minimum Order Amount (₹)</label>
                  <input
                    type="number"
                    value={editingCoupon.minimumOrder ?? 0}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, minimumOrder: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-[#E9DFD0] rounded-xs"
                    placeholder="0"
                  />
                </div>

                {editingCoupon.discountType === 'percentage' && (
                  <div>
                    <label className="block font-semibold mb-1">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      value={editingCoupon.maximumDiscount ?? ''}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          maximumDiscount: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full p-2 border border-[#E9DFD0] rounded-xs"
                      placeholder="Optional, e.g. 500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-1 flex items-center justify-between p-2.5 bg-[#FAF8F4] border border-[#E9DFD0] rounded-xs">
                <div>
                  <span className="font-semibold block text-[#292522]">Coupon Status</span>
                  <span className="text-[11px] text-[#766F68]">
                    {editingCoupon.active ? 'Active & redeemable by shoppers' : 'Disabled (hidden from checkout)'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCoupon.active ?? true}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, active: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-[#E9DFD0] rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#292522] text-white rounded-xs font-semibold"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
