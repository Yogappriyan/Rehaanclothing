/**
 * Razorpay Payment Integration & Security Utilities
 * House Of Rehaan Boutique
 *
 * Implements client-side checkout initiation, dynamic script loading,
 * server-side order generation request, and cryptographic payment verification.
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayConfig {
  keyId: string;
  currency: string;
  isConfigured: boolean;
  businessName: string;
  themeColor: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  isSandbox?: boolean;
  error?: string;
}

export interface PaymentVerificationResponse {
  verified: boolean;
  paymentId?: string;
  orderId?: string;
  verifiedAt?: string;
  error?: string;
}

/**
 * Dynamically loads the official Razorpay Checkout SDK.
 * Handles timeouts and resolves gracefully.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('[Razorpay] Failed to load external checkout.js script. Falling back to secure in-app modal.');
      resolve(false);
    };

    // Timeout after 6 seconds if network stalls
    setTimeout(() => {
      if (!window.Razorpay) {
        resolve(false);
      }
    }, 6000);

    document.body.appendChild(script);
  });
}

/**
 * Fetches Razorpay configuration from server.
 * Note: Never returns secret keys to frontend.
 */
export async function fetchRazorpayConfig(): Promise<RazorpayConfig> {
  try {
    const res = await fetch('/api/razorpay/config');
    if (!res.ok) {
      throw new Error(`Config fetch failed with status: ${res.status}`);
    }
    const data = await res.json();
    return {
      keyId: data.keyId || 'rzp_test_houseofrehaan',
      currency: data.currency || 'INR',
      isConfigured: Boolean(data.isConfigured),
      businessName: data.businessName || 'House Of Rehaan',
      themeColor: data.themeColor || '#292522',
    };
  } catch (err) {
    console.warn('[Razorpay Config Notice]:', err);
    return {
      keyId: 'rzp_test_houseofrehaan',
      currency: 'INR',
      isConfigured: false,
      businessName: 'House Of Rehaan',
      themeColor: '#292522',
    };
  }
}

/**
 * Requests server to create a verified Razorpay order
 */
export async function createRazorpayOrder(params: {
  amount: number;
  receipt?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  notes?: Record<string, string>;
}): Promise<CreateOrderResponse> {
  try {
    const res = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to initialize payment gateway order.',
      };
    }

    return {
      success: true,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
      keyId: data.keyId,
      isSandbox: data.isSandbox,
    };
  } catch (err: any) {
    console.error('[Razorpay Order Creation Error]:', err);
    return {
      success: false,
      error: err?.message || 'Network connection issue while initiating payment.',
    };
  }
}

/**
 * Submits payment token & signature to backend for cryptographic HMAC SHA-256 verification.
 */
export async function verifyRazorpayPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<PaymentVerificationResponse> {
  try {
    const res = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.verified) {
      return {
        verified: false,
        error: data.error || 'Cryptographic payment verification failed.',
      };
    }

    return {
      verified: true,
      paymentId: data.paymentId,
      orderId: data.orderId,
      verifiedAt: data.verifiedAt,
    };
  } catch (err: any) {
    console.error('[Razorpay Payment Verification Error]:', err);
    return {
      verified: false,
      error: err?.message || 'Failed to verify payment with server.',
    };
  }
}

/**
 * Requests server to sign a test sandbox transaction with HMAC SHA-256
 */
export async function generateSandboxSignature(orderId: string, paymentId: string): Promise<string> {
  try {
    const res = await fetch('/api/razorpay/generate-sandbox-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentId }),
    });
    const data = await res.json();
    return data.signature || `sig_test_${Date.now()}`;
  } catch {
    return `sig_test_${Date.now()}`;
  }
}
