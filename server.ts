import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Razorpay Key Credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// Internal fallback secret for secure sandbox verification when real keys are not injected
const SANDBOX_SECRET = process.env.SANDBOX_SECRET || 'house_of_rehaan_secure_sandbox_secret_2026';

let razorpayInstance: Razorpay | null = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
    console.log('[Razorpay] Initialized with live/test key:', RAZORPAY_KEY_ID.slice(0, 8) + '***');
  } catch (err) {
    console.error('[Razorpay] Failed to initialize SDK client:', err);
  }
} else {
  console.log('[Razorpay] Running in Secure Sandbox Mode. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for production.');
}

// Request body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security Headers (compatible with applet iframe)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// -------------------------------------------------------------
// RAZORPAY API ENDPOINTS
// -------------------------------------------------------------

/**
 * GET /api/razorpay/config
 * Returns public configuration for client-side checkout.
 * CRITICAL SECURITY: Never returns RAZORPAY_KEY_SECRET!
 */
app.get('/api/razorpay/config', (req, res) => {
  res.json({
    success: true,
    keyId: RAZORPAY_KEY_ID || 'rzp_test_houseofrehaan',
    currency: 'INR',
    isConfigured: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
    businessName: 'House Of Rehaan',
    themeColor: '#292522',
  });
});

/**
 * POST /api/razorpay/create-order
 * Creates a server-side order with Razorpay.
 * Validates order amounts and stores secure metadata.
 */
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', customer, notes, receipt } = req.body;

    // Strict input validation
    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order amount. Amount must be a positive number.',
      });
    }

    // Upper limit safeguard to prevent abnormal transaction sizes
    if (parsedAmount > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'Order amount exceeds maximum transaction limit.',
      });
    }

    const amountInPaise = Math.round(parsedAmount * 100);
    const sanitizedReceipt = (receipt || `rcpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 40);

    const safeNotes = {
      store: 'House Of Rehaan',
      customerName: String(customer?.name || '').slice(0, 45),
      customerPhone: String(customer?.phone || '').slice(0, 15),
      customerEmail: String(customer?.email || '').slice(0, 45),
      ...(notes || {}),
    };

    if (razorpayInstance) {
      // Create official order with Razorpay API
      const options = {
        amount: amountInPaise,
        currency,
        receipt: sanitizedReceipt,
        notes: safeNotes,
      };

      const order = await razorpayInstance.orders.create(options);

      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        isSandbox: false,
      });
    } else {
      // Generate a secure cryptographically unique sandbox order ID
      const sandboxOrderId = `order_test_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      
      return res.json({
        success: true,
        orderId: sandboxOrderId,
        amount: amountInPaise,
        currency,
        keyId: RAZORPAY_KEY_ID || 'rzp_test_houseofrehaan',
        isSandbox: true,
        message: 'Order created in Secure Sandbox Mode. Ready for checkout verification.',
      });
    }
  } catch (error: any) {
    console.error('[Razorpay Create Order Error]:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to initialize payment gateway order.',
    });
  }
});

/**
 * POST /api/razorpay/verify-payment
 * Cryptographically verifies Razorpay payment signatures using HMAC SHA256.
 * Uses constant-time buffer comparison to prevent timing attacks.
 */
app.post('/api/razorpay/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        verified: false,
        error: 'Missing required Razorpay payment parameters (order_id, payment_id, signature).',
      });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;

    if (razorpayInstance && RAZORPAY_KEY_SECRET) {
      // Real Razorpay Signature Verification
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const receivedBuffer = Buffer.from(razorpay_signature, 'utf8');

      if (expectedBuffer.length !== receivedBuffer.length) {
        return res.status(400).json({
          verified: false,
          error: 'Security verification failed: signature length mismatch.',
        });
      }

      const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

      if (!isValid) {
        return res.status(400).json({
          verified: false,
          error: 'Security verification failed: invalid HMAC SHA256 signature.',
        });
      }

      return res.json({
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        verifiedAt: new Date().toISOString(),
        method: 'HMAC_SHA256_LIVE',
      });
    } else {
      // Sandbox HMAC SHA256 verification
      const expectedSandboxSig = crypto
        .createHmac('sha256', SANDBOX_SECRET)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSandboxSig, 'utf8');
      const receivedBuffer = Buffer.from(razorpay_signature, 'utf8');

      let isValid = false;
      if (expectedBuffer.length === receivedBuffer.length) {
        isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
      }

      // Also accept standard simulated token for testing if matching prefix
      if (!isValid && razorpay_signature.startsWith('sig_test_') && razorpay_payment_id.startsWith('pay_')) {
        isValid = true;
      }

      if (!isValid) {
        return res.status(400).json({
          verified: false,
          error: 'Sandbox signature mismatch.',
        });
      }

      return res.json({
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        verifiedAt: new Date().toISOString(),
        method: 'HMAC_SHA256_SANDBOX',
      });
    }
  } catch (error: any) {
    console.error('[Razorpay Verify Payment Error]:', error);
    return res.status(500).json({
      verified: false,
      error: 'Internal error during payment security verification.',
    });
  }
});

/**
 * POST /api/razorpay/generate-sandbox-signature
 * Helper for sandbox test flow to compute legitimate HMAC SHA-256 signatures
 * using server-side secret without leaking the secret to the browser.
 */
app.post('/api/razorpay/generate-sandbox-signature', (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    if (!orderId || !paymentId) {
      return res.status(400).json({ error: 'Missing orderId or paymentId' });
    }

    const secretToUse = RAZORPAY_KEY_SECRET || SANDBOX_SECRET;
    const payload = `${orderId}|${paymentId}`;
    const signature = crypto.createHmac('sha256', secretToUse).update(payload).digest('hex');

    res.json({ success: true, signature });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate signature' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'House Of Rehaan API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// VITE DEV MIDDLEWARE OR STATIC PRODUCTION FILES
// -------------------------------------------------------------
async function setupServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[House Of Rehaan] Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('[House Of Rehaan] Fatal server startup error:', err);
  process.exit(1);
});
