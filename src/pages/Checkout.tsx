import React, { useState } from 'react';
import { Check, ShieldCheck, ArrowRight, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, subscribeCoupons } from '../firebase/db';
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
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleteId, setOrderCompleteId] = useState<string | null>(null);

  const [couponsList, setCouponsList] = useState<Coupon[]>([]);

  React.useEffect(() => {
    const unsub = subscribeCoupons((c) => setCouponsList(c));
    return () => unsub();
  }, []);

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    // Check pre-configured or Firestore coupons
    const found = couponsList.find((c) => c.code.toUpperCase() === code && c.active);
    if (found) {
      if (subtotal < found.minimumOrder) {
        setCouponError(`Minimum order amount of ₹${found.minimumOrder} required for ${code}.`);
        return;
      }
      applyCoupon(found);
      setCouponSuccess(`Coupon ${code} applied successfully!`);
      return;
    }

    // Default welcome coupon fallback
    if (code === 'WELCOME10') {
      applyCoupon({
        id: 'welcome10',
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minimumOrder: 999,
        maximumDiscount: 500,
        startDate: '',
        endDate: '',
        active: true,
      });
      setCouponSuccess('Coupon WELCOME10 applied (10% OFF)!');
      return;
    }

    setCouponError('Invalid or expired coupon code.');
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
        email: formData.email || 'customer@rehaanclothing.com',
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
          Thank you for choosing Rehaan Clothing
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
                    Pick up at Rehaan Boutique (Trichy)
                  </span>
                  <span className="text-[11px] text-[#766F68]">
                    Collect in person at Plot No. 46, 2nd Cross, Sathanur, Trichy.
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
            <div className="pt-3 border-t border-[#E9DFD0]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code (e.g. WELCOME10)"
                  className="flex-1 text-xs p-2.5 border border-[#E9DFD0] rounded-xs uppercase tracking-wider"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 bg-[#FAF8F4] border border-[#E9DFD0] hover:bg-[#E9DFD0] text-xs font-semibold text-[#292522] rounded-xs"
                >
                  Apply
                </button>
              </div>

              {couponError && <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>}
              {couponSuccess && (
                <p className="text-[11px] text-emerald-700 mt-1 flex items-center justify-between">
                  <span>{couponSuccess}</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs underline text-rose-600 ml-2"
                  >
                    Remove
                  </button>
                </p>
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
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-[#E9DFD0] text-base font-semibold text-[#292522]">
                <span>Total Amount</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
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
