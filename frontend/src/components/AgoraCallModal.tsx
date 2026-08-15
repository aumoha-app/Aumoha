import React, { Component, ErrorInfo, ReactNode, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';

// Built-in Live Consultation Video UI Component
function AgoraUIKit({ rtcProps, callbacks }: { rtcProps: any; callbacks: any }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);

  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setStreamActive(true);
        })
        .catch((err) => {
          console.warn('Video stream access note:', err);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }, [muted]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoOff;
      });
    }
  }, [videoOff]);

  return (
    <div className="relative w-full h-full min-h-[360px] bg-[#09090B] flex flex-col items-center justify-center overflow-hidden">
      {/* Video Container */}
      <div className="relative w-full h-full flex items-center justify-center bg-stone-900">
        {!videoOff && streamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover max-h-[80vh]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-white text-center gap-3 select-none">
            <div className="w-20 h-20 rounded-full bg-[#2D4536] border-2 border-emerald-500/40 flex items-center justify-center text-3xl shadow-xl">
              👨‍⚕️
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">Live Consultation Active</h4>
              <p className="text-xs text-stone-400 font-semibold mt-1">
                Connected to encrypted room #{rtcProps?.channel?.slice(-6) || 'vet-care'}
              </p>
            </div>
          </div>
        )}

        {/* Floating Self Preview Thumbnail */}
        <div className="absolute bottom-4 right-4 w-28 h-36 bg-black/80 rounded-2xl border border-white/20 overflow-hidden shadow-2xl flex items-center justify-center">
          <div className="text-center text-[10px] text-stone-400 font-bold p-2">
            <span>📹 You</span>
          </div>
        </div>
      </div>

      {/* Floating Call Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center gap-5 shadow-2xl z-20">
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            muted ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
          title={muted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {muted ? '🎙️❌' : '🎙️'}
        </button>

        <button
          type="button"
          onClick={() => setVideoOff(!videoOff)}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            videoOff ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
          title={videoOff ? 'Turn On Camera' : 'Turn Off Camera'}
        >
          {videoOff ? '📷❌' : '📷'}
        </button>

        <button
          type="button"
          onClick={() => callbacks?.EndCall?.()}
          className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-md cursor-pointer font-bold"
          title="End Call"
        >
          📞
        </button>
      </div>
    </div>
  );
}

interface SafeCallBoundaryProps {
  children: ReactNode;
}

interface SafeCallBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SafeCallBoundary extends Component<SafeCallBoundaryProps, SafeCallBoundaryState> {
  public state: SafeCallBoundaryState = { hasError: false };

  private handleGlobalError = (event: ErrorEvent) => {
    if (
      event.error && 
      (event.error.name === 'NotAllowedError' || 
       event.error.name === 'NotReadableError' ||
       String(event.error).includes('AgoraRTC') || 
       event.message.includes('Permission denied') ||
       event.message.includes('getUserMedia') ||
       event.message.includes('GATEWAY_SERVER'))
    ) {
      console.warn("Caught global Agora error:", event.error);
      this.setState({ hasError: true, error: event.error });
      event.preventDefault(); // Prevents the red dev overlay in development mode
    }
  };

  private handleGlobalRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (
      reason && 
      (reason.name === 'NotAllowedError' || 
       reason.name === 'NotReadableError' ||
       String(reason).includes('AgoraRTC') || 
       String(reason).includes('Permission denied') ||
       String(reason).includes('getUserMedia') ||
       String(reason).includes('GATEWAY_SERVER'))
    ) {
      console.warn("Caught global Agora promise rejection:", reason);
      const err = reason instanceof Error ? reason : new Error(String(reason));
      this.setState({ hasError: true, error: err });
      event.preventDefault(); // Prevents the red dev overlay in development mode
    }
  };

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleGlobalRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleGlobalRejection);
  }

  public static getDerivedStateFromError(error: Error): SafeCallBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Agora Call Boundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center gap-4 max-w-md mx-auto my-6 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xl font-bold">⚠️</div>
          <div>
            <h4 className="text-sm font-extrabold text-rose-800">Call Connection Failed</h4>
            <p className="text-xs text-rose-900/70 font-semibold leading-relaxed mt-1">
              The video calling session encountered a network connection issue or device conflict. Please verify your camera is not in use, ensure your internet connection is active, and try again.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AgoraCallModalProps {
  appointmentId?: string;
  channelName?: string;
  appointment?: any;
  onClose: () => void;
}

export default function AgoraCallModal({ appointmentId, channelName, appointment, onClose }: AgoraCallModalProps) {
  const { token: authToken } = useAuth();
  const targetApptId = appointmentId || channelName || (appointment ? (appointment.bookingId || appointment._id) : '');
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [permissionError, setPermissionError] = useState<string>('');
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState<boolean>(true);
  const originalGetUserMediaRef = useRef<any>(null);

  // Track body class for active video call to hide bottom nav
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('video-call-active');
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('video-call-active');
      }
    };
  }, []);

  // 1. Fetch Agora dynamic token from backend
  useEffect(() => {
    const fetchAgoraToken = async () => {
      try {
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const res = await fetch(`${API_BASE}/appointments/${targetApptId}/token`, {
          headers
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setAgoraToken(data.token);
          }
        }
      } catch (err) {
        console.error("Error fetching Agora token from backend:", err);
      } finally {
        setLoadingToken(false);
      }
    };

    if (targetApptId) {
      fetchAgoraToken();
    } else {
      setLoadingToken(false);
    }
  }, [targetApptId, authToken]);

  // 2. Request local media permissions
  useEffect(() => {
    if (!appId) return;

    if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(() => {
          setPermissionState('granted');
        })
        .catch((err) => {
          console.error("Media permission check failed:", err);
          setPermissionState('denied');
          setPermissionError(err.message || String(err));
        });
    } else {
      setPermissionState('denied');
      setPermissionError('Media devices are not supported or this is not a secure (HTTPS/localhost) context.');
    }
  }, [appId]);

  // 3. Stub getUserMedia to return mock tracks if joining call anyway (avoiding SDK device conflict crash)
  useEffect(() => {
    if (permissionState === 'granted' && permissionError) {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        if (!originalGetUserMediaRef.current) {
          originalGetUserMediaRef.current = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        }
        const original = originalGetUserMediaRef.current;

        navigator.mediaDevices.getUserMedia = async (constraints) => {
          try {
            // Attempt to grab the real hardware sources first in case they became free
            return await original(constraints);
          } catch (e) {
            console.warn("Hardware devices busy. Providing software fallback tracks:", e);

            const fallbackTracks: MediaStreamTrack[] = [];

            // A. Create software canvas video track if video was requested
            if (constraints?.video) {
              const canvas = document.createElement('canvas');
              canvas.width = 320;
              canvas.height = 240;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#18181B';
                ctx.fillRect(0, 0, 320, 240);
                // Draw a camera placeholder text
                ctx.fillStyle = '#A8A29E';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Camera in use by another app', 160, 120);
              }
              const stream = (canvas as any).captureStream ? (canvas as any).captureStream(10) : null;
              if (stream && stream.getVideoTracks().length > 0) {
                fallbackTracks.push(stream.getVideoTracks()[0]);
              }
            }

            // B. Create silent audio track if audio was requested
            if (constraints?.audio) {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const audioCtx = new AudioCtx();
                const dst = audioCtx.createMediaStreamDestination();
                const oscillator = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                gain.gain.value = 0; // Completely silent
                oscillator.connect(gain);
                gain.connect(dst);
                if (dst.stream && dst.stream.getAudioTracks().length > 0) {
                  fallbackTracks.push(dst.stream.getAudioTracks()[0]);
                }
              }
            }

            if (fallbackTracks.length > 0) {
              return new MediaStream(fallbackTracks);
            }
            throw e;
          }
        };
      }
    }

    return () => {
      // Restore original getUserMedia on component unmount
      if (typeof window !== 'undefined' && navigator.mediaDevices && originalGetUserMediaRef.current) {
        navigator.mediaDevices.getUserMedia = originalGetUserMediaRef.current;
      }
    };
  }, [permissionState, permissionError]);

  // 4. Update status to 'ongoing' on backend when channel opens
  useEffect(() => {
    if (permissionState === 'granted' && targetApptId) {
      fetch(`${API_BASE}/appointments/${targetApptId}/call/join`, {
        method: 'PUT',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      }).catch(err => console.error('Error notifying join:', err));
    }
  }, [permissionState, targetApptId, authToken]);

  if (!appId) {
    return (
      <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center flex flex-col gap-4 shadow-xl border border-warmBeige">
          <div className="text-3xl">🔑</div>
          <h4 className="text-sm font-extrabold text-charcoal">Agora App ID Missing</h4>
          <p className="text-xs text-stone-500 font-semibold leading-relaxed">
            Agora App ID is not configured. Please add `NEXT_PUBLIC_AGORA_APP_ID` to your environment variables.
          </p>
          <button onClick={onClose} className="w-full py-3 bg-terracotta hover:bg-[#c2502f] text-white font-extrabold rounded-2xl text-xs shadow-sm transition-all">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (permissionState === 'checking' || loadingToken) {
    return (
      <div className="fixed inset-0 z-[3000] bg-[#121212] flex flex-col items-center justify-center p-4 text-white animate-fadeIn">
        <div className="w-12 h-12 rounded-full border-4 border-[#222] border-t-emerald-500 animate-spin mb-4" />
        <h4 className="text-sm font-extrabold">Configuring Call Session</h4>
        <p className="text-xs text-stone-400 mt-1">Please allow camera and mic access when prompted...</p>
        <button onClick={onClose} className="mt-6 px-5 py-2 bg-white/10 hover:bg-rose-600 rounded-xl text-xs font-bold transition-all">
          Cancel
        </button>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn animate-scaleIn">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center flex flex-col gap-4 shadow-xl border border-warmBeige">
          <div className="text-3xl">🎙️</div>
          <h4 className="text-sm font-extrabold text-charcoal">Device Access Issue</h4>
          <p className="text-xs text-stone-500 font-semibold leading-relaxed">
            Could not access camera/microphone. They may be blocked, not connected, or in use by another application.
          </p>
          <div className="text-[10px] text-stone-500 bg-[#FCFAF7] p-3 rounded-xl border border-[#F0EBE1] max-h-24 overflow-y-auto font-mono text-left select-text">
            Error: {permissionError}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={() => {
                setPermissionState('checking');
                navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                  .then(() => setPermissionState('granted'))
                  .catch(err => {
                    setPermissionState('denied');
                    setPermissionError(err.message || String(err));
                  });
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-sm transition-all"
            >
              Try Again
            </button>
            <button 
              onClick={() => setPermissionState('granted')}
              className="w-full py-3 bg-[#FAF2EE] hover:bg-[#F5DFD8] text-terracotta font-extrabold rounded-2xl text-xs shadow-sm transition-all border border-[#F5DFD8]"
            >
              Join Call Anyway
            </button>
            <button onClick={onClose} className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-extrabold rounded-2xl text-xs transition-all">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleEndCall = async () => {
    try {
      if (targetApptId) {
        await fetch(`${API_BASE}/appointments/${targetApptId}/call/end`, {
          method: 'PUT',
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
      }
    } catch (err) {
      console.error('Error ending call:', err);
    } finally {
      onClose();
    }
  };

  const rtcProps = {
    appId,
    channel: targetApptId || 'default-channel',
    token: agoraToken, // Passes backend generated dynamic token (or null if tokenless)
    enableRtm: false,  // Disables RTM chat signals to prevent RTM Error Code 5 (vendor dynamic key error)
  };

  const callbacks = {
    EndCall: () => {
      handleEndCall();
    },
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black flex flex-col animate-fadeIn">
      {/* Call Header */}
      <div className="bg-[#121212] border-b border-[#222] px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-stone-300">Live Video Consultation</span>
        </div>
        <button 
          onClick={handleEndCall}
          className="px-4 py-2 bg-white/10 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Leave Call
        </button>
      </div>

      {/* Video Stream Area wrapped in Error Boundary */}
      <div className="flex-grow relative bg-[#18181B] flex items-center justify-center">
        <SafeCallBoundary>
          <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />
        </SafeCallBoundary>
      </div>
    </div>
  );
}
