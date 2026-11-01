import Link from 'next/link';

const features: Record<string, { title: string; intro: string; items: string[] }> = {
  '/vet-consult': { title: 'Veterinary consultations', intro: 'We are onboarding veterinarians. Appointments and instant consultations are not available yet.', items: ['Scheduled video consultations', 'Talk to an available veterinarian', 'Pet history and prescriptions'] },
  '/expert-support': { title: 'Expert support', intro: 'Meet the care Aumoha is building around every animal. Professional onboarding is in progress.', items: ['Animal behaviour and nutrition', 'Physiotherapy and recovery support', 'Book support when professionals join'] },
  '/pet-care': { title: 'Everyday care', intro: 'A place to discover local care partners as our network grows.', items: ['Grooming', 'Boarding', 'Pet walking'] },
  '/marketplace': { title: 'The Aumoha marketplace', intro: 'Discover our vision for animal food, supplies and recovery essentials. Orders and payments are not open at this event.', items: ['Food and everyday essentials', 'Care and recovery supplies', 'Partner brands and local sellers'] },
  '/circle': { title: 'Your Mohalla', intro: 'A local community for people who care for animals. The event preview introduces the network we are building.', items: ['Rescuers and volunteers', 'Feeding and awareness activities', 'Local updates and community support'] },
  '/profile': { title: 'Your place in Aumoha', intro: 'Care for your animals and connect with your community. Account and pet management will be available in the full app.', items: ['Your animal companions', 'Consultation history', 'Your community contributions'] },
  '/sos': { title: 'Rescue to Recovery', intro: 'Report an animal in need and coordinate local support when the rescue service opens. This event preview does not submit emergencies.', items: ['Share the animal’s location and situation', 'Connect with local rescuers', 'Follow the recovery journey'] },
};

export function EventFeaturePreview({ path }: { path: string }) {
  const feature = features[path];
  if (!feature) return null;
  return (
    <section className="mx-auto max-w-2xl py-8 sm:py-12">
      <Link href="/" className="text-sm text-[#2D4536] underline underline-offset-4">Back to Aumoha</Link>
      <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-[#E05C52]">Coming to Aumoha</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-5xl text-[#1C1A17]">{feature.title}</h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-stone-600">{feature.intro}</p>
      <div className="mt-8 grid gap-3">
        {feature.items.map((item, i) => <div key={item} className="flex gap-4 rounded-2xl border border-[#E8E2D8] bg-white/70 p-5"><span className="text-sm text-[#E05C52]">0{i + 1}</span><span className="text-sm font-medium text-[#2D4536]">{item}</span></div>)}
      </div>
      <p className="mt-8 text-sm text-stone-500">Visit the Mohalle Mastane team at the event to learn more.</p>
    </section>
  );
}

export const eventPreviewPaths = new Set(Object.keys(features));
