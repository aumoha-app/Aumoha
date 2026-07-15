import { useState, useEffect } from 'react';

export default function DonationSection() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [checkoutCountryCode, setCheckoutCountryCode] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/settings/checkout-phone');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setCheckoutCountryCode(data.countryCode || '');
            setCheckoutPhone(data.phoneNumber || '');
          }
        }
      } catch (err) {
        console.warn('Failed to load checkout settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const presets = [
    { value: 500, label: 'Feed a Stray', desc: 'Provides food for a street dog for 1 month.' },
    { value: 1000, label: 'Paravet Aid', desc: 'Sponsors basic first aid & medical kit supplies.' },
    { value: 2500, label: 'Rescue Fund', desc: 'Covers transport and vet charges for a critical rescue.' },
  ];

  const handlePresetSelect = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount('');
  };

  const handleCustomChange = (val: string) => {
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  const handleDonateClick = () => {
    const finalAmount = selectedAmount !== null ? selectedAmount : (Number(customAmount) || 0);
    const cleanCountryCode = checkoutCountryCode.replace('+', '');
    const phoneNumber = checkoutPhone ? `${cleanCountryCode}${checkoutPhone}` : '919876543210';
    const amountStr = finalAmount > 0 ? ` of ₹${finalAmount}` : '';
    const message = encodeURIComponent(
      `Hi! I would like to support Aumoha with a donation${amountStr} to help rescue and care for local stray animals. Please guide me on how I can contribute.`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <section className="bg-gradient-to-br from-[#FCFAF7] to-[#FAF5EC] border border-[#F0EBE1] rounded-[32px] p-6 md:p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all duration-300 select-none">
      
      {/* Header and Brand Icon */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FDEDEC] border border-[#FADBD8] flex items-center justify-center text-[#C85341] shrink-0 shadow-inner">
          <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div className="flex-grow">
          <h2 className="font-serif text-lg md:text-xl text-[#1C1A17] font-semibold leading-tight">
            Support Aumoha Rescue Mission
          </h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed mt-1">
            Your generous contributions directly fund street rescues, medical checkups, and daily feeding drives for stray animals in our community.
          </p>
        </div>
      </div>

      {/* Preset Amount Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {presets.map((preset) => {
          const isSelected = selectedAmount === preset.value;
          return (
            <button
              key={preset.value}
              onClick={() => handlePresetSelect(preset.value)}
              className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white border-[#C85341] shadow-xs ring-1 ring-[#C85341]'
                  : 'bg-white/60 hover:bg-white border-[#EBE3D5] text-stone-600 hover:text-charcoal'
              }`}
            >
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-[#C85341]' : 'text-stone-400'}`}>
                {preset.label}
              </span>
              <span className="text-base font-extrabold text-[#1C1A17] mt-1">
                ₹{preset.value}
              </span>
              <span className="text-[9.5px] text-stone-400 font-medium leading-normal mt-1">
                {preset.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Amount Field */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="customAmount" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
          Or Enter Custom Amount
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-stone-400 text-xs select-none pointer-events-none font-bold">
            ₹
          </span>
          <input
            type="number"
            id="customAmount"
            value={customAmount}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="e.g. 5000"
            className="w-full bg-white rounded-xl py-3 pl-9 pr-4 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#C85341] focus:ring-1 focus:ring-[#C85341] outline-none transition-all shadow-2xs font-bold"
          />
        </div>
      </div>

      {/* Donate WhatsApp CTA Button */}
      <button
        onClick={handleDonateClick}
        className="w-full py-3.5 bg-[#C85341] hover:bg-[#B34535] active:scale-98 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-100 transition-all cursor-pointer"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
        </svg>
        Proceed to Donation Inquiry
      </button>

    </section>
  );
}
