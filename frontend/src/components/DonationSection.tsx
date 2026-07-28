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
    { value: 500, label: 'Feed a Stray' },
    { value: 1000, label: 'Paravet Aid' },
    { value: 2500, label: 'Rescue Fund' },
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
    <div className="w-full flex flex-col gap-3 py-1 select-none">
      
      {/* Inline Section Title */}
      <div className="flex items-center justify-between border-t border-[#F0EBE1] pt-4 mt-1">
        <h3 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
          Support Rescue Mission
        </h3>
        <span className="text-[9px] text-stone-400 font-bold">Direct street rescue funding</span>
      </div>

      {/* Preset Pills */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => {
          const isSelected = selectedAmount === preset.value;
          return (
            <button
              key={preset.value}
              onClick={() => handlePresetSelect(preset.value)}
              className={`flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-[#8C5E45] border-[#8C5E45] text-white shadow-2xs'
                  : 'bg-white border-[#EBE3D5] text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span className="text-xs font-extrabold">
                ₹{preset.value}
              </span>
              <span className={`text-[8px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-400'}`}>
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom input + Submit CTA button inline */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-grow max-w-[130px]">
          <span className="absolute inset-y-0 left-2.5 flex items-center text-stone-400 text-xs font-bold pointer-events-none">
            ₹
          </span>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Custom amount"
            className="w-full bg-stone-50 border border-[#EBE3D5] rounded-xl py-2 pl-7 pr-2 text-xs text-[#1C1A17] outline-none focus:bg-white focus:border-[#8C5E45] transition-all font-bold"
          />
        </div>

        <button
          onClick={handleDonateClick}
          className="flex-grow py-2.5 bg-[#8C5E45] hover:bg-[#774E38] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
        >
          <span>Donate to Rescue</span>
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
          </svg>
        </button>
      </div>

    </div>
  );
}
