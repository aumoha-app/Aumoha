'use client';

import { X, ShieldCheck, FileText, ChevronRight } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export const TERMS_AND_CONDITIONS_SECTIONS = [
  {
    number: '1',
    title: 'ABOUT AUMOHA',
    content: `Aumoha is a technology-enabled animal health, care and welfare platform designed to bring essential animal-care services and community support into one integrated digital ecosystem.
The Platform facilitates access to veterinary professionals, online consultations, animal health records, rescue and SOS coordination, community participation, location-based assistance and other animal-care services made available through Aumoha.

Depending on availability, location and the version of the Platform, users may be able to:
• create and maintain animal or pet profiles and health information;
• discover and connect with veterinary professionals;
• book scheduled veterinary consultations or access available consultation services;
• participate in audio/video consultations;
• receive and access consultation-related prescriptions and records;
• report injured, abandoned or distressed animals and request rescue assistance;
• coordinate with available rescuers, volunteers and animal-welfare participants;
• participate in animal-welfare and community features;
• use location-based functionality to identify relevant animal-care or rescue services;
• make payments for applicable services; and
• access additional animal health, welfare and care services introduced through the Platform.

Aumoha primarily operates as a technology platform that facilitates access, communication and coordination between users, veterinary professionals, rescuers, volunteers, service providers and other relevant participants. Unless expressly stated otherwise for a particular service, Aumoha does not itself provide veterinary medical treatment, emergency response or guaranteed rescue services.
The availability of individual features, professionals and services may vary according to location, time, operational capacity and other relevant circumstances.
Aumoha may introduce, modify, improve, suspend or discontinue Platform features or services from time to time as the Platform develops.`
  },
  {
    number: '2',
    title: 'ELIGIBILITY',
    content: `You must be at least 18 years of age and legally capable of entering into a binding agreement under applicable law to independently create an account and use paid or contractual services through Aumoha.
By creating an account, you represent that the information supplied by you is accurate and that you satisfy applicable eligibility requirements.`
  },
  {
    number: '3',
    title: 'USER ACCOUNTS',
    content: `Certain Platform functionality requires registration.
You agree to:
• provide accurate and current information;
• maintain the accuracy of your account information;
• maintain the confidentiality and security of your account;
• not permit unauthorized use of your account; and
• promptly inform Aumoha if you reasonably believe your account has been compromised.

You are responsible for activity undertaken through your account to the extent permitted by applicable law.
You must not create an account using false information, impersonate another person, or knowingly use another person’s account without authorization.
Aumoha may restrict or suspend accounts reasonably suspected of fraud, abuse, unauthorized access or material violation of these Terms.`
  },
  {
    number: '4',
    title: 'ANIMAL AND PET INFORMATION',
    content: `Aumoha may allow users to create animal or pet profiles and provide information such as photographs, age, breed, gender, symptoms, health history, vaccination information, prescriptions, reports and other animal-care information.
You are responsible for ensuring that information provided by you is accurate to the best of your knowledge.
You must not deliberately provide false or materially misleading animal-health information.
Information contained within an animal profile should not be considered a substitute for professional veterinary examination or advice where such examination or advice is necessary.`
  },
  {
    number: '5',
    title: 'VETERINARY PROFESSIONALS',
    content: `Aumoha may facilitate access to veterinarians and other appropriately listed animal-care professionals through the Platform.
Unless expressly stated otherwise for a particular service, Aumoha operates as a technology platform facilitating interaction between users and independent veterinary or animal-care professionals and does not itself practise veterinary medicine.
Veterinary professionals remain responsible for:
• maintaining applicable professional qualifications and registrations;
• exercising independent professional judgment;
• determining whether remote consultation is appropriate;
• advice, diagnosis, prescriptions or recommendations personally provided by them; and
• complying with applicable professional and legal requirements.
Aumoha may undertake reasonable verification procedures in relation to professionals listed on the Platform. Such verification does not constitute a guarantee of any particular diagnosis, treatment or health outcome.`
  },
  {
    number: '6',
    title: 'ONLINE VETERINARY CONSULTATIONS',
    content: `Aumoha may facilitate veterinary consultations through video, audio or other supported communication methods.
Remote veterinary consultation has inherent limitations and may not be appropriate for every medical condition.
Depending upon an animal’s condition, a veterinarian may recommend:
• physical examination;
• diagnostic testing;
• hospitalization;
• emergency treatment;
• referral to another veterinarian or specialist; or
• other in-person care.
Users must provide relevant and accurate information concerning the animal’s symptoms, history, medications and condition.
Aumoha does not guarantee any particular diagnosis, treatment recommendation, response to treatment or health outcome.
Where an animal appears to require urgent physical intervention, users should seek appropriate in-person veterinary assistance rather than relying solely upon an online consultation.`
  },
  {
    number: '7',
    title: 'APPOINTMENTS',
    content: `Appointment slots displayed through Aumoha depend upon the availability communicated by participating professionals.
An appointment is confirmed only after confirmation is provided through the Platform.
Users should attend scheduled consultations at the confirmed time.
Appointments may occasionally need to be cancelled, delayed or rescheduled because of veterinarian availability, emergencies, technical problems or circumstances beyond reasonable control.
Applicable cancellation, rescheduling and refund conditions shall be governed by Aumoha’s Cancellation & Refund Policy and any service-specific conditions displayed during booking.`
  },
  {
    number: '8',
    title: 'PRESCRIPTIONS AND CONSULTATION RECORDS',
    content: `Where professionally and legally appropriate, veterinarians may provide prescriptions, recommendations or consultation-related records through Aumoha.
Users may also be permitted to upload prescriptions, diagnostic reports, photographs or other animal-health documents.
Prescriptions and professional recommendations should be followed in accordance with the instructions of the issuing veterinarian.
Aumoha should not be treated as the user’s sole permanent repository for important veterinary records. Users are encouraged to retain copies of important prescriptions, reports and other medical information.`
  },
  {
    number: '9',
    title: 'ANIMAL RESCUE AND SOS FUNCTIONALITY',
    content: `Aumoha may enable users to report animals that are injured, abandoned, distressed or otherwise appear to require assistance.
The Platform may facilitate coordination between users and available:
• rescuers;
• volunteers;
• animal-welfare organizations;
• community participants;
• veterinarians; and
• other relevant services.

Nature of Rescue Assistance:
Aumoha facilitates rescue coordination. Aumoha is not a government emergency authority, police service, ambulance service or guaranteed animal-rescue service.
Submission of an SOS or rescue report does not guarantee:
• availability of a responder;
• acceptance of a rescue request;
• any particular response or arrival time;
• transportation;
• veterinary treatment; or
• a successful rescue outcome.
Where an animal requires immediate intervention, users should also contact appropriate local veterinary, civic, government or emergency services as appropriate.`
  },
  {
    number: '10',
    title: 'SAFETY DURING RESCUE',
    content: `Animal rescue situations may involve injured, frightened or unpredictable animals, traffic, unsafe locations and other hazards.
Users and volunteers should exercise reasonable judgment and must not unnecessarily endanger themselves, other persons or animals.
Aumoha does not require users to physically intervene in situations they reasonably consider unsafe.
Where appropriate, assistance should be sought from trained rescuers, veterinary professionals or relevant authorities.`
  },
  {
    number: '11',
    title: 'ACCURACY AND MISUSE OF RESCUE REPORTS',
    content: `Users submitting rescue or SOS reports should provide information that is accurate to the best of their knowledge, including the reported location and circumstances.
Users must not knowingly:
• submit fraudulent rescue requests;
• deliberately provide false locations;
• fabricate animal emergencies;
• misuse SOS functionality to harass another person; or
• interfere with legitimate rescue activity.
Serious or repeated misuse may result in restriction or suspension of the user’s account.`
  },
  {
    number: '12',
    title: 'LOCATION-BASED FUNCTIONALITY',
    content: `Certain Aumoha features may require approximate or precise device location with appropriate user permission.
Location may be used to:
• identify an animal’s reported location;
• facilitate rescue coordination;
• identify relevant nearby responders or services; and
• provide other location-dependent functionality requested by the user.
Location accuracy may depend upon device hardware, network conditions, GPS availability and information supplied by the user.
Collection and processing of location information is further explained in Aumoha’s Privacy Policy.`
  },
  {
    number: '13',
    title: 'COMMUNITY AND USER-GENERATED CONTENT',
    content: `Aumoha may allow users to submit or share photographs, videos, rescue updates, comments, descriptions and other content (“User Content”).
Users remain responsible for User Content submitted through their accounts.
Users must not knowingly upload or distribute content that:
• is unlawful;
• promotes animal cruelty or abuse;
• is threatening, abusive or harassing;
• unlawfully infringes another person’s privacy;
• infringes intellectual-property rights;
• impersonates another person or organization;
• contains deliberately false or fraudulent information;
• contains malware or harmful software;
• constitutes spam; or
• otherwise violates applicable law or these Terms.
Aumoha may review, restrict, moderate or remove User Content where reasonably necessary for safety, legal compliance, Platform integrity or enforcement of these Terms.
Users may report inappropriate content through functionality made available by Aumoha.`
  },
  {
    number: '14',
    title: 'PHOTOGRAPHS, VIDEOS AND DOCUMENTS',
    content: `Where the Platform permits uploading photographs, videos or documents, you represent that you have the lawful right to submit such material.
Users should avoid unnecessarily uploading personal information concerning unrelated individuals.
By submitting content necessary for a requested Platform service, you authorize Aumoha to process such content to the extent reasonably necessary to provide, secure and administer that service in accordance with the Privacy Policy.
Ownership of original User Content is not transferred to Aumoha merely because it is uploaded to the Platform.`
  },
  {
    number: '15',
    title: 'CAMERA, MICROPHONE AND DEVICE PERMISSIONS',
    content: `Certain Platform features may require device permissions including:
• camera;
• microphone;
• location;
• photographs or files; and
• notifications.
Permissions will be requested through the relevant device, browser or operating-system mechanisms where applicable.
Users may deny or subsequently modify permissions through their device settings, although doing so may prevent functionality dependent upon the relevant permission from operating correctly.
Further information concerning the processing associated with these permissions is provided in the Privacy Policy.`
  },
  {
    number: '16',
    title: 'VIDEO AND AUDIO CALLS',
    content: `Camera and microphone access may be required to facilitate online veterinary consultations.
Unless Aumoha expressly informs users otherwise and obtains any consent required under applicable law, Aumoha does not record or retain the contents of veterinary audio/video consultations.
Technical information relating to a consultation, such as appointment information, participants, timing, duration or connection status, may be processed where reasonably necessary for Platform operation, security, support or dispute resolution.`
  },
  {
    number: '17',
    title: 'PAYMENTS',
    content: `Certain Aumoha services may require payment.
Applicable prices and charges shall be displayed before the user confirms a transaction wherever reasonably practicable.
Payments may be processed through authorized independent payment service providers.
Aumoha generally does not directly store sensitive payment credentials such as:
• complete payment-card details;
• CVV;
• UPI PIN;
• banking passwords; or
• payment OTPs.
Users must not attempt to manipulate, circumvent or fraudulently interfere with payment functionality.
Cancellations and refunds shall be governed by the applicable Cancellation & Refund Policy.`
  },
  {
    number: '18',
    title: 'MARKETPLACE AND THIRD-PARTY SERVICES',
    content: `Where available, Aumoha may facilitate access to animal-care products or services supplied either directly by Aumoha or by independent sellers/service providers.
Where an independent third party supplies a product or service, relevant seller/provider information and applicable commercial conditions shall be displayed as required by applicable law.
Additional terms concerning pricing, delivery, returns, cancellation or refunds may apply to such transactions.`
  },
  {
    number: '19',
    title: 'THIRD-PARTY TECHNOLOGY SERVICES',
    content: `Aumoha may rely upon third-party technology and infrastructure providers for functionality including:
• authentication;
• hosting and cloud infrastructure;
• databases;
• payment processing;
• video/audio communication;
• notifications;
• maps and location services;
• storage; and
• other technical infrastructure.
Some Platform functionality may therefore depend upon the availability and performance of independent third-party systems.
Processing of personal information through such services is addressed in Aumoha’s Privacy Policy.`
  },
  {
    number: '20',
    title: 'PROHIBITED USE',
    content: `Users must not use Aumoha to:
• violate applicable law;
• gain or attempt unauthorized access to accounts or systems;
• interfere with Platform security;
• introduce malicious software;
• manipulate payments;
• scrape or systematically extract protected information without authorization;
• submit fraudulent rescue requests;
• harass veterinarians, rescuers, volunteers or other users;
• impersonate another person;
• misuse another person’s information;
• exploit or deliberately harm animals; or
• otherwise materially misuse the Platform.`
  },
  {
    number: '21',
    title: 'INTELLECTUAL PROPERTY',
    content: `Unless otherwise stated, the Aumoha name, logo, branding, software, application interface, original graphics, design elements and original Platform content are owned by or licensed to Arvista Nova Private Limited and protected by applicable intellectual-property laws.
Access to Aumoha grants users a limited, personal, non-exclusive, non-transferable and revocable right to use the Platform in accordance with these Terms.
Use of Aumoha does not transfer ownership of Aumoha’s intellectual property to users.`
  },
  {
    number: '22',
    title: 'PRIVACY',
    content: `Aumoha’s processing of personal data is governed by the Aumoha Privacy Policy.
Users should review the Privacy Policy to understand matters including:
• information collected;
• purposes of processing;
• location and device permissions;
• sharing of information;
• third-party providers;
• retention;
• security;
• account deletion; and
• applicable privacy rights.`
  },
  {
    number: '23',
    title: 'PLATFORM AVAILABILITY',
    content: `Aumoha aims to provide reliable Platform availability but does not guarantee that every feature will operate without interruption or error.
Platform functionality may be temporarily affected by:
• maintenance;
• software updates;
• internet or network failures;
• third-party infrastructure failures;
• device compatibility;
• security incidents;
• force majeure events; or
• circumstances outside Aumoha’s reasonable control.
Aumoha may temporarily suspend functionality where reasonably necessary for maintenance, security or operational purposes.`
  },
  {
    number: '24',
    title: 'DISCLAIMERS',
    content: `Aumoha provides technology designed to facilitate animal health and welfare services, access to professionals and rescue/community coordination.
To the extent permitted by applicable law, Aumoha does not guarantee:
• availability of any particular veterinarian or responder;
• successful rescue of an animal;
• any particular veterinary outcome;
• uninterrupted availability of independent third-party services;
• accuracy of information independently supplied by users or third parties; or
• outcomes outside Aumoha’s reasonable control.
Nothing in these Terms removes the independent professional responsibility of a veterinarian or other professional providing services through the Platform.`
  },
  {
    number: '25',
    title: 'LIMITATION OF LIABILITY',
    content: `To the maximum extent permitted under applicable law, Aumoha and Arvista Nova Private Limited shall not be liable for indirect, incidental, special or consequential losses arising solely from circumstances beyond their reasonable control.
Nothing in these Terms excludes or restricts:
• liability that cannot lawfully be excluded;
• statutory consumer rights;
• liability arising from fraud or wilful misconduct; or
• any right or remedy that cannot legally be restricted.
These Terms shall at all times be interpreted consistently with applicable Indian law.`
  },
  {
    number: '26',
    title: 'ACCOUNT SUSPENSION OR TERMINATION',
    content: `Aumoha may reasonably restrict, suspend or terminate access to an account in circumstances involving:
• fraud;
• serious or repeated misuse;
• unlawful activity;
• animal or human safety concerns;
• security threats;
• unauthorized system access;
• repeated fraudulent rescue reports; or
• material or repeated violation of these Terms.
Where reasonably appropriate and legally required, notice or an opportunity to address the issue may be provided.`
  },
  {
    number: '27',
    title: 'ACCOUNT DELETION',
    content: `Users may request deletion of their Aumoha account through functionality provided within the Platform or another method communicated by Aumoha.
Following a valid deletion request, associated personal information will be deleted or anonymized, subject to information that may reasonably or legally need to be retained for:
• legal obligations;
• transaction records;
• fraud prevention;
• security;
• safety;
• dispute resolution; or
• establishment, exercise or defence of legal claims.
Further information is provided in the Privacy Policy.`
  },
  {
    number: '28',
    title: 'CHANGES TO THE PLATFORM',
    content: `Aumoha may introduce, modify or discontinue features as the Platform develops.
Where a material change affects users’ legal rights or the processing of personal information, Aumoha will provide appropriate notice and obtain renewed acknowledgement or consent where required by applicable law.`
  },
  {
    number: '29',
    title: 'CHANGES TO THESE TERMS',
    content: `Aumoha may update these Terms from time to time because of changes to:
• Platform services;
• technology;
• regulatory requirements;
• security requirements; or
• applicable law.
The latest version will display its effective and last-updated dates.
Material changes will be communicated appropriately where required.`
  },
  {
    number: '30',
    title: 'GOVERNING LAW',
    content: `These Terms shall be governed by and interpreted in accordance with the laws of India.
Nothing contained in these Terms limits mandatory rights available to consumers under applicable law.`
  },
  {
    number: '31',
    title: 'JURISDICTION',
    content: `Subject to applicable consumer-protection legislation and other mandatory laws concerning jurisdiction, disputes arising in connection with these Terms or the Platform shall be subject to the jurisdiction of the competent courts at Rourkela, Odisha, India.`
  },
  {
    number: '32',
    title: 'SEVERABILITY',
    content: `If any provision of these Terms is determined to be invalid, unlawful or unenforceable, that provision shall be interpreted or limited to the extent necessary under applicable law, and the remaining provisions shall continue in effect.`
  },
  {
    number: '33',
    title: 'CONTACT AND SUPPORT',
    content: `For any questions, grievances, feedback or customer support concerning these Terms & Conditions or the Aumoha Platform, please reach out to:

Arvista Nova Private Limited
Registered Office: Rourkela, Odisha, India
Email: support.aumoha@gmail.com`
  }
];

export default function TermsModal({
  isOpen,
  onClose,
  onAccept,
  showAcceptButton = false
}: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-[28px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-[#E8E2D8] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D4536]/10 text-[#2D4536] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1C1A17] leading-tight">
                Terms &amp; Conditions
              </h2>
              <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                Version 1.0 • Effective 24 August 2026 • Arvista Nova Pvt Ltd
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 text-xs sm:text-[13px] text-stone-700 leading-relaxed font-sans">
          
          {/* Welcome & Preamble Box */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <h3 className="font-serif font-bold text-sm sm:text-base text-[#1C1A17] mb-2">
              Welcome to Aumoha
            </h3>
            <p className="text-stone-600 mb-2">
              Aumoha is an animal health, welfare and care technology platform owned and operated by <strong>Arvista Nova Private Limited</strong>, a company incorporated under the laws of India and having its registered office in Rourkela, Odisha, India (&ldquo;Aumoha&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;).
            </p>
            <p className="text-stone-600 mb-2">
              These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the Aumoha mobile application, web application, website and related services (collectively, the &ldquo;Platform&rdquo;).
            </p>
            <p className="text-stone-600 font-semibold">
              By creating an account, accessing or using the Platform, or using any service made available through Aumoha, you acknowledge that you have read, understood and agreed to these Terms and acknowledge Aumoha’s Privacy Policy. If you do not agree with these Terms, you should not use the Platform.
            </p>
          </div>

          {/* Detailed Numbered Sections */}
          <div className="space-y-4">
            {TERMS_AND_CONDITIONS_SECTIONS.map((sec) => (
              <div
                key={sec.number}
                className="bg-white border border-[#EFEBE3] rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-[#2D4536]/20 transition-all"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#2D4536]/10 text-[#2D4536] font-extrabold text-[11px] flex items-center justify-center shrink-0">
                    {sec.number}
                  </span>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1C1A17] tracking-tight">
                    {sec.title}
                  </h4>
                </div>
                <div className="text-stone-600 whitespace-pre-line text-xs leading-relaxed pl-8">
                  {sec.content}
                </div>
              </div>
            ))}
          </div>

          {/* Legal Notice Footer Box */}
          <div className="p-4 bg-[#2D4536]/5 border border-[#2D4536]/15 rounded-2xl text-[11px] text-stone-600">
            <strong>Registered Entity:</strong> Arvista Nova Private Limited, Rourkela, Odisha, India. Contact: <a href="mailto:support.aumoha@gmail.com" className="underline font-bold text-[#2D4536]">support.aumoha@gmail.com</a>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-[#E8E2D8] bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
          {showAcceptButton && onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#2D4536] hover:bg-[#1E2E24] text-white font-extrabold text-xs transition-all shadow-md shadow-[#2D4536]/20 cursor-pointer active:scale-95"
            >
              I Accept the Terms
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
