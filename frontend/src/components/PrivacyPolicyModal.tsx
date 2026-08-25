'use client';

import { X, Lock, FileText, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PRIVACY_POLICY_SECTIONS = [
  {
    number: '1',
    title: 'SCOPE AND PURPOSE',
    content: `This Privacy Policy explains how Aumoha collects, uses, stores, shares, protects and otherwise processes personal data when you use the Platform. It applies to users of Aumoha and, where relevant, to information submitted in connection with animals, rescue requests, veterinary consultations and community activity.
This Policy should be read together with Aumoha’s Terms & Conditions.`
  },
  {
    number: '2',
    title: 'INFORMATION WE MAY COLLECT',
    content: `Account and Profile Information:
When you create or use an account, we may process information such as:
• name;
• email address;
• phone number, where collected;
• profile photograph, where provided;
• account identifiers;
• authentication and login-related information; and
• other profile information you choose to provide.

Animal and Pet Information:
When you create an animal or pet profile or use veterinary functionality, we may process:
• animal name, type, breed, age, sex and other profile details;
• animal photographs;
• symptoms and health information;
• vaccination or treatment history;
• prescriptions and diagnostic reports;
• consultation notes or related records made available through the Platform; and
• other animal-care information you choose to provide.

Rescue and SOS Information:
When you submit or participate in a rescue request, we may process:
• reported rescue location;
• description of the animal or incident;
• photographs, videos or other media you submit;
• rescue status and updates;
• responder or volunteer participation information; and
• communications or other information reasonably necessary to coordinate the request.

Location Information:
Where you grant permission or otherwise provide a location, Aumoha may process approximate or precise location information for functions such as rescue/SOS coordination, identifying an animal’s location, showing relevant nearby responders or services, or other location-based features requested by you.
Aumoha does not intend to collect continuous background location merely because the application is installed. If background location is introduced for a future feature, this Policy and the relevant permission flow should be updated before such use.

Camera, Microphone, Photos and Files:
Depending on the feature you choose to use, the Platform may request access to:
• camera, for video consultations or capturing animal/rescue images;
• microphone, for audio/video consultations;
• photos or selected media, when you choose to upload images; and
• files or documents, when you choose to upload prescriptions, reports or other relevant records.
Where technically available, Aumoha should use system photo/file pickers so that users can select the specific content they wish to share instead of granting unnecessary broad storage access.

Consultation and Appointment Information:
When you book or participate in veterinary services, we may process:
• veterinarian or service selected;
• appointment date and time;
• booking and consultation status;
• animal information supplied for the consultation;
• prescriptions, recommendations or related records;
• technical call information such as participants, timing, duration or connection status where necessary; and
• support or dispute-related information concerning the consultation.

Community and User Content:
If you use community functionality, we may process content you choose to submit, such as posts, comments, rescue updates, photographs, videos, reports and related interaction information.

Payment and Transaction Information:
For paid services, we may process transaction-related information such as:
• service or order information;
• amount payable or paid;
• payment status;
• transaction/order identifiers;
• payment-provider reference; and
• refund or cancellation information.
Payments may be processed by independent payment service providers. Aumoha does not directly store sensitive payment credentials such as your UPI PIN, CVV, banking password, payment OTP or complete card credentials.

Technical and Security Information:
We may process technical information reasonably necessary to operate and secure the Platform, including:
• IP address;
• device, browser or application information;
• login and security events;
• error, diagnostic and performance information;
• timestamps and activity logs; and
• information necessary to detect fraud, abuse or unauthorized access.`
  },
  {
    number: '3',
    title: 'HOW WE USE INFORMATION',
    content: `We may process personal data for purposes including:
• creating, authenticating and managing user accounts;
• providing requested Platform features and services;
• creating and maintaining animal or pet profiles;
• facilitating veterinary bookings and consultations;
• facilitating rescue/SOS coordination;
• providing location-based functionality requested by users;
• processing and confirming payments and refunds;
• enabling community functionality and moderation;
• responding to support requests and complaints;
• maintaining Platform security and preventing fraud, abuse or unauthorized access;
• diagnosing technical problems and improving reliability;
• complying with applicable legal and regulatory obligations;
• establishing, exercising or defending legal claims; and
• communicating important service, account, consultation or rescue updates.
We will not use personal data for a materially unrelated purpose without providing appropriate information and, where required, obtaining valid consent.`
  },
  {
    number: '4',
    title: 'DEVICE PERMISSIONS',
    content: `Aumoha may request device permissions only when relevant to a feature you choose to use. These may include location, camera, microphone, notifications and access to selected photos or files.
The actual permission request may be presented by your device, browser or operating system. You may deny or later change permissions through your device settings, although the corresponding feature may then be unavailable or limited.
Permission to receive necessary service notifications should not automatically be treated as consent to unrelated promotional marketing.`
  },
  {
    number: '5',
    title: 'VIDEO AND AUDIO CONSULTATIONS',
    content: `Camera and microphone data may be transmitted as necessary to enable a veterinary audio/video consultation.
Unless Aumoha expressly informs you otherwise and obtains any consent required under applicable law, Aumoha does not record or retain the contents of veterinary audio/video consultations.
Technical information about a consultation, such as booking details, participants, timing, duration or connection status, may be processed where reasonably necessary for operation, security, support or dispute resolution.`
  },
  {
    number: '6',
    title: 'HOW INFORMATION MAY BE SHARED',
    content: `Aumoha does not sell personal data merely as a business model. Information may be shared only where reasonably necessary for legitimate Platform functions, with appropriate safeguards and subject to applicable law.

Veterinarians and Service Professionals:
Information reasonably necessary for a consultation or requested service may be made available to the relevant veterinarian or professional. Access should be limited to information reasonably required for the service they are authorized to provide.

Rescuers, Volunteers and Relevant Participants:
Information necessary to coordinate a rescue may be shared with relevant responders, volunteers, animal-welfare organizations or service participants. Aumoha avoids unnecessarily exposing a user’s private contact details or unrelated personal information to the wider community.

Technology and Service Providers:
We may use third-party service providers to support functions such as:
• authentication;
• cloud hosting and databases;
• payment processing;
• video/audio communications;
• maps, geocoding and location services;
• media or file storage;
• notifications;
• email or communications;
• security, diagnostics and technical support.
Such providers process information on our behalf or as independent service providers according to their role, contractual terms and applicable law.

Legal and Safety Requirements:
We may disclose information where reasonably necessary to:
• comply with applicable law, legal process or lawful government requests;
• protect the rights, safety or security of users, animals, Aumoha or others;
• investigate fraud, abuse or security incidents; or
• establish, exercise or defend legal claims.

Business Reorganization:
If the business or relevant Platform assets are subject to a merger, acquisition, restructuring or transfer, information may be transferred as part of that transaction subject to applicable law and appropriate safeguards.`
  },
  {
    number: '7',
    title: 'COMMUNITY AND PUBLIC CONTENT',
    content: `Information you deliberately publish in community or public-facing areas may be visible to other users according to the design of the relevant feature.
Do not publish private phone numbers, home addresses, identification documents or other sensitive information unless genuinely necessary and you are comfortable with the intended audience seeing it.
Aumoha may provide reporting and moderation tools and may restrict or remove content where reasonably necessary for safety, privacy, legal compliance or enforcement of the Terms & Conditions.`
  },
  {
    number: '8',
    title: 'RESCUE LOCATION AND PRIVACY',
    content: `Rescue coordination may require sharing an animal’s location with relevant participants. Aumoha limits disclosure of precise location and personal contact information to what is reasonably necessary for the rescue function.
Where technically and operationally feasible, public/community displays use only the level of location detail needed for general awareness, while more precise information may be made available to relevant authorized responders when required.`
  },
  {
    number: '9',
    title: 'DATA RETENTION',
    content: `Aumoha retains personal data only for as long as reasonably necessary for the purposes for which it was collected, to provide requested services, maintain legitimate business and security records, resolve disputes, prevent fraud and comply with applicable legal obligations.
Different categories of information may require different retention periods. Transaction, security, complaint or legal records may be retained for longer where required or reasonably necessary.
When information is no longer required, Aumoha will take reasonable steps to delete or anonymize it, subject to applicable law and technical limitations.`
  },
  {
    number: '10',
    title: 'ACCOUNT DELETION',
    content: `Users may request deletion of their Aumoha account through functionality provided within the Platform or another method communicated by Aumoha.
Following a valid deletion request, personal data associated with the account will be deleted or anonymized, except information that may reasonably or legally need to be retained for:
• legal or regulatory obligations;
• transaction and accounting records;
• fraud prevention;
• security and abuse prevention;
• safety;
• complaints or dispute resolution; or
• establishment, exercise or defence of legal claims.
Deletion of an account may not automatically remove content that has been lawfully anonymized or information that another user independently provided or is legally entitled to retain.`
  },
  {
    number: '11',
    title: 'DATA SECURITY',
    content: `Aumoha uses reasonable technical and organizational safeguards appropriate to the nature of the information processed.
Measures include access controls, authentication, protected credentials, secure transmission, role-based authorization, logging and other security practices appropriate to the Platform.
No internet-based service can guarantee absolute security. Users should protect their login credentials and notify Aumoha if they suspect unauthorized account access.`
  },
  {
    number: '12',
    title: 'CHILDREN',
    content: `Aumoha is intended for independent account use by persons who are legally capable of entering into the applicable agreement. Users under 18 should not independently create paid or contractual accounts unless permitted through an appropriate parent, guardian or legally compliant mechanism implemented by Aumoha.
Aumoha does not knowingly seek to collect personal data from children for purposes unrelated to providing the requested Platform functionality.`
  },
  {
    number: '13',
    title: 'YOUR PRIVACY CHOICES AND RIGHTS',
    content: `Subject to applicable law and the nature of the processing, you may have rights or choices concerning your personal data, including the ability to:
• access or obtain information about personal data processed by Aumoha;
• request correction or updating of inaccurate or incomplete information;
• withdraw consent where processing is based on consent, subject to consequences explained at the time of withdrawal;
• request deletion of personal data where applicable;
• manage device permissions through your device settings;
• raise a complaint concerning Aumoha’s handling of personal data; and
• exercise other rights available under applicable Indian data-protection law.
Requests may be submitted using the support contact stated below. Aumoha may need to verify the requester’s identity before acting on certain requests.`
  },
  {
    number: '14',
    title: 'CONSENT AND WITHDRAWAL',
    content: `Where Aumoha relies on your consent for a particular processing activity, the request should be clear and connected to a specified purpose.
You may withdraw consent where applicable. Withdrawal will not affect processing already lawfully undertaken before withdrawal, and some Platform features may no longer function if the information or permission is necessary to provide them.`
  },
  {
    number: '15',
    title: 'COOKIES, LOCAL STORAGE AND SIMILAR TECHNOLOGIES',
    content: `The web or progressive-web version of Aumoha may use cookies, local storage or similar technologies that are necessary for functions such as authentication, security, session management, preferences or Platform operation.
If Aumoha later introduces non-essential advertising, behavioral tracking or similar technologies, the relevant privacy notice and consent implementation will be reviewed and updated before deployment.`
  },
  {
    number: '16',
    title: 'THIRD-PARTY LINKS AND SERVICES',
    content: `The Platform may contain links to or integrations with independent third-party services. Their own privacy practices may apply when you interact directly with those services.
Aumoha is not responsible for independent third-party privacy practices that are outside its control, although Aumoha will take reasonable steps when selecting providers that process information on its behalf.`
  },
  {
    number: '17',
    title: 'INTERNATIONAL OR CROSS-BORDER PROCESSING',
    content: `Some technology service providers used by Aumoha may process or store information using infrastructure located outside the user’s state or outside India, subject to applicable Indian law and any restrictions or safeguards that may apply.
Aumoha takes reasonable steps to use service providers and processing arrangements consistent with applicable legal requirements.`
  },
  {
    number: '18',
    title: 'CHANGES TO THIS PRIVACY POLICY',
    content: `Aumoha may update this Privacy Policy to reflect changes in the Platform, technology, service providers, legal requirements or data-processing practices.
The latest version will display its effective and last-updated dates. Where a change materially affects users’ rights or requires fresh consent under applicable law, Aumoha will provide appropriate notice and obtain consent where required.`
  },
  {
    number: '19',
    title: 'CONTACT AND PRIVACY SUPPORT',
    content: `For questions, privacy requests, complaints or support concerning this Privacy Policy or Aumoha’s handling of personal data, contact:

Platform: Aumoha
Operated by: Arvista Nova Private Limited
Registered Office: Rourkela, Odisha, India
Support & Privacy Email: support.aumoha@gmail.com

Requests will be handled in accordance with applicable Indian law and Aumoha procedures.`
  },
  {
    number: '20',
    title: 'ACKNOWLEDGEMENT',
    content: `By using Aumoha, you acknowledge that you have had an opportunity to review this Privacy Policy. Where a specific feature requires your consent or device permission, Aumoha will request it separately as appropriate.

© 2026 Aumoha. Operated by Arvista Nova Private Limited. All rights reserved.`
  }
];

export default function PrivacyPolicyModal({
  isOpen,
  onClose
}: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-[28px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-[#E8E2D8] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D4536]/10 text-[#2D4536] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1C1A17] leading-tight">
                Privacy Policy
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

        {/* Scrollable Privacy Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6 text-xs sm:text-[13px] text-stone-700 leading-relaxed font-sans">
          
          {/* Overview Card */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <h3 className="font-serif font-bold text-sm sm:text-base text-[#1C1A17] mb-2">
              Privacy Commitment
            </h3>
            <p className="text-stone-600 mb-2">
              Aumoha is an animal health, welfare and care technology platform owned and operated by <strong>Arvista Nova Private Limited</strong>, a company incorporated under the laws of India and having its registered office in Rourkela, Odisha, India (&ldquo;Aumoha&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;).
            </p>
            <p className="text-stone-600 font-semibold">
              Aumoha is committed to handling personal data responsibly, transparently and in accordance with applicable Indian law.
            </p>
          </div>

          {/* Detailed Sections */}
          <div className="space-y-4">
            {PRIVACY_POLICY_SECTIONS.map((sec) => (
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

          {/* Contact Support & Privacy Officer */}
          <div className="p-4 bg-[#2D4536]/5 border border-[#2D4536]/15 rounded-2xl text-[11px] text-stone-600">
            <strong>Privacy Inquiries &amp; Grievance Redressal:</strong> Arvista Nova Private Limited, Rourkela, Odisha, India. Contact: <a href="mailto:support.aumoha@gmail.com" className="underline font-bold text-[#2D4536]">support.aumoha@gmail.com</a>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-[#E8E2D8] bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2D4536] hover:bg-[#1E2E24] text-white font-extrabold text-xs transition-all shadow-md shadow-[#2D4536]/20 cursor-pointer active:scale-95"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
}
