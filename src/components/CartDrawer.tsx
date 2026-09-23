import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface CartDrawerProps {
  onNavigate: (route: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    discountAmount,
    deliveryFee,
    total,
  } = useCart();

  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F4] border-l border-[#E9DFD0] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-5 border-b border-[#E9DFD0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#9A8568]" />
              <h2 className="font-editorial text-xl font-normal text-[#292522]">
                Your Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full text-[#766F68] hover:text-[#292522] hover:bg-[#E9DFD0]/40 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="font-editorial text-lg text-[#292522]">
                  Your bag is waiting for your next favourite.
                </h3>
                <p className="text-xs text-[#766F68] max-w-xs">
                  Discover our curated collection of contemporary and traditional women's clothing.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigate('shop');
                  }}
                  className="mt-2 px-6 py-2.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex gap-4 p-3 bg-white border border-[#E9DFD0]/80 rounded-md"
                >
                  {/* Item Image */}
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-20 h-24 object-cover rounded-xs bg-[#F4EFE6] shrink-0"
                  />

                  {/* Item Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-editorial text-sm font-medium text-[#292522] leading-snug line-clamp-1">
                        {item.productName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#766F68]">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && (
                          <>
                            <span>•</span>
                            <span>Color: {item.color}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-[#E9DFD0] rounded-xs text-xs">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.size,
                              item.color
                            )
                          }
                          className="px-2 py-0.5 text-[#766F68] hover:text-[#292522]"
                        >
                          -
                        </button>
                        <span className="px-2.5 font-medium">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.size,
                              item.color
                            )
                          }
                          className="px-2 py-0.5 text-[#766F68] hover:text-[#292522]"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-sm font-semibold text-[#292522]">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Move to Wishlist / Remove */}
                    <div className="flex items-center justify-end gap-3 mt-1 text-[11px] text-[#766F68]">
                      <button
                        onClick={() => {
                          if (!isInWishlist(item.productId)) {
                            toggleWishlist(item.productId);
                          }
                          removeFromCart(item.productId, item.size, item.color);
                        }}
                        className="hover:text-[#9A8568] flex items-center gap-1 cursor-pointer"
                      >
                        <Heart className="w-3 h-3" />
                        <span>Save for later</span>
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId, item.size, item.color)}
                        className="hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Subtotal & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#E9DFD0] bg-white space-y-3">
              <div className="space-y-1.5 text-xs text-[#766F68]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#292522] font-medium">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery (Trichy & PAN India)</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-[#E9DFD0] text-sm font-semibold text-[#292522]">
                  <span>Estimated Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onNavigate('checkout');
                }}
                className="w-full py-3.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-widest rounded-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-[#766F68]">
                Complimentary shipping on orders above ₹1,999.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
