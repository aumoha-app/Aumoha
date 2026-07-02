'use client';

import { useState } from 'react';

interface Product {
  id: number;
  category: 'food' | 'toys' | 'medical';
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discountBadge: string | null;
  imageUrl: string;
}

const ALL_PRODUCTS: Product[] = [
  {
    id: 1,
    category: 'food',
    title: 'Plant-Based Dog Treats',
    description: 'Wholesome daily treats',
    price: 499,
    originalPrice: null,
    discountBadge: null,
    imageUrl: '/product-1.png'
  },
  {
    id: 2,
    category: 'medical',
    title: 'Paw Wash',
    description: 'Gentle & calming',
    price: 449,
    originalPrice: 499,
    discountBadge: '10% OFF',
    imageUrl: '/product-2.png'
  },
  {
    id: 3,
    category: 'toys',
    title: 'Eco Rope Ball',
    description: 'Durable & safe play',
    price: 349,
    originalPrice: null,
    discountBadge: null,
    imageUrl: '/product-3.png'
  },
  {
    id: 4,
    category: 'toys',
    title: 'Plush Buddy',
    description: 'Soft & comforting',
    price: 399,
    originalPrice: null,
    discountBadge: null,
    imageUrl: '/product-4.png'
  },
  {
    id: 5,
    category: 'medical',
    title: 'Skin & Coat Support',
    description: 'Nourishment from within',
    price: 899,
    originalPrice: 999,
    discountBadge: '10% OFF',
    imageUrl: '/product-5.png'
  },
  {
    id: 6,
    category: 'toys',
    title: 'Comfort Collar',
    description: 'Soft. Secure. Everyday.',
    price: 499,
    originalPrice: null,
    discountBadge: null,
    imageUrl: '/product-6.png'
  }
];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'toys' | 'medical'>('all');
  const [cartCount, setCartCount] = useState(0);

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
  };

  // Filter products based on category and search query
  const filteredProducts = ALL_PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-4 md:p-8 flex flex-col gap-5 transition-all duration-300">
      
      {/* 1. HEADER: Title and Shopping Cart Icon */}
      <header className="flex items-center justify-between w-full select-none px-1">
        <h1 className="font-serif text-3xl md:text-4xl text-[#1C1A17] font-normal tracking-tight">Marketplace</h1>
        
        {/* Shopping Cart Icon with item counter */}
        <div className="relative p-2 hover:opacity-85 transition-opacity cursor-pointer select-none">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1A17" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#4A5D4E] text-[#FDFBF7] text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scaleIn select-none">
              {cartCount}
            </span>
          )}
        </div>
      </header>

      {/* 2. SEARCH BAR */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-stone-400 select-none">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search for products, brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#F5F3EF] rounded-2xl py-3 pl-12 pr-4 text-xs md:text-sm text-[#1C1A17] placeholder-stone-500 outline-none focus:ring-1 focus:ring-[#4A5D4E] transition-all"
        />
      </div>

      {/* 3. CATEGORY RAIL */}
      <div className="flex items-center justify-between w-full select-none mt-1 pb-2">
        {/* Category: All */}
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center justify-center px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm'
              : 'bg-transparent text-stone-500 hover:text-[#1C1A17]'
          }`}
        >
          All
        </button>

        {/* Separator */}
        <div className="w-[1px] h-4 bg-stone-200 shrink-0" />

        {/* Category: Food */}
        <button
          onClick={() => setSelectedCategory('food')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer shrink-0 ${
            selectedCategory === 'food'
              ? 'bg-[#4A5D4E] text-[#FDFBF7] font-bold'
              : 'bg-transparent text-stone-500 hover:text-[#1C1A17] font-semibold'
          }`}
        >
          Food
        </button>

        {/* Separator */}
        <div className="w-[1px] h-4 bg-stone-200 shrink-0" />

        {/* Category: Toys */}
        <button
          onClick={() => setSelectedCategory('toys')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer shrink-0 ${
            selectedCategory === 'toys'
              ? 'bg-[#4A5D4E] text-[#FDFBF7] font-bold'
              : 'bg-transparent text-stone-500 hover:text-[#1C1A17] font-semibold'
          }`}
        >
          Toys
        </button>

        {/* Separator */}
        <div className="w-[1px] h-4 bg-stone-200 shrink-0" />

        {/* Category: Medical */}
        <button
          onClick={() => setSelectedCategory('medical')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs transition-all duration-200 cursor-pointer shrink-0 ${
            selectedCategory === 'medical'
              ? 'bg-[#4A5D4E] text-[#FDFBF7] font-bold'
              : 'bg-transparent text-stone-500 hover:text-[#1C1A17] font-semibold'
          }`}
        >
          Medical
        </button>
      </div>

      {/* 4. DISCOUNT BANNER */}
      <div className="bg-[#FAF6F0] border border-[#EBE3D5] rounded-[20px] p-4 flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Custom Shield Paw Icon Container */}
          <div className="w-10 h-10 rounded-xl bg-white border border-[#EBE3D5] flex items-center justify-center text-[#4A5D4E] shrink-0">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="11.5" r="2" fill="currentColor" />
              <circle cx="10" cy="9" r="0.8" fill="currentColor" />
              <circle cx="14" cy="9" r="0.8" fill="currentColor" />
              <circle cx="8" cy="11" r="0.8" fill="currentColor" />
              <circle cx="16" cy="11" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <div className="flex-grow flex flex-col min-w-0">
            <h4 className="text-xs md:text-sm font-bold text-[#1C1A17] leading-tight">Special discount for badge rescuers</h4>
            <p className="text-[10px] md:text-xs text-stone-500 mt-0.5 leading-normal">Thank you for making a difference.</p>
          </div>
        </div>
        {/* Percentage badge */}
        <div className="w-9 h-9 rounded-full bg-[#D4DDD6] text-[#4A5D4E] font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
          %
        </div>
      </div>

      {/* 5. PRODUCT GRID */}
      <section className="w-full">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 w-full">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-3 flex flex-col gap-3.5 relative hover:shadow-md transition-all duration-300 group"
              >
                  {/* 10% OFF Badge at top left */}
                  {product.discountBadge && (
                    <div className="absolute top-3.5 left-3.5 bg-[#2A3E31] text-[#FDFBF7] font-bold text-[9px] px-2 py-0.5 rounded-md select-none z-10">
                      {product.discountBadge}
                    </div>
                  )}

                  {/* Product Image Area */}
                  <div className="aspect-square w-full rounded-2xl bg-[#FAF6F0] overflow-hidden relative select-none">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Product Title and Details */}
                  <div className="flex flex-col flex-grow min-w-0 px-0.5">
                    <h3 className="font-serif text-sm md:text-base font-normal text-[#1C1A17] leading-tight truncate">{product.title}</h3>
                    <p className="text-[10px] text-stone-400 font-medium leading-normal mt-0.5">{product.description}</p>
                  </div>

                  {/* Bottom Row: Prices and Add Button */}
                  <div className="flex items-center justify-between mt-auto px-0.5">
                    <div className="flex flex-col leading-none">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs md:text-sm font-extrabold text-[#1C1A17] leading-none">
                          ₹{product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[10px] text-stone-400 line-through leading-none">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Add Button */}
                    <button 
                      onClick={handleAddToCart}
                      className="px-4 py-1.5 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-95 text-white font-bold rounded-xl text-[10px] md:text-xs transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 select-none">
              <p className="text-xs md:text-sm text-stone-400 font-medium">No products match your search query.</p>
            </div>
          )}
      </section>

    </main>
  );
}
