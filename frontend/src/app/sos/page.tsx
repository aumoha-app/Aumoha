'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import EmergencyDispatch from '../../components/EmergencyDispatch';
import PopupModal, { PopupConfig } from '../../components/PopupModal';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../lib/api';

export default function SosPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [sosReason, setSosReason] = useState<string>('');
  const [reportId, setReportId] = useState<string>('');
  const [sosSent, setSosSent] = useState<boolean>(false);
  const [emergencyType, setEmergencyType] = useState<string>('General');
  const [popupConfig, setPopupConfig] = useState<PopupConfig | null>(null);

  const triggerSOS = async (
    category: string,
    severity: 'critical' | 'urgent' | 'stable',
    reason: string,
    location: string,
    photo?: string,
    audio?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          severity,
          reason,
          location: location || 'Santi Nagar, Rourkela',
          photo,
          audio
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReportId(data.report?._id || '');
        setSosSent(true);
      } else {
        const err = await response.json();
        setPopupConfig({ message: err.message || 'Failed to submit SOS alert.', type: 'error' });
      }
    } catch (err) {
      console.error('Error submitting SOS:', err);
      setPopupConfig({ message: 'Network error submitting SOS report.', type: 'error' });
    }
  };

  return (
    <AppShell>
      <EmergencyDispatch 
        sosReason={sosReason}
        setSosReason={setSosReason}
        emergencyType={emergencyType}
        setEmergencyType={setEmergencyType}
        sosSent={sosSent}
        reportId={reportId}
        onSubmitSos={triggerSOS}
        onResetSos={() => {
          setSosSent(false);
          setReportId('');
          setSosReason('');
        }}
      />
      <PopupModal config={popupConfig} onClose={() => setPopupConfig(null)} />
    </AppShell>
  );
}

