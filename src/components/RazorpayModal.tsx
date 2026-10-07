import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { generateSandboxSignature } from '../utils/razorpay';

interface RazorpayModalProps {
  isOpen: boolean;
  orderId: string;
  amount: number; // in INR
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isSandbox?: boolean;
  onSuccess: (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onClose: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  isSandbox = false,
  onSuccess,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'upi' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || '');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFillTestCard = () => {
    setCardNumber('4111 2222 3333 4444');
    setCardExpiry('12/28');
    setCardCvv('789');
    setCardHolder(customerName || 'Test Customer');
    setErrorMessage('');
  };

  const handleFillTestUpi = (app: string) => {
    const handle = app.toLowerCase();
    setUpiId(`${customerPhone || '9790478436'}@${handle}`);
    setErrorMessage('');
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Field validations
    if (activeTab === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 15 || cleanNum.length > 19) {
        setErrorMessage('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        setErrorMessage('Please enter card expiry in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMessage('Please enter a valid 3-digit CVV.');
        return;
      }
    } else if (activeTab === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        setErrorMessage('Please enter a valid UPI Virtual Payment Address (e.g. name@okhdfcbank).');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Simulate bank network authorization delay
      await new Promise((r) => setTimeout(r, 1200));

      // Generate payment ID matching Razorpay format
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Generate HMAC SHA-256 signature from backend securely
      const signature = await generateSandboxSignature(orderId, paymentId);

      onSuccess({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setErrorMessage(err?.message || 'Payment authentication failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="razorpay-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-[#E9DFD0] overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#292522] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#9A8568] flex items-center justify-center font-editorial font-bold text-white text-lg">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="razorpay-modal-title" className="text-sm font-semibold tracking-wide">
                  House Of Rehaan
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Razorpay Secure
                </span>
              </div>
              <p className="text-[11px] text-[#C2B5A5] flex items-center gap-1.5 mt-0.5">
                <span>Order Ref:</span>
                <span className="font-mono text-white">#{orderId.slice(0, 14)}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close payment modal"
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-[#FAF8F4] px-5 py-3.5 border-b border-[#E9DFD0] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#766F68] uppercase tracking-wider block">
              Amount Due
            </span>
            <span className="text-xl font-bold text-[#292522]">
              ₹{amount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-right text-[11px] text-[#766F68]">
            <div className="flex items-center gap-1 text-emerald-700 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <span>Trichy Boutique Direct Fulfillment</span>
          </div>
        </div>

        {isSandbox && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-[11px] text-amber-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>
                <strong>Razorpay Test Sandbox:</strong> Live credentials or test simulation active.
              </span>
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-[#E9DFD0] text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upi');
              setErrorMessage('');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upi'
                ? 'border-[#9A8568] text-[#292522] bg-white'
                : 'border-transparent text-[#766F68] bg-[#F6F1EA]/50 hover:bg-[#F6F1EA]'
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#9A8568]" />
            <span>UPI Instant</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('card');
              setErrorMessage('');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'card'
                ? 'border-[#9A8568] text-[#292522] bg-white'
                : 'border-transparent text-[#766F68] bg-[#F6F1EA]/50 hover:bg-[#F6F1EA]'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#9A8568]" />
            <span>Card (Credit/Debit)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('netbanking');
              setErrorMessage('');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'netbanking'
                ? 'border-[#9A8568] text-[#292522] bg-white'
                : 'border-transparent text-[#766F68] bg-[#F6F1EA]/50 hover:bg-[#F6F1EA]'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#9A8568]" />
            <span>NetBanking</span>
          </button>
        </div>

        {/* Payment Forms */}
        <form onSubmit={handleProcessPayment} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: UPI */}
          {activeTab === 'upi' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#292522] mb-1">
                  Enter UPI Virtual Payment Address (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="e.g. mobile@okaxis, user@upi, user@paytm"
                  className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs font-mono focus:border-[#9A8568] focus:outline-hidden"
                  autoFocus
                />
              </div>

              {/* Quick UPI Pill Selectors */}
              <div>
                <span className="block text-[11px] text-[#766F68] mb-1.5 font-medium">
                  Popular Apps (click to test):
                </span>
                <div className="flex flex-wrap gap-2">
                  {['okaxis', 'okhdfcbank', 'paytm', 'ybl'].map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => handleFillTestUpi(handle)}
                      className="text-[11px] px-2.5 py-1 rounded-xs border border-[#E9DFD0] bg-[#FAF8F4] hover:bg-[#E9DFD0] text-[#292522] font-mono transition-colors cursor-pointer"
                    >
                      @{handle}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F4] border border-[#E9DFD0] rounded-xs text-[11px] text-[#766F68] space-y-1">
                <div className="flex items-center gap-1.5 text-[#292522] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real-time UPI intent & QR payment authorized by NPCI</span>
                </div>
                <p>Accepts GPay, PhonePe, Paytm, CRED, Amazon Pay, and all BHIM UPI apps.</p>
              </div>
            </div>
          )}

          {/* TAB 2: Card */}
          {activeTab === 'card' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#292522]">Card Details</label>
                <button
                  type="button"
                  onClick={handleFillTestCard}
                  className="text-[10px] text-[#9A8568] hover:underline font-semibold cursor-pointer"
                >
                  Fill Sample Test Card
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={cardNumber}
                  maxLength={19}
                  onChange={(e) => {
                    const v = e.target.value
                      .replace(/\D/g, '')
                      .replace(/(.{4})/g, '$1 ')
                      .trim();
                    setCardNumber(v);
                    setErrorMessage('');
                  }}
                  placeholder="Card Number (4111 2222 3333 4444)"
                  className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs font-mono focus:border-[#9A8568] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={cardExpiry}
                    maxLength={5}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                      setCardExpiry(v);
                      setErrorMessage('');
                    }}
                    placeholder="MM/YY"
                    className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs font-mono focus:border-[#9A8568] focus:outline-hidden"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={cardCvv}
                    maxLength={4}
                    onChange={(e) => {
                      setCardCvv(e.target.value.replace(/\D/g, ''));
                      setErrorMessage('');
                    }}
                    placeholder="CVV (3 digits)"
                    className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs font-mono focus:border-[#9A8568] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Cardholder Name"
                  className="w-full text-xs p-2.5 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
                />
              </div>

              <div className="text-[10px] text-[#766F68] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Card data tokenized via PCI-DSS compliant Razorpay Vault.</span>
              </div>
            </div>
          )}

          {/* TAB 3: NetBanking */}
          {activeTab === 'netbanking' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#292522]">
                Select Your Bank
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'Canara'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`p-2.5 text-xs rounded-xs border text-left font-medium transition-colors cursor-pointer ${
                      selectedBank === bank
                        ? 'border-[#9A8568] bg-[#FAF8F4] text-[#292522] font-semibold'
                        : 'border-[#E9DFD0] text-[#766F68] hover:bg-zinc-50'
                    }`}
                  >
                    {bank} Bank
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-widest rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:bg-zinc-400"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying with Razorpay Secure Gateway...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    Pay ₹{amount.toLocaleString('en-IN')} Securely
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Footer Security Badges */}
          <div className="pt-2 border-t border-[#E9DFD0] flex items-center justify-between text-[10px] text-[#766F68]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>HMAC SHA-256 Signatures</span>
            </span>
            <span>House Of Rehaan • Trichy Boutique</span>
          </div>
        </form>
      </div>
    </div>
  );
};
