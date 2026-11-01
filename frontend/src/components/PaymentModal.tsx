'use client';

import React, { useState } from 'react';
import { processRazorpayPayment } from '../lib/razorpay';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  doctorOrServiceName: string;
  doctorSpecialisation?: string;
  doctorPhoto?: string;
  petName?: string;
  slotDate?: string;
  slotTime?: string;
  bookingMode?: 'in-clinic' | 'tele-consult' | string;
  amount: number;
  userPrefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentInfo?: { order_id?: string; payment_id?: string; signature?: string; mode?: string }) => void;
  onPayLaterSuccess?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  title,
  subtitle,
  doctorOrServiceName,
  doctorSpecialisation,
  doctorPhoto,
  petName,
  slotDate,
  slotTime,
  bookingMode,
  amount,
  userPrefill,
  onSuccess,
  onPayLaterSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'razorpay' | 'upi' | 'pay_later'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProceedPayment = async () => {
    if (selectedMethod === 'pay_later') {
      if (onPayLaterSuccess) {
        onPayLaterSuccess();
      } else {
        onSuccess({ mode: 'pay_later' });
      }
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      await processRazorpayPayment({
        amount,
        receipt: `rcpt_${Date.now()}`,
        name: title || 'Aumoha Payment',
        description: `${doctorOrServiceName}${petName ? ` for ${petName}` : ''}`,
        prefill: userPrefill,
        onSuccess: (data) => {
          setIsProcessing(false);
          onSuccess({ order_id: data.order_id, payment_id: data.payment_id, signature: data.signature, mode: 'online' });
          onClose();
        },
        onFailure: (err) => {
          setIsProcessing(false);
          console.error('Payment failed:', err);
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (err) {
      setIsProcessing(false);
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-[#1C1A17]/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 animate-fadeIn">
      <div className="bg-[#FAF8F5] border border-[#EFEAE2] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        
        {/* ─── HEADER BAR ─── */}
        <div className="bg-[#2D4536] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 border-b border-[#23372B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center p-1 shrink-0">
              <img src="/logo.png" alt="Aumoha" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-white tracking-wide leading-tight">{title}</h3>
              <p className="text-[10.5px] text-emerald-100/80 font-sans font-medium">{subtitle || 'Secure Online Payment & Booking'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ─── SCROLLABLE CONTENT AREA ─── */}
        <div className="p-5 sm:p-6 overflow-y-auto scrollbar-hide flex flex-col gap-4 text-[#1C1A17]">
          
          {/* Summary Card */}
          <div className="bg-white border border-[#EBE3D5] rounded-[22px] p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                  {doctorPhoto ? (
                    <img src={doctorPhoto} alt={doctorOrServiceName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#2D4536] text-white flex items-center justify-center font-bold text-sm">
                      {doctorOrServiceName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1C1A17]">{doctorOrServiceName}</h4>
                  {doctorSpecialisation && (
                    <span className="text-[10px] text-stone-500 font-semibold block">{doctorSpecialisation}</span>
                  )}
                </div>
              </div>
              {bookingMode && (
                <span className="text-xs font-extrabold text-[#1C1A17] capitalize">
                  {bookingMode === 'tele-consult' ? 'Tele-consult' : 'In-clinic'}
                </span>
              )}
            </div>

            {/* Details Table */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {petName && (
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-2.5">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Pet Family</span>
                  <span className="font-extrabold text-[#1C1A17] text-xs">{petName}</span>
                </div>
              )}
              {slotDate && slotTime && (
                <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-2.5">
                  <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Scheduled Slot</span>
                  <span className="font-extrabold text-[#0D7855] text-xs">{slotDate} · {slotTime}</span>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">Total Consultation Fee</span>
              <span className="font-serif text-lg font-extrabold text-[#2D4536]">₹{amount}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest px-1">Choose Payment Method</span>

            {/* Option 1: Razorpay Online */}
            <label
              onClick={() => setSelectedMethod('razorpay')}
              className={`p-3.5 border rounded-[20px] flex items-center justify-between cursor-pointer transition-all ${
                selectedMethod === 'razorpay'
                  ? 'bg-white border-[#2D4536] shadow-sm ring-1 ring-[#2D4536]/20'
                  : 'bg-white/60 border-[#EBE3D5] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'razorpay' ? 'border-[#2D4536] bg-[#2D4536]' : 'border-stone-300'
                }`}>
                  {selectedMethod === 'razorpay' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1C1A17]">Cards / UPI / Netbanking / Wallets</span>
                    <span className="text-[8px] bg-blue-50 text-blue-700 font-extrabold px-1.5 py-0.5 rounded border border-blue-100">Razorpay</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium mt-0.5">Google Pay, PhonePe, Paytm, Visa, Mastercard, Netbanking</p>
                </div>
              </div>
              <span className="text-base">💳</span>
            </label>

            {/* Option 2: Direct UPI */}
            <label
              onClick={() => setSelectedMethod('upi')}
              className={`p-3.5 border rounded-[20px] flex items-center justify-between cursor-pointer transition-all ${
                selectedMethod === 'upi'
                  ? 'bg-white border-[#2D4536] shadow-sm ring-1 ring-[#2D4536]/20'
                  : 'bg-white/60 border-[#EBE3D5] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'upi' ? 'border-[#2D4536] bg-[#2D4536]' : 'border-stone-300'
                }`}>
                  {selectedMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1C1A17]">Instant Instant UPI Apps</span>
                  <p className="text-[10px] text-stone-500 font-medium mt-0.5">GPay, PhonePe, Paytm, Cred, BHIM</p>
                </div>
              </div>
              <span className="text-base">⚡</span>
            </label>

            {/* Option 3: Pay Later / Clinic */}
            <label
              onClick={() => setSelectedMethod('pay_later')}
              className={`p-3.5 border rounded-[20px] flex items-center justify-between cursor-pointer transition-all ${
                selectedMethod === 'pay_later'
                  ? 'bg-white border-[#2D4536] shadow-sm ring-1 ring-[#2D4536]/20'
                  : 'bg-white/60 border-[#EBE3D5] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'pay_later' ? 'border-[#2D4536] bg-[#2D4536]' : 'border-stone-300'
                }`}>
                  {selectedMethod === 'pay_later' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1C1A17]">Pay at Clinic / Book Direct</span>
                  <p className="text-[10px] text-stone-500 font-medium mt-0.5">Pay directly at appointment counter or session start</p>
                </div>
              </div>
              <span className="text-base">🏥</span>
            </label>
          </div>

          {/* Security badge */}
          <div className="bg-[#EDE8DE]/60 border border-[#E2DBD0] rounded-xl px-3 py-2 flex items-center justify-between text-[10px] text-stone-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span>🔒</span> 256-Bit SSL Encrypted & RBI Compliant
            </span>
            <span className="font-bold text-[#2D4536]">Aumoha Verified</span>
          </div>

        </div>

        {/* ─── FOOTER CTA BAR ─── */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#EFEAE2] flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={handleProceedPayment}
            disabled={isProcessing}
            className="w-full py-3.5 bg-[#2D4536] hover:bg-[#1E2E24] active:scale-[0.99] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting Secure Gateway...
              </span>
            ) : selectedMethod === 'pay_later' ? (
              <span>Confirm Booking (Pay Later) →</span>
            ) : (
              <span>Pay ₹{amount} & Complete Booking →</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

