export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'Free Size';

export interface SizeStock {
  size: ProductSize;
  stock: number;
}

export interface ColorVariant {
  name: string;
  hex: string;
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  subcategory?: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  discountPercentage?: number;
  images: string[];
  thumbnail: string;
  colors: ColorVariant[];
  sizes: ProductSize[];
  sizeStock: Record<string, number>;
  material?: string;
  fabric?: string;
  fit?: string;
  pattern?: string;
  occasion?: string;
  careInstructions?: string;
  sku?: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  sale?: boolean;
  status: 'active' | 'draft' | 'archived';
  customizationAvailable?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  displayOrder: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  bannerImage: string;
  products: string[]; // product IDs
  displayOrder: number;
  active: boolean;
}

export interface Lookbook {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  products: string[];
  active: boolean;
  createdAt?: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  displayOrder: number;
}

export interface Offer {
  id: string;
  offerName: string;
  description: string;
  discount: string;
  startDate: string;
  endDate: string;
  couponCode?: string;
  active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  active: boolean;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  image: string;
  price: number;
  color?: string;
  size?: ProductSize;
  quantity: number;
}

export interface ShippingAddress {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  notes?: string;
}

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'upi_transfer' | 'store_pickup' | 'online';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  orderStatus: OrderStatus;
  address: ShippingAddress;
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: 'New' | 'Contacted' | 'Closed';
  createdAt: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  review: string;
  product?: string;
  approved: boolean;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  storeName?: string;
  phone: string;
  email: string;
  address: string;
  whatsappNumber: string;
  whatsappEnabled: boolean;
  instagram: string;
  facebook: string;
  youtube: string;
  googleMapsUrl: string;
  businessHours: string;
  announcement: string;
  heroTitle: string;
  heroSubtitle: string;
  notificationEmail?: string;
  freeShippingThreshold?: number;
  standardShippingFee?: number;
}

export interface EmailNotification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  type: 'order_confirmation' | 'status_update' | 'scheduled_report' | 'contact_reply';
  subject: string;
  content: string;
  status: 'sent' | 'queued' | 'delivered';
  sentAt: string;
}

export interface EmailNotificationLog {
  id: string;
  to: string;
  type: string;
  subject: string;
  status: string;
  timestamp: string;
}

export interface ScheduledReport {
  id: string;
  title: string;
  period: 'Daily' | 'Weekly' | 'Monthly';
  generatedAt: string;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingDeliveries: number;
  sentTo: string;
}
