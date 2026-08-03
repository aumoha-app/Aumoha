'use client';

import { useState } from 'react';
import { 
  Scissors, 
  Home, 
  Footprints, 
  Award, 
  ShieldCheck, 
  Star, 
  MapPin, 
  MessageCircle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Phone, 
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ServiceType = 'All' | 'Grooming' | 'Boarding' | 'Walking' | 'Training';

export interface PetCareProvider {
  id: number;
  title: string;
  subtitle: string;
  rating: string;
  reviews: number;
  location: string;
  serviceTag: 'Grooming' | 'Boarding' | 'Walking' | 'Training';
  price: number;
  priceUnit: string;
  imageUrl: string;
  verified: boolean;
  experience: string;
  description: string;
  features: string[];
  timing: string;
  phone: string;
}

const PET_CARE_SERVICES: PetCareProvider[] = [
  {
    id: 1,
    title: 'Paws & Shine Spa',
    subtitle: 'Full bath, hair trim, ear cleaning & nail clipping',
    rating: '4.9',
    reviews: 230,
    location: '1.2 km away • Saheed Nagar',
    serviceTag: 'Grooming',
    price: 699,
    priceUnit: 'per session',
    imageUrl: '/pet_grooming_service.png',
    verified: true,
    experience: '6+ yrs experience',
    description: 'Certified pet aesthetician specializing in stress-free home grooming sessions for dogs and cats. Uses organic, hypoallergenic shampoos.',
    features: ['Stress-Free Home Visit', 'Medicated Anti-Flea Bath', 'De-Shedding Treatment', 'Nail Trimming & Ear Hygiene'],
    timing: '09:00 AM - 07:00 PM',
    phone: '+91 98765 43210'
  },
  {
    id: 2,
    title: 'Happy Stay Haven',
    subtitle: 'Cage-free home daycare & overnight boarding',
    rating: '4.9',
    reviews: 340,
    location: '1.8 km away • Sector 4',
    serviceTag: 'Boarding',
    price: 499,
    priceUnit: 'per night',
    imageUrl: '/pet_boarding_service.png',
    verified: true,
    experience: '8+ yrs experience',
    description: 'Spacious, climate-controlled home boarding with 24/7 CCTV access, outdoor play lawn, and personalized meal schedules.',
    features: ['24/7 Live Video Feed', 'Spacious Fenced Yard', 'On-Call Vet Partner', 'Daily Photo & Video Updates'],
    timing: '24 Hours Open',
    phone: '+91 98765 43211'
  },
  {
    id: 3,
    title: 'Walk & Wag Outdoor Club',
    subtitle: 'Solo & group energetic fitness walks',
    rating: '4.8',
    reviews: 180,
    location: '1.4 km away • Park Circle',
    serviceTag: 'Walking',
    price: 349,
    priceUnit: 'per 45-min walk',
    imageUrl: '/pet_walking_service.png',
    verified: true,
    experience: '4+ yrs experience',
    description: 'Professional pet walkers equipped with GPS tracking apps. Structured exercise and positive reinforcement during every stroll.',
    features: ['Live GPS Route Tracking', 'Fresh Water & Paws Wipe', 'Solo / Duo Walks', 'Flexible Morning & Evening Slots'],
    timing: '06:00 AM - 08:00 PM',
    phone: '+91 98765 43212'
  },
  {
    id: 4,
    title: 'Puppy Power Academy',
    subtitle: 'Positive reinforcement obedience & manners',
    rating: '4.7',
    reviews: 120,
    location: '2.5 km away • Green Glen',
    serviceTag: 'Training',
    price: 549,
    priceUnit: 'per class',
    imageUrl: '/pet_training_service.png',
    verified: true,
    experience: '7+ yrs experience',
    description: 'Humane, reward-based training sessions for puppies and adult dogs. Behavioral correction, potty training, and leash discipline.',
    features: ['Clicker Training Methods', 'Potty & Crate Discipline', 'Socialization Drills', 'Custom Home Action Plan'],
    timing: '08:00 AM - 06:00 PM',
    phone: '+91 98765 43213'
  }
];

interface PetCareServicesProps {
  activeFilter: ServiceType;
  searchQuery?: string;
  sortBy?: 'rating' | 'price' | 'distance';
}

export default function PetCareServices({ activeFilter, searchQuery = '', sortBy = 'rating' }: PetCareServicesProps) {
  const { user } = useAuth();

  // Modal States
  const [selectedProvider, setSelectedProvider] = useState<PetCareProvider | null>(null);
  const [bookingProvider, setBookingProvider] = useState<PetCareProvider | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [bookingDate, setBookingDate] = useState<string>('Tomorrow');
  const [bookingTime, setBookingTime] = useState<string>('10:00 AM');
  const [selectedPet, setSelectedPet] = useState<string>(user?.pets?.[0]?.name || 'My Pet');
  const [bookingMonth, setBookingMonth] = useState(new Date().getMonth());
  const [bookingYear, setBookingYear] = useState(new Date().getFullYear());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(new Date().getDate());

  // Filter & Sort Logic
  let filteredServices = PET_CARE_SERVICES.filter(service => {
    const matchesTag = activeFilter === 'All' || service.serviceTag === activeFilter;
    const matchesSearch = searchQuery === '' || 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      service.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  if (sortBy === 'price') {
    filteredServices = [...filteredServices].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'rating') {
    filteredServices = [...filteredServices].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  }

  const getTagBadge = (tag: string) => {
    switch (tag) {
      case 'Grooming':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-[#E8F0EA] text-[#2D4536] border border-[#2D4536]/20 px-2.5 py-1 rounded-full">
            <Scissors className="w-3 h-3 text-[#2D4536]" /> Grooming
          </span>
        );
      case 'Boarding':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-[#FCFAF7] text-clay border border-[#EBE3D5] px-2.5 py-1 rounded-full">
            <Home className="w-3 h-3 text-clay" /> Boarding
          </span>
        );
      case 'Walking':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-[#FAF6F0] text-[#B68A35] border border-[#EBE3D5] px-2.5 py-1 rounded-full">
            <Footprints className="w-3 h-3 text-[#B68A35]" /> Walking
          </span>
        );
      case 'Training':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-[#F5FAF6] text-[#2F5233] border border-[#D9EBDC] px-2.5 py-1 rounded-full">
            <Award className="w-3 h-3 text-[#2F5233]" /> Training
          </span>
        );
      default:
        return null;
    }
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingConfirmed(true);
  };

  return (
    <section className="w-full flex flex-col gap-4">
      {/* SERVICE PROVIDERS CARDS */}
      <div className="grid grid-cols-1 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-[#FCFAF7] border border-[#F0EBE1] hover:border-[#2D4536]/30 rounded-[28px] p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-5 items-stretch group"
          >
            {/* Left Image / Visual Container */}
            <div className="w-full md:w-[130px] h-[130px] rounded-[22px] bg-[#F5F3EF] border border-[#EBE3D5] overflow-hidden shrink-0 relative flex items-center justify-center">
              <img
                src={service.imageUrl}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Right Details Column */}
            <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base md:text-lg font-serif font-bold text-charcoal leading-tight truncate group-hover:text-[#2D4536] transition-colors">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 font-medium leading-relaxed mt-1 line-clamp-2">
                    {service.subtitle}
                  </p>
                </div>
                <div className="shrink-0">
                  {getTagBadge(service.serviceTag)}
                </div>
              </div>

              {/* Meta stats row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-medium border-y border-[#F0EBE1] py-2">
                <span className="flex items-center gap-1 text-stone-500 font-semibold text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {service.location}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-stone-500 font-semibold text-[11px]">{service.experience}</span>
              </div>

              {/* Action & Price Footer */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider leading-none">Starting Fee</span>
                  <span className="text-base font-extrabold text-[#2D4536] mt-0.5">
                    ₹{service.price} <span className="text-[10px] font-semibold text-stone-400">{service.priceUnit}</span>
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProvider(service)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-[#EBE3D5] hover:bg-stone-50 text-charcoal font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setBookingProvider(service);
                      setBookingConfirmed(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#2D4536] hover:bg-[#1E2E24] text-white font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-sm shadow-[#2D4536]/20 flex items-center gap-1.5"
                  >
                    <span>Book Care</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="bg-[#FCFAF7] border border-dashed border-[#EBE3D5] rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-stone-300" />
          <p className="text-xs font-bold text-charcoal">No care providers match your criteria</p>
          <p className="text-[10px] text-stone-400">Try resetting filters or searching for another neighborhood.</p>
        </div>
      )}

      {/* ==================== PROVIDER DETAILS MODAL ==================== */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-[#1C1A17]/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 transition-all">
          <div className="bg-white w-full max-w-lg rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-5 max-h-[85vh] overflow-y-auto scrollbar-hide animate-scaleIn select-none mb-14 sm:mb-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#F0EBE1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#FCFAF7] border border-[#F0EBE1] overflow-hidden shrink-0">
                  <img src={selectedProvider.imageUrl} alt={selectedProvider.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-charcoal flex items-center gap-1.5">
                    {selectedProvider.title}
                  </h3>
                  <span className="text-[11px] text-stone-500 font-semibold block mt-0.5">{selectedProvider.subtitle}</span>
                  <div className="flex items-center gap-2 mt-1">
                    {getTagBadge(selectedProvider.serviceTag)}
                    <span className="text-[10px] text-stone-400 font-bold">{selectedProvider.experience}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProvider(null)}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">About Care Provider</span>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                {selectedProvider.description}
              </p>
            </div>

            {/* Highlights / Features list */}
            <div className="flex flex-col gap-2 bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-4">
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Service Highlights</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {selectedProvider.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D4536] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timing & Contact */}
            <div className="flex flex-col gap-2 text-xs font-semibold text-stone-600 border-t border-[#F0EBE1] pt-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-stone-400 font-bold">
                  <Clock className="w-3.5 h-3.5" /> Working Hours
                </span>
                <span className="text-charcoal font-bold">{selectedProvider.timing}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-stone-400 font-bold">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </span>
                <span className="text-charcoal font-bold">{selectedProvider.location}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <a
                href={`tel:${selectedProvider.phone}`}
                className="py-3 border border-stone-200 hover:border-charcoal text-charcoal font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
              >
                <Phone className="w-3.5 h-3.5 text-[#2D4536]" /> Call Provider
              </a>
              <button
                onClick={() => {
                  setBookingProvider(selectedProvider);
                  setSelectedProvider(null);
                  setBookingConfirmed(false);
                }}
                className="py-3 bg-[#2D4536] hover:bg-[#1E2E24] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-center shadow-md shadow-[#2D4536]/15"
              >
                Book Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BOOKING APPOINTMENT MODAL ==================== */}
      {bookingProvider && (
        <div className="fixed inset-0 bg-[#1C1A17]/65 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 transition-all">
          <div className="bg-white w-full max-w-md rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-5 max-h-[85vh] overflow-y-auto scrollbar-hide animate-scaleIn select-none mb-14 sm:mb-0">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-3.5">
              <div>
                <h3 className="font-serif text-lg font-bold text-charcoal">Book {bookingProvider.serviceTag}</h3>
                <span className="text-[11px] text-stone-400 font-bold block mt-0.5">{bookingProvider.title}</span>
              </div>
              <button
                onClick={() => setBookingProvider(null)}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            {bookingConfirmed ? (
              <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#2D4536]">Booking Request Submitted!</h4>
                  <p className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
                    Thank you! <strong>{bookingProvider.title}</strong> has received your request for {bookingDate} at {bookingTime}.
                  </p>
                </div>

                <div className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-4 text-left flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-400 font-semibold">Service</span>
                    <span className="font-bold text-charcoal">{bookingProvider.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400 font-semibold">Pet</span>
                    <span className="font-bold text-charcoal">{selectedPet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400 font-semibold">Scheduled Slot</span>
                    <span className="font-bold text-[#2D4536]">{bookingDate} • {bookingTime}</span>
                  </div>
                </div>

                <button
                  onClick={() => setBookingProvider(null)}
                  className="w-full py-3 bg-[#2D4536] hover:bg-[#1E2E24] text-white font-bold rounded-2xl text-xs transition-all shadow-md mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="flex flex-col gap-4">
                {/* Pet Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Select Pet</label>
                  <input
                    type="text"
                    value={selectedPet}
                    onChange={(e) => setSelectedPet(e.target.value)}
                    placeholder="Enter pet name (e.g. Max)"
                    required
                    className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl py-2.5 px-3.5 text-xs text-charcoal font-semibold outline-none focus:border-[#2D4536]"
                  />
                </div>

                {/* SELECT DATE & TIME GRID */}
                <div className="flex flex-col gap-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-[22px] p-3.5 sm:p-4">
                  
                  {/* SELECT DATE Header */}
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest">SELECT DATE</label>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-xs font-bold text-[#1C1A17]">
                        {['January','February','March','April','May','June','July','August','September','October','November','December'][bookingMonth]} {bookingYear}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (bookingMonth === 11) {
                            setBookingMonth(0);
                            setBookingYear(prev => prev + 1);
                          } else {
                            setBookingMonth(prev => prev + 1);
                          }
                        }}
                        className="w-5 h-5 rounded-full hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-all cursor-pointer font-bold text-xs"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 text-center">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                      <span key={d} className="text-[8.5px] font-bold text-stone-400 uppercase py-0.5">{d}</span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-y-1 text-center">
                    {Array.from({ length: new Date(bookingYear, bookingMonth, 1).getDay() }).map((_, i) => (
                      <span key={`blank-${i}`} />
                    ))}
                    {Array.from({ length: new Date(bookingYear, bookingMonth + 1, 0).getDate() }).map((_, i) => {
                      const dayNum = i + 1;
                      const isSelected = selectedCalendarDay === dayNum;
                      const isPast = new Date().getMonth() === bookingMonth && new Date().getFullYear() === bookingYear && dayNum < new Date().getDate();
                      
                      return (
                        <div key={dayNum} className="flex flex-col items-center justify-center">
                          <button
                            type="button"
                            disabled={isPast}
                            onClick={() => {
                              setSelectedCalendarDay(dayNum);
                              const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][bookingMonth];
                              setBookingDate(`${mName} ${dayNum}`);
                            }}
                            className={`w-7 h-7 rounded-full text-[11px] font-bold transition-all flex items-center justify-center ${
                              isPast 
                                ? 'text-stone-300 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-[#2D4536] text-white shadow-2xs font-extrabold'
                                  : 'text-[#1C1A17] hover:bg-[#F4F0EA] cursor-pointer'
                            }`}
                          >
                            {dayNum}
                          </button>
                          {!isPast && (
                            <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-emerald-400' : 'bg-stone-400'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* SELECT TIME Header & Slots */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#E8E2D8]">
                    <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest">SELECT TIME</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['10:00 AM', '02:00 PM', '05:30 PM'].map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setBookingTime(time)}
                          className={`py-2 px-2 border rounded-xl text-xs font-extrabold transition-all text-center cursor-pointer ${
                            bookingTime === time
                              ? 'bg-[#2D4536] border-[#2D4536] text-white shadow-xs'
                              : 'bg-white border-[#E5E0D8] text-[#1C1A17] hover:bg-[#F4F0EA]'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Price total */}
                <div className="flex justify-between items-center bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3.5 my-1">
                  <span className="text-xs font-bold text-stone-600">Total Fee</span>
                  <span className="text-base font-extrabold text-[#2D4536]">₹{bookingProvider.price}</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2D4536] hover:bg-[#1E2E24] text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-[#2D4536]/20 cursor-pointer active:scale-98"
                >
                  Confirm Reservation
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
