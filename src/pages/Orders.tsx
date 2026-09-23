import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Search,
  ShieldCheck,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { subscribeUserOrders, trackSingleOrder, subscribeSingleOrder } from '../firebase/db';
import { useAuth } from '../context/AuthContext';
import { maskPhone, maskEmail, maskAddress } from '../utils/security';
import type { Order, OrderStatus } from '../types';

interface OrdersProps {
  onNavigate: (route: string, param?: string) => void;
}

export const Orders: React.FC<OrdersProps> = ({ onNavigate }) => {
  const { user, signInWithGoogle } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Guest Order Tracking Lookup State
  const [lookupOrderId, setLookupOrderId] = useState('');
  const [lookupContact, setLookupContact] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [guestTrackedOrder, setGuestTrackedOrder] = useState<Order | null>(null);
  const [showFullPII, setShowFullPII] = useState(false);

  // Authenticated user order history subscription (strictly scoped to user.uid or email)
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setSelectedOrder(null);
      return;
    }

    const unsub = subscribeUserOrders(user.uid, user.email || undefined, (myOrders) => {
      setOrders(myOrders);
      if (myOrders.length > 0) {
        setSelectedOrder((prev) => {
          if (!prev) return myOrders[0];
          return myOrders.find((o) => o.id === prev.id) || myOrders[0];
        });
      }
    });

    return () => unsub();
  }, [user]);

  // Real-time synchronization for verified guest order
  useEffect(() => {
    if (!guestTrackedOrder?.id) return;
    const unsub = subscribeSingleOrder(guestTrackedOrder.id, (liveOrder) => {
      if (liveOrder) {
        setGuestTrackedOrder(liveOrder);
      }
    });
    return () => unsub();
  }, [guestTrackedOrder?.id]);

  const handleGuestTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setGuestTrackedOrder(null);
    setLookupLoading(true);

    try {
      const res = await trackSingleOrder(lookupOrderId, lookupContact);
      if (res.success && res.order) {
        setGuestTrackedOrder(res.order);
      } else {
        setLookupError(res.error || 'Verification failed. Please check your Order ID and phone/email.');
      }
    } catch {
      setLookupError('Unable to verify order. Please ensure credentials are correct.');
    } finally {
      setLookupLoading(false);
    }
  };

  const timelineSteps: OrderStatus[] = [
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Delivered',
  ];

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'Cancelled') return -1;
    if (status === 'Pending') return 0;
    return timelineSteps.indexOf(status);
  };

  const activeDisplayOrder = user ? selectedOrder : guestTrackedOrder;

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E9DFD0] gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#9A8568]" />
            <span>Encrypted Customer Portal</span>
          </span>
          <h1 className="font-editorial text-3xl text-[#292522] mt-1 font-normal">
            Track Orders & History
          </h1>
        </div>

        {!user ? (
          <button
            onClick={signInWithGoogle}
            className="px-5 py-2.5 bg-[#292522] hover:bg-[#9A8568] text-xs font-semibold text-white rounded-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <span>Sign in to view full history</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#766F68]">
              Signed in as <strong className="text-[#292522]">{user.email}</strong>
            </span>
          </div>
        )}
      </div>

      {/* VIEW 1: Unauthenticated Guest Order Lookup (Zero mass order exposure) */}
      {!user && (
        <div className="space-y-8">
          <div className="max-w-xl mx-auto bg-white border border-[#E9DFD0] rounded-md p-6 sm:p-8 shadow-xs space-y-6">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#E9DFD0] text-[#9A8568] flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5 text-[#9A8568]" />
              </div>
              <h2 className="font-editorial text-2xl text-[#292522]">Secure Order Verification</h2>
              <p className="text-xs text-[#766F68] leading-relaxed">
                To protect customer privacy, please enter your Order Reference ID and the registered
                Phone Number or Email used at checkout.
              </p>
            </div>

            {lookupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xs text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}

            <form onSubmit={handleGuestTrack} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#292522] mb-1">
                  Order ID / Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7d8f92a1 or full order ID"
                  value={lookupOrderId}
                  onChange={(e) => setLookupOrderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#E9DFD0] rounded-xs bg-[#FAF8F4] focus:bg-white focus:outline-hidden focus:border-[#9A8568]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#292522] mb-1">
                  Registered Phone or Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 9876543210 or your email"
                  value={lookupContact}
                  onChange={(e) => setLookupContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#E9DFD0] rounded-xs bg-[#FAF8F4] focus:bg-white focus:outline-hidden focus:border-[#9A8568]"
                />
              </div>

              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full py-3 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-wider rounded-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {lookupLoading ? 'Verifying Credentials...' : 'Verify & Track Order'}
              </button>
            </form>

            <div className="pt-4 border-t border-[#E9DFD0] text-center">
              <span className="text-xs text-[#766F68]">
                Have a Google account?{' '}
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="text-[#9A8568] font-semibold underline hover:text-[#292522] cursor-pointer"
                >
                  Sign in here
                </button>{' '}
                to access all your previous purchases automatically.
              </span>
            </div>
          </div>

          {/* If verified single guest order is loaded */}
          {guestTrackedOrder && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-[#E9DFD0] rounded-md p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E9DFD0] gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      Verified Identity Match
                    </span>
                    <h3 className="font-editorial text-2xl text-[#292522] mt-1">
                      Order #{guestTrackedOrder.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <p className="text-xs text-[#766F68]">
                      Placed on {new Date(guestTrackedOrder.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#766F68] block">Total Amount</span>
                    <span className="font-editorial text-2xl font-bold text-[#292522]">
                      ₹{guestTrackedOrder.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#292522] mb-4">
                    Fulfillment Progress
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {timelineSteps.map((step, idx) => {
                      const currentStepIndex = getStepIndex(guestTrackedOrder.orderStatus);
                      const isDone = currentStepIndex >= idx;
                      const isCurrent = currentStepIndex === idx;

                      return (
                        <div key={step} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              isDone
                                ? 'bg-[#9A8568] text-white shadow-xs'
                                : 'bg-[#FAF8F4] border border-[#E9DFD0] text-[#766F68]'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div>
                            <span
                              className={`text-xs font-semibold block ${
                                isCurrent ? 'text-[#9A8568]' : isDone ? 'text-[#292522]' : 'text-[#766F68]/70'
                              }`}
                            >
                              {step}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-[#9A8568] font-medium">Current Status</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items */}
                <div className="pt-4 border-t border-[#E9DFD0]">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#292522] mb-3">
                    Order Items ({guestTrackedOrder.items.length})
                  </h4>
                  <div className="space-y-3">
                    {guestTrackedOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border border-zinc-100 rounded-xs bg-[#FAF8F4]"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt=""
                            className="w-12 h-14 object-cover rounded-xs bg-zinc-200"
                          />
                          <div>
                            <h5 className="font-editorial text-sm font-medium text-[#292522]">
                              {item.productName}
                            </h5>
                            <span className="text-xs text-[#766F68]">
                              Qty: {item.quantity} {item.size && `• Size: ${item.size}`}{' '}
                              {item.color && `• Color: ${item.color}`}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#292522]">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping & Delivery with PII Masking */}
                <div className="pt-4 border-t border-[#E9DFD0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#766F68]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-semibold text-[#292522] uppercase tracking-wider">
                        Delivery Destination
                      </h5>
                      <button
                        type="button"
                        onClick={() => setShowFullPII(!showFullPII)}
                        className="text-[10px] text-[#9A8568] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showFullPII ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showFullPII ? 'Hide PII' : 'Show Details'}</span>
                      </button>
                    </div>
                    <p className="text-[#292522] font-medium">{guestTrackedOrder.customerName}</p>
                    <p>
                      {showFullPII
                        ? guestTrackedOrder.address.address
                        : maskAddress(guestTrackedOrder.address.address)}
                    </p>
                    <p>
                      {guestTrackedOrder.address.city}, {guestTrackedOrder.address.state} -{' '}
                      {guestTrackedOrder.address.pincode}
                    </p>
                    <p>
                      Contact:{' '}
                      {showFullPII
                        ? guestTrackedOrder.phone
                        : maskPhone(guestTrackedOrder.phone)}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-[#292522] uppercase tracking-wider mb-1">
                      Payment & Tracking
                    </h5>
                    <p>
                      Payment Method:{' '}
                      <strong className="text-[#292522] capitalize">
                        {guestTrackedOrder.paymentMethod.replace('_', ' ')}
                      </strong>
                    </p>
                    <p>
                      Payment Status:{' '}
                      <strong className="text-[#292522]">{guestTrackedOrder.paymentStatus}</strong>
                    </p>
                    {guestTrackedOrder.trackingNumber && (
                      <p className="mt-1">
                        Tracking Ref:{' '}
                        <span className="font-mono font-bold text-[#292522]">
                          {guestTrackedOrder.trackingNumber}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Logged-in Customer View (Authenticated and scoped to user's UID only) */}
      {user && (
        <>
          {orders.length === 0 ? (
            <div className="py-20 text-center bg-white border border-[#E9DFD0] rounded-md space-y-4">
              <Package className="w-12 h-12 text-[#9A8568] mx-auto opacity-70" />
              <h3 className="font-editorial text-xl text-[#292522]">No Past Orders Found</h3>
              <p className="text-xs text-[#766F68] max-w-sm mx-auto">
                No orders are currently linked with {user.email}. If you checked out as a guest, please
                use the Reference ID lookup above.
              </p>
              <button
                onClick={() => onNavigate('shop')}
                className="px-6 py-2.5 bg-[#292522] text-white text-xs uppercase tracking-wider rounded-xs hover:bg-[#9A8568] transition-colors cursor-pointer"
              >
                Discover Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Orders List */}
              <div className="lg:col-span-5 space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#766F68] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your orders..."
                    className="w-full pl-9 pr-4 py-2 text-xs border border-[#E9DFD0] rounded-xs bg-white focus:outline-hidden focus:border-[#9A8568]"
                  />
                </div>

                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {filteredOrders.map((o) => {
                    const isSelected = selectedOrder?.id === o.id;
                    return (
                      <div
                        key={o.id}
                        onClick={() => setSelectedOrder(o)}
                        className={`p-4 rounded-md border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#9A8568] bg-white shadow-xs'
                            : 'border-[#E9DFD0] bg-[#FAF8F4] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-mono font-bold text-[#292522]">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider ${
                              o.orderStatus === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-800'
                                : o.orderStatus === 'Cancelled'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {o.orderStatus}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#766F68]">
                          <span>
                            {new Date(o.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="font-semibold text-[#292522]">
                            ₹{o.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="mt-2 text-[11px] text-[#766F68] truncate">
                          {o.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Order Details */}
              <div className="lg:col-span-7">
                {selectedOrder ? (
                  <div className="bg-white border border-[#E9DFD0] rounded-md p-6 sm:p-8 space-y-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E9DFD0] gap-2">
                      <div>
                        <h3 className="font-editorial text-2xl text-[#292522]">
                          Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-xs text-[#766F68]">
                          Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#766F68] block">Total Amount</span>
                        <span className="font-editorial text-2xl font-bold text-[#292522]">
                          ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#292522] mb-4">
                        Fulfillment Progress
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {timelineSteps.map((step, idx) => {
                          const currentStepIndex = getStepIndex(selectedOrder.orderStatus);
                          const isDone = currentStepIndex >= idx;
                          const isCurrent = currentStepIndex === idx;

                          return (
                            <div key={step} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                  isDone
                                    ? 'bg-[#9A8568] text-white shadow-xs'
                                    : 'bg-[#FAF8F4] border border-[#E9DFD0] text-[#766F68]'
                                }`}
                              >
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>
                              <div>
                                <span
                                  className={`text-xs font-semibold block ${
                                    isCurrent ? 'text-[#9A8568]' : isDone ? 'text-[#292522]' : 'text-[#766F68]/70'
                                  }`}
                                >
                                  {step}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] text-[#9A8568] font-medium">Current</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="pt-4 border-t border-[#E9DFD0]">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#292522] mb-3">
                        Items ({selectedOrder.items.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border border-zinc-100 rounded-xs bg-[#FAF8F4]"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt=""
                                className="w-12 h-14 object-cover rounded-xs bg-zinc-200"
                              />
                              <div>
                                <h5 className="font-editorial text-sm font-medium text-[#292522]">
                                  {item.productName}
                                </h5>
                                <span className="text-xs text-[#766F68]">
                                  Qty: {item.quantity} {item.size && `• Size: ${item.size}`}{' '}
                                  {item.color && `• Color: ${item.color}`}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-[#292522]">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Payment with PII protection */}
                    <div className="pt-4 border-t border-[#E9DFD0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#766F68]">
                      <div>
                        <h5 className="font-semibold text-[#292522] uppercase tracking-wider mb-1">
                          Delivery Address
                        </h5>
                        <p className="text-[#292522] font-medium">{selectedOrder.customerName}</p>
                        <p>{selectedOrder.address.address}</p>
                        <p>
                          {selectedOrder.address.city}, {selectedOrder.address.state} -{' '}
                          {selectedOrder.address.pincode}
                        </p>
                        <p>Phone: {maskPhone(selectedOrder.phone)}</p>
                      </div>

                      <div>
                        <h5 className="font-semibold text-[#292522] uppercase tracking-wider mb-1">
                          Payment Details
                        </h5>
                        <p>
                          Method:{' '}
                          <strong className="text-[#292522] capitalize">
                            {selectedOrder.paymentMethod.replace('_', ' ')}
                          </strong>
                        </p>
                        <p>
                          Payment Status:{' '}
                          <strong className="text-[#292522]">{selectedOrder.paymentStatus}</strong>
                        </p>
                        {selectedOrder.trackingNumber && (
                          <p className="mt-1">
                            Tracking:{' '}
                            <span className="font-mono font-bold text-[#292522]">
                              {selectedOrder.trackingNumber}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-[#766F68] bg-white border border-[#E9DFD0] rounded-md">
                    Select an order from the list to view its fulfillment timeline and items.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
