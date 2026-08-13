'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CartDrawer, { type CartItem } from './CartDrawer';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { API_BASE } from '../lib/api';

interface MarketplaceProps {
  onOpenAdmin?: () => void;
}

export default function Marketplace({ onOpenAdmin }: MarketplaceProps) {
  const { token } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'toys' | 'medical'>('all');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | number | null>(null);

  // Customer Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        setError('Failed to load marketplace products.');
      }
    } catch (err) {
      setError('Network error fetching products. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
                          (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <main className="w-full max-w-6xl mx-auto flex flex-col gap-5 transition-all duration-300 font-sans pb-24 px-1 sm:px-3">
        
        {/* 1. HEADER: Title & Cart Drawer Icon */}
        <header className="flex items-center justify-between gap-4 w-full select-none px-1 pt-1">
          <div className="flex flex-col gap-1 min-w-0 pr-2">
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight leading-none">
              Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-medium tracking-normal leading-relaxed max-w-lg">
              Ethical nutrition, veterinary care & essential pet supplies
            </p>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 sm:p-3 bg-[#EFEAE2] hover:bg-[#E6E0D6] border border-[#D5CEBF] rounded-2xl transition-all cursor-pointer select-none group shadow-xs shrink-0"
            aria-label={`Open cart with ${cartCount} items`}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-105 transition-transform duration-200">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-[#C85341] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center select-none shadow-xs"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </header>

        {/* 2. SEARCH BAR & CATEGORY FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full items-center">
          <div className="relative flex-grow w-full">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-stone-500 select-none">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search products, medicine, food, or toys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#EFEAE2] border border-[#D5CEBF] focus:border-[#2D4536] rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-xs sm:text-sm text-[#111827] placeholder-stone-500 outline-none transition-all font-sans font-medium shadow-2xs"
            />
          </div>

          {/* CATEGORY PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none w-full sm:w-auto shrink-0 py-0.5">
            {(['all', 'food', 'toys', 'medical'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-extrabold capitalize transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-[#2D4536] text-white shadow-xs'
                    : 'bg-[#EFEAE2] text-stone-700 hover:text-[#111827] border border-[#D5CEBF]'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. RESCUER DISCOUNT BANNER */}
        <div className="bg-[#EFEAE2] border border-[#D5CEBF] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between gap-3 select-none shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#D5CEBF] flex items-center justify-center text-[#2D4536] shrink-0">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="12" cy="11.5" r="2" fill="currentColor" />
              </svg>
            </div>
            <div className="flex-grow flex flex-col min-w-0">
              <h4 className="text-xs sm:text-sm font-extrabold font-heading text-[#111827] leading-tight">Verified Rescuer Subsidized Discount</h4>
              <p className="text-[10.5px] sm:text-xs text-stone-600 font-sans font-medium mt-0.5 leading-snug">Community feeders and animal rescuers receive special subsidized rates on all medical & feed items.</p>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2D4536] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
            %
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-2xl p-3.5 flex justify-between items-center text-xs font-bold my-1">
            <span>{error}</span>
            <button
              onClick={fetchProducts}
              className="px-3 py-1.5 bg-[#C0392B] text-white rounded-xl text-[11px] font-extrabold hover:bg-[#A93226] transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4. PRODUCT SECTIONS (FOOD, TOYS, MEDICAL) */}
        <section className="w-full mt-1 flex flex-col gap-7">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-[#EFEAE2] border border-[#D5CEBF] rounded-2xl p-3 flex flex-col gap-2.5 animate-pulse">
                  <div className="aspect-[4/3] w-full rounded-xl bg-stone-300/60" />
                  <div className="h-4 w-3/4 bg-stone-300/70 rounded" />
                  <div className="h-3.5 w-full bg-stone-300/50 rounded" />
                  <div className="h-9 w-full bg-stone-300/70 rounded-xl mt-1" />
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
                          <h3 className="font-heading text-base sm:text-xl font-extrabold text-[#111827] tracking-tight">
                            Food & Nutrition
                          </h3>
                          <span className="text-[10px] font-bold bg-[#EAE4D8] text-[#2D4536] px-2.5 py-0.5 rounded-full">
                            {foodProds.length} items
                          </span>
                        </div>
                        {selectedCategory === 'all' && (
                          <button
                            onClick={() => setSelectedCategory('food')}
                            className="text-xs text-[#2D4536] font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            View All <span className="text-xs">→</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 w-full">
                        {foodProds.map((product) => {
                          const prodId = product._id || product.id || '';
                          const inCartQty = getCartQuantity(prodId);

                          return (
                            <div
                              key={prodId}
                              onClick={() => setSelectedProduct(product)}
                              className="bg-[#EFEAE2] border border-[#D5CEBF] hover:border-[#2D4536]/50 rounded-2xl sm:rounded-[24px] p-2.5 sm:p-4 flex flex-col justify-between gap-2.5 sm:gap-3.5 hover:shadow-md transition-all duration-300 group cursor-pointer relative select-none"
                            >
                              {product.discountBadge && (
                                <div className="absolute top-4 left-4 bg-[#2D4536] text-white font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md sm:rounded-lg z-10 shadow-xs uppercase tracking-wider">
                                  {product.discountBadge}
                                </div>
                              )}

                              <div className="aspect-[4/3] w-full rounded-xl sm:rounded-2xl bg-[#F4EFE6] overflow-hidden relative border border-[#E0D8C8]/60 shrink-0">
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => { e.currentTarget.src = '/real-pet-food.png'; }}
                                />
                              </div>

                              <div className="flex flex-col gap-1 flex-grow min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#2D4536] bg-[#E8E2D6] px-2 py-0.5 rounded-full shrink-0">
                                    {product.category}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-xs sm:text-base font-bold text-[#111827]">
                                      ₹{product.price}
                                    </span>
                                    {product.originalPrice && (
                                      <span className="text-[10px] sm:text-xs text-stone-400 line-through font-medium">
                                        ₹{product.originalPrice}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <h3 className="text-xs sm:text-sm font-bold text-[#111827] leading-snug line-clamp-1 group-hover:text-[#2D4536] transition-colors">
                                  {product.title}
                                </h3>

                                <p className="text-[10px] sm:text-xs text-stone-600 font-medium leading-tight line-clamp-1">
                                  {product.subtitle || 'Formulated for companion health'}
                                </p>
                              </div>

                              <div className="pt-1.5 border-t border-[#D5CEBF]/60 mt-auto">
                                {inCartQty === 0 ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(product);
                                    }}
                                    className="w-full py-2 sm:py-2.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-[0.98] text-white font-extrabold text-[11px] sm:text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <circle cx="9" cy="21" r="1" />
                                      <circle cx="20" cy="21" r="1" />
                                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    Add to Cart
                                  </button>
                                ) : (
                                  <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-between bg-[#2D4536] rounded-xl px-2.5 py-1 shadow-xs"
                                  >
                                    <button
                                      onClick={() => handleUpdateQuantity(prodId, -1)}
                                      className="w-7 h-7 flex items-center justify-center text-white font-bold hover:bg-[#1F3325] rounded-lg transition-all cursor-pointer text-sm"
                                    >
                                      -
                                    </button>
                                    <span className="text-[11px] sm:text-xs font-extrabold text-white tabular-nums">
                                      {inCartQty} in Cart
                                    </span>
                                    <button
                                      onClick={() => handleAddToCart(product)}
                                      className="w-7 h-7 flex items-center justify-center text-white font-bold hover:bg-[#1F3325] rounded-lg transition-all cursor-pointer text-sm"
                                    >
                                      +
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
                          <h3 className="font-heading text-base sm:text-xl font-extrabold text-[#111827] tracking-tight">
                            Toys & Essentials
                          </h3>
                          <span className="text-[10px] font-bold bg-[#EAE4D8] text-[#2D4536] px-2.5 py-0.5 rounded-full">
                            {toyProds.length} items
                          </span>
                        </div>
                        {selectedCategory === 'all' && (
                          <button
                            onClick={() => setSelectedCategory('toys')}
                            className="text-xs text-[#2D4536] font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            View All <span className="text-xs">→</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 w-full">
                        {toyProds.map((product) => {
                          const prodId = product._id || product.id || '';
                          const inCartQty = getCartQuantity(prodId);

                          return (
                            <div
                              key={prodId}
                              onClick={() => setSelectedProduct(product)}
                              className="bg-[#EFEAE2] border border-[#D5CEBF] hover:border-[#2D4536]/50 rounded-2xl sm:rounded-[24px] p-2.5 sm:p-4 flex flex-col justify-between gap-2.5 sm:gap-3.5 hover:shadow-md transition-all duration-300 group cursor-pointer relative select-none"
                            >
                              {product.discountBadge && (
                                <div className="absolute top-4 left-4 bg-[#2D4536] text-white font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md sm:rounded-lg z-10 shadow-xs uppercase tracking-wider">
                                  {product.discountBadge}
                                </div>
                              )}

                              <div className="aspect-[4/3] w-full rounded-xl sm:rounded-2xl bg-[#F4EFE6] overflow-hidden relative border border-[#E0D8C8]/60 shrink-0">
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => { e.currentTarget.src = '/real-pet-toy.png'; }}
                                />
                              </div>

                              <div className="flex flex-col gap-1 flex-grow min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#2D4536] bg-[#E8E2D6] px-2 py-0.5 rounded-full shrink-0">
                                    {product.category}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-xs sm:text-base font-bold text-[#111827]">
                                      ₹{product.price}
                                    </span>
                                    {product.originalPrice && (
                                      <span className="text-[10px] sm:text-xs text-stone-400 line-through font-medium">
                                        ₹{product.originalPrice}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <h3 className="text-xs sm:text-sm font-bold text-[#111827] leading-snug line-clamp-1 group-hover:text-[#2D4536] transition-colors">
                                  {product.title}
                                </h3>

                                <p className="text-[10px] sm:text-xs text-stone-600 font-medium leading-tight line-clamp-1">
                                  {product.subtitle || 'Durable & safe play material'}
                                </p>
                              </div>

                              <div className="pt-1.5 border-t border-[#D5CEBF]/60 mt-auto">
                                {inCartQty === 0 ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(product);
                                    }}
                                    className="w-full py-2 sm:py-2.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-[0.98] text-white font-extrabold text-[11px] sm:text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <circle cx="9" cy="21" r="1" />
                                      <circle cx="20" cy="21" r="1" />
                                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    Add to Cart
                                  </button>
                                ) : (
                                  <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-between bg-[#2D4536] rounded-xl px-2.5 py-1 shadow-xs"
                                  >
                                    <button
                                      onClick={() => handleUpdateQuantity(prodId, -1)}
                                      className="w-7 h-7 flex items-center justify-center text-white font-bold hover:bg-[#1F3325] rounded-lg transition-all cursor-pointer text-sm"
                                    >
                                      -
                                    </button>
                                    <span className="text-[11px] sm:text-xs font-extrabold text-white tabular-nums">
                                      {inCartQty} in Cart
                                    </span>
                                    <button
                                      onClick={() => handleAddToCart(product)}
                                      className="w-7 h-7 flex items-center justify-center text-white font-bold hover:bg-[#1F3325] rounded-lg transition-all cursor-pointer text-sm"
                                    >
                                      +
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
                          <h3 className="font-heading text-base sm:text-xl font-extrabold text-[#111827] tracking-tight">
                            Medical & Health Care
                          </h3>
                          <span className="text-[10px] font-bold bg-[#EAE4D8] text-[#2D4536] px-2.5 py-0.5 rounded-full">
                            {medProds.length} items
                          </span>
                        </div>
                        {selectedCategory === 'all' && (
                          <button
                            onClick={() => setSelectedCategory('medical')}
                            className="text-xs text-[#2D4536] font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            View All <span className="text-xs">→</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 w-full">
                        {medProds.map((product) => {
                          const prodId = product._id || product.id || '';
                          const inCartQty = getCartQuantity(prodId);

                          return (
                            <div
                              key={prodId}
                              onClick={() => setSelectedProduct(product)}
                              className="bg-[#EFEAE2] border border-[#D5CEBF] hover:border-[#2D4536]/50 rounded-2xl sm:rounded-[24px] p-2.5 sm:p-4 flex flex-col justify-between gap-2.5 sm:gap-3.5 hover:shadow-md transition-all duration-300 group cursor-pointer relative select-none"
                            >
                              {product.discountBadge && (
                                <div className="absolute top-4 left-4 bg-[#2D4536] text-white font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md sm:rounded-lg z-10 shadow-xs uppercase tracking-wider">
                                  {product.discountBadge}
                                </div>
                              )}

                              <div className="aspect-[4/3] w-full rounded-xl sm:rounded-2xl bg-[#F4EFE6] overflow-hidden relative border border-[#E0D8C8]/60 shrink-0">
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => { e.currentTarget.src = '/real-pet-med.png'; }}
                                />
                              </div>

                              <div className="flex flex-col gap-1 flex-grow min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#2D4536] bg-[#E8E2D6] px-2 py-0.5 rounded-full shrink-0">
                                    {product.category}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-xs sm:text-base font-bold text-[#111827]">
                                      ₹{product.price}
                                    </span>
                                    {product.originalPrice && (
                                      <span className="text-[10px] sm:text-xs text-stone-400 line-through font-medium">
                                        ₹{product.originalPrice}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <h3 className="text-xs sm:text-sm font-bold text-[#111827] leading-snug line-clamp-1 group-hover:text-[#2D4536] transition-colors">
                                  {product.title}
                                </h3>

                                <p className="text-[10px] sm:text-xs text-stone-600 font-medium leading-tight line-clamp-1">
                                  {product.subtitle || 'Veterinary care & first aid'}
                                </p>
                              </div>

                              <div className="pt-1.5 border-t border-[#D5CEBF]/60 mt-auto">
                                {inCartQty === 0 ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(product);
                                    }}
                                    className="w-full py-2 sm:py-2.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-[0.98] text-white font-extrabold text-[11px] sm:text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <circle cx="9" cy="21" r="1" />
                                      <circle cx="20" cy="21" r="1" />
                                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                    Add to Cart
                                  </button>
                                ) : (
                                  <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-between bg-[#2D4536] rounded-xl px-2.5 py-1 shadow-xs"
                                  >
                                    <button
                                      onClick={() => handleUpdateQuantity(prodId, -1)}
                                      className="w-7 h-7 flex items-center justify-center text-white font-bold hover:bg-[#1F3325] rounded-lg transition-all cursor-pointer text-sm"
                                    >
                                      -
                                    </button>
                                    <span className="text-[11px] sm:text-xs font-extrabold text-white tabular-nums">
                                      {inCartQty} in Cart
                                    </span>
                                    <button
                                      onClick={() => handleAddToCart(product)}
                                      className="w-7 h-7 flex items-center justify-center text-white font-bold hover:bg-[#1F3325] rounded-lg transition-all cursor-pointer text-sm"
                                    >
                                      +
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
                <div className="text-center py-16 bg-[#EFEAE2] border border-[#D5CEBF] rounded-[28px] select-none">
                  <p className="text-xs sm:text-sm text-stone-600 font-semibold">No products found matching &ldquo;{searchQuery}&rdquo;.</p>
                </div>
              )}
            </>
          )}
        </section>

      </main>

      {/* CUSTOMER PRODUCT DETAILS MODAL (PetCareServices Formatted View) */}
      {isMounted && selectedProduct && createPortal(
        <div 
          onClick={() => setSelectedProduct(null)}
          className="fixed inset-0 bg-black/75 z-[100000] backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto scrollbar-hide animate-fadeIn select-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] border border-[#D5CEBF] rounded-[32px] max-w-lg w-full p-5 sm:p-7 shadow-2xl relative max-h-[85vh] sm:max-h-[88vh] overflow-y-auto scrollbar-hide flex flex-col gap-5 font-sans my-auto"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between w-full border-b border-[#EAE4D8] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase bg-[#2D4536] text-white px-3 py-1 rounded-full tracking-wider">
                  {selectedProduct.category}
                </span>
                {selectedProduct.discountBadge && (
                  <span className="text-xs font-bold bg-[#C85341] text-white px-2.5 py-1 rounded-full">
                    {selectedProduct.discountBadge}
                  </span>
                )}
              </div>
              
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-9 h-9 rounded-full bg-[#EFEAE2] border border-[#D5CEBF] hover:bg-[#E6E0D6] flex items-center justify-center text-[#111827] font-bold text-lg cursor-pointer transition-all"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Product Image */}
            <div className="w-full aspect-[4/3] max-h-[240px] rounded-2xl bg-[#EFEAE2] overflow-hidden relative border border-[#D5CEBF] shrink-0">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const fallback = selectedProduct.category === 'food' ? '/real-pet-food.png' : selectedProduct.category === 'toys' ? '/real-pet-toy.png' : '/real-pet-med.png';
                  e.currentTarget.src = fallback;
                }}
              />
            </div>

            {/* Title, Subheading & Pricing */}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#111827] leading-snug">
                {selectedProduct.title}
              </h2>
              {selectedProduct.subtitle && (
                <p className="text-xs sm:text-sm text-stone-600 font-medium">
                  {selectedProduct.subtitle}
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
                  ₹{selectedProduct.price}
                </span>
                {selectedProduct.originalPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-400 line-through font-bold">
                      ₹{selectedProduct.originalPrice}
                    </span>
                    <span className="text-xs font-bold text-[#2D4536] bg-[#EAE4D8] px-2.5 py-1 rounded-md">
                      Save ₹{selectedProduct.originalPrice - selectedProduct.price}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Formatted Description Section */}
            <div className="flex flex-col gap-2.5 bg-[#EFEAE2] border border-[#D5CEBF] p-4 sm:p-5 rounded-2xl shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D4536]">
                About Product
              </h4>
              <p className="text-xs sm:text-sm text-stone-800 font-normal leading-relaxed">
                {selectedProduct.description || 'Formulated with high quality ingredients, vitamins, and care standards for rescue and household animals.'}
              </p>
            </div>

            {/* Formatted Key Features Checklist (Like PetCareServices) */}
            <div className="flex flex-col gap-3 bg-[#FFFDFB] border border-[#D5CEBF] p-4 sm:p-5 rounded-2xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D4536]">
                Key Highlights & Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(selectedProduct.features && selectedProduct.features.length > 0
                  ? selectedProduct.features
                  : [
                      'High bioavailable protein & essential nutrients',
                      'Formulated according to veterinary care standards',
                      '100% natural formula without synthetic fillers',
                      'Safe & recommended for rescue & companion pets'
                    ]
                ).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-stone-700 font-medium">
                    <div className="w-4 h-4 rounded-full bg-[#2D4536]/15 text-[#2D4536] flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                      ✓
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="sticky bottom-0 bg-[#FAF8F5] pt-3 pb-1 border-t border-[#EAE4D8] mt-auto z-20">
              {getCartQuantity(selectedProduct._id || selectedProduct.id || '') > 0 ? (
                <div className="flex items-center justify-between w-full bg-[#2D4536] rounded-2xl px-4 py-2.5 shadow-xs">
                  <button
                    onClick={() => handleUpdateQuantity(selectedProduct._id || selectedProduct.id || '', -1)}
                    className="w-9 h-9 flex items-center justify-center text-white font-bold hover:bg-[#1F3325] rounded-xl transition-all cursor-pointer text-lg"
                  >
                    -
                  </button>
                  <span className="text-sm font-extrabold text-white">
                    {getCartQuantity(selectedProduct._id || selectedProduct.id || '')} in Cart
                  </span>
                  <button
                    onClick={() => handleAddToCart(selectedProduct)}
                    className="w-9 h-9 flex items-center justify-center text-white font-bold hover:bg-[#1F3325] rounded-xl transition-all cursor-pointer text-lg"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="w-full py-3.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  Add to Cart
                </button>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

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
