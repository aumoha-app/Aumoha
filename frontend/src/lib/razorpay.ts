import { API_BASE } from './api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Dynamically loads the Razorpay Standard Checkout JS SDK
 */
export const loadRazorpayScript = (): Promise<boolean> => {
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
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export interface RazorpayOptions {
  amount: number; // in Rupees (e.g. 499) or in Paise
  receipt?: string;
  name?: string;
  description?: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentData: { order_id: string; payment_id: string }) => void;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
}

/**
 * Initiates Razorpay Standard Web Checkout
 */
export const processRazorpayPayment = async (options: RazorpayOptions): Promise<void> => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert('Failed to load Razorpay SDK. Please check your internet connection.');
    if (options.onFailure) options.onFailure(new Error('Razorpay SDK failed to load'));
    return;
  }

  try {
    // 1. Call backend to create Razorpay Order
    const res = await fetch(`${API_BASE}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: options.amount,
        currency: 'INR',
        receipt: options.receipt,
        notes: options.notes,
      }),
    });

    const orderData = await res.json();

    if (!res.ok || orderData.status !== 'success') {
      throw new Error(orderData.message || 'Failed to create payment order');
    }

    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.key_id || 'rzp_test_TKxpLxhMCofQDL';

    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png';

    // 2. Configure Razorpay modal options
    const rzpOptions = {
      key: razorpayKey,
      amount: orderData.amount,
      currency: orderData.currency,
      name: options.name || 'Aumoha Pet Care Services',
      description: options.description || 'Payment for Aumoha Order',
      image: logoUrl,
      order_id: orderData.order_id,
      prefill: {
        name: options.prefill?.name || '',
        email: options.prefill?.email || '',
        contact: options.prefill?.contact || '',
      },
      theme: {
        color: '#2D4536',
        backdrop_color: 'rgba(28, 26, 23, 0.7)',
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          // 3. Verify payment signature on backend
          const verifyRes = await fetch(`${API_BASE}/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.status === 'success') {
            options.onSuccess({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
            });
          } else {
            alert(verifyData.message || 'Payment signature verification failed.');
            if (options.onFailure) options.onFailure(new Error(verifyData.message));
          }
        } catch (verifyErr: any) {
          console.error('Payment verification error:', verifyErr);
          alert('Network error verifying payment signature.');
          if (options.onFailure) options.onFailure(verifyErr);
        }
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed by user');
          if (options.onDismiss) options.onDismiss();
        },
      },
    };

    const rzp = new window.Razorpay(rzpOptions);
    rzp.on('payment.failed', function (response: any) {
      console.error('Razorpay Payment Failed:', response.error);
      alert(`Payment Failed: ${response.error.description || response.error.reason}`);
      if (options.onFailure) options.onFailure(response.error);
    });

    rzp.open();
  } catch (error: any) {
    console.error('Error initiating Razorpay checkout:', error);
    alert(error.message || 'Error processing payment request.');
    if (options.onFailure) options.onFailure(error);
  }
};
