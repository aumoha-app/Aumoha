export default function HeroSection() {
  return (
    <main className="w-full max-w-2xl mx-auto transition-all duration-300">
      <div className="w-full flex flex-col items-center select-none">
        
        {/* Tagline */}
        <div className="w-full text-center pt-2 pb-1">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-[40px] text-charcoal font-medium leading-[1.2] tracking-tight">
            Together, we protect<br />what matters.
          </h2>
          <div className="text-xs sm:text-sm text-stone-600 font-semibold leading-relaxed mt-2 md:mt-3">
            <span>Rescue. Protect. Care. For every life.</span>
          </div>
        </div>
        
        {/* Group Pets Image */}
        <div className="w-full max-w-md mx-auto flex items-center justify-center pt-2" suppressHydrationWarning>
          <img
            src="/hero-pets-group.png"
            alt="Group of dogs and cats — Aumoha pet care community"
            className="w-full h-auto object-contain max-h-[340px]"
            suppressHydrationWarning
          />
        </div>

      </div>
    </main>
  );
}

