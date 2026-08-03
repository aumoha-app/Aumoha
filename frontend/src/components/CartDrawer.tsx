'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { processRazorpayPayment } from '../lib/razorpay';


interface CartItem {
  id: string | number;
  title: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string | number, delta: number) => void;
  onRemoveItem: (id: string | number) => void;
  onClearCart: () => void;
  checkoutCountryCode?: string;
  checkoutPhone?: string;
}


export type { CartItem };

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  checkoutCountryCode = '+91',
  checkoutPhone = ''
}: CartDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSavings = items.reduce((sum, item) => {
    if (item.originalPrice) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleRazorpayPay = () => {
    if (subtotal <= 0) return;
    setIsProcessingPayment(true);

    processRazorpayPayment({
      amount: subtotal,
      receipt: `receipt_cart_${Date.now()}`,
      name: 'Aumoha Marketplace',
      description: `Purchase of ${totalItems} item${totalItems !== 1 ? 's' : ''}`,
      prefill: {
        name: user?.fullName || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      onSuccess: (paymentData) => {
        setIsProcessingPayment(false);
        alert(`🎉 Payment Successful!\nPayment ID: ${paymentData.payment_id}\nOrder ID: ${paymentData.order_id}`);
        onClearCart();
        onClose();
      },
      onFailure: () => {
        setIsProcessingPayment(false);
      },
      onDismiss: () => {
        setIsProcessingPayment(false);
      }
    });
  };

  const handleCheckout = () => {
    if (!checkoutPhone) return;

    // Build checkout text
    let orderItemsText = '';
    items.forEach((item) => {
      orderItemsText += `- ${item.title} x ${item.quantity} (₹${item.price * item.quantity})\n`;
    });

    const customerDetailsText = user ? `👤 CUSTOMER DETAILS:
- Name: ${user.fullName}
- Phone: ${user.phone || 'N/A'}
- Delivery Address: ${user.address || 'N/A'}` : `👤 CUSTOMER DETAILS:
- Guest Customer`;

    const message = `Hello Aumoha! I would like to place an order:

🛒 ORDER DETAILS:
${orderItemsText}
💵 Total Amount: ₹${subtotal}

${customerDetailsText}

Please confirm my order. Thank you!`;

    // Clean up the target phone number for WhatsApp link
    const cleanCountry = checkoutCountryCode.replace(/\+/g, '').trim();
    const cleanPhone = checkoutPhone.replace(/\D/g, '').trim();
    const fullNumber = `${cleanCountry}${cleanPhone}`;

    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');

    // Clear cart immediately
    onClearCart();
    
    // Close CartDrawer
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[9998] transition-all duration-300 ${
          isOpen
            ? 'bg-black/40 backdrop-blur-sm pointer-events-auto'
            : 'bg-transparent backdrop-blur-none pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-[9999] h-full w-full max-w-md bg-[#FDFBF7] shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* --- Header --- */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE3D5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4A5D4E] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FDFBF7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#1C1A17] font-normal leading-tight">Your Cart</h2>
              <p className="text-[11px] text-stone-400 font-medium">
                {totalItems === 0 ? 'No items yet' : `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#F5F3EF] hover:bg-[#EBE3D5] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1C1A17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* --- Cart Items --- */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
              {/* Empty cart illustration */}
              <div className="w-20 h-20 rounded-full bg-[#F5F3EF] flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#C4BDB2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1C1A17]">Your cart is empty</p>
                <p className="text-xs text-stone-400 mt-1">Browse the marketplace and add products you love!</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-[#4A5D4E] hover:bg-[#3A4D3E] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Clear all button */}
              <div className="flex justify-end">
                <button
                  onClick={onClearCart}
                  className="text-[11px] text-stone-400 hover:text-red-500 font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Clear all
                </button>
              </div>

              {/* Item list */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#F0EBE1] rounded-2xl p-3 flex gap-3 group hover:shadow-sm transition-all duration-200"
                >
                  {/* Product thumbnail */}
                  <div className="w-[72px] h-[72px] rounded-xl bg-[#FAF6F0] overflow-hidden shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product details */}
                  <div className="flex flex-col flex-1 min-w-0 justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-sm text-[#1C1A17] font-normal leading-tight truncate">
                        {item.title}
                      </h4>
                      {/* Remove button */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
                        aria-label={`Remove ${item.title}`}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-end justify-between mt-1">
                      {/* Price */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-[#1C1A17]">
                          ₹{item.price * item.quantity}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-stone-400">
                            (₹{item.price} × {item.quantity})
                          </span>
                        )}
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-0.5 bg-[#F5F3EF] rounded-lg overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-[#1C1A17] hover:bg-[#EBE3D5] transition-colors cursor-pointer text-sm font-bold"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-[#1C1A17] select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#1C1A17] hover:bg-[#EBE3D5] transition-colors cursor-pointer text-sm font-bold"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Footer / Checkout --- */}
        {items.length > 0 && (
          <div className="border-t border-[#EBE3D5] px-5 py-4 bg-white/80 backdrop-blur-sm">
            {/* Savings banner */}
            {totalSavings > 0 && (
              <div className="flex items-center gap-2 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl px-3 py-2 mb-3">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span className="text-xs font-bold text-[#2E7D32]">
                  You&apos;re saving ₹{totalSavings}!
                </span>
              </div>
            )}

            {/* Price breakdown */}
            <div className="flex flex-col gap-1.5 mb-4">
              <div className="flex justify-between text-xs text-stone-500">
                <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                <span className="font-semibold text-[#1C1A17]">₹{subtotal}</span>
              </div>
              <div className="h-px bg-[#EBE3D5] my-1" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[#1C1A17]">Total</span>
                <span className="text-sm font-extrabold text-[#1C1A17]">₹{subtotal}</span>
              </div>
            </div>

            {/* Checkout buttons */}
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={handleRazorpayPay}
                disabled={isProcessingPayment}
                className="w-full py-3.5 bg-[#2D4536] hover:bg-[#1E2E24] disabled:bg-stone-300 active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                {isProcessingPayment ? 'Processing Payment...' : `Pay ₹${subtotal} Online (Razorpay)`}
              </button>

              {checkoutPhone && (
                <button 
                  onClick={handleCheckout}
                  className="w-full py-3 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-[0.98] text-white font-bold text-xs rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Checkout via WhatsApp
                </button>
              )}
            </div>

            {/* Continue shopping link */}
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 text-xs text-stone-500 hover:text-[#4A5D4E] font-semibold transition-colors cursor-pointer"
            >
              ← Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
