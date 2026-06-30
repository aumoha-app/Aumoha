'use client';

export default function Marketplace() {
  return (
    <main className="w-full max-w-4xl mx-auto bg-warmCard border border-warmBeige rounded-3xl p-6 md:p-10 shadow-sm flex flex-col gap-6 transition-all duration-300">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal">Marketplace</h1>
        <p className="text-xs md:text-sm text-stone-500 font-medium mt-1">Discover, trade, and request community items and resources.</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cream/30 border border-warmBeige rounded-2xl overflow-hidden hover:shadow-md hover:border-clay/40 transition-all duration-300 flex flex-col">
          <div className="h-32 bg-warmBeige/60 flex items-center justify-center text-sm font-bold text-clay border-b border-warmBeige">
            🎒 Supply Kit
          </div>
          <div className="p-5 flex flex-col gap-2 flex-grow">
            <h3 className="font-bold text-charcoal text-base">Premium Survival Pack</h3>
            <p className="text-xs text-stone-500 leading-relaxed">Contains medical essentials, tools, and signals.</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-base font-bold text-terracotta">$45.00</span>
              <button className="px-4 py-1.5 bg-terracotta text-white font-bold rounded-lg text-xs hover:bg-terracotta/90 transition-all cursor-pointer">Buy</button>
            </div>
          </div>
        </div>

        <div className="bg-cream/30 border border-warmBeige rounded-2xl overflow-hidden hover:shadow-md hover:border-clay/40 transition-all duration-300 flex flex-col">
          <div className="h-32 bg-warmBeige/60 flex items-center justify-center text-sm font-bold text-clay border-b border-warmBeige">
            📻 AM/FM Radio
          </div>
          <div className="p-5 flex flex-col gap-2 flex-grow">
            <h3 className="font-bold text-charcoal text-base">Solar Crank Radio</h3>
            <p className="text-xs text-stone-500 leading-relaxed">Emergency solar hand-crank radio with solar charger.</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-base font-bold text-terracotta">$24.99</span>
              <button className="px-4 py-1.5 bg-terracotta text-white font-bold rounded-lg text-xs hover:bg-terracotta/90 transition-all cursor-pointer">Buy</button>
            </div>
          </div>
        </div>

        <div className="bg-cream/30 border border-warmBeige rounded-2xl overflow-hidden hover:shadow-md hover:border-clay/40 transition-all duration-300 flex flex-col">
          <div className="h-32 bg-warmBeige/60 flex items-center justify-center text-sm font-bold text-clay border-b border-warmBeige">
            💧 Water Filter
          </div>
          <div className="p-5 flex flex-col gap-2 flex-grow">
            <h3 className="font-bold text-charcoal text-base">Microfiltration Straw</h3>
            <p className="text-xs text-stone-500 leading-relaxed">Filters microplastics, bacteria, and cysts instantly.</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-base font-bold text-terracotta">$18.50</span>
              <button className="px-4 py-1.5 bg-terracotta text-white font-bold rounded-lg text-xs hover:bg-terracotta/90 transition-all cursor-pointer">Buy</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
