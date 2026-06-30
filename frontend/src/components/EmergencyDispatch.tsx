'use client';

interface EmergencyDispatchProps {
  sosReason: string;
  setSosReason: (val: string) => void;
  emergencyType: string;
  setEmergencyType: (val: string) => void;
  sosSent: boolean;
  onSubmitSos: (e: React.FormEvent) => void;
}

export default function EmergencyDispatch({
  sosReason,
  setSosReason,
  emergencyType,
  setEmergencyType,
  sosSent,
  onSubmitSos
}: EmergencyDispatchProps) {
  return (
    <main className="w-full max-w-md mx-auto bg-warmCard border border-warmBeige rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 transition-all duration-300">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-emergency">Emergency Dispatch</h1>
        <p className="text-xs text-stone-500 font-medium mt-1">Broadcast SOS telemetry signals instantly to mesh nodes.</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 text-center flex flex-col gap-1">
          <h2 className="text-sm font-bold text-emergency uppercase tracking-wider">🚨 SOS Transmission Center</h2>
          <p className="text-xs text-rose-700 leading-relaxed">
            Pressing the button below instantly forwards your approximate location, status, and note to grid responders.
          </p>
        </div>

        <form onSubmit={onSubmitSos} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-charcoal">Distress Category</label>
            <select 
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              className="bg-cream/40 border border-warmBeige rounded-xl p-3 text-sm text-charcoal outline-none focus:border-emergency transition-all"
            >
              <option value="General">General Inquiries / Support</option>
              <option value="Medical">Medical Assistance Required</option>
              <option value="Safety">Safety & Shelter Concerns</option>
              <option value="Infrastructure">Grid Power / Water Failure</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-charcoal">Description of Emergency</label>
            <textarea
              value={sosReason}
              onChange={(e) => setSosReason(e.target.value)}
              placeholder="Provide urgent details (e.g., medical symptoms, fire hazard, structural damage)..."
              className="bg-cream/40 border border-warmBeige rounded-xl p-3 text-sm text-charcoal outline-none focus:border-emergency min-h-[90px] resize-y transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-emergency text-white font-bold rounded-xl text-sm shadow-md shadow-rose-200 hover:bg-emergency/90 transition-all cursor-pointer"
            disabled={sosSent}
          >
            {sosSent ? "🚨 Broadcasting Distress Signal..." : "Broadcast SOS Alert"}
          </button>
        </form>
      </div>
    </main>
  );
}
