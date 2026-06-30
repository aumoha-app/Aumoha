'use client';

export default function Profile() {
  return (
    <main className="w-full max-w-4xl mx-auto bg-warmCard border border-warmBeige rounded-3xl p-6 md:p-10 shadow-sm flex flex-col gap-6 transition-all duration-300">
      <div className="flex items-center gap-5 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-terracotta to-clay text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
          U
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-charcoal">Anonymous User</h2>
          <p className="text-xs text-stone-400 font-semibold mt-0.5">Node Hash ID: <span className="text-terracotta">aumoha-node-ff921</span></p>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="bg-cream/40 border border-warmBeige rounded-2xl p-6 flex flex-col gap-2">
          <h3 className="text-base font-bold text-charcoal">⚙️ Node Configurations</h3>
          <p className="text-xs text-stone-500 leading-relaxed">Customize offline synchronizations and storage levels.</p>
          <button className="px-4 py-2 border border-warmBeige bg-white text-charcoal font-bold text-xs rounded-xl hover:bg-cream/60 transition-all cursor-pointer mt-4 w-fit">
            Configure settings
          </button>
        </div>

        <div className="bg-cream/40 border border-warmBeige rounded-2xl p-6 flex flex-col gap-2">
          <h3 className="text-base font-bold text-charcoal">🛡️ Security Keys</h3>
          <p className="text-xs text-stone-500 leading-relaxed">Backup cryptographic keys and verify local node handshake credentials.</p>
          <button className="px-4 py-2 border border-warmBeige bg-white text-charcoal font-bold text-xs rounded-xl hover:bg-cream/60 transition-all cursor-pointer mt-4 w-fit">
            Manage Keys
          </button>
        </div>
      </section>
    </main>
  );
}
