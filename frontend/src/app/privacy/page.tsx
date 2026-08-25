'use client';

import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import AppShell from '../../components/AppShell';
import { PRIVACY_POLICY_SECTIONS } from '../../components/PrivacyPolicyModal';

export default function PrivacyPage() {
  return (
    <AppShell bgColor="#F5F2EC">
      <main className="w-full max-w-3xl mx-auto flex flex-col gap-6 select-none font-sans text-charcoal pb-24 pt-2 animate-fadeIn">
        
        {/* Header Navigation */}
        <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-4">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white border border-[#D5CEBF] flex items-center justify-center hover:bg-[#FAF8F5] text-[#1C1A17] transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-[#2D4536] tracking-widest uppercase">
                PRIVACY &amp; DATA PROTECTION
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#1C1A17] leading-tight">
              Privacy Policy
            </h1>
          </div>
        </div>

        {/* Preamble Card */}
        <div className="bg-white border border-[#E8E2D8] rounded-[24px] p-5 sm:p-6 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-[#2D4536]">
            <Lock className="w-5 h-5" />
            <span className="font-serif font-bold text-base text-[#1C1A17]">
              Version 1.0 • Effective Date: 24 August 2026
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
            Aumoha is an animal health, welfare and care technology platform owned and operated by <strong>Arvista Nova Private Limited</strong>, a company incorporated under the laws of India and having its registered office in Rourkela, Odisha, India (&ldquo;Aumoha&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;).
          </p>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
            This Privacy Policy applies to the Aumoha mobile application, web application, website and related services (collectively, the &ldquo;Platform&rdquo;).
          </p>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-semibold bg-[#FAF8F5] border border-[#E8E2D8] p-3.5 rounded-xl">
            Aumoha is committed to handling personal data responsibly, transparently and in accordance with applicable Indian law.
          </p>
        </div>

        {/* Numbered Privacy Sections */}
        <div className="space-y-4">
          {PRIVACY_POLICY_SECTIONS.map((sec) => (
            <section
              key={sec.number}
              id={`section-${sec.number}`}
              className="bg-white border border-[#EBE3D5] rounded-[22px] p-5 sm:p-6 shadow-xs hover:border-[#2D4536]/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-xl bg-[#2D4536]/10 text-[#2D4536] font-extrabold text-xs flex items-center justify-center shrink-0">
                  {sec.number}
                </span>
                <h2 className="font-serif font-bold text-sm sm:text-base text-[#1C1A17] tracking-tight">
                  {sec.title}
                </h2>
              </div>
              <div className="text-stone-600 whitespace-pre-line text-xs sm:text-[13px] leading-relaxed pl-10">
                {sec.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer info box */}
        <div className="bg-[#EFEAE2] border border-[#D5CEBF] rounded-2xl p-5 text-xs text-stone-600 text-center leading-relaxed">
          <p className="font-bold text-[#1C1A17] mb-1">Arvista Nova Private Limited</p>
          <p>Registered Office: Rourkela, Odisha, India</p>
          <p className="mt-1">
            For support or privacy inquiries: <a href="mailto:support.aumoha@gmail.com" className="underline font-bold text-[#2D4536]">support.aumoha@gmail.com</a>
          </p>
        </div>

      </main>
    </AppShell>
  );
}
