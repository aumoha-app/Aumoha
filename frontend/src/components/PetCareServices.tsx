export type ServiceType = 'All' | 'Grooming' | 'Boarding' | 'Walking' | 'Training';

const PET_CARE_SERVICES = [
  {
    id: 1,
    title: 'Paws & Shine Grooming',
    subtitle: 'Independent groomer • Calm home visits',
    rating: '4.8',
    reviews: 230,
    location: '2.1 km away',
    serviceTag: 'Grooming',
    price: 699,
    imageUrl: '/warden-1.png'
  },
  {
    id: 2,
    title: 'Happy Stay Daycare',
    subtitle: 'Daycare & boarding with trusted hosts',
    rating: '4.9',
    reviews: 340,
    location: '1.8 km away',
    serviceTag: 'Boarding',
    price: 499,
    imageUrl: '/warden-2.png'
  },
  {
    id: 3,
    title: 'Walk & Wag Club',
    subtitle: 'Solo walking and activity sessions',
    rating: '4.7',
    reviews: 180,
    location: '1.4 km away',
    serviceTag: 'Walking',
    price: 349,
    imageUrl: '/warden-3.png'
  },
  {
    id: 4,
    title: 'Puppy Power Training',
    subtitle: 'Reward-based manners and play training',
    rating: '4.6',
    reviews: 120,
    location: '3.0 km away',
    serviceTag: 'Training',
    price: 549,
    imageUrl: '/product-4.png'
  }
];

interface PetCareServicesProps {
  activeFilter: ServiceType;
}

export default function PetCareServices({ activeFilter }: PetCareServicesProps) {
  const visibleServices = activeFilter === 'All'
    ? PET_CARE_SERVICES
    : PET_CARE_SERVICES.filter(service => service.serviceTag === activeFilter);

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4">
        {visibleServices.map((service) => (
          <div key={service.id} className="bg-[#FCFAF7] border border-[#E8E4DB] rounded-[28px] p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#D4E8D0]">
            <div className="grid md:grid-cols-[120px_1fr] gap-4 items-center">
              <div className="w-full h-28 md:h-32 rounded-[22px] bg-[#F5F3EF] overflow-hidden">
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-serif text-[#1C1A17] leading-tight truncate">{service.title}</h3>
                    <p className="text-[11px] md:text-sm text-stone-500 mt-1 leading-relaxed">{service.subtitle}</p>
                  </div>
                  <span className="text-[9px] md:text-[10px] uppercase tracking-[0.24em] text-[#3D6B41] font-bold bg-[#E0F2DD] px-3 py-1 rounded-full select-none whitespace-nowrap">{service.serviceTag}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] md:text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-semibold text-[#4A9D6F]">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    {service.rating}
                  </span>
                  <span>({service.reviews})</span>
                  <span>•</span>
                  <span>{service.location}</span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm md:text-base font-extrabold text-[#1C1A17]">From ₹{service.price}</span>
                  <button className="inline-flex items-center justify-center rounded-xl bg-[#4A9D6F] px-4 py-2 text-xs md:text-sm font-bold text-white hover:bg-[#3D7A56] transition-all">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {visibleServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-500 font-medium">No services found for this category.</p>
        </div>
      )}
    </section>
  );
}
