'use client';

import { useState, useCallback, useEffect } from 'react';
import CartDrawer, { type CartItem } from './CartDrawer';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { API_BASE } from '../lib/api';

interface MarketplaceProps {
  onOpenAdmin?: () => void;
}

export default function Marketplace({ onOpenAdmin }: MarketplaceProps) {
  const { token } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'toys' | 'medical'>('all');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | number | null>(null);

  const [checkoutCountryCode, setCheckoutCountryCode] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');

  // Fetch configured checkout phone settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings/checkout-phone`);
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
  }, [isCartOpen]);

  // Fetch products from MongoDB
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.warn('Failed to fetch products from MongoDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Check if current user is admin whitelisted
  useEffect(() => {
    const checkAdmin = async () => {
      if (!token) {
        setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/admin-config`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setIsAdmin(data.isAdmin);
          }
        }
      } catch (err) {
        console.warn('Failed to retrieve admin configuration:', err);
      }
    };
    checkAdmin();
  }, [token]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = useCallback((product: Product) => {
    const prodId = product._id || product.id || '';
    setCartItems(prev => {
      const existing = prev.find(item => item.id === prodId);
      if (existing) {
        return prev.map(item =>
          item.id === prodId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: prodId,
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice,
        imageUrl: product.imageUrl,
        quantity: 1,
      }];
    });

    setAddedProductId(prodId);
    setTimeout(() => setAddedProductId(null), 1200);
  }, []);

  const handleUpdateQuantity = useCallback((id: string | number, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item =>
          item.id === id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }, []);

  const handleRemoveItem = useCallback((id: string | number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartQuantity = (productId: string | number) => {
    const item = cartItems.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <main className="w-full max-w-3xl md:max-w-4xl mx-auto flex flex-col gap-5 transition-all duration-300 font-sans">
        
        {/* 1. HEADER: Title & Shopping Cart Icon */}
        <header className="flex items-center justify-between w-full select-none px-1 pt-1">
          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1C1A17] tracking-tight leading-none">
              Marketplace
            </h1>
            <span className="text-xs sm:text-sm text-stone-600 font-medium">
              Curated care essentials for your companions
            </span>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 bg-[#EFEAE2] hover:bg-[#E6E0D6] border border-[#D5CEBF] rounded-2xl transition-all cursor-pointer select-none group shadow-2xs"
            aria-label={`Open cart with ${cartCount} items`}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1C1A17" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-105 transition-transform duration-200">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-[#C85341] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center select-none shadow-xs"
                style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </header>

        {/* 2. SEARCH BAR (Matching Homepage Input) */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-stone-600 select-none">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search for food, toys, medical care..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EFEAE2] border border-[#D5CEBF] focus:border-[#C85341] rounded-2xl py-3.5 pl-11 pr-4 text-xs sm:text-sm text-[#1C1A17] placeholder-stone-600 outline-none transition-all font-sans font-medium shadow-2xs"
          />
        </div>

        {/* 3. CATEGORY RAIL */}
        <div className="grid grid-cols-4 gap-2.5 w-full select-none mt-0.5 pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full flex items-center justify-center py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
              selectedCategory === 'all'
                ? 'bg-[#2D4536] text-white shadow-xs'
                : 'bg-[#EFEAE2] text-stone-700 hover:text-[#1C1A17] border border-[#D5CEBF]'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setSelectedCategory('food')}
            className={`w-full flex items-center justify-center py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
              selectedCategory === 'food'
                ? 'bg-[#2D4536] text-white shadow-xs'
                : 'bg-[#EFEAE2] text-stone-700 hover:text-[#1C1A17] border border-[#D5CEBF]'
            }`}
          >
            Food
          </button>

          <button
            onClick={() => setSelectedCategory('toys')}
            className={`w-full flex items-center justify-center py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
              selectedCategory === 'toys'
                ? 'bg-[#2D4536] text-white shadow-xs'
                : 'bg-[#EFEAE2] text-stone-700 hover:text-[#1C1A17] border border-[#D5CEBF]'
            }`}
          >
            Toys
          </button>

          <button
            onClick={() => setSelectedCategory('medical')}
            className={`w-full flex items-center justify-center py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
              selectedCategory === 'medical'
                ? 'bg-[#2D4536] text-white shadow-xs'
                : 'bg-[#EFEAE2] text-stone-700 hover:text-[#1C1A17] border border-[#D5CEBF]'
            }`}
          >
            Medical
          </button>
        </div>

        {/* 4. DISCOUNT BANNER */}
        <div className="bg-[#EFEAE2] border border-[#D5CEBF] rounded-[24px] p-4 flex items-center justify-between gap-4 select-none shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#D5CEBF] flex items-center justify-center text-[#2D4536] shrink-0">
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
              <h4 className="text-xs sm:text-sm font-bold font-serif text-[#1C1A17] leading-tight">Special discount for badge rescuers</h4>
              <p className="text-[10.5px] sm:text-xs text-stone-600 font-sans font-medium mt-0.5 leading-normal">Thank you for making a difference.</p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#2D4536] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
            %
          </div>
        </div>

        {/* 5. SIDE SCROLLABLE CATEGORY SECTIONS (Food, Toys, Medical) */}
        <section className="w-full flex flex-col gap-6">
          {isLoading ? (
            <div className="flex flex-col gap-5 w-full">
              {[1, 2].map((s) => (
                <div key={s} className="flex flex-col gap-3">
                  <div className="h-6 w-36 bg-stone-200/80 rounded animate-pulse" />
                  <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-[200px] shrink-0 bg-[#EFEAE2] border border-[#D5CEBF] rounded-[24px] p-3 flex flex-col gap-3">
                        <div className="aspect-square w-full rounded-2xl bg-stone-200/70 animate-pulse" />
                        <div className="h-4 w-3/4 bg-stone-200/80 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-stone-200/60 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* FOOD SECTION */}
              {(selectedCategory === 'all' || selectedCategory === 'food') && (
                (() => {
                  const foodProds = filteredProducts.filter(p => p.category === 'food' || selectedCategory === 'food');
                  if (foodProds.length === 0 && selectedCategory === 'food') return null;
                  return (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex items-center justify-between w-full px-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base sm:text-xl font-bold text-[#1C1A17] tracking-tight">
                            Food And Nutrition
                          </h3>
                          <span className="text-[10px] font-bold bg-[#EAE4D8] text-[#2D4536] px-2 py-0.5 rounded-full">
                            {foodProds.length} items
                          </span>
                        </div>
                        {selectedCategory === 'all' && (
                          <button
                            onClick={() => setSelectedCategory('food')}
                            className="text-xs text-[#C85341] font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            View All <span className="text-xs">→</span>
                          </button>
                        )}
                      </div>

                      {/* Side-Scrollable Track */}
                      <div className="flex overflow-x-auto gap-3.5 w-full pb-3 pt-1 scrollbar-none no-scrollbar scrollbar-hide snap-x snap-mandatory px-0.5">
                        {foodProds.map((product) => {
                          const prodId = product._id || product.id || '';
                          const inCartQty = getCartQuantity(prodId);

                          return (
                            <div
                              key={prodId}
                              className="w-[200px] xs:w-[220px] md:w-[230px] shrink-0 bg-[#EFEAE2] border border-[#D5CEBF] rounded-[24px] p-3 flex flex-col gap-3 relative hover:shadow-md transition-all duration-300 group snap-start select-none"
                            >
                              {product.discountBadge && (
                                <div className="absolute top-3.5 left-3.5 bg-[#2D4536] text-white font-bold text-[9px] px-2 py-0.5 rounded-md select-none z-10">
                                  {product.discountBadge}
                                </div>
                              )}

                              <div className="aspect-square w-full rounded-2xl bg-[#F4EFE6] overflow-hidden relative select-none">
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => { e.currentTarget.src = '/real-pet-food.png'; }}
                                />
                              </div>

                              <div className="flex flex-col flex-grow min-w-0 px-0.5">
                                <h3 className="font-serif text-sm font-bold text-[#1C1A17] leading-tight truncate">
                                  {product.title}
                                </h3>
                                <p className="text-[10.5px] text-stone-600 font-sans font-medium leading-normal mt-0.5 line-clamp-2">
                                  {product.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-auto px-0.5 pt-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs sm:text-sm font-extrabold text-[#1C1A17]">
                                    ₹{product.price}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-[10px] text-stone-500 line-through">
                                      ₹{product.originalPrice}
                                    </span>
                                  )}
                                </div>

                                {inCartQty === 0 ? (
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="px-3.5 py-1.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-95 text-white font-bold rounded-xl text-[10px] sm:text-xs transition-all duration-200 cursor-pointer shadow-xs"
                                  >
                                    Add
                                  </button>
                                ) : (
                                  <div className="flex items-center bg-[#2D4536] rounded-xl overflow-hidden shadow-xs">
                                    <button
                                      onClick={() => handleUpdateQuantity(prodId, -1)}
                                      className="w-6 h-6 flex items-center justify-center text-white hover:bg-[#1F3325] active:scale-90 transition-all cursor-pointer"
                                    >
                                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                      </svg>
                                    </button>
                                    <span className="w-5 text-center text-[10px] font-bold text-white tabular-nums">
                                      {inCartQty}
                                    </span>
                                    <button
                                      onClick={() => handleAddToCart(product)}
                                      className="w-6 h-6 flex items-center justify-center text-white hover:bg-[#1F3325] active:scale-90 transition-all cursor-pointer"
                                    >
                                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* TOYS SECTION */}
              {(selectedCategory === 'all' || selectedCategory === 'toys') && (
                (() => {
                  const toyProds = filteredProducts.filter(p => p.category === 'toys' || selectedCategory === 'toys');
                  if (toyProds.length === 0 && selectedCategory === 'toys') return null;
                  return (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex items-center justify-between w-full px-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base sm:text-xl font-bold text-[#1C1A17] tracking-tight">
                            Toys And Play Gear
                          </h3>
                          <span className="text-[10px] font-bold bg-[#EAE4D8] text-[#2D4536] px-2 py-0.5 rounded-full">
                            {toyProds.length} items
                          </span>
                        </div>
                        {selectedCategory === 'all' && (
                          <button
                            onClick={() => setSelectedCategory('toys')}
                            className="text-xs text-[#C85341] font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            View All <span className="text-xs">→</span>
                          </button>
                        )}
                      </div>

                      {/* Side-Scrollable Track */}
                      <div className="flex overflow-x-auto gap-3.5 w-full pb-3 pt-1 scrollbar-none no-scrollbar scrollbar-hide snap-x snap-mandatory px-0.5">
                        {toyProds.map((product) => {
                          const prodId = product._id || product.id || '';
                          const inCartQty = getCartQuantity(prodId);

                          return (
                            <div
                              key={prodId}
                              className="w-[200px] xs:w-[220px] md:w-[230px] shrink-0 bg-[#EFEAE2] border border-[#D5CEBF] rounded-[24px] p-3 flex flex-col gap-3 relative hover:shadow-md transition-all duration-300 group snap-start select-none"
                            >
                              {product.discountBadge && (
                                <div className="absolute top-3.5 left-3.5 bg-[#2D4536] text-white font-bold text-[9px] px-2 py-0.5 rounded-md select-none z-10">
                                  {product.discountBadge}
                                </div>
                              )}

                              <div className="aspect-square w-full rounded-2xl bg-[#F4EFE6] overflow-hidden relative select-none">
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => { e.currentTarget.src = '/real-pet-toy.png'; }}
                                />
                              </div>

                              <div className="flex flex-col flex-grow min-w-0 px-0.5">
                                <h3 className="font-serif text-sm font-bold text-[#1C1A17] leading-tight truncate">
                                  {product.title}
                                </h3>
                                <p className="text-[10.5px] text-stone-600 font-sans font-medium leading-normal mt-0.5 line-clamp-2">
                                  {product.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-auto px-0.5 pt-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs sm:text-sm font-extrabold text-[#1C1A17]">
                                    ₹{product.price}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-[10px] text-stone-500 line-through">
                                      ₹{product.originalPrice}
                                    </span>
                                  )}
                                </div>

                                {inCartQty === 0 ? (
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="px-3.5 py-1.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-95 text-white font-bold rounded-xl text-[10px] sm:text-xs transition-all duration-200 cursor-pointer shadow-xs"
                                  >
                                    Add
                                  </button>
                                ) : (
                                  <div className="flex items-center bg-[#2D4536] rounded-xl overflow-hidden shadow-xs">
                                    <button
                                      onClick={() => handleUpdateQuantity(prodId, -1)}
                                      className="w-6 h-6 flex items-center justify-center text-white hover:bg-[#1F3325] active:scale-90 transition-all cursor-pointer"
                                    >
                                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                      </svg>
                                    </button>
                                    <span className="w-5 text-center text-[10px] font-bold text-white tabular-nums">
                                      {inCartQty}
                                    </span>
                                    <button
                                      onClick={() => handleAddToCart(product)}
                                      className="w-6 h-6 flex items-center justify-center text-white hover:bg-[#1F3325] active:scale-90 transition-all cursor-pointer"
                                    >
                                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* MEDICAL SECTION */}
              {(selectedCategory === 'all' || selectedCategory === 'medical') && (
                (() => {
                  const medProds = filteredProducts.filter(p => p.category === 'medical' || selectedCategory === 'medical');
                  if (medProds.length === 0 && selectedCategory === 'medical') return null;
                  return (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex items-center justify-between w-full px-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base sm:text-xl font-bold text-[#1C1A17] tracking-tight">
                            Medical And Health Care
                          </h3>
                          <span className="text-[10px] font-bold bg-[#EAE4D8] text-[#2D4536] px-2 py-0.5 rounded-full">
                            {medProds.length} items
                          </span>
                        </div>
                        {selectedCategory === 'all' && (
                          <button
                            onClick={() => setSelectedCategory('medical')}
                            className="text-xs text-[#C85341] font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            View All <span className="text-xs">→</span>
                          </button>
                        )}
                      </div>

                      {/* Side-Scrollable Track */}
                      <div className="flex overflow-x-auto gap-3.5 w-full pb-3 pt-1 scrollbar-none no-scrollbar scrollbar-hide snap-x snap-mandatory px-0.5">
                        {medProds.map((product) => {
                          const prodId = product._id || product.id || '';
                          const inCartQty = getCartQuantity(prodId);

                          return (
                            <div
                              key={prodId}
                              className="w-[200px] xs:w-[220px] md:w-[230px] shrink-0 bg-[#EFEAE2] border border-[#D5CEBF] rounded-[24px] p-3 flex flex-col gap-3 relative hover:shadow-md transition-all duration-300 group snap-start select-none"
                            >
                              {product.discountBadge && (
                                <div className="absolute top-3.5 left-3.5 bg-[#2D4536] text-white font-bold text-[9px] px-2 py-0.5 rounded-md select-none z-10">
                                  {product.discountBadge}
                                </div>
                              )}

                              <div className="aspect-square w-full rounded-2xl bg-[#F4EFE6] overflow-hidden relative select-none">
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => { e.currentTarget.src = '/real-pet-med.png'; }}
                                />
                              </div>

                              <div className="flex flex-col flex-grow min-w-0 px-0.5">
                                <h3 className="font-serif text-sm font-bold text-[#1C1A17] leading-tight truncate">
                                  {product.title}
                                </h3>
                                <p className="text-[10.5px] text-stone-600 font-sans font-medium leading-normal mt-0.5 line-clamp-2">
                                  {product.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-auto px-0.5 pt-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs sm:text-sm font-extrabold text-[#1C1A17]">
                                    ₹{product.price}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-[10px] text-stone-500 line-through">
                                      ₹{product.originalPrice}
                                    </span>
                                  )}
                                </div>

                                {inCartQty === 0 ? (
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="px-3.5 py-1.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-95 text-white font-bold rounded-xl text-[10px] sm:text-xs transition-all duration-200 cursor-pointer shadow-xs"
                                  >
                                    Add
                                  </button>
                                ) : (
                                  <div className="flex items-center bg-[#2D4536] rounded-xl overflow-hidden shadow-xs">
                                    <button
                                      onClick={() => handleUpdateQuantity(prodId, -1)}
                                      className="w-6 h-6 flex items-center justify-center text-white hover:bg-[#1F3325] active:scale-90 transition-all cursor-pointer"
                                    >
                                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                      </svg>
                                    </button>
                                    <span className="w-5 text-center text-[10px] font-bold text-white tabular-nums">
                                      {inCartQty}
                                    </span>
                                    <button
                                      onClick={() => handleAddToCart(product)}
                                      className="w-6 h-6 flex items-center justify-center text-white hover:bg-[#1F3325] active:scale-90 transition-all cursor-pointer"
                                    >
                                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 select-none">
                  <p className="text-xs sm:text-sm text-stone-600 font-medium">No products match your search query.</p>
                </div>
              )}
            </>
          )}
        </section>

      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        checkoutCountryCode={checkoutCountryCode}
        checkoutPhone={checkoutPhone}
      />
    </>
  );
}
