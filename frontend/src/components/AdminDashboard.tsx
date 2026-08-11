'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Product, SosReport } from '../types';
import { API_BASE } from '../lib/api';

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

  // Custom Confirmation Dialog States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  } | null>(null);

  const openConfirmation = (config: any) => {
    setConfirmConfig(config);
    setIsConfirmOpen(true);
  };

  const closeConfirmation = () => {
    setIsConfirmOpen(false);
    setConfirmConfig(null);
  };

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
  const [currentTab, setCurrentTab] = useState<'products' | 'sos' | 'settings' | 'community' | 'calls' | 'vets' | 'users'>('sos');
  const [sosReports, setSosReports] = useState<SosReport[]>([]);
  const [isSosLoading, setIsSosLoading] = useState(false);

  // User Role Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [roleAssignEmail, setRoleAssignEmail] = useState('');
  const [roleAssignRole, setRoleAssignRole] = useState('doctor');
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    }
  };

  const handleAssignRole = async (targetEmail?: string, targetRole?: string) => {
    const emailToUse = targetEmail || roleAssignEmail;
    const roleToUse = targetRole || roleAssignRole;
    if (!emailToUse.trim()) return;

    setIsAssigningRole(true);
    setRoleMsg(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify({ email: emailToUse, role: roleToUse })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setRoleMsg({ type: 'success', text: data.message });
        setRoleAssignEmail('');
        fetchAdminUsers();
      } else {
        setRoleMsg({ type: 'error', text: data.message || 'Failed to assign role.' });
      }
    } catch {
      setRoleMsg({ type: 'error', text: 'Network error assigning user role.' });
    } finally {
      setIsAssigningRole(false);
    }
  };

  // Call Sessions States
  const [callSessions, setCallSessions] = useState<any[]>([]);

  const fetchCallSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/calls`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCallSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Error fetching call sessions:', err);
    }
  };

  const handleConnectCall = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/calls/${sessionId}/connect`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        }
      });
      if (res.ok) {
        fetchCallSessions();
      }
    } catch (err) {
      console.error('Error connecting call:', err);
    }
  };

  const handleForceEndCall = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/calls/${sessionId}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        }
      });
      if (res.ok) {
        fetchCallSessions();
      }
    } catch (err) {
      console.error('Error ending call:', err);
    }
  };

  // Community Activities States
  const [activities, setActivities] = useState<any[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [editActivityId, setEditActivityId] = useState<string | null>(null);
  const [actFormCategory, setActFormCategory] = useState<'feeding' | 'help' | 'event' | 'awareness'>('event');
  const [actFormTitle, setActFormTitle] = useState('');
  const [actFormDescription, setActFormDescription] = useState('');
  const [actFormLocation, setActFormLocation] = useState('');
  const [actFormImage, setActFormImage] = useState('');
  const [actFormScheduledTime, setActFormScheduledTime] = useState('');
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const actFileInputRef = useRef<HTMLInputElement>(null);

  // Settings States
  const [checkoutCountryCode, setCheckoutCountryCode] = useState('+91');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<boolean>(false);

  // Vets & Experts management state
  const [vets, setVets] = useState<any[]>([]);
  const [isVetsLoading, setIsVetsLoading] = useState(false);
  const [editingVetId, setEditingVetId] = useState<string | null>(null);
  const [editVetFee, setEditVetFee] = useState('');
  const [editVetName, setEditVetName] = useState('');
  const [editVetIsOnline, setEditVetIsOnline] = useState(false);
  const [isSavingVet, setIsSavingVet] = useState(false);
  const [vetsError, setVetsError] = useState<string | null>(null);

  const fetchVets = async () => {
    setIsVetsLoading(true);
    setVetsError(null);
    try {
      const res = await fetch(`${API_BASE}/vets`);
      if (res.ok) {
        const data = await res.json();
        setVets(data.vets || []);
      } else {
        setVetsError('Failed to load vets/experts.');
      }
    } catch {
      setVetsError('Network error loading vets/experts.');
    } finally {
      setIsVetsLoading(false);
    }
  };

  const startEditVet = (vet: any) => {
    setEditingVetId(vet._id);
    setEditVetFee(String(vet.fee));
    setEditVetName(vet.name);
    setEditVetIsOnline(!!vet.isOnline);
  };

  const cancelEditVet = () => {
    setEditingVetId(null);
    setEditVetFee('');
    setEditVetName('');
    setVetsError(null);
  };

  const handleSaveVet = async (vetId: string) => {
    const feeNum = Number(editVetFee);
    if (!editVetName.trim()) { setVetsError('Name cannot be empty.'); return; }
    if (isNaN(feeNum) || feeNum < 1) { setVetsError('Fee must be a positive number (₹).'); return; }
    setIsSavingVet(true);
    setVetsError(null);
    try {
      const res = await fetch(`${API_BASE}/vets/${vetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify({ name: editVetName, fee: feeNum, isOnline: editVetIsOnline })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setVets(prev => prev.map(v => v._id === vetId ? { ...v, name: editVetName, fee: feeNum, isOnline: editVetIsOnline } : v));
        cancelEditVet();
      } else {
        setVetsError(data.message || 'Failed to save changes.');
      }
    } catch {
      setVetsError('Network error saving vet.');
    } finally {
      setIsSavingVet(false);
    }
  };

  const [pendingVets, setPendingVets] = useState<any[]>([]);

  const fetchPendingVets = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/vets/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingVets(data.pendingVets || []);
      }
    } catch (err) {
      console.error('Error fetching pending vets:', err);
    }
  };

  const handleApproveVet = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/admin/vets/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify({ isApproved })
      });
      if (res.ok) {
        fetchPendingVets();
        fetchVets();
      }
    } catch (err) {
      console.error('Error approving vet:', err);
    }
  };

  const fetchProducts = async (password: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/products`);
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
      const res = await fetch(`${API_BASE}/sos`, {
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

  const verifyPasswordDirectly = async (password: string) => {
    setIsVerifying(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-admin`, {
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

  // Load from sessionStorage if already validated in this tab session
  useEffect(() => {
    const cachedPass = sessionStorage.getItem('aumoha_admin_password');
    if (cachedPass) {
      verifyPasswordDirectly(cachedPass);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCallSessions();
      const interval = setInterval(() => {
        fetchCallSessions();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, adminPassword, token]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;
    verifyPasswordDirectly(adminPassword);
  };

  const handleUpdateSosStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/sos/${id}`, {
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
        setErrorMessage(data.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Error updating SOS status:', err);
    }
  };

  const handleDeleteSos = (id: string) => {
    openConfirmation({
      title: 'Delete SOS Report?',
      message: 'Are you sure you want to delete this SOS report from the system? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/sos/${id}`, {
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
            openConfirmation({
              title: 'Error',
              message: data.message || 'Failed to delete SOS report.',
              confirmText: 'OK',
              onConfirm: () => {}
            });
          }
        } catch (err) {
          console.error('Error deleting SOS report:', err);
          openConfirmation({
            title: 'Error',
            message: 'Network error. Unable to delete SOS report.',
            confirmText: 'OK',
            onConfirm: () => {}
          });
        }
      }
    });
  };

  const fetchCheckoutSettings = async () => {
    setIsSettingsLoading(true);
    setSettingsError(null);
    try {
      const res = await fetch(`${API_BASE}/settings/checkout-phone`);
      if (res.ok) {
        const data = await res.json();
        setCheckoutCountryCode(data.countryCode || '+91');
        setCheckoutPhone(data.phoneNumber || '');
      } else {
        setSettingsError('Failed to load settings.');
      }
    } catch (err) {
      setSettingsError('Network error loading settings.');
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(false);

    // Enforce validations
    if (!checkoutCountryCode.trim() || !checkoutPhone.trim()) {
      setSettingsError('Please fill out both country code and phone number fields.');
      return;
    }

    if (!/^\+\d+$/.test(checkoutCountryCode)) {
      setSettingsError('Country code must start with "+" followed by digits (e.g. +91).');
      return;
    }

    if (!/^\d+$/.test(checkoutPhone)) {
      setSettingsError('Phone number must contain only digits.');
      return;
    }

    setIsSettingsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings/checkout-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': adminPassword
        },
        body: JSON.stringify({
          countryCode: checkoutCountryCode,
          phoneNumber: checkoutPhone
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        setSettingsError(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      setSettingsError('Network error saving settings.');
    } finally {
      setIsSettingsSaving(false);
    }
  };

  // Community Activity CRUD
  const fetchActivities = async (showLoading = false) => {
    if (showLoading) setIsActivitiesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      if (showLoading) setIsActivitiesLoading(false);
    }
  };

  // Polling hook for ASAP updates
  useEffect(() => {
    if (isAuthenticated) {
      fetchSosReports(true);
      fetchCheckoutSettings();
      fetchActivities(true);
      fetchVets();
      fetchPendingVets();
      const interval = setInterval(() => {
        fetchSosReports(false);
        fetchPendingVets();
      }, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  const resetActivityForm = () => {
    setIsEditingActivity(false);
    setEditActivityId(null);
    setActFormCategory('event');
    setActFormTitle('');
    setActFormDescription('');
    setActFormLocation('');
    setActFormImage('');
    setActFormScheduledTime('');
    setActivityError(null);
    if (actFileInputRef.current) actFileInputRef.current.value = '';
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actFormTitle || !actFormDescription || !actFormLocation) {
      setActivityError('Please fill out Title, Description, and Location.');
      return;
    }
    setIsSavingActivity(true);
    setActivityError(null);

    const fullDescription = actFormScheduledTime
      ? `${actFormDescription}\n\n🕒 Scheduled: ${actFormScheduledTime}`
      : actFormDescription;

    const payload = {
      category: actFormCategory,
      title: actFormTitle,
      description: fullDescription,
      location: actFormLocation,
      image: actFormImage || ''
    };

    try {
      const url = isEditingActivity && editActivityId
        ? `${API_BASE}/admin/activities/${editActivityId}`
        : `${API_BASE}/admin/activities`;
      const method = isEditingActivity ? 'PUT' : 'POST';

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
        resetActivityForm();
        fetchActivities(false);
      } else {
        setActivityError(data.message || 'Failed to save activity.');
      }
    } catch (err) {
      setActivityError('Network error saving activity.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleEditActivity = (act: any) => {
    setIsEditingActivity(true);
    setEditActivityId(act._id);
    setActFormCategory(act.category);
    // Extract scheduled time from description if present
    const parts = (act.description || '').split(/\n\n🕒 Scheduled: |\\n\\n🕒 Scheduled: /);
    setActFormTitle(act.title);
    setActFormDescription(parts[0] || '');
    setActFormScheduledTime(parts[1] || '');
    setActFormLocation(act.location);
    setActFormImage(act.image || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteActivity = (id: string) => {
    openConfirmation({
      title: 'Delete Community Post?',
      message: 'Are you sure you want to permanently delete this community post? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/activities/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Admin-Password': adminPassword
            }
          });
          if (res.ok) {
            fetchActivities(false);
          } else {
            const data = await res.json();
            openConfirmation({
              title: 'Error',
              message: data.message || 'Failed to delete community post.',
              confirmText: 'OK',
              onConfirm: () => {}
            });
          }
        } catch (err) {
          console.error('Error deleting activity:', err);
        }
      }
    });
  };

  const handleActivityFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setActFormImage(base64);
      });
    }
  };

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
      setErrorMessage('Please fill out all required fields (Title, Description, Price, Image)');
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
      ? `${API_BASE}/products/${editId}`
      : `${API_BASE}/products`;
    
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

  const handleDeleteClick = (id: string) => {
    openConfirmation({
      title: 'Delete Product?',
      message: 'Are you sure you want to delete this product from the marketplace? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        setErrorMessage(null);
        try {
          const res = await fetch(`${API_BASE}/products/${id}`, {
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
      }
    });
  };

  // Auth lock screen
  if (!isAuthenticated) {
    return (
      <main className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-sm border border-[#EBE3D5] select-none transition-all duration-300 my-8 pb-12">
        <header className="flex items-center justify-between w-full border-b border-[#EBE3D5] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#4A5D4E]/10 text-[#4A5D4E] flex items-center justify-center font-bold text-sm">
              🔐
            </div>
            <h1 className="font-serif text-xl text-[#1C1A17] font-semibold tracking-tight">Admin Authentication</h1>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-[#EBE3D5] bg-stone-50 hover:bg-stone-100 text-stone-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Exit
          </button>
        </header>

        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 w-full">
          <p className="text-xs text-stone-500 text-center leading-relaxed">
            Enter the admin double-lock password to manage rescue alerts, marketplace products, doctors, call sessions, and community posts.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Admin Password</label>
            <input
              type="password"
              placeholder="Enter admin password..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-[#F9F8F5] rounded-xl py-3 px-4 text-sm text-[#1C1A17] border border-[#EBE3D5] outline-none focus:ring-2 focus:ring-[#4A5D4E]/30 focus:border-[#4A5D4E] transition-all"
              required
            />
          </div>

          {authError && (
            <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="mt-2 py-3 bg-[#4A5D4E] hover:bg-[#3A4D3E] text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying Credentials...
              </>
            ) : (
              'Verify & Unlock Dashboard'
            )}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="w-full max-w-5xl lg:max-w-6xl mx-auto bg-white rounded-3xl p-4 sm:p-6 md:p-8 pb-32 sm:pb-36 flex flex-col gap-6 shadow-sm border border-[#F0EBE1] transition-all duration-300">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full select-none border-b border-[#EBE3D5] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#4A5D4E]/10 text-[#4A5D4E] px-2.5 py-0.5 rounded-full border border-[#4A5D4E]/20">
              Admin Portal
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1C1A17] font-normal tracking-tight">Admin Control Panel</h1>
          <p className="text-xs text-stone-400 font-medium mt-0.5">Manage rescue alerts, product catalog, vets, calls, community & checkout settings</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              sessionStorage.removeItem('aumoha_admin_password');
              setIsAuthenticated(false);
              setAdminPassword('');
              onClose();
            }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs border border-stone-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Exit Dashboard
          </button>
        </div>
      </header>

      {/* TAB NAVIGATION PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none pb-2.5 border-b border-[#EBE3D5] select-none -mx-1 px-1">
        <button
          onClick={() => setCurrentTab('sos')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            currentTab === 'sos'
              ? 'bg-[#9B1C1C] text-white shadow-md scale-[1.02]'
              : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-600'
          }`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>SOS Alerts</span>
          {sosReports.filter(r => r.status === 'active').length > 0 && (
            <span className="bg-white text-[#9B1C1C] text-[9px] px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
              {sosReports.filter(r => r.status === 'active').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('products')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            currentTab === 'products'
              ? 'bg-[#4A5D4E] text-white shadow-md scale-[1.02]'
              : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-600'
          }`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>Products</span>
          {products.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${currentTab === 'products' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'}`}>
              {products.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('vets')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            currentTab === 'vets'
              ? 'bg-[#072654] text-white shadow-md scale-[1.02]'
              : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-600'
          }`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.8 2.3A.3.3 0 0 0 4.5 2.6V8a5 5 0 0 0 10 0V2.6a.3.3 0 0 0-.3-.3h-.9a.3.3 0 0 0-.3.3V8a3.5 3.5 0 1 1-7 0V2.6a.3.3 0 0 0-.3-.3h-.9z" />
            <path d="M9.5 13a4.5 4.5 0 0 0 4.5 4.5h.5a4 4 0 0 0 4-4V12" />
            <circle cx="18.5" cy="11.5" r="1.5" />
          </svg>
          <span>Vets & Experts</span>
          {vets.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${currentTab === 'vets' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'}`}>
              {vets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('calls')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            currentTab === 'calls'
              ? 'bg-emerald-700 text-white shadow-md scale-[1.02]'
              : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-600'
          }`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Active Calls</span>
          {callSessions.filter(s => s.status === 'requested').length > 0 && (
            <span className="bg-amber-400 text-stone-900 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
              {callSessions.filter(s => s.status === 'requested').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('community')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            currentTab === 'community'
              ? 'bg-[#B68A35] text-white shadow-md scale-[1.02]'
              : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-600'
          }`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Community</span>
          {activities.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${currentTab === 'community' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'}`}>
              {activities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            currentTab === 'settings'
              ? 'bg-[#4A5D4E] text-white shadow-md scale-[1.02]'
              : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-600'
          }`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </button>
        <button
          onClick={() => {
            setCurrentTab('users');
            fetchAdminUsers();
          }}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            currentTab === 'users'
              ? 'bg-[#2D4536] text-white shadow-md scale-[1.02]'
              : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-600'
          }`}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="17" y1="11" x2="23" y2="11" />
          </svg>
          <span>Assign Roles</span>
        </button>
      </div>

      {errorMessage && (
        <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-3 text-xs leading-relaxed font-semibold">
          {errorMessage}
        </div>
      )}

      {/* ======================= ACTIVE CALLS TAB ======================= */}
      {currentTab === 'calls' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFAF7] p-4.5 rounded-2xl border border-[#F0EBE1] shadow-sm">
            <div>
              <h3 className="text-sm font-extrabold text-stone-800">Tele-Consultation Call Sessions</h3>
              <p className="text-xs text-stone-500 mt-0.5">Connect requested client calls to enable video/voice room access for doctor and pet parent.</p>
            </div>
            <button
              onClick={fetchCallSessions}
              className="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh Calls
            </button>
          </div>

          {callSessions.length === 0 ? (
            <div className="text-center py-16 bg-[#FCFAF7] rounded-2xl border border-dashed border-[#EBE3D5]">
              <p className="text-xs font-bold text-stone-400">No active or past call sessions found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {callSessions.map((session) => (
                <div key={session._id} className="bg-white p-5 rounded-2xl border border-[#EBE3D5] shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">BOOKING: {session.bookingId}</span>
                      <h4 className="text-xs font-extrabold text-stone-800 mt-2 truncate">User: {session.userEmail}</h4>
                      <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">Expert ID: {session.expertOrVetId}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                      session.status === 'requested' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      session.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                      session.status === 'ongoing' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {session.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-500 flex justify-between border-t border-stone-100 pt-3">
                    <span>Type: <strong className="capitalize">{session.callType || 'video'}</strong></span>
                    <span>{new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {session.status === 'requested' && (
                      <button
                        onClick={() => handleConnectCall(session._id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        Connect Call Room
                      </button>
                    )}
                    {(session.status === 'ready' || session.status === 'ongoing') && (
                      <button
                        onClick={() => handleForceEndCall(session._id)}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                        Force End Call
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= PRODUCTS TAB ======================= */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white border border-[#F0EBE1] rounded-2xl p-4 flex flex-col justify-between gap-3 hover:shadow-md transition-all duration-200 group relative"
                  >
                    <div className="flex gap-3">
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
                      <div className="flex flex-col flex-grow min-w-0">
                        <span className="text-[9px] font-extrabold text-[#4A5D4E] bg-[#D4DDD6] px-1.5 py-0.5 rounded uppercase tracking-wider self-start">
                          {product.category}
                        </span>
                        <h4 className="font-serif text-sm text-[#1C1A17] font-semibold leading-tight mt-1 truncate">
                          {product.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs mt-1.5">
                          <span className="font-extrabold text-[#1C1A17]">₹{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-[10px] text-stone-400 line-through">₹{product.originalPrice}</span>
                          )}
                          {product.discountBadge && (
                            <span className="text-[9px] font-bold text-stone-400">({product.discountBadge})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Edit product"
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => product._id && handleDeleteClick(product._id)}
                        className="px-2.5 py-1 rounded-lg border border-red-100 bg-white hover:bg-red-50 text-red-500 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Delete product"
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
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

      {/* ======================= SOS ALERTS TAB ======================= */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="w-7 h-7 rounded-xl bg-red-100 text-[#9B1C1C] flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <h4 className="font-serif text-base text-[#1C1A17] font-semibold">
                          {report.category} Alert
                        </h4>
                      </div>
                      <p className="text-xs text-[#1C1A17] leading-relaxed pl-9">
                        &ldquo;{report.reason}&rdquo;
                      </p>
                    </div>

                    {/* Location & User Info */}
                    <div className="bg-white border border-[#EBE3D5] rounded-xl p-3 flex flex-col gap-2 text-[11px] text-stone-600">
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-400 shrink-0">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span className="truncate"><strong>Location:</strong> {report.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-400 shrink-0">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        </svg>
                        <span className="truncate"><strong>Reporter:</strong> {report.userEmail}</span>
                      </div>
                      {report.userPhone && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#4A5D4E] shrink-0">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span><strong>Phone:</strong> {report.userPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Media Attachments */}
                    {(report.photo || report.audio) && (
                      <div className="flex flex-col gap-3 mt-1 pt-2 border-t border-[#F0EBE1]">
                        {report.photo && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Report Photo Attachment</span>
                            <a href={report.photo} target="_blank" rel="noopener noreferrer" className="block max-w-sm rounded-xl overflow-hidden border border-stone-200 shadow-sm cursor-zoom-in">
                              <img src={report.photo} alt="Distress alert photo attachment" className="w-full max-h-44 object-cover hover:scale-102 transition-transform duration-200" />
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
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Status:</span>
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
                            className="px-3 py-1.5 bg-[#4A5D4E] hover:bg-[#3A4D3E] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
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

      {/* ======================= VETS & EXPERTS TAB ======================= */}
      {currentTab === 'vets' && (
        <section className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-5 md:p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EBE3D5]/80 pb-2.5">
            <div>
              <h2 className="font-serif text-lg text-[#1C1A17] font-normal">Manage Vets & Experts</h2>
              <p className="text-[11px] text-stone-400 font-medium mt-0.5">Edit consultation fees, names, and availability status for all registered vets and specialists.</p>
            </div>
            <button
              onClick={fetchVets}
              className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>

          {vetsError && (
            <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-2.5 text-xs font-semibold">
              {vetsError}
            </div>
          )}

          {isVetsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-stone-400 select-none">
              <div className="w-7 h-7 rounded-full border-2 border-stone-200 border-t-[#072654] animate-spin" />
              <p className="text-[10px] font-semibold">Loading vets & experts...</p>
            </div>
          ) : vets.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              <p className="text-xs font-bold text-stone-400">No vets or experts found in the database.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vets.map((vet) => (
                <div key={vet._id} className="bg-white border border-[#EBE3D5] rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
                  {editingVetId === vet._id ? (
                    /* EDIT MODE */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <img src={vet.photo || '/sairaj_avatar.png'} alt={vet.name} className="w-10 h-10 rounded-full object-cover border-2 border-[#EBE3D5] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Name</p>
                          <input
                            type="text"
                            value={editVetName}
                            onChange={e => setEditVetName(e.target.value)}
                            className="w-full bg-stone-50 rounded-xl py-1.5 px-3 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#072654] focus:ring-1 focus:ring-[#072654]/30 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Consultation Fee (₹)</p>
                          <input
                            type="number"
                            min="1"
                            value={editVetFee}
                            onChange={e => setEditVetFee(e.target.value)}
                            className="w-full bg-stone-50 rounded-xl py-1.5 px-3 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#072654] focus:ring-1 focus:ring-[#072654]/30 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Availability</p>
                          <button
                            type="button"
                            onClick={() => setEditVetIsOnline(v => !v)}
                            className={`w-full py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              editVetIsOnline
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-stone-50 border-stone-200 text-stone-500'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${editVetIsOnline ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            {editVetIsOnline ? 'Online' : 'Offline'}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={cancelEditVet}
                          className="px-4 py-1.5 text-xs font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveVet(vet._id)}
                          disabled={isSavingVet}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-[#072654] hover:bg-[#0c3570] disabled:opacity-60 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSavingVet ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div className="flex items-center gap-3">
                      <img src={vet.photo || '/sairaj_avatar.png'} alt={vet.name} className="w-10 h-10 rounded-full object-cover border-2 border-[#EBE3D5] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-[#1C1A17]">{vet.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                            vet.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${vet.isOnline ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            {vet.isOnline ? 'Online' : 'Offline'}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#072654]/10 text-[#072654]">
                            {vet.category === 'vet' ? 'Veterinarian' : vet.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-0.5">{vet.specialisation} · {vet.experience}yr exp</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-[#2D4536]">₹{vet.fee}</p>
                        <p className="text-[9px] text-stone-400">per session</p>
                      </div>
                      <button
                        onClick={() => startEditVet(vet)}
                        className="ml-1 px-2.5 py-1.5 text-[10px] font-bold text-[#072654] bg-[#072654]/10 hover:bg-[#072654]/20 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================= SETTINGS TAB ======================= */}
      {currentTab === 'settings' && (
        <section className="max-w-xl mx-auto w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-5 md:p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="border-b border-[#EBE3D5]/80 pb-2.5">
            <h2 className="font-serif text-lg text-[#1C1A17] font-normal">Marketplace Settings</h2>
            <p className="text-[11px] text-stone-400 font-medium leading-normal mt-0.5">Configure the destination contact for WhatsApp checkout orders.</p>
          </div>

          {isSettingsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-stone-400 select-none">
              <div className="w-7 h-7 rounded-full border-2 border-stone-200 border-t-[#4A5D4E] animate-spin" />
              <p className="text-[10px] font-semibold">Loading checkout settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                {/* Country Code */}
                <div className="flex flex-col gap-1 col-span-1">
                  <label htmlFor="countryCode" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Country Code *</label>
                  <input
                    type="text"
                    id="countryCode"
                    value={checkoutCountryCode}
                    onChange={(e) => setCheckoutCountryCode(e.target.value)}
                    placeholder="+91"
                    className="w-full bg-white rounded-xl py-2.5 px-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E] outline-none transition-all shadow-sm font-semibold"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label htmlFor="checkoutPhone" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">WhatsApp Phone Number *</label>
                  <input
                    type="text"
                    id="checkoutPhone"
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-white rounded-xl py-2.5 px-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E] outline-none transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              {settingsError && (
                <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-2.5 text-xs font-semibold">
                  {settingsError}
                </div>
              )}

              {settingsSuccess && (
                <div className="bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] rounded-xl px-4 py-2.5 text-xs font-semibold">
                  WhatsApp settings saved successfully!
                </div>
              )}

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSettingsSaving}
                  className="px-6 py-2.5 bg-[#4A5D4E] hover:bg-[#3A4D3E] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSettingsSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ======================= COMMUNITY TAB ======================= */}
      {currentTab === 'community' && (
        <>
          {/* ADD / EDIT ACTIVITY FORM */}
          <section className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-5 md:p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[#EBE3D5]/80 pb-2.5">
              <h2 className="font-serif text-lg text-[#1C1A17] font-normal">
                {isEditingActivity ? 'Edit Community Post' : 'Create Official Post'}
              </h2>
              {isEditingActivity && (
                <span className="text-[9px] font-extrabold bg-[#B68A35]/15 text-[#B68A35] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Editing Mode
                </span>
              )}
            </div>

            <form onSubmit={handleSaveActivity} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="actTitle" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Post Title *</label>
                  <input
                    type="text"
                    id="actTitle"
                    value={actFormTitle}
                    onChange={(e) => setActFormTitle(e.target.value)}
                    placeholder="e.g. Community Feeding Drive at Park"
                    className="w-full bg-white rounded-xl py-2.5 px-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#B68A35] focus:ring-1 focus:ring-[#B68A35] outline-none transition-all shadow-sm"
                    required
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Category *</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['feeding', 'help', 'event', 'awareness'] as const).map((cat) => {
                      const isActive = actFormCategory === cat;
                      const icons: Record<string, React.ReactNode> = {
                        feeding: (
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                            <line x1="6" y1="1" x2="6" y2="4" />
                            <line x1="10" y1="1" x2="10" y2="4" />
                            <line x1="14" y1="1" x2="14" y2="4" />
                          </svg>
                        ),
                        help: (
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-red-500">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        ),
                        event: (
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        ),
                        awareness: (
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        )
                      };
                      const labels: Record<string, string> = { feeding: 'Feed', help: 'Help', event: 'Event', awareness: 'Info' };
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActFormCategory(cat)}
                          className={`flex items-center justify-center py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-[#B68A35]/10 text-[#B68A35] border-[#B68A35]/30 scale-[1.01]'
                              : 'bg-white hover:bg-stone-50 border-[#EBE3D5] text-stone-500 hover:text-charcoal'
                          }`}
                        >
                          {icons[cat]}
                          <span>{labels[cat]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="actLocation" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Location *</label>
                  <input
                    type="text"
                    id="actLocation"
                    value={actFormLocation}
                    onChange={(e) => setActFormLocation(e.target.value)}
                    placeholder="e.g. Saheed Nagar, Bhubaneswar"
                    className="w-full bg-white rounded-xl py-2.5 px-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#B68A35] focus:ring-1 focus:ring-[#B68A35] outline-none transition-all shadow-sm"
                    required
                  />
                </div>

                {/* Scheduled Time */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="actScheduledTime" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Scheduled Time (Optional)</label>
                  <input
                    type="text"
                    id="actScheduledTime"
                    value={actFormScheduledTime}
                    onChange={(e) => setActFormScheduledTime(e.target.value)}
                    placeholder="e.g. Tomorrow, 6:00 PM"
                    className="w-full bg-white rounded-xl py-2.5 px-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#B68A35] focus:ring-1 focus:ring-[#B68A35] outline-none transition-all shadow-sm"
                  />
                </div>

                {/* Image Upload */}
                <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Cover Image (Optional)</label>
                  <div
                    onClick={() => actFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-2.5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 bg-white ${
                      actFormImage
                        ? 'border-[#B68A35] bg-[#B68A35]/5'
                        : 'border-[#EBE3D5] hover:border-[#B68A35] hover:bg-stone-50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={actFileInputRef}
                      onChange={handleActivityFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    {actFormImage ? (
                      <div className="flex items-center gap-3 w-full select-none">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#EBE3D5] bg-[#FAF6F0] shrink-0 shadow-sm">
                          <img src={actFormImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-[10px] font-extrabold text-[#B68A35] leading-none truncate">Image Loaded</p>
                          <p className="text-[8px] text-stone-400 mt-1">Click to replace</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setActFormImage(''); if (actFileInputRef.current) actFileInputRef.current.value = ''; }}
                          className="w-5 h-5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer shrink-0"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-0.5 text-stone-400 hover:text-[#B68A35] transition-colors">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide">Upload Image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label htmlFor="actDescription" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Description *</label>
                <textarea
                  id="actDescription"
                  value={actFormDescription}
                  onChange={(e) => setActFormDescription(e.target.value)}
                  placeholder="Describe the community activity, what participants should expect..."
                  rows={3}
                  className="w-full bg-white rounded-xl py-2.5 px-3.5 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#B68A35] focus:ring-1 focus:ring-[#B68A35] outline-none transition-all resize-none leading-relaxed shadow-sm"
                  required
                />
              </div>

              {activityError && (
                <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-2.5 text-xs font-semibold">
                  {activityError}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-2.5 mt-2">
                {isEditingActivity && (
                  <button
                    type="button"
                    onClick={resetActivityForm}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-all cursor-pointer shadow-sm"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSavingActivity}
                  className="px-6 py-2.5 bg-[#B68A35] hover:bg-[#9A7430] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSavingActivity ? (
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
                      {isEditingActivity ? 'Update Post' : 'Publish Official Post'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ACTIVITIES LIST */}
          <section className="flex flex-col gap-3">
            <h2 className="font-serif text-lg text-[#1C1A17] font-normal border-b border-[#EBE3D5] pb-2">
              Community Posts ({activities.length})
            </h2>

            {isActivitiesLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-stone-400 select-none">
                <div className="w-7 h-7 rounded-full border-2 border-stone-200 border-t-[#B68A35] animate-spin" />
                <p className="text-[10px] font-semibold">Loading community posts...</p>
              </div>
            ) : activities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map((act: any) => {
                  const catColors: Record<string, string> = {
                    feeding: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    help: 'bg-red-50 text-red-600 border-red-200',
                    event: 'bg-blue-50 text-blue-600 border-blue-200',
                    awareness: 'bg-amber-50 text-amber-700 border-amber-200'
                  };
                  const catColor = catColors[act.category] || 'bg-stone-100 text-stone-500 border-stone-200';
                  const isOfficial = act.authorRole === 'official';
                  const descParts = (act.description || '').split(/\n\n🕒 Scheduled: |\\n\\n🕒 Scheduled: /);
                  const descText = descParts[0] || '';
                  const scheduledTime = descParts[1] || '';

                  return (
                    <div
                      key={act._id}
                      className={`bg-[#FCFAF7] border rounded-[24px] p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-200 group ${
                        isOfficial ? 'border-[#B68A35]/30' : 'border-[#F0EBE1]'
                      }`}
                    >
                      {/* Top Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${catColor}`}>
                            {act.category}
                          </span>
                          {isOfficial && (
                            <span className="text-[8px] font-extrabold bg-gradient-to-r from-[#B68A35] to-[#D4A84B] text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="m9 12 2 2 4-4" />
                              </svg>
                              Official
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-stone-400 font-semibold">
                          {act.createdAt ? new Date(act.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex gap-3">
                        {act.image && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-stone-100 shadow-sm">
                            <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex flex-col flex-grow min-w-0">
                          <h4 className="font-serif text-sm text-[#1C1A17] font-semibold leading-tight truncate">{act.title}</h4>
                          <p className="text-[11px] text-stone-500 leading-relaxed mt-1 line-clamp-2">{descText}</p>
                          {scheduledTime && (
                            <span className="text-[10px] text-[#B68A35] font-bold mt-1 flex items-center gap-1">
                              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {scheduledTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metadata Row */}
                      <div className="bg-white border border-[#EBE3D5] rounded-xl p-2.5 flex items-center justify-between text-[10px] text-stone-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-400">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <strong className="truncate max-w-[90px] inline-block">{act.authorName}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-stone-400">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="truncate max-w-[80px] inline-block">{act.location}</span>
                          </span>
                          <span className="font-bold text-[#4A5D4E] shrink-0">
                            {(act.joinees || []).length} joined
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditActivity(act)}
                            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
                            title="Edit post"
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => act._id && handleDeleteActivity(act._id)}
                            className="p-1.5 rounded-lg border border-red-100 bg-white hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                            title="Delete post"
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
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
                <p className="text-xs text-stone-400 font-semibold">No community posts yet. Use the form above to create the first official post!</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* ======================= USERS & ROLE ASSIGNMENT TAB ======================= */}
      {currentTab === 'users' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1C1A17] via-[#2D4536] to-[#4A5D4E] text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 relative z-10 max-w-xl">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Assign User Roles
              </h2>
              <p className="text-xs text-stone-200/90 leading-relaxed font-medium">
                Grant specialized roles (Veterinarians, Certified Rescuers, Community Feeders, NGOs, Administrators) to enable provider dashboards and administrative capabilities across the platform.
              </p>
            </div>
            
            <button
              onClick={() => fetchAdminUsers()}
              className="self-start md:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-2 shrink-0 backdrop-blur-md"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh Users List
            </button>
          </div>

          {/* Doctor Verification Queue */}
          {pendingVets.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-[28px] p-5 sm:p-7 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-amber-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Pending Doctor Verifications ({pendingVets.length})
                  </h3>
                  <p className="text-xs text-amber-700 font-medium">Review and verify credentials before approving new doctor accounts for public booking.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingVets.map(pv => (
                  <div key={pv._id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-charcoal">{pv.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800">
                          {pv.category === 'expert' ? 'Specialist' : 'Vet Surgeon'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-bold mt-0.5">{pv.specialisation} • Fee: ₹{pv.fee}</p>
                      {pv.email && <p className="text-[11px] text-stone-400 font-medium mt-0.5">Email: {pv.email}</p>}
                      {pv.bio && <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200 mt-2 italic">"{pv.bio}"</p>}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleApproveVet(pv._id, true)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve Doctor
                      </button>
                      <button
                        onClick={() => handleApproveVet(pv._id, false)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-xl transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Role Assignment Form Card */}
          <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-[28px] p-5 sm:p-7 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-serif text-lg font-bold text-[#1C1A17]">Assign Role to User by Email</h3>
              <p className="text-xs text-stone-500 font-medium">Enter a registered user's email and select their designated system role.</p>
            </div>

            {roleMsg && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                roleMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <span>{roleMsg.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{roleMsg.text}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleAssignRole(); }} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">User Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. doctor@aumoha.com"
                  value={roleAssignEmail}
                  onChange={(e) => setRoleAssignEmail(e.target.value)}
                  className="w-full bg-white border border-[#D5CEBF] focus:border-[#2D4536] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1A17] outline-none font-medium shadow-2xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Select System Role</label>
                <select
                  value={roleAssignRole}
                  onChange={(e) => setRoleAssignRole(e.target.value)}
                  className="w-full bg-white border border-[#D5CEBF] focus:border-[#2D4536] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1A17] outline-none font-bold cursor-pointer shadow-2xs"
                >
                  <option value="doctor">🩺 Doctor / Veterinarian (Full Medical Dashboard)</option>
                  <option value="expert">🎓 Veterinary Specialist / Care Expert</option>
                  <option value="rescuer">🛡️ Certified Rescuer (Emergency SOS Access)</option>
                  <option value="feeder">🥣 Community Feeder</option>
                  <option value="volunteer">🤝 Rescue Volunteer</option>
                  <option value="ngo">🏥 Animal Welfare NGO Organization</option>
                  <option value="admin">👑 Administrator (Full System Control)</option>
                  <option value="normal">👤 Normal Member</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isAssigningRole || !roleAssignEmail.trim()}
                  className="w-full py-2.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-[0.98] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isAssigningRole ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Assigning Role...
                    </>
                  ) : (
                    <>
                      <span>✨ Save & Update Role</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Registered Users Directory */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1C1A17]">Registered Platform Users ({usersList.length})</h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">Click any user's role badge to instantly update their access permissions.</p>
              </div>
            </div>

            {usersList.length === 0 ? (
              <div className="text-center py-12 bg-[#FAF8F5] border border-dashed border-[#D5CEBF] rounded-[28px] select-none">
                <p className="text-xs text-stone-500 font-semibold">No users loaded yet. Tap "Refresh Users List" above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usersList.map((usr: any) => {
                  const roleColors: Record<string, string> = {
                    admin: 'bg-[#2D4536]/15 text-[#2D4536] border-[#2D4536]/30',
                    doctor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    expert: 'bg-teal-100 text-teal-900 border-teal-300',
                    rescuer: 'bg-red-100 text-red-900 border-red-300',
                    feeder: 'bg-amber-100 text-amber-900 border-amber-300',
                    ngo: 'bg-blue-100 text-blue-900 border-blue-300',
                    volunteer: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    normal: 'bg-stone-100 text-stone-700 border-stone-300'
                  };
                  const currentRoleColor = roleColors[usr.role] || roleColors.normal;

                  return (
                    <div
                      key={usr._id || usr.email}
                      className="bg-white border border-[#E8E2D8] rounded-[24px] p-4.5 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D4536] to-[#4A5D4E] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                            {usr.fullName ? usr.fullName[0].toUpperCase() : 'U'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-xs font-bold text-[#1C1A17] truncate leading-tight">
                              {usr.fullName || 'Anonymous User'}
                            </h4>
                            <span className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                              {usr.email}
                            </span>
                            {usr.phone && (
                              <span className="text-[10px] text-stone-400 font-medium">
                                📞 {usr.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border shrink-0 ${currentRoleColor}`}>
                          {usr.role || 'normal'}
                        </span>
                      </div>

                      {/* Quick Role Select Action */}
                      <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Quick Change:</span>
                        <select
                          value={usr.role || 'normal'}
                          onChange={(e) => handleAssignRole(usr.email, e.target.value)}
                          className="bg-[#FAF8F5] border border-[#D5CEBF] rounded-xl text-xs font-bold text-[#1C1A17] py-1.5 px-2.5 outline-none cursor-pointer hover:border-[#2D4536] transition-colors"
                        >
                          <option value="normal">Member</option>
                          <option value="doctor">Doctor</option>
                          <option value="expert">Expert</option>
                          <option value="rescuer">Rescuer</option>
                          <option value="feeder">Feeder</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="ngo">NGO</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog Modal */}
      {isConfirmOpen && confirmConfig && (
        <div className="fixed inset-0 z-50 bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#F0EBE1] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col gap-1 text-center select-none">
              <h4 className="font-serif text-lg text-[#1C1A17] font-semibold">{confirmConfig.title}</h4>
              <p className="text-xs text-stone-400 font-medium leading-relaxed mt-1">{confirmConfig.message}</p>
            </div>
            
            <div className={`grid ${confirmConfig.cancelText ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mt-2`}>
              {confirmConfig.cancelText && (
                <button
                  type="button"
                  onClick={closeConfirmation}
                  className="py-2.5 px-4 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer text-center"
                >
                  {confirmConfig.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  confirmConfig.onConfirm();
                  closeConfirmation();
                }}
                className={`py-2.5 px-4 text-xs font-bold rounded-xl text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer text-center ${
                  confirmConfig.isDestructive 
                    ? 'bg-red-600 hover:bg-red-750 shadow-sm' 
                    : 'bg-[#4A5D4E] hover:bg-[#3A4D3E] shadow-sm'
                }`}
              >
                {confirmConfig.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
