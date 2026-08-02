'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { LightbulbIcon } from './icons/PetIcons';

export default function AuthScreen() {
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. user@example.com).');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(trimmedEmail, password);
      } else {
        await signUp(trimmedEmail, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-sm border border-[#F0EBE1] animate-scaleIn select-none mt-8">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center gap-2 mt-2">
        <img 
          src="/logo.png" 
          alt="Aumoha Logo" 
          className="h-16 w-auto object-contain select-none mix-blend-multiply"
        />
        <h1 className="font-serif text-2xl md:text-3xl text-[#1C1A17] font-normal tracking-tight mt-1">Aumoha</h1>
        <p className="text-xs text-stone-500 max-w-[280px]">Your decentralized hub for local animal rescues and emergency response.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F5F3EF] p-1 rounded-2xl">
        <button
          onClick={() => {
            setIsLogin(true);
            setError(null);
          }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            isLogin 
              ? 'bg-white text-[#1C1A17] shadow-sm' 
              : 'text-stone-500 hover:text-[#1C1A17]'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setIsLogin(false);
            setError(null);
          }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            !isLogin 
              ? 'bg-white text-[#1C1A17] shadow-sm' 
              : 'text-stone-500 hover:text-[#1C1A17]'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-3 text-xs leading-relaxed font-semibold">
          {error}
        </div>
      )}

      {/* Mode Note */}
      {auth.isMock && (
        <div className="bg-[#FAF6F0] border border-[#EBE3D5] rounded-xl p-3 text-[11px] text-[#4A5D4E] leading-normal font-semibold flex items-center gap-1.5">
          <LightbulbIcon className="w-4 h-4 text-amber-500 shrink-0" />
          <span><strong>Dev Mode Active:</strong> Firebase is running in mock mode. You can sign in or register with any credentials to test the MongoDB connection.</span>
        </div>
      )}

      {/* Authentication Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            id="email"
            placeholder="e.g. aria.carter@aumoha.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#F5F3EF] rounded-xl py-3 px-4 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all placeholder-stone-400 font-medium"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Password</label>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-[#F5F3EF] rounded-xl py-3 px-4 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all placeholder-stone-400 font-medium"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#2A3E31]/10 flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : isLogin ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2 select-none">
          <div className="flex-grow border-t border-[#EBE3D5]"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-stone-400 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-[#EBE3D5]"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white border border-[#EBE3D5] hover:bg-[#FCFAF7] active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none text-[#1C1A17] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </form>
    </div>
  );
}
