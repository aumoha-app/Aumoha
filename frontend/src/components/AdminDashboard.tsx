'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product, SosReport } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { token } = useAuth();
  
  // Security locks
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<'food' | 'toys' | 'medical'>('food');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formDiscountBadge, setFormDiscountBadge] = useState('');
  const [formImage, setFormImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // TAB NAVIGATION & SOS STATES
  const [currentTab, setCurrentTab] = useState<'products' | 'sos'>('products');
  const [sosReports, setSosReports] = useState<SosReport[]>([]);
  const [isSosLoading, setIsSosLoading] = useState(false);

  // Load from sessionStorage if already validated in this tab session
  useEffect(() => {
    const cachedPass = sessionStorage.getItem('aumoha_admin_password');
    if (cachedPass) {
      verifyPasswordDirectly(cachedPass);
    }
  }, []);

  const verifyPasswordDirectly = async (password: string) => {
    setIsVerifying(true);
    setAuthError(null);
    try {
      const res = await fetch('http://localhost:5001/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setAdminPassword(password);
        sessionStorage.setItem('aumoha_admin_password', password);
        fetchProducts(password);
        fetchSosReports(true);
      } else {
        setAuthError(data.message || 'Incorrect admin password.');
        sessionStorage.removeItem('aumoha_admin_password');
      }
    } catch (err) {
      setAuthError('Connection error. Unable to verify admin password.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;
    verifyPasswordDirectly(adminPassword);
  };

  const fetchProducts = async (password: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('http://localhost:5001/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        setErrorMessage('Failed to load products.');
      }
    } catch (err) {
      setErrorMessage('Network error fetching products.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSosReports = async (showLoading = false) => {
    if (showLoading) setIsSosLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/sos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSosReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching SOS reports:', err);
    } finally {
      if (showLoading) setIsSosLoading(false);
    }
  };

  const handleUpdateSosStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/sos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchSosReports(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Error updating SOS status:', err);
    }
  };

  const handleDeleteSos = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SOS report?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/sos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        }
      });
      if (res.ok) {
        fetchSosReports(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete SOS report.');
      }
    } catch (err) {
      console.error('Error deleting SOS report:', err);
    }
  };

  // Polling hook for ASAP updates
  useEffect(() => {
    if (isAuthenticated) {
      fetchSosReports(true);
      const interval = setInterval(() => {
        fetchSosReports(false);
      }, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormCategory('food');
    setFormTitle('');
    setFormDescription('');
    setFormPrice('');
    setFormOriginalPrice('');
    setFormDiscountBadge('');
    setFormImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // Larger than profile pic for product detail clarity
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          callback(dataUrl);
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setFormImage(base64);
      });
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription || !formPrice || !formImage) {
      alert('Please fill out all required fields (Title, Description, Price, Image)');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      category: formCategory,
      title: formTitle,
      description: formDescription,
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : null,
      discountBadge: formDiscountBadge || '',
      image: formImage
    };

    const url = isEditing
      ? `http://localhost:5001/api/products/${editId}`
      : 'http://localhost:5001/api/products';
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        resetForm();
        fetchProducts(adminPassword);
      } else {
        setErrorMessage(data.message || 'Failed to save product.');
      }
    } catch (err) {
      setErrorMessage('Network error saving product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setIsEditing(true);
    setEditId(product._id || null);
    setFormCategory(product.category);
    setFormTitle(product.title);
    setFormDescription(product.description);
    setFormPrice(product.price.toString());
    setFormOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
    setFormDiscountBadge(product.discountBadge || '');
    setFormImage(product.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setErrorMessage(null);
    try {
      const res = await fetch(`http://localhost:5001/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        }
      });
      const data = await res.json();
      if (res.ok) {
        fetchProducts(adminPassword);
      } else {
        setErrorMessage(data.message || 'Failed to delete product.');
      }
    } catch (err) {
      setErrorMessage('Network error deleting product.');
    }
  };

  // Auth lock screen
  if (!isAuthenticated) {
    return (
      <main className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-10 flex flex-col gap-6 shadow-sm select-none transition-all duration-300">
        <header className="flex items-center justify-between w-full border-b border-[#EBE3D5] pb-4">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl text-[#1C1A17] font-normal tracking-tight">Admin Authentication</h1>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#EBE3D5] bg-white text-stone-500 hover:bg-stone-55 hover:text-charcoal font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Exit
          </button>
        </header>

        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 max-w-sm mx-auto w-full py-8">
          <p className="text-xs text-stone-500 text-center leading-normal mb-2">
            Enter the admin double-lock password to manage marketplace products.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Admin Password</label>
            <input
              type="password"
              placeholder="Enter password..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-[#F5F3EF] rounded-xl py-3 px-4 text-sm text-[#1C1A17] outline-none focus:ring-1 focus:ring-[#4A5D4E] transition-all"
              required
            />
          </div>

          {authError && (
            <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-2.5 text-xs font-semibold">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="mt-2 py-3 bg-[#4A5D4E] hover:bg-[#3A4D3E] text-[#FDFBF7] font-bold text-xs rounded-xl shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Unlock'
            )}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-4 md:p-8 flex flex-col gap-6 shadow-sm transition-all duration-300">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full select-none border-b border-[#EBE3D5] pb-5">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1C1A17] font-normal tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-stone-400 font-medium mt-1">Manage and publish items to the Aumoha Marketplace</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              sessionStorage.removeItem('aumoha_admin_password');
              setIsAuthenticated(false);
              setAdminPassword('');
              onClose();
            }}
            className="px-4 py-2 bg-[#4A5D4E] hover:bg-[#3A4D3E] text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            Exit Dashboard
          </button>
        </div>
      </header>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-[#EBE3D5] mb-2 select-none">
        <button
          onClick={() => setCurrentTab('products')}
          className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            currentTab === 'products'
              ? 'border-[#4A5D4E] text-[#4A5D4E]'
              : 'border-transparent text-stone-400 hover:text-[#4A5D4E]'
          }`}
        >
          Manage Products
        </button>
        <button
          onClick={() => setCurrentTab('sos')}
          className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            currentTab === 'sos'
              ? 'border-[#9B1C1C] text-[#9B1C1C]'
              : 'border-transparent text-stone-400 hover:text-[#9B1C1C]'
          }`}
        >
          <span>Emergency SOS Alerts</span>
          {sosReports.filter(r => r.status === 'active').length > 0 && (
            <span className="bg-[#9B1C1C] text-white text-[8px] px-1.5 py-0.5 rounded-full font-extrabold animate-pulse">
              {sosReports.filter(r => r.status === 'active').length}
            </span>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-3 text-xs leading-relaxed font-semibold">
          {errorMessage}
        </div>
      )}

      {currentTab === 'products' && (
        <>
          {/* ADD/EDIT FORM */}
      <section className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-5 md:p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between border-b border-[#EBE3D5]/80 pb-2.5">
          <h2 className="font-serif text-lg text-[#1C1A17] font-normal">
            {isEditing ? 'Edit Marketplace Product' : 'Add New Product'}
          </h2>
          {isEditing && (
            <span className="text-[9px] font-extrabold bg-[#D95D39]/10 text-[#D95D39] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Editing Mode
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label htmlFor="title" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Product Title *</label>
              <input
                type="text"
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Eco Rope Ball"
                className="w-full bg-white rounded-xl py-2.5 px-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E] outline-none transition-all shadow-sm"
                required
              />
            </div>

            {/* Category Custom Pills */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Category *</span>
              <div className="grid grid-cols-3 gap-2">
                {(['food', 'toys', 'medical'] as const).map((cat) => {
                  const isActive = formCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-terracottaGlow text-terracotta border-terracotta/30 scale-[1.01]'
                          : 'bg-white hover:bg-stone-50 border-[#EBE3D5] text-stone-500 hover:text-charcoal'
                      }`}
                    >
                      <span className="capitalize text-[10px] md:text-xs">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Price */}
            <div className="flex flex-col gap-1">
              <label htmlFor="price" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sale Price *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-stone-400 text-xs select-none pointer-events-none font-bold">₹</span>
                <input
                  type="number"
                  id="price"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="349"
                  className="w-full bg-white rounded-xl py-2.5 pl-8 pr-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E] outline-none transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Original Price */}
            <div className="flex flex-col gap-1">
              <label htmlFor="originalPrice" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Original Price (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-stone-400 text-xs select-none pointer-events-none font-bold">₹</span>
                <input
                  type="number"
                  id="originalPrice"
                  value={formOriginalPrice}
                  onChange={(e) => setFormOriginalPrice(e.target.value)}
                  placeholder="499"
                  className="w-full bg-white rounded-xl py-2.5 pl-8 pr-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E] outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Discount Badge */}
            <div className="flex flex-col gap-1">
              <label htmlFor="discountBadge" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Discount Badge (Optional)</label>
              <input
                type="text"
                id="discountBadge"
                value={formDiscountBadge}
                onChange={(e) => setFormDiscountBadge(e.target.value)}
                placeholder="e.g. 10% OFF"
                className="w-full bg-white rounded-xl py-2.5 px-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E] outline-none transition-all shadow-sm"
              />
            </div>

            {/* Product Image drag-n-drop file selector box */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Product Image *</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 bg-white ${
                  formImage 
                    ? 'border-terracotta bg-terracottaGlow' 
                    : 'border-[#EBE3D5] hover:border-[#4A5D4E] hover:bg-stone-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                {formImage ? (
                  <div className="flex items-center gap-3.5 w-full select-none">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#EBE3D5] bg-[#FAF6F0] shrink-0 shadow-sm">
                      <img src={formImage} alt="Uploaded" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[10px] font-extrabold text-terracotta leading-none truncate">Image Loaded</p>
                      <p className="text-[8px] text-stone-400 mt-1">Click to replace photo</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormImage('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="w-5 h-5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-0.5 text-stone-400 hover:text-[#4A5D4E] transition-colors">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide">Upload Image</span>
                    <span className="text-[8px] mt-0.5 text-stone-400">Click to browse local files</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Description *</label>
            <textarea
              id="description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Enter product features, ingredients, sizes..."
              rows={2}
              className="w-full bg-white rounded-xl py-2.5 px-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E] outline-none transition-all resize-none leading-relaxed shadow-sm"
              required
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex justify-end gap-2.5 mt-2">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-all cursor-pointer shadow-sm"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#4A5D4E] hover:bg-[#3A4D3E] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {isEditing ? 'Update Product' : 'Add Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* PRODUCTS LIST */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg text-[#1C1A17] font-normal border-b border-[#EBE3D5] pb-2">
          Current Products ({products.length})
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-stone-400 select-none">
            <div className="w-7 h-7 rounded-full border-2 border-stone-200 border-t-[#4A5D4E] animate-spin" />
            <p className="text-[10px] font-semibold">Loading current inventory...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white border border-[#F0EBE1] rounded-2xl p-3.5 flex gap-4 hover:shadow-sm transition-all duration-200 group"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-[#FAF6F0] overflow-hidden shrink-0 border border-stone-100 select-none">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/sw.js';
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col flex-grow min-w-0 justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-extrabold text-[#4A5D4E] bg-[#D4DDD6] px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {product.category}
                      </span>
                      <h4 className="font-serif text-sm md:text-base text-[#1C1A17] font-normal leading-tight mt-1 truncate">
                        {product.title}
                      </h4>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
                        title="Edit product"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => product._id && handleDeleteClick(product._id)}
                        className="p-1.5 rounded-lg border border-red-100 bg-white hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs mt-1.5">
                    <span className="font-extrabold text-[#1C1A17]">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-[10px] text-stone-400 line-through">₹{product.originalPrice}</span>
                    )}
                    {product.discountBadge && (
                      <span className="text-[9px] font-bold text-stone-400 ml-1">({product.discountBadge})</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-[#EBE3D5] rounded-[20px] select-none">
            <p className="text-xs text-stone-400 font-medium">No products in inventory. Use the form above to add one!</p>
          </div>
        )}
      </section>
        </>
      )}

      {currentTab === 'sos' && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-[#1C1A17] font-normal">SOS Reports</h2>
          </div>

          {isSosLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-400 select-none">
              <div className="w-7 h-7 rounded-full border-2 border-stone-200 border-t-[#9B1C1C] animate-spin" />
              <p className="text-[10px] font-semibold">Checking rescue logs...</p>
            </div>
          ) : sosReports.length > 0 ? (
            <div className="flex flex-col gap-3">
              {sosReports.map((report) => {
                let severityColor = 'bg-[#FAF8F5]/30 border-stone-200 text-stone-600';
                if (report.severity === 'critical') severityColor = 'bg-[#FDF2F2] border-[#F8B4B4] text-[#C0392B]';
                if (report.severity === 'urgent') severityColor = 'bg-[#FFF8F1] border-[#FFE4E6] text-amber-700';
                if (report.severity === 'stable') severityColor = 'bg-[#F0FDF4] border-[#BBF7D0] text-emerald-700';

                let statusBadgeColor = 'bg-stone-100 text-stone-500';
                if (report.status === 'active') statusBadgeColor = 'bg-red-100 text-red-600 border border-red-200';
                if (report.status === 'dispatched') statusBadgeColor = 'bg-amber-100 text-amber-700 border border-amber-200';
                if (report.status === 'resolved') statusBadgeColor = 'bg-emerald-100 text-emerald-700 border border-emerald-200';

                return (
                  <div
                    key={report._id}
                    className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-200 relative group overflow-hidden"
                  >
                    {/* Status Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${severityColor} border`}>
                          {report.severity}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusBadgeColor}`}>
                          {report.status}
                        </span>
                      </div>
                      <span className="text-[9px] text-stone-400 font-semibold">
                        {report.createdAt ? new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                      </span>
                    </div>

                    {/* Report Content */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🚨</span>
                        <h4 className="font-serif text-base text-[#1C1A17] font-semibold">
                          {report.category} Alert
                        </h4>
                      </div>
                      <p className="text-xs text-[#1C1A17] leading-relaxed pl-7">
                        &ldquo;{report.reason}&rdquo;
                      </p>
                    </div>

                    {/* Location & User Info */}
                    <div className="bg-white border border-[#EBE3D5] rounded-xl p-3 flex flex-col gap-2 pl-7 text-[11px] text-stone-600">
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-400">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span><strong>Location:</strong> {report.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-400">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        </svg>
                        <span><strong>Reporter:</strong> {report.userEmail}</span>
                      </div>
                      {report.userPhone && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#4A5D4E]">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span><strong>Phone:</strong> {report.userPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Media Attachments */}
                    {(report.photo || report.audio) && (
                      <div className="flex flex-col gap-3 mt-1.5 pt-1.5 border-t border-[#F0EBE1] pl-7">
                        {report.photo && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Report Photo Attachment</span>
                            <a href={report.photo} target="_blank" rel="noopener noreferrer" className="block max-w-sm rounded-xl overflow-hidden border border-stone-200 shadow-sm cursor-zoom-in">
                              <img src={report.photo} alt="Distress alert photo attachment" className="w-full max-h-48 object-cover hover:scale-102 transition-transform duration-200" />
                            </a>
                          </div>
                        )}
                        {report.audio && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Report Voice Note</span>
                            <audio src={report.audio} controls className="w-full max-w-sm h-8 rounded-lg scale-90 origin-left" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Controls Row */}
                    <div className="flex items-center justify-between border-t border-[#EBE3D5]/80 pt-3 mt-1 flex-wrap gap-2.5">
                      {/* Status select switcher */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Update Status:</span>
                        <div className="flex gap-1">
                          {(['active', 'dispatched', 'resolved'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => report._id && handleUpdateSosStatus(report._id, st)}
                              className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider cursor-pointer border transition-colors ${
                                report.status === st
                                  ? 'bg-[#4A5D4E] text-white border-transparent'
                                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-500'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Call Button & Delete */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        {report.userPhone && (
                          <a
                            href={`tel:${report.userPhone}`}
                            className="px-3.5 py-1.5 bg-[#4A5D4E] hover:bg-[#3A4D3E] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            Call Reporter
                          </a>
                        )}
                        <button
                          onClick={() => report._id && handleDeleteSos(report._id)}
                          className="p-1.5 rounded-lg border border-red-100 bg-white hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                          title="Delete report"
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[#EBE3D5] rounded-[24px] select-none bg-[#FCFAF7]">
              <p className="text-xs text-stone-400 font-semibold">No emergency alerts registered in database logs.</p>
            </div>
          )}
        </section>
      )}

    </main>
  );
}
