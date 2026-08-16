'use client';

import React from 'react';

export interface PopupConfig {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface PopupModalProps {
  config: PopupConfig | null;
  onClose: () => void;
}

export default function PopupModal({ config, onClose }: PopupModalProps) {
  if (!config) return null;

  const typeIcons = {
    success: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  const typeColors = {
    success: 'bg-emerald-50 border border-emerald-200',
    error: 'bg-rose-50 border border-rose-200',
    warning: 'bg-amber-50 border border-amber-200',
    info: 'bg-[#FCFAF7] border border-stone-200'
  };

  const buttonColors = {
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    error: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-700 hover:bg-amber-800 text-white',
    info: 'bg-[#2D4536] hover:bg-[#1E2E24] text-white'
  };

  const currentType = config.type || 'info';
  const hasCancel = Boolean(config.cancelText || config.onCancel);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-sm w-full border border-[#E8E2D8] shadow-2xl p-6 flex flex-col gap-5 animate-scaleIn text-charcoal">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xs ${typeColors[currentType]}`}>
            {typeIcons[currentType]}
          </div>
          <div className="flex flex-col gap-1">
            {config.title && (
              <h4 className="font-serif text-lg font-bold text-[#1C1A17]">{config.title}</h4>
            )}
            <p className="text-xs text-stone-600 font-medium leading-relaxed mt-0.5 whitespace-pre-line">
              {config.message}
            </p>
          </div>
        </div>

        {hasCancel ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                if (config.onCancel) config.onCancel();
                onClose();
              }}
              className="w-full py-3 rounded-2xl text-xs font-extrabold bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all cursor-pointer"
            >
              {config.cancelText || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (config.onConfirm) config.onConfirm();
                onClose();
              }}
              className={`w-full py-3 rounded-2xl text-xs font-extrabold shadow-sm transition-all active:scale-[0.98] cursor-pointer ${buttonColors[currentType]}`}
            >
              {config.confirmText || 'Confirm'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (config.onConfirm) config.onConfirm();
              onClose();
            }}
            className={`w-full py-3 rounded-2xl text-xs font-extrabold shadow-sm transition-all active:scale-[0.98] cursor-pointer ${buttonColors[currentType]}`}
          >
            {config.confirmText || 'OK'}
          </button>
        )}
      </div>
    </div>
  );
}
