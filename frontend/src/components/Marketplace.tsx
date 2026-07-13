'use client';

import { useState, useCallback, useEffect } from 'react';
import CartDrawer, { type CartItem } from './CartDrawer';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';

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
    fetch('http://localhost:5001/api/settings/checkout-phone')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setCheckoutCountryCode(data.countryCode || '');
          setCheckoutPhone(data.phoneNumber || '');
        }
      })
      .catch(err => console.error('Failed to load checkout settings:', err));
  }, [isCartOpen]); // Fetch or refresh settings when cart is opened

  // Fetch products from MongoDB
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products from MongoDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Check if current user is admin whitelisted
  useEffect(() => {
    if (token) {
      fetch('http://localhost:5001/api/auth/admin-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setIsAdmin(data.isAdmin);
        }
      })
      .catch(err => console.error('Failed to retrieve admin configuration:', err));
    } else {
      setIsAdmin(false);
    }
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

    // Visual feedback: briefly show "Added" on the button
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

  // Get quantity in cart for a product (for button label)
  const getCartQuantity = (productId: string | number) => {
    const item = cartItems.find(i => i.id === productId);
    return item ? item.quantity : 0;
  };

  // Filter products based on category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <main className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-4 md:p-8 flex flex-col gap-5 transition-all duration-300">
        
        {/* 1. HEADER: Title, Admin Panel Badge, and Shopping Cart Icon */}
        <header className="flex items-center justify-between w-full select-none px-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl md:text-4xl text-[#1C1A17] font-normal tracking-tight">Marketplace</h1>
            {/* Admin Panel button removed from here */}
          </div>
          
          {/* Shopping Cart Icon with item counter */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:opacity-85 transition-all cursor-pointer select-none group"
            aria-label={`Open cart with ${cartCount} items`}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#1C1A17" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform duration-200">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span 
                className="absolute -top-0.5 -right-0.5 bg-[#4A5D4E] text-[#FDFBF7] text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center select-none"
                style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-400 select-none">
              <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-[#4A5D4E] animate-spin" />
              <p className="text-[11px] font-semibold">Loading marketplace...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 w-full">
              {filteredProducts.map((product) => {
                const prodId = product._id || product.id || '';
                const inCartQty = getCartQuantity(prodId);

                return (
                  <div 
                    key={prodId}
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
                        onError={(e) => {
                          // Fallback to placeholder image if load fails
                          e.currentTarget.src = '/sw.js'; // fallback target placeholder
                        }}
                      />
                    </div>

                    {/* Product Title and Details */}
                    <div className="flex flex-col flex-grow min-w-0 px-0.5">
                      <h3 className="font-serif text-sm md:text-base font-normal text-[#1C1A17] leading-tight truncate">{product.title}</h3>
                      <p className="text-[10px] text-stone-400 font-medium leading-normal mt-0.5 line-clamp-2">{product.description}</p>
                    </div>

                    {/* Bottom Row: Prices and +/- Stepper */}
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
                      
                      {/* Quantity Stepper / Add Button */}
                      {inCartQty === 0 ? (
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="px-4 py-1.5 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-95 text-white font-bold rounded-xl text-[10px] md:text-xs transition-all duration-200 cursor-pointer shadow-sm"
                        >
                          Add
                        </button>
                      ) : (
                        <div 
                          className="flex items-center bg-[#2A3E31] rounded-xl overflow-hidden shadow-sm select-none"
                          style={{ animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        >
                          <button
                            onClick={() => handleUpdateQuantity(prodId, -1)}
                            className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#1E2E24] active:scale-90 transition-all cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          <span className="w-6 text-center text-[11px] font-bold text-white tabular-nums">
                            {inCartQty}
                          </span>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#1E2E24] active:scale-90 transition-all cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
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
          ) : (
            <div className="text-center py-12 select-none">
              <p className="text-xs md:text-sm text-stone-400 font-medium">No products match your search query.</p>
            </div>
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

