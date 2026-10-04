import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, ArrowRight, ShoppingBag, Truck, CreditCard, Tag, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, subscribeCoupons, validateCouponCode } from '../firebase/db';
import type { ShippingAddress, Coupon } from '../types';

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

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi_transfer' | 'store_pickup'>('cod');
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code || '');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(
    appliedCoupon ? `Coupon ${appliedCoupon.code} active (-₹${discountAmount})` : ''
  );
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleteId, setOrderCompleteId] = useState<string | null>(null);

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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Validation
    if (!formData.customerName || !formData.phone || !formData.address || !formData.pincode) {
      alert('Please fill in all mandatory shipping address fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = await createOrder({
        customerId: user?.uid || 'guest',
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email || 'customer@houseofrehaan.com',
        items,
        subtotal,
        discount: discountAmount,
        couponCode: appliedCoupon?.code,
        deliveryFee,
        totalAmount: total,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Pending',
        orderStatus: 'Confirmed',
        address: formData,
        notes: formData.notes,
      });

      clearCart();
      setOrderCompleteId(orderId);
    } catch (err) {
      console.error('Order placement failed:', err);
      alert('We encountered an issue placing your order. Please try again or reach out on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderCompleteId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8" />
        </div>
        <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
          Order Received
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl text-[#292522]">
          Thank you for choosing House Of Rehaan
        </h1>
        <p className="text-sm text-[#766F68] max-w-md mx-auto leading-relaxed">
          Your order has been recorded in our Trichy boutique system. An automated confirmation and
          tracking notification has been dispatched to{' '}
          <strong className="text-[#292522]">{formData.email}</strong>.
        </p>

        <div className="p-5 bg-white border border-[#E9DFD0] rounded-md text-left text-xs max-w-sm mx-auto space-y-2">
          <div className="flex justify-between">
            <span className="text-[#766F68]">Order Reference:</span>
            <span className="font-mono font-bold text-[#292522]">
              #{orderCompleteId.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#766F68]">Total Paid / Due:</span>
            <span className="font-bold text-[#292522]">₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#766F68]">Payment Mode:</span>
            <span className="capitalize text-[#292522]">{paymentMethod.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => onNavigate('orders')}
            className="px-6 py-3 bg-[#292522] hover:bg-[#9A8568] text-white text-xs uppercase tracking-widest font-semibold rounded-xs transition-colors"
          >
            Track Order Status
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className="px-6 py-3 border border-[#E9DFD0] text-[#292522] text-xs uppercase tracking-widest font-semibold rounded-xs hover:bg-white transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-[#9A8568] mx-auto opacity-70" />
        <h2 className="font-editorial text-2xl text-[#292522]">Your Bag is Empty</h2>
        <p className="text-xs text-[#766F68]">Please add items from our boutique before checking out.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-[#292522] text-white text-xs uppercase tracking-wider rounded-xs"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <h1 className="font-editorial text-3xl text-[#292522] mb-8">Checkout & Delivery Details</h1>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form: Shipping Address & Payment */}
        <div className="lg:col-span-7 space-y-8">
          {/* Customer & Shipping Section */}
          <div className="bg-white p-6 rounded-md border border-[#E9DFD0] space-y-4 shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A8568]">
              1. Delivery Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#292522] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. Priya Sundaram"
                  className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292522] mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292522] mb-1">
                Email Address (for order updates & receipts) *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
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
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A8568]">
              2. Payment Method
            </h3>

            <div className="space-y-3">
              <label
                className={`flex items-start gap-3 p-3.5 border rounded-xs cursor-pointer transition-colors ${
                  paymentMethod === 'cod'
                    ? 'border-[#9A8568] bg-[#FAF8F4]'
                    : 'border-[#E9DFD0] bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-0.5 accent-[#9A8568]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#292522] block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[11px] text-[#766F68]">
                    Pay cash or UPI to the courier agent upon receiving your package.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 border rounded-xs cursor-pointer transition-colors ${
                  paymentMethod === 'upi_transfer'
                    ? 'border-[#9A8568] bg-[#FAF8F4]'
                    : 'border-[#E9DFD0] bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi_transfer'}
                  onChange={() => setPaymentMethod('upi_transfer')}
                  className="mt-0.5 accent-[#9A8568]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#292522] block">
                    Direct UPI / Bank Transfer
                  </span>
                  <span className="text-[11px] text-[#766F68]">
                    Pay via GPay, PhonePe, or Paytm (+91 9790478436) after placing order.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 border rounded-xs cursor-pointer transition-colors ${
                  paymentMethod === 'store_pickup'
                    ? 'border-[#9A8568] bg-[#FAF8F4]'
                    : 'border-[#E9DFD0] bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'store_pickup'}
                  onChange={() => setPaymentMethod('store_pickup')}
                  className="mt-0.5 accent-[#9A8568]"
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
              <label className="block text-xs font-semibold text-[#292522] flex items-center justify-between">
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
                  placeholder="Enter coupon code (e.g. WELCOME10)"
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

              {appliedCoupon && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xs flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-xs font-mono text-[11px] tracking-wider">
                      {appliedCoupon.code}
                    </span>
                    <span>
                      {appliedCoupon.discountType === 'percentage'
                        ? `${appliedCoupon.discountValue}% OFF`
                        : `₹${appliedCoupon.discountValue} Flat OFF`}{' '}
                      applied (-₹{discountAmount.toLocaleString('en-IN')})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline cursor-pointer ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Available Boutique Offers Chips */}
              {couponsList.filter((c) => c.active && (!appliedCoupon || appliedCoupon.code !== c.code)).length > 0 && (
                <div className="pt-1.5 space-y-1.5">
                  <span className="text-[10px] font-semibold text-[#766F68] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#9A8568]" />
                    <span>Available Store Offers (Click to apply):</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {couponsList
                      .filter((c) => c.active && (!appliedCoupon || appliedCoupon.code !== c.code))
                      .slice(0, 3)
                      .map((c) => (
                        <button
                          key={c.id || c.code}
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
                <span>Securing Order...</span>
              ) : (
                <>
                  <span>Place Order (₹{total.toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[#766F68] pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Encrypted checkout & authentic direct boutique fulfillment.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
