'use client';

import React from 'react';

export interface PopupConfig {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  onConfirm?: () => void;
}

interface PopupModalProps {
  config: PopupConfig | null;
  onClose: () => void;
}

export default function PopupModal({ config, onClose }: PopupModalProps) {
  if (!config) return null;

  const typeIcons = {
    success: '✓',
    error: '⚠️',
    warning: '⚡',
    info: 'ℹ️'
  };

  const typeColors = {
    success: 'bg-[#2D4536] text-white hover:bg-[#1F3325]',
    error: 'bg-[#9B1C1C] text-white hover:bg-[#801414]',
    warning: 'bg-amber-700 text-white hover:bg-amber-800',
    info: 'bg-[#1C1A17] text-white hover:bg-stone-800'
  };

  const currentType = config.type || 'info';

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF8F5] rounded-3xl max-w-sm w-full border border-[#E8E2D8] shadow-2xl p-6 flex flex-col gap-4 animate-scaleIn text-charcoal select-none">
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-xs ${typeColors[currentType]}`}>
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

        <button
          type="button"
          onClick={() => {
            if (config.onConfirm) config.onConfirm();
            onClose();
          }}
          className={`w-full py-3 rounded-2xl text-xs font-extrabold shadow-sm transition-all active:scale-[0.98] cursor-pointer ${typeColors[currentType]}`}
        >
          {config.confirmText || 'OK'}
        </button>
      </div>
    </div>
  );
}
