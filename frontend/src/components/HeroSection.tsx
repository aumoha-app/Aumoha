export default function HeroSection() {
  return (
    <main className="w-full max-w-2xl mx-auto transition-all duration-300">
      <div className="w-full flex flex-col items-center select-none">
        
        {/* Tagline */}
        <div className="w-full text-center pt-2 pb-1">
          <h2 className="font-serif text-2xl md:text-[40px] text-charcoal font-normal leading-[1.15] tracking-tight">
            Together, we protect<br />what matters.
          </h2>
          <div className="text-[11px] md:text-sm text-stone-500 font-medium leading-relaxed mt-2 md:mt-3">
            <span>Rescue. Protect. Care. For every life.</span>
          </div>
        </div>
        
        {/* Group Pets Image (CSS cropped from top to eliminate empty image padding) */}
        <div className="w-full max-w-sm mx-auto h-[250px] sm:h-[250px] md:h-[280px] overflow-hidden flex items-end justify-center" suppressHydrationWarning>
          <img
            src="/hero-pets-group.png"
            alt="Group of dogs and cats — Aumoha pet care community"
            className="w-full h-full object-cover object-bottom"
            suppressHydrationWarning
          />
        </div>

      </div>
    </main>
  );
}

