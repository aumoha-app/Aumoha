export default function HeroSection() {
  return (
    <main className="w-full max-w-2xl mx-auto transition-all duration-300">
      {/* Split Hero Layout - No Background Card & Consistent Row for both Mobile/Desktop */}
      <div className="w-full flex flex-row h-[200px] md:h-[340px]">
        
        {/* Left Column: Core Messaging & Tagline */}
        <div className="w-[50%] pr-4 flex flex-col justify-center select-none">
          <h2 className="font-serif text-xl md:text-[36px] text-charcoal font-normal leading-[1.15] tracking-tight">
            Together,<br />
            we protect<br />
            what matters.
          </h2>
          <div className="text-[10px] md:text-sm text-stone-500 font-medium leading-relaxed mt-4 md:mt-8 flex flex-col gap-0.5">
            <span>Rescue. Protect. Care.</span>
            <span>For every life.</span>
          </div>
        </div>
        
        {/* Right Column: Sunlit Golden Retriever Puppy Image */}
        <div className="w-[50%] h-full rounded-[16px] md:rounded-[24px] overflow-hidden" suppressHydrationWarning>
          <img
            src="/hero-golden-retriever.png"
            alt="MOHA Golden Retriever Puppy"
            className="w-full h-full object-cover object-center rounded-[16px] md:rounded-[24px]"
            suppressHydrationWarning
          />
        </div>

      </div>
    </main>
  );
}
