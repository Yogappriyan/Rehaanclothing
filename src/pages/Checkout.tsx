import React, { useState, useEffect } from 'react';
import {
  Check,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Truck,
  CreditCard,
  Tag,
  Sparkles,
  Lock,
  Smartphone,
  Building2,
  AlertCircle,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, subscribeCoupons, validateCouponCode } from '../firebase/db';
import type { ShippingAddress, Coupon } from '../types';
import {
  loadRazorpayScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
  fetchRazorpayConfig,
} from '../utils/razorpay';
import { RazorpayModal } from '../components/RazorpayModal';

interface CheckoutProps {
  onNavigate: (route: string, param?: string) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ onNavigate }) => {
  const { items, subtotal, discountAmount, deliveryFee, total, clearCart, appliedCoupon, applyCoupon, removeCoupon } =
    useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ShippingAddress>({
    customerName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: 'Trichy',
    district: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    pincode: '620102',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi_transfer' | 'store_pickup'>('razorpay');
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code || '');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(
    appliedCoupon ? `Coupon ${appliedCoupon.code} active (-₹${discountAmount})` : ''
  );
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleteId, setOrderCompleteId] = useState<string | null>(null);
  const [verifiedPaymentData, setVerifiedPaymentData] = useState<{
    paymentId: string;
    orderId: string;
  } | null>(null);

  // In-app Razorpay modal state
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [activeRazorpayOrderId, setActiveRazorpayOrderId] = useState('');
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const [couponsList, setCouponsList] = useState<Coupon[]>([]);

  useEffect(() => {
    const unsub = subscribeCoupons((c) => setCouponsList(c));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (appliedCoupon) {
      setCouponInput(appliedCoupon.code);
      setCouponSuccess(`Coupon ${appliedCoupon.code} active (-₹${discountAmount.toLocaleString('en-IN')})`);
    } else {
      setCouponSuccess('');
    }
  }, [appliedCoupon, discountAmount]);

  const handleApplyCoupon = async (codeOverride?: string) => {
    setCouponError('');
    setCouponSuccess('');
    const code = (codeOverride || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setIsApplyingCoupon(true);
    try {
      // 1. Check in-memory coupons list
      let target: Coupon | undefined = couponsList.find(
        (c) => c.code.toUpperCase() === code && c.active !== false
      );

      // 2. Query cloud database / local storage if not found in memory
      if (!target) {
        const validated = await validateCouponCode(code);
        if (validated) {
          target = validated;
        }
      }

      // 3. Fallback to standard welcome coupon if matched
      if (!target && code === 'WELCOME10') {
        target = {
          id: 'welcome10',
          code: 'WELCOME10',
          discountType: 'percentage',
          discountValue: 10,
          minimumOrder: 999,
          maximumDiscount: 500,
          startDate: '',
          endDate: '',
          active: true,
        };
      }

      if (!target || target.active === false) {
        setCouponError(`Coupon code "${code}" is invalid or expired.`);
        return;
      }

      // Check minimum order
      const minOrder = target.minimumOrder || 0;
      if (subtotal < minOrder) {
        setCouponError(
          `Minimum order value of ₹${minOrder.toLocaleString('en-IN')} required for ${code}. Add ₹${(
            minOrder - subtotal
          ).toLocaleString('en-IN')} more to unlock!`
        );
        return;
      }

      // Check dates if present
      const now = new Date();
      if (target.startDate && new Date(target.startDate) > now) {
        setCouponError(`Coupon "${code}" is scheduled for an upcoming sale.`);
        return;
      }
      if (target.endDate && new Date(target.endDate) < now) {
        setCouponError(`Coupon "${code}" has expired.`);
        return;
      }

      applyCoupon(target);
      setCouponInput(target.code);

      // Calculate instant saving
      let saving = 0;
      if (target.discountType === 'percentage') {
        saving = Math.round((subtotal * target.discountValue) / 100);
        if (target.maximumDiscount && saving > target.maximumDiscount) {
          saving = target.maximumDiscount;
        }
      } else {
        saving = target.discountValue;
      }
      saving = Math.min(saving, subtotal);

      setCouponSuccess(
        `Coupon ${target.code} applied! You save ₹${saving.toLocaleString('en-IN')} on this order.`
      );
    } catch (err) {
      console.error('Coupon application failed:', err);
      setCouponError('Unable to verify coupon. Please check connection and try again.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponInput('');
    setCouponSuccess('');
    setCouponError('');
  };

  /**
   * Finalizes the order in Firestore upon verified payment
   */
  const handleFinalizeVerifiedOrder = async (
    razorpayDetails?: {
      paymentId: string;
      orderId: string;
      signature: string;
    }
  ) => {
    const isOnlinePaid = Boolean(razorpayDetails?.paymentId);

    const orderPayload: any = {
      customerId: user?.uid || 'guest',
      customerName: formData.customerName,
      phone: formData.phone,
      email: formData.email || 'customer@houseofrehaan.com',
      items,
      subtotal,
      discount: discountAmount,
      deliveryFee,
      totalAmount: total,
      paymentMethod,
      paymentStatus: isOnlinePaid ? 'Paid' : 'Pending',
      orderStatus: 'Confirmed',
      address: formData,
      notes: formData.notes || '',
    };

    if (appliedCoupon?.code) {
      orderPayload.couponCode = appliedCoupon.code;
    }

    if (razorpayDetails?.paymentId) {
      orderPayload.razorpayPaymentId = razorpayDetails.paymentId;
    }
    if (razorpayDetails?.orderId) {
      orderPayload.razorpayOrderId = razorpayDetails.orderId;
    }
    if (razorpayDetails?.signature) {
      orderPayload.razorpaySignature = razorpayDetails.signature;
    }

    const orderId = await createOrder(orderPayload);

    if (razorpayDetails) {
      setVerifiedPaymentData({
        paymentId: razorpayDetails.paymentId,
        orderId: razorpayDetails.orderId,
      });
    }

    clearCart();
    setOrderCompleteId(orderId);
  };

  /**
   * Callback invoked from Razorpay SDK or in-app secure modal
   */
  const handleRazorpaySuccessCallback = async (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setIsSubmitting(true);
    setCheckoutError('');

    try {
      // 1. Cryptographic HMAC SHA-256 verification on backend
      const verification = await verifyRazorpayPayment(response);

      if (!verification.verified) {
        throw new Error(
          verification.error ||
            'Razorpay cryptographic signature verification failed. Transaction was not confirmed.'
        );
      }

      // 2. Persist confirmed order to Firestore with payment proof
      await handleFinalizeVerifiedOrder({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        signature: response.razorpay_signature,
      });

      setIsRazorpayModalOpen(false);
    } catch (err: any) {
      console.error('Razorpay verification or order completion error:', err);
      setCheckoutError(
        err?.message ||
          'Payment verification could not be validated. Please reach out with your payment transaction ID.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (items.length === 0) return;

    // Field Validations
    if (!formData.customerName.trim()) {
      setCheckoutError('Please enter your full name for order dispatch.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      setCheckoutError('Please provide a valid 10-digit phone number for shipment coordination.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setCheckoutError('Please enter a valid email address to receive order updates and receipts.');
      return;
    }
    if (!formData.address.trim() || !formData.pincode.trim()) {
      setCheckoutError('Please complete your street delivery address and 6-digit postal pincode.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMethod === 'razorpay') {
        // --- RAZORPAY PAYMENT FLOW ---
        // 1. Create order on backend
        const orderResult = await createRazorpayOrder({
          amount: total,
          customer: {
            name: formData.customerName,
            email: formData.email,
            phone: formData.phone,
          },
          notes: {
            address: formData.address,
            city: formData.city,
            pincode: formData.pincode,
          },
        });

        if (!orderResult.success || !orderResult.orderId) {
          throw new Error(orderResult.error || 'Unable to create order with Razorpay gateway.');
        }

        setActiveRazorpayOrderId(orderResult.orderId);
        setIsSandboxMode(Boolean(orderResult.isSandbox));

        // 2. Try loading official Razorpay checkout script
        const scriptLoaded = await loadRazorpayScript();

        if (scriptLoaded && window.Razorpay) {
          const config = await fetchRazorpayConfig();

          const rzpOptions = {
            key: orderResult.keyId || config.keyId,
            amount: orderResult.amount,
            currency: orderResult.currency || 'INR',
            name: 'House Of Rehaan',
            description: `Boutique Order (${items.length} ${items.length === 1 ? 'item' : 'items'})`,
            image: '/logo.jpg',
            order_id: orderResult.orderId,
            handler: function (response: any) {
              handleRazorpaySuccessCallback(response);
            },
            prefill: {
              name: formData.customerName,
              email: formData.email,
              contact: formData.phone,
            },
            notes: {
              address: `${formData.address}, ${formData.city} - ${formData.pincode}`,
              store: 'House Of Rehaan, Trichy',
            },
            theme: {
              color: '#292522',
            },
            modal: {
              ondismiss: function () {
                setIsSubmitting(false);
              },
            },
          };

          try {
            const rzp = new window.Razorpay(rzpOptions);
            rzp.on('payment.failed', function (resp: any) {
              console.error('Razorpay payment failure:', resp.error);
              setCheckoutError(
                resp?.error?.description || 'Payment was declined by bank. Please try another card or UPI.'
              );
              setIsSubmitting(false);
            });
            rzp.open();
            setIsSubmitting(false);
            return;
          } catch (launchErr) {
            console.warn('Official Razorpay modal popup blocked or failed, launching in-app secure modal:', launchErr);
            // Fallback to secure in-app modal
            setIsRazorpayModalOpen(true);
            setIsSubmitting(false);
            return;
          }
        } else {
          // External script blocked or unavailable, open secure in-app modal
          setIsRazorpayModalOpen(true);
          setIsSubmitting(false);
          return;
        }
      } else {
        // --- COD, DIRECT UPI, OR STORE PICKUP FLOW ---
        await handleFinalizeVerifiedOrder();
      }
    } catch (err: any) {
      console.error('Order submission failed:', err);
      setCheckoutError(
        err?.message || 'We encountered an issue placing your order. Please try again or reach out on WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (orderCompleteId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <Check className="w-8 h-8" />
        </div>
        <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold block">
          Order Confirmed & Secured
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#292522]">
          Thank you for choosing House Of Rehaan
        </h1>
        <p className="text-sm text-[#766F68] max-w-md mx-auto leading-relaxed">
          Your order has been recorded in our Trichy boutique system. An automated confirmation and
          tracking notification has been dispatched to{' '}
          <strong className="text-[#292522]">{formData.email}</strong>.
        </p>

        {/* Verified Payment Seal if Razorpay */}
        {verifiedPaymentData && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-md text-emerald-900 text-xs max-w-sm mx-auto space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay Verified Transaction</span>
            </div>
            <p className="font-mono text-[11px] text-emerald-700">
              Payment ID: {verifiedPaymentData.paymentId}
            </p>
          </div>
        )}

        {/* Order Details Summary Box */}
        <div className="p-5 bg-white border border-[#E9DFD0] rounded-md text-left text-xs max-w-sm mx-auto space-y-2.5 shadow-2xs">
          <div className="flex justify-between pb-2 border-b border-[#E9DFD0]">
            <span className="text-[#766F68]">Order Reference:</span>
            <span className="font-mono font-bold text-[#292522]">
              #{orderCompleteId.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#766F68]">Total Amount:</span>
            <span className="font-bold text-[#292522]">₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#766F68]">Payment Mode:</span>
            <span className="font-medium text-[#292522] uppercase tracking-wider text-[11px]">
              {paymentMethod === 'razorpay' ? 'Razorpay Secure Online' : paymentMethod.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#766F68]">Payment Status:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-xs text-[10px] ${
                paymentMethod === 'razorpay'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {paymentMethod === 'razorpay' ? 'PAID & VERIFIED' : 'PENDING ON DELIVERY'}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[#E9DFD0] text-[#766F68]">
            <span>Delivery Destination:</span>
            <span className="font-medium text-[#292522] text-right truncate max-w-[170px]">
              {formData.city}, {formData.pincode}
            </span>
          </div>
        </div>

        {/* Boutique Location for Trichy Store */}
        <div className="pt-2 text-xs text-[#766F68]">
          <span>Visiting our boutique in person?</span>{' '}
          <a
            href="https://maps.app.goo.gl/mLggnqsck5AnXRRN6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9A8568] hover:underline font-semibold inline-flex items-center gap-1"
          >
            <span>Get Directions to House Of Rehaan (Trichy)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => onNavigate('orders')}
            className="px-6 py-3 bg-[#292522] hover:bg-[#9A8568] text-white text-xs uppercase tracking-widest font-semibold rounded-xs transition-colors cursor-pointer"
          >
            Track Order Status
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className="px-6 py-3 border border-[#E9DFD0] text-[#292522] text-xs uppercase tracking-widest font-semibold rounded-xs hover:bg-white transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // EMPTY BAG VIEW
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-[#9A8568] mx-auto opacity-70" />
        <h2 className="font-editorial text-2xl text-[#292522]">Your Bag is Empty</h2>
        <p className="text-xs text-[#766F68]">Please add items from our boutique before checking out.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-[#292522] text-white text-xs uppercase tracking-wider rounded-xs cursor-pointer hover:bg-[#9A8568] transition-colors"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#E9DFD0] gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold block">
            House Of Rehaan • Trichy Boutique
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#292522] mt-1">
            Secure Checkout & Delivery
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#766F68]">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-[#9A8568]" />
            <span></span>
          </div>
        </div>
      </div>

      {checkoutError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-1">
            <strong className="block font-semibold">Please check the required information:</strong>
            <p>{checkoutError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form: Shipping Address & Payment Selection */}
        <div className="lg:col-span-7 space-y-8">
          {/* Customer & Shipping Section */}
          <div className="bg-white p-6 rounded-md border border-[#E9DFD0] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A8568]">
                1. Delivery & Contact Details
              </h3>
              <span className="text-[11px] text-[#766F68]">* Required fields</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#292522] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => {
                    setFormData({ ...formData, customerName: e.target.value });
                    if (checkoutError) setCheckoutError('');
                  }}
                  placeholder="e.g. Priya Sundaram"
                  className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292522] mb-1">
                  Phone Number (for Courier & OTP) *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (checkoutError) setCheckoutError('');
                  }}
                  placeholder="10-digit mobile number"
                  className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs font-mono focus:border-[#9A8568] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292522] mb-1">
                Email Address (for Order Receipt & Verification) *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (checkoutError) setCheckoutError('');
                }}
                placeholder="name@example.com"
                className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292522] mb-1">
                Street Address / Flat / Building *
              </label>
              <textarea
                required
                rows={2}
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (checkoutError) setCheckoutError('');
                }}
                placeholder="Door no., Apartment, Street name, Landmark"
                className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#292522] mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#292522] mb-1">District</label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#292522] mb-1">State</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#292522] mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => {
                    setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') });
                    if (checkoutError) setCheckoutError('');
                  }}
                  className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292522] mb-1">
                Order Notes / Special Requests (Optional)
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Ring doorbell, gift packing request"
                className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs"
              />
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white p-6 rounded-md border border-[#E9DFD0] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A8568]">
                2. Select Payment Method
              </h3>
              <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3" />
                <span>Zero Transaction Surcharge</span>
              </span>
            </div>

            <div className="space-y-3">
              {/* 1. RAZORPAY SECURE (RECOMMENDED) */}
              <label
                className={`flex items-start gap-3.5 p-4 border rounded-xs cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#9A8568] bg-[#FAF8F4] ring-1 ring-[#9A8568]/30 shadow-xs'
                    : 'border-[#E9DFD0] bg-white hover:bg-[#FAF8F4]/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="mt-1 accent-[#9A8568] cursor-pointer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#292522] flex items-center gap-2">
                      <span>Razorpay Secure (Cards, UPI, NetBanking, Wallets)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                        Recommended
                      </span>
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-[#766F68] leading-relaxed">
                    Instant authorization with GPay, PhonePe, Paytm, Credit/Debit cards (Visa, MasterCard, RuPay), and NetBanking. Protected with 256-bit SSL and server-side HMAC SHA-256 verification.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[10px] text-[#9A8568] font-medium">
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      UPI
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      Cards
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      NetBanking
                    </span>
                  </div>
                </div>
              </label>

              {/* CLEAR NO CASH ON DELIVERY (COD) POLICY NOTICE */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xs flex items-start gap-3 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-[#292522] block tracking-wide">
                    No Cash on Delivery (COD) Available
                  </span>
                  <p className="text-[#766F68] text-[11px] leading-relaxed">
                    House Of Rehaan accepts <strong>100% prepaid orders only</strong> to guarantee authentic boutique dispatch directly from our Trichy workshop and prevent courier transit delays. We do not provide Cash on Delivery (COD). Please choose Razorpay (UPI / Cards / NetBanking), direct UPI transfer, or in-person boutique collection.
                  </p>
                </div>
              </div>

              {/* 2. DIRECT UPI / BANK TRANSFER */}
              <label
                className={`flex items-start gap-3.5 p-3.5 border rounded-xs cursor-pointer transition-colors ${
                  paymentMethod === 'upi_transfer'
                    ? 'border-[#9A8568] bg-[#FAF8F4]'
                    : 'border-[#E9DFD0] bg-white hover:bg-[#FAF8F4]/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi_transfer'}
                  onChange={() => setPaymentMethod('upi_transfer')}
                  className="mt-0.5 accent-[#9A8568] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-[#292522] block">
                    Manual UPI / Boutique Bank Transfer
                  </span>
                  <span className="text-[11px] text-[#766F68]">
                    Direct transfer to House Of Rehaan boutique accounts (+91 9790478436) after placing order.
                  </span>
                </div>
              </label>

              {/* 4. BOUTIQUE STORE PICKUP */}
              <label
                className={`flex items-start gap-3.5 p-3.5 border rounded-xs cursor-pointer transition-colors ${
                  paymentMethod === 'store_pickup'
                    ? 'border-[#9A8568] bg-[#FAF8F4]'
                    : 'border-[#E9DFD0] bg-white hover:bg-[#FAF8F4]/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'store_pickup'}
                  onChange={() => setPaymentMethod('store_pickup')}
                  className="mt-0.5 accent-[#9A8568] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-[#292522] block">
                    Pick up at House Of Rehaan Boutique (Trichy)
                  </span>
                  <span className="text-[11px] text-[#766F68]">
                    Collect in person at Plot No. 46, 2nd Cross, Sathanur, Trichy.{' '}
                    <a
                      href="https://maps.app.goo.gl/mLggnqsck5AnXRRN6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9A8568] hover:underline font-semibold inline-flex items-center ml-1"
                    >
                      Get Directions ↗
                    </a>
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-md border border-[#E9DFD0] space-y-5 shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A8568] border-b border-[#E9DFD0] pb-3">
              Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} items)
            </h3>

            {/* Items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((i) => (
                <div
                  key={`${i.productId}-${i.size}-${i.color}`}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={i.image}
                      alt={i.productName}
                      className="w-10 h-12 object-cover rounded-xs bg-zinc-100"
                    />
                    <div>
                      <h5 className="font-medium text-[#292522] line-clamp-1">{i.productName}</h5>
                      <span className="text-[#766F68] text-[10px]">
                        Qty: {i.quantity} {i.size && `• Size: ${i.size}`}
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-[#292522]">
                    ₹{(i.price * i.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon input */}
            <div className="pt-3 border-t border-[#E9DFD0] space-y-2.5">
              <label className="text-xs font-semibold text-[#292522] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#9A8568]" />
                  <span>Have a Promo or Coupon Code?</span>
                </span>
                {appliedCoupon && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs font-semibold border border-emerald-200">
                    Applied
                  </span>
                )}
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  placeholder="Enter code (e.g. WELCOME10)"
                  className="flex-1 text-xs p-2.5 border border-[#E9DFD0] rounded-xs uppercase tracking-wider font-mono font-medium focus:outline-hidden focus:border-[#9A8568]"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  className="px-4 py-2.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-wider rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isApplyingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>

              {couponError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xs text-[11px] text-rose-700 leading-normal">
                  {couponError}
                </div>
              )}

              {couponSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xs text-[11px] text-emerald-700 flex items-center justify-between">
                  <span>{couponSuccess}</span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[10px] font-semibold text-rose-600 hover:underline ml-2 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Available active coupon suggestion pill */}
              {couponsList.length > 0 && !appliedCoupon && (
                <div className="pt-1">
                  <span className="text-[10px] text-[#766F68] block mb-1">
                    Available boutique offers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {couponsList
                      .filter((c) => c.active !== false)
                      .slice(0, 3)
                      .map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleApplyCoupon(c.code)}
                          className="text-[10px] bg-[#FAF8F4] hover:bg-[#E9DFD0] text-[#292522] border border-[#E9DFD0] px-2 py-1 rounded-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
                        >
                          <span className="font-mono font-bold">{c.code}</span>
                          <span className="text-[#9A8568]">
                            ({c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`})
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subtotal & Total calculations */}
            <div className="pt-3 border-t border-[#E9DFD0] space-y-2 text-xs text-[#766F68]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#292522] font-medium">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <span>Coupon Discount</span>
                    <span className="font-mono text-[10px] bg-emerald-100 px-1 rounded-xs text-emerald-800">
                      {appliedCoupon?.code}
                    </span>
                  </span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery (Trichy & PAN India)</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-[#E9DFD0] text-base font-semibold text-[#292522]">
                <span>Total Amount</span>
                <span className="text-lg text-[#292522]">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Submit Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-widest rounded-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:bg-zinc-400"
            >
              {isSubmitting ? (
                <span>Securing Transaction...</span>
              ) : paymentMethod === 'razorpay' ? (
                <>
                  <Lock className="w-4 h-4 text-[#C2B5A5]" />
                  <span>Pay with Razorpay (₹{total.toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Place Order (₹{total.toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] text-[#766F68] pt-1 text-center border-t border-[#E9DFD0]">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>HMAC SHA-256 Verified Payment Gateway</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#9A8568]">
                <span>100% Prepaid Orders Only • No Cash on Delivery (COD)</span>
              </div>
              <span>Encrypted checkout & authentic direct boutique fulfillment from Trichy.</span>
            </div>
          </div>
        </div>
      </form>

      {/* In-App Razorpay Modal for test sandbox or fallback */}
      <RazorpayModal
        isOpen={isRazorpayModalOpen}
        orderId={activeRazorpayOrderId}
        amount={total}
        customerName={formData.customerName}
        customerEmail={formData.email}
        customerPhone={formData.phone}
        isSandbox={isSandboxMode}
        onSuccess={handleRazorpaySuccessCallback}
        onClose={() => {
          setIsRazorpayModalOpen(false);
          setIsSubmitting(false);
        }}
      />
    </div>
  );
};
