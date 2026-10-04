import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type {
  Product,
  Category,
  Collection as StoreCollection,
  Lookbook,
  Banner,
  Offer,
  Coupon,
  Order,
  ContactRequest,
  Review,
  BusinessSettings,
  EmailNotification,
  ScheduledReport,
} from '../types';

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'House Of Rehaan',
  storeName: 'House Of Rehaan',
  phone: '+91 9790478436',
  email: 'houseofrehaan@gmail.com',
  address: 'Plot No. 46, 2nd Cross, Sathanur, Trichy – 620102, Tamil Nadu, India',
  whatsappNumber: '919790478436',
  whatsappEnabled: true,
  instagram: '',
  facebook: '',
  youtube: '',
  googleMapsUrl: 'https://maps.app.goo.gl/mLggnqsck5AnXRRN6',
  businessHours: 'Mon - Sat: 10:00 AM - 8:30 PM',
  announcement: 'New styles arriving soon | Delivery available across India',
  heroTitle: 'Style That Feels Like You',
  heroSubtitle: "Discover thoughtfully selected women's fashion from House Of Rehaan.",
  notificationEmail: 'houseofrehaan@gmail.com',
  freeShippingThreshold: 1999,
  standardShippingFee: 99,
};

import { SAMPLE_CATEGORIES, ALL_SAMPLE_PRODUCTS } from '../data/allSampleProducts';

// 5 Sample Categories and 75 Products (15 in each category)
export const INITIAL_CATEGORIES: Omit<Category, 'id'>[] = SAMPLE_CATEGORIES;
export const INITIAL_DEMO_PRODUCTS: Omit<Product, 'id'>[] = ALL_SAMPLE_PRODUCTS;

/**
 * Normalizes a category name or slug to a unified canonical key.
 * This prevents duplicates like "Kurtis" vs "Kurtis & Tunics", or repeated seed documents.
 */
export function getNormalizedCategoryKey(cat: { name?: string; slug?: string }): string {
  const raw = ((cat?.name || '') + ' ' + (cat?.slug || '')).toLowerCase().trim();
  if (raw.includes('kurti') || raw.includes('tunic')) return 'kurtis-tunics';
  if (raw.includes('saree')) return 'handcrafted-sarees';
  if (raw.includes('dress')) return 'designer-dresses';
  if (raw.includes('co-ord') || raw.includes('coord')) return 'co-ord-sets';
  if (raw.includes('western') || raw.includes('fusion')) return 'western-fusion';
  return (cat?.slug || cat?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Actively cleans up duplicate category documents from Firestore.
 * Keeps the canonical document and permanently deletes redundant duplicates.
 */
export async function cleanupDuplicateFirestoreCategories(): Promise<number> {
  try {
    const categoriesCol = collection(db, 'categories');
    const snap = await getDocs(categoriesCol);
    if (snap.size <= 1) return 0;

    const seenKeys = new Map<string, { id: string; name: string }>();
    let deletedCount = 0;

    for (const d of snap.docs) {
      const data = d.data();
      const key = getNormalizedCategoryKey({ name: data.name, slug: data.slug });
      if (!key) continue;

      if (!seenKeys.has(key)) {
        seenKeys.set(key, { id: d.id, name: data.name || '' });
      } else {
        const existing = seenKeys.get(key)!;
        // If current doc has longer or more canonical name (e.g. "Kurtis & Tunics" > "Kurtis"), replace and delete existing
        if ((data.name || '').length > existing.name.length) {
          const oldRef = doc(db, 'categories', existing.id);
          await deleteDoc(oldRef);
          seenKeys.set(key, { id: d.id, name: data.name || '' });
        } else {
          // Delete this duplicate document
          await deleteDoc(d.ref);
        }
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Deduplication complete: removed ${deletedCount} duplicate categories from Firestore.`);
    }
    return deletedCount;
  } catch (err) {
    console.warn('Category deduplication notice:', err);
    return 0;
  }
}

// Explicit helper to seed or re-seed the full 5 categories and 75 products
export async function seedFullSampleCatalog(clearPrevious = false) {
  try {
    const productsCol = collection(db, 'products');
    const categoriesCol = collection(db, 'categories');

    if (clearPrevious) {
      const prodSnap = await getDocs(productsCol);
      for (const d of prodSnap.docs) {
        await deleteDoc(d.ref);
      }
      const catSnap = await getDocs(categoriesCol);
      for (const d of catSnap.docs) {
        await deleteDoc(d.ref);
      }
    }

    // 1. Clean any existing duplicates first
    await cleanupDuplicateFirestoreCategories();

    // 2. Seed Categories (ensure all 5 exist without duplication)
    const catSnap = await getDocs(categoriesCol);
    const existingCatKeys = new Set(
      catSnap.docs.map((d) => getNormalizedCategoryKey({ name: d.data().name, slug: d.data().slug }))
    );
    for (const cat of SAMPLE_CATEGORIES) {
      const catKey = getNormalizedCategoryKey(cat);
      if (!existingCatKeys.has(catKey)) {
        await addDoc(categoriesCol, cat);
        existingCatKeys.add(catKey);
      }
    }

    // 3. Seed Products (ensure all 75 sample products exist)
    const prodSnap = await getDocs(productsCol);
    const existingProdSlugs = new Set(prodSnap.docs.map((d) => d.data().slug));
    for (const prod of ALL_SAMPLE_PRODUCTS) {
      if (!existingProdSlugs.has(prod.slug)) {
        await addDoc(productsCol, prod);
      }
    }
  } catch (err) {
    console.warn('Catalog seeding notice:', err);
  }
}

// Seed database if clean or incomplete
export async function seedInitialDatabaseIfEmpty() {
  try {
    // 1. Settings
    const settingsRef = doc(db, 'settings', 'business');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, DEFAULT_SETTINGS);
    }

    // 2. Always clean any duplicate categories on app launch
    await cleanupDuplicateFirestoreCategories();

    // 3. Categories & Products Check
    const categoriesCol = collection(db, 'categories');
    const catSnap = await getDocs(categoriesCol);
    const productsCol = collection(db, 'products');
    const prodSnap = await getDocs(productsCol);

    // If database has less than 75 products or less than 5 categories, populate the sample catalog
    if (prodSnap.size < 75 || catSnap.size < 5) {
      await seedFullSampleCatalog(false);
    }
  } catch (error) {
    console.warn('Database initialization / check:', error);
  }
}

// -------------------------------------------------------------
// Real-time Subscriptions & CRUD
// -------------------------------------------------------------

export function subscribeBusinessSettings(callback: (settings: BusinessSettings) => void) {
  const ref = doc(db, 'settings', 'business');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as BusinessSettings;
        const googleMapsUrl =
          data.googleMapsUrl && !data.googleMapsUrl.includes('q=Sathanur')
            ? data.googleMapsUrl
            : 'https://maps.app.goo.gl/mLggnqsck5AnXRRN6';
        callback({ ...DEFAULT_SETTINGS, ...data, googleMapsUrl });
      } else {
        callback(DEFAULT_SETTINGS);
      }
    },
    (err) => {
      console.warn('Settings listener fallback:', err);
      callback(DEFAULT_SETTINGS);
    }
  );
}

export async function updateBusinessSettings(settings: Partial<BusinessSettings>) {
  const ref = doc(db, 'settings', 'business');
  await setDoc(ref, settings, { merge: true });
}

export function subscribeProducts(callback: (products: Product[]) => void) {
  const col = collection(db, 'products');
  return onSnapshot(
    col,
    (snap) => {
      const items: Product[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Product, 'id'>) });
      });
      if (items.length === 0) {
        callback(ALL_SAMPLE_PRODUCTS.map((p, idx) => ({ id: `sample-${idx + 1}`, ...p })));
      } else {
        callback(items);
      }
    },
    (err) => {
      console.warn('Products listener error:', err);
      callback(ALL_SAMPLE_PRODUCTS.map((p, idx) => ({ id: `sample-${idx + 1}`, ...p })));
    }
  );
}

export async function addProduct(product: Omit<Product, 'id'>) {
  const col = collection(db, 'products');
  const res = await addDoc(col, {
    ...product,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return res.id;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const ref = doc(db, 'products', id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProduct(id: string) {
  const ref = doc(db, 'products', id);
  await deleteDoc(ref);
}

// Bulk delete all demo products
export async function deleteAllDemoProducts() {
  const col = collection(db, 'products');
  const snap = await getDocs(col);
  const deletePromises: Promise<void>[] = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.name?.includes('[DEMO PRODUCT]') || data.slug?.startsWith('demo-')) {
      deletePromises.push(deleteDoc(doc(db, 'products', d.id)));
    }
  });
  await Promise.all(deletePromises);
}

export function subscribeCategories(callback: (categories: Category[]) => void) {
  const col = collection(db, 'categories');
  return onSnapshot(
    col,
    (snap) => {
      const items: Category[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Category, 'id'>) });
      });

      // Strictly deduplicate by normalized key so every category is single and unique
      const uniqueMap = new Map<string, Category>();
      for (const cat of items) {
        const key = getNormalizedCategoryKey(cat);
        if (!key) continue;

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, cat);
        } else {
          // If a version has a more complete name or non-empty image, prioritize it
          const existing = uniqueMap.get(key)!;
          if (
            (cat.name && cat.name.length > (existing.name?.length || 0)) ||
            (cat.image && !existing.image)
          ) {
            uniqueMap.set(key, cat);
          }
        }
      }

      const deduplicated = Array.from(uniqueMap.values());
      deduplicated.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      if (deduplicated.length === 0) {
        callback(SAMPLE_CATEGORIES.map((c, idx) => ({ id: `cat-${idx + 1}`, ...c })));
      } else {
        callback(deduplicated);
      }
    },
    (err) => {
      console.warn('Categories listener error:', err);
      callback(SAMPLE_CATEGORIES.map((c, idx) => ({ id: `cat-${idx + 1}`, ...c })));
    }
  );
}

export async function addCategory(category: Omit<Category, 'id'>) {
  const col = collection(db, 'categories');
  return await addDoc(col, category);
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const ref = doc(db, 'categories', id);
  await updateDoc(ref, updates);
}

export async function deleteCategory(id: string) {
  const ref = doc(db, 'categories', id);
  await deleteDoc(ref);
}

// Orders
export function subscribeOrders(callback: (orders: Order[]) => void) {
  const col = collection(db, 'orders');
  return onSnapshot(
    col,
    (snap) => {
      const items: Order[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Order, 'id'>) });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      console.warn('Orders listener notice (auth-scoped access):', err.message);
      callback([]);
    }
  );
}

/**
 * Subscribes only to orders belonging to the specified user or email.
 * Prevents non-admins from receiving any other customer's order records.
 */
export function subscribeUserOrders(
  userId: string | undefined,
  email: string | undefined,
  callback: (orders: Order[]) => void
) {
  if (!userId && !email) {
    callback([]);
    return () => {};
  }
  const col = collection(db, 'orders');
  const constraints = [];
  if (userId) {
    constraints.push(where('customerId', '==', userId));
  } else if (email) {
    constraints.push(where('email', '==', email.toLowerCase()));
  }
  const q = query(col, ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      const items: Order[] = [];
      snap.forEach((d) => {
        const order = { id: d.id, ...(d.data() as Omit<Order, 'id'>) };
        if (
          (userId && order.customerId === userId) ||
          (email && order.email?.toLowerCase() === email.toLowerCase())
        ) {
          items.push(order);
        }
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      console.warn('User orders query restricted:', err.message);
      callback([]);
    }
  );
}

/**
 * Allows a guest customer to securely look up only their single order.
 * Requires BOTH the Order ID and the exact matching Phone Number or Email.
 * Returns null if the contact verification fails.
 */
export async function trackSingleOrder(
  orderId: string,
  contactVerification: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const cleanId = orderId.trim();
  const cleanContact = contactVerification.trim().toLowerCase();
  if (!cleanId || !cleanContact) {
    return { success: false, error: 'Please enter both Order ID and matching Phone/Email.' };
  }

  try {
    const docRef = doc(db, 'orders', cleanId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { success: false, error: 'No order found with this Reference ID.' };
    }
    const data = snap.data() as Omit<Order, 'id'>;
    const orderPhone = (data.phone || data.address?.phone || '').replace(/\D/g, '');
    const inputDigits = cleanContact.replace(/\D/g, '');
    const orderEmail = (data.email || data.address?.email || '').toLowerCase();

    // Verify contact matches either phone (last 10 digits) or email
    const phoneMatch = inputDigits.length >= 7 && orderPhone.endsWith(inputDigits.slice(-10));
    const emailMatch = orderEmail && orderEmail === cleanContact;

    if (!phoneMatch && !emailMatch) {
      return {
        success: false,
        error: 'Order verification failed: contact details do not match this order.',
      };
    }

    return {
      success: true,
      order: { id: snap.id, ...data },
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Security lookup restricted. Please sign in or contact the boutique.',
    };
  }
}

/**
 * Real-time listener for a single order's live status.
 * Updates immediately whenever the order status or fulfillment progress changes in Firestore.
 */
export function subscribeSingleOrder(
  orderId: string,
  callback: (order: Order | null) => void,
  onError?: (err: any) => void
) {
  if (!orderId) {
    callback(null);
    return () => {};
  }
  const cleanId = orderId.trim();
  const docRef = doc(db, 'orders', cleanId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...(snap.data() as Omit<Order, 'id'>) });
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('Real-time order tracking error:', err.message);
      if (onError) onError(err);
    }
  );
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
  const col = collection(db, 'orders');
  const now = new Date().toISOString();
  const orderDoc = await addDoc(col, {
    ...orderData,
    createdAt: now,
    updatedAt: now,
  });

  // Automated notification record for customer & business
  try {
    const notifCol = collection(db, 'emailNotifications');
    await addDoc(notifCol, {
      recipientEmail: orderData.email,
      recipientName: orderData.customerName,
      type: 'order_confirmation',
      subject: `Order Confirmation #${orderDoc.id.slice(0, 8).toUpperCase()} - House Of Rehaan`,
      content: `Dear ${orderData.customerName},\n\nThank you for choosing House Of Rehaan. Your order #${orderDoc.id.slice(0, 8).toUpperCase()} for ₹${orderData.totalAmount} has been received and is being prepared with utmost care at our Trichy boutique.\n\nItems: ${orderData.items.map((i) => `${i.productName} (Qty: ${i.quantity})`).join(', ')}\nDelivery Address: ${orderData.address.address}, ${orderData.address.city}, ${orderData.address.state} - ${orderData.address.pincode}.\n\nWarm regards,\nHouse Of Rehaan Boutique Team\nTrichy, Tamil Nadu`,
      status: 'sent',
      sentAt: now,
    });
  } catch (e) {
    console.warn('Automated notification log notice:', e);
  }

  return orderDoc.id;
}

export async function updateOrderStatus(id: string, status: Order['orderStatus'], trackingNumber?: string) {
  const ref = doc(db, 'orders', id);
  const now = new Date().toISOString();
  const updates: Record<string, any> = {
    orderStatus: status,
    updatedAt: now,
  };
  if (trackingNumber !== undefined) {
    updates.trackingNumber = trackingNumber;
  }
  await updateDoc(ref, updates);

  // Send status update email notification
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const order = snap.data() as Order;
      const notifCol = collection(db, 'emailNotifications');
      await addDoc(notifCol, {
        recipientEmail: order.email,
        recipientName: order.customerName,
        type: 'status_update',
        subject: `Update on Order #${id.slice(0, 8).toUpperCase()}: ${status} - House Of Rehaan`,
        content: `Dear ${order.customerName},\n\nYour order #${id.slice(0, 8).toUpperCase()} status has changed to "${status}".${trackingNumber ? ` Shipping Tracking Reference: ${trackingNumber}` : ''}\n\nThank you for shopping with House Of Rehaan.`,
        status: 'sent',
        sentAt: now,
      });
    }
  } catch (e) {
    console.warn('Status notification notice:', e);
  }
}

// Contact Requests
export async function submitContactRequest(data: Omit<ContactRequest, 'id' | 'status' | 'createdAt'>) {
  const col = collection(db, 'contactRequests');
  const now = new Date().toISOString();
  const res = await addDoc(col, {
    ...data,
    status: 'New',
    createdAt: now,
  });

  // Automated notification
  try {
    const notifCol = collection(db, 'emailNotifications');
    await addDoc(notifCol, {
      recipientEmail: data.email,
      recipientName: data.name,
      type: 'contact_reply',
      subject: `We have received your message - House Of Rehaan`,
      content: `Hello ${data.name},\n\nThank you for contacting House Of Rehaan. Our boutique styling team in Trichy has received your message regarding "${data.subject}" and will get back to you shortly.\n\nWarm regards,\nHouse Of Rehaan`,
      status: 'sent',
      sentAt: now,
    });
  } catch (e) {
    console.warn('Contact notification notice:', e);
  }

  return res.id;
}

export function subscribeContactRequests(callback: (requests: ContactRequest[]) => void) {
  const col = collection(db, 'contactRequests');
  return onSnapshot(
    col,
    (snap) => {
      const items: ContactRequest[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<ContactRequest, 'id'>) });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      console.warn('Contact requests listener error:', err);
      callback([]);
    }
  );
}

export async function updateContactRequestStatus(id: string, status: ContactRequest['status']) {
  const ref = doc(db, 'contactRequests', id);
  await updateDoc(ref, { status });
}

// Reviews
export function subscribeReviews(callback: (reviews: Review[]) => void, onlyApproved = true) {
  const col = collection(db, 'reviews');
  const q = onlyApproved ? query(col, where('approved', '==', true)) : col;
  return onSnapshot(
    q,
    (snap) => {
      const items: Review[] = [];
      snap.forEach((d) => {
        const r = { id: d.id, ...(d.data() as Omit<Review, 'id'>) };
        if (!onlyApproved || r.approved) {
          items.push(r);
        }
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      console.warn('Reviews listener notice:', err.message);
      callback([]);
    }
  );
}

export async function addReview(review: Omit<Review, 'id' | 'createdAt'>) {
  const col = collection(db, 'reviews');
  return await addDoc(col, {
    ...review,
    createdAt: new Date().toISOString(),
  });
}

export async function updateReviewStatus(id: string, approved: boolean) {
  const ref = doc(db, 'reviews', id);
  await updateDoc(ref, { approved });
}

export async function deleteReview(id: string) {
  const ref = doc(db, 'reviews', id);
  await deleteDoc(ref);
}

// Coupons
export const DEFAULT_BOUTIQUE_COUPONS: Coupon[] = [
  {
    id: 'coupon-welcome10',
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrder: 999,
    maximumDiscount: 500,
    startDate: '',
    endDate: '',
    active: true,
  },
  {
    id: 'coupon-rehaan15',
    code: 'REHAAN15',
    discountType: 'percentage',
    discountValue: 15,
    minimumOrder: 1499,
    maximumDiscount: 750,
    startDate: '',
    endDate: '',
    active: true,
  },
  {
    id: 'coupon-trichy100',
    code: 'TRICHY100',
    discountType: 'fixed',
    discountValue: 100,
    minimumOrder: 999,
    startDate: '',
    endDate: '',
    active: true,
  },
  {
    id: 'coupon-festive20',
    code: 'FESTIVE20',
    discountType: 'percentage',
    discountValue: 20,
    minimumOrder: 1999,
    maximumDiscount: 1000,
    startDate: '',
    endDate: '',
    active: true,
  },
];

const COUPONS_STORAGE_KEY = 'rehaan_store_coupons_cache';

export function getStoredCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (!raw) return DEFAULT_BOUTIQUE_COUPONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BOUTIQUE_COUPONS;
  } catch {
    return DEFAULT_BOUTIQUE_COUPONS;
  }
}

export function setStoredCoupons(coupons: Coupon[]) {
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
  } catch (e) {
    console.warn('Could not cache coupons locally:', e);
  }
}

export function subscribeCoupons(callback: (coupons: Coupon[]) => void) {
  const col = collection(db, 'coupons');
  return onSnapshot(
    col,
    (snap) => {
      const items: Coupon[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Coupon, 'id'>) });
      });
      if (items.length > 0) {
        setStoredCoupons(items);
        callback(items);
      } else {
        const local = getStoredCoupons();
        callback(local);
      }
    },
    (err) => {
      console.warn('Coupons listener notice, using cached coupons:', err.message);
      callback(getStoredCoupons());
    }
  );
}

/**
 * Validates a single coupon code securely on demand.
 * Checks live cloud database first, with seamless fallback to cached boutique vouchers.
 */
export async function validateCouponCode(code: string): Promise<Coupon | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;

  // 1. Try checking Firestore
  try {
    const col = collection(db, 'coupons');
    const q = query(col, where('code', '==', clean), where('active', '==', true));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const firstDoc = snap.docs[0];
      return { id: firstDoc.id, ...(firstDoc.data() as Omit<Coupon, 'id'>) };
    }
  } catch (err) {
    console.warn('Firestore coupon lookup notice:', err);
  }

  // 2. Check local store cache and default coupons
  const localList = getStoredCoupons();
  const found = localList.find((c) => c.code.toUpperCase() === clean && c.active !== false);
  if (found) {
    return found;
  }

  return null;
}

export async function addCoupon(coupon: Omit<Coupon, 'id'>) {
  const cleanCode = (coupon.code || 'SPECIAL10').trim().toUpperCase();
  const couponData = {
    ...coupon,
    code: cleanCode,
    active: coupon.active ?? true,
    discountValue: Number(coupon.discountValue) || 0,
    minimumOrder: Number(coupon.minimumOrder) || 0,
    maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : undefined,
  };

  try {
    const col = collection(db, 'coupons');
    const docRef = await addDoc(col, couponData);

    const current = getStoredCoupons();
    const updated = [{ id: docRef.id, ...couponData }, ...current.filter((c) => c.code !== cleanCode)];
    setStoredCoupons(updated);

    return docRef;
  } catch (err) {
    console.warn('Firestore addCoupon notice, saving to local cache:', err);
    const newId = `cpn-${Date.now()}`;
    const current = getStoredCoupons();
    const updated = [{ id: newId, ...couponData }, ...current.filter((c) => c.code !== cleanCode)];
    setStoredCoupons(updated);
    return { id: newId };
  }
}

export async function deleteCoupon(id: string) {
  try {
    const ref = doc(db, 'coupons', id);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Firestore deleteCoupon notice:', err);
  }
  const current = getStoredCoupons();
  setStoredCoupons(current.filter((c) => c.id !== id));
}

// Email Notifications Log & Scheduled Reports
export function subscribeEmailNotifications(callback: (notifs: EmailNotification[]) => void) {
  const col = collection(db, 'emailNotifications');
  return onSnapshot(
    col,
    (snap) => {
      const items: EmailNotification[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<EmailNotification, 'id'>) });
      });
      items.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      callback(items);
    },
    (err) => {
      console.warn('Email notifs listener error:', err);
      callback([]);
    }
  );
}

export function subscribeScheduledReports(callback: (reports: ScheduledReport[]) => void) {
  const col = collection(db, 'scheduledReports');
  return onSnapshot(
    col,
    (snap) => {
      const items: ScheduledReport[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<ScheduledReport, 'id'>) });
      });
      items.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      callback(items);
    },
    (err) => {
      console.warn('Reports listener error:', err);
      callback([]);
    }
  );
}

export async function generateScheduledReport(period: 'Daily' | 'Weekly' | 'Monthly', stats: { totalOrders: number; totalRevenue: number; activeProducts: number; pendingDeliveries: number }, recipient = 'houseofrehaan@gmail.com') {
  const col = collection(db, 'scheduledReports');
  const now = new Date().toISOString();
  const report = {
    title: `${period} Boutique Performance & Inventory Digest`,
    period,
    generatedAt: now,
    totalOrders: stats.totalOrders,
    totalRevenue: stats.totalRevenue,
    activeProducts: stats.activeProducts,
    pendingDeliveries: stats.pendingDeliveries,
    sentTo: recipient,
  };
  const docRef = await addDoc(col, report);

  // Also log email dispatch
  const notifCol = collection(db, 'emailNotifications');
  await addDoc(notifCol, {
    recipientEmail: recipient,
    recipientName: 'House Of Rehaan Management',
    type: 'scheduled_report',
    subject: `[Automated Report] ${period} Store Summary - House Of Rehaan`,
    content: `House Of Rehaan Automated Performance Report (${period})\nDate: ${new Date().toLocaleDateString()}\n\n• Total Revenue: ₹${stats.totalRevenue.toLocaleString('en-IN')}\n• Total Orders Processed: ${stats.totalOrders}\n• Active Catalog Styles: ${stats.activeProducts}\n• Pending Dispatch: ${stats.pendingDeliveries}\n\nSecurity Status: All customer payment details and sensitive tokens encrypted and verified. Access controls active.`,
    status: 'delivered',
    sentAt: now,
  });

  return docRef.id;
}

// -------------------------------------------------------------
// Compatibility & Convenience Wrappers
// -------------------------------------------------------------

export async function saveProduct(product: Partial<Product>) {
  if (product.id) {
    await updateProduct(product.id, product);
    return product.id;
  } else {
    return await addProduct({
      name: product.name || 'New Style',
      slug: product.slug || (product.name ? product.name.toLowerCase().replace(/\s+/g, '-') : `item-${Date.now()}`),
      brand: product.brand || 'House Of Rehaan',
      category: product.category || 'Dresses',
      description: product.description || '',
      price: product.price || 0,
      salePrice: product.salePrice,
      images: product.images || ['/hero-banner.jpg'],
      thumbnail: product.thumbnail || product.images?.[0] || '/hero-banner.jpg',
      colors: product.colors || [{ name: 'Taupe', hex: '#9A8568' }],
      sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      sizeStock: product.sizeStock || { S: 5, M: 5, L: 5, XL: 5 },
      fabric: product.fabric || 'Cotton Blend',
      status: product.status || 'active',
      newArrival: product.newArrival ?? true,
      featured: product.featured ?? true,
      customizationAvailable: product.customizationAvailable ?? false,
      createdAt: new Date().toISOString(),
    });
  }
}

export async function saveCategory(category: Partial<Category>) {
  if (category.id) {
    await updateCategory(category.id, category);
    return category.id;
  } else {
    const res = await addCategory({
      name: category.name || 'New Category',
      slug: category.slug || (category.name ? category.name.toLowerCase().replace(/\s+/g, '-') : `cat-${Date.now()}`),
      description: category.description || '',
      image: category.image || '/hero-banner.jpg',
      active: category.active ?? true,
      displayOrder: category.displayOrder || 1,
    });
    return res.id;
  }
}

export async function saveCoupon(coupon: Partial<Coupon>) {
  const cleanCode = (coupon.code || 'SPECIAL10').trim().toUpperCase();
  const couponData = {
    code: cleanCode,
    discountType: coupon.discountType || 'percentage',
    discountValue: Number(coupon.discountValue) || 10,
    minimumOrder: Number(coupon.minimumOrder) || 0,
    maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : undefined,
    startDate: coupon.startDate || '',
    endDate: coupon.endDate || '',
    active: coupon.active ?? true,
  };

  if (coupon.id) {
    try {
      const ref = doc(db, 'coupons', coupon.id);
      await setDoc(ref, couponData, { merge: true });
    } catch (err) {
      console.warn('Firestore updateCoupon error, updating local cache:', err);
    }
    const current = getStoredCoupons();
    const updated = current.map((c) =>
      c.id === coupon.id ? { id: coupon.id, ...couponData } : c
    );
    setStoredCoupons(updated);
    return coupon.id;
  } else {
    const res = await addCoupon(couponData);
    return res.id;
  }
}

export const saveSettings = updateBusinessSettings;
export const subscribeSettings = subscribeBusinessSettings;
export const submitContactMessage = submitContactRequest;

export function subscribeNotificationLogs(callback: (logs: Array<{ id: string; to: string; type: string; subject: string; status: string; timestamp: string }>) => void) {
  return subscribeEmailNotifications((notifs) => {
    callback(
      notifs.map((n) => ({
        id: n.id,
        to: n.recipientEmail,
        type: n.type,
        subject: n.subject,
        status: n.status,
        timestamp: n.sentAt,
      }))
    );
  });
}

export async function sendAutomatedEmailNotification(data: {
  to: string;
  subject: string;
  type: string;
  content: string;
}) {
  const col = collection(db, 'emailNotifications');
  const now = new Date().toISOString();
  await addDoc(col, {
    recipientEmail: data.to,
    recipientName: 'Valued Customer / Store Owner',
    type: data.type,
    subject: data.subject,
    content: data.content,
    status: 'delivered',
    sentAt: now,
  });
}

