'use client';

import React, { Component, ErrorInfo, ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';

interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  time: string;
  isSelf: boolean;
}

interface VideoCallInterfaceProps {
  appointment?: any;
  targetApptId: string;
  onEndCall: () => void;
}

function VideoCallInterface({ appointment, targetApptId, onEndCall }: VideoCallInterfaceProps) {
  const { token: authToken, user } = useAuth();
  
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
  const selfVideoRef = useRef<HTMLDivElement | null>(null);
  const pipRef = useRef<HTMLDivElement | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [remoteConnected, setRemoteConnected] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);

  // In-Call Chat State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Draggable PiP State
  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Agora SDK refs
  const agoraClientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);
  const joinedRef = useRef<boolean>(false);

  const selfEmail = user?.email || (typeof window !== 'undefined' ? sessionStorage.getItem('user_email') || 'user_a' : 'user_a');
  const selfName = user?.fullName || (appointment?.userEmail ? appointment.userEmail.split('@')[0] : 'You');
  const patientName = appointment?.petName || 'Patient';
  const doctorOrTitle = appointment?.vetName || 'Doctor';

  // 1. Freeze body scroll when call modal is open
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('video-call-active');

      return () => {
        document.body.style.overflow = originalStyle;
        document.body.classList.remove('video-call-active');
      };
    }
  }, []);

  // Timer for active call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat feed to bottom
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Agora SDK initialization and join
  useEffect(() => {
    if (typeof window === 'undefined' || !targetApptId) return;

    let isMounted = true;
    const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

    const initAgora = async () => {
      try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        agoraClientRef.current = client;

        client.on('user-published', async (remoteUser: any, mediaType: 'audio' | 'video') => {
          await client.subscribe(remoteUser, mediaType as any);
          
          if (mediaType === 'video') {
            if (isMounted) setRemoteConnected(true);
            if (remoteVideoRef.current) {
              remoteUser.videoTrack?.play(remoteVideoRef.current);
            }
          }
          
          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (remoteUser: any, mediaType: string) => {
          if (mediaType === 'video') {
            // keep status
          }
        });

        client.on('user-left', () => {
          if (isMounted) setRemoteConnected(false);
        });

        const tokenRes = await fetch(`${API_BASE}/appointments/${targetApptId}/token`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.token) throw new Error(tokenData.message || 'Unable to authorize video call');
        const agoraToken: string = tokenData.token;
        const uid: number = tokenData.uid;

        try {
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
            { encoderConfig: 'speech_standard' },
            { encoderConfig: { width: 640, height: 480, frameRate: 15 } }
          );

          if (!isMounted) {
            audioTrack.close();
            videoTrack.close();
            return;
          }

          localAudioTrackRef.current = audioTrack;
          localVideoTrackRef.current = videoTrack;

          if (selfVideoRef.current) {
            videoTrack.play(selfVideoRef.current);
          }
          setStreamActive(true);
        } catch (mediaErr) {
          console.warn('Camera/mic access issue, attempting audio-only:', mediaErr);
          try {
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: 'speech_standard' });
            if (!isMounted) {
              audioTrack.close();
              return;
            }
            localAudioTrackRef.current = audioTrack;
            setStreamActive(true);
          } catch (audioErr) {
            console.warn('Audio capture also failed:', audioErr);
            setStreamActive(true);
          }
        }

        const channelName = tokenData.channelName;
        await client.join(tokenData.appId || AGORA_APP_ID, channelName, agoraToken, uid);
        joinedRef.current = true;

        const tracksToPublish = [localAudioTrackRef.current, localVideoTrackRef.current].filter(Boolean);
        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish);
        }

        if (authToken) {
          try {
            await fetch(`${API_BASE}/appointments/${targetApptId}/consultation/start`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${authToken}` }
            });
          } catch (e) {}
        }

      } catch (err) {
        console.error('Agora init error:', err);
      }
    };

    initAgora();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        try {
          if (localAudioTrackRef.current) {
            localAudioTrackRef.current.close();
            localAudioTrackRef.current = null;
          }
          if (localVideoTrackRef.current) {
            localVideoTrackRef.current.close();
            localVideoTrackRef.current = null;
          }
          if (agoraClientRef.current && joinedRef.current) {
            await agoraClientRef.current.leave();
            joinedRef.current = false;
          }
        } catch (e) {
          console.warn('Agora cleanup error:', e);
        }
      };
      cleanup();
    };
  }, [targetApptId, authToken]);

  const receiveChatMessage = useCallback((senderName: string, text: string) => {
    if (!text || !text.trim()) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setMessages((prev) => {
      if (prev.some((m) => m.text === text && m.senderName === senderName && Math.abs(Date.now() - Number(m.id)) < 2000)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: String(Date.now()),
          senderName,
          text,
          time: nowStr,
          isSelf: false
        }
      ];
    });

    if (!isChatOpen) {
      setUnreadCount((count) => count + 1);
    }
  }, [isChatOpen]);

  const lastSignalTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (!authToken || !targetApptId) return;
    
    lastSignalTimeRef.current = Date.now() - 500;
    const signalInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/appointments/${targetApptId}/call/signals?since=${lastSignalTimeRef.current}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.signals && data.signals.length > 0) {
            for (const item of data.signals) {
              if (item.timestamp > lastSignalTimeRef.current) {
                lastSignalTimeRef.current = item.timestamp;
                const signal = item.signal;
                if (signal && signal.type === 'chat' && signal.senderEmail !== selfEmail) {
                  receiveChatMessage(signal.senderName, signal.text);
                }
              }
            }
          }
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(signalInterval);
  }, [authToken, targetApptId, selfEmail, receiveChatMessage]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const textToSend = chatInput.trim();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      senderName: selfName,
      text: textToSend,
      time: nowStr,
      isSelf: true
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    if (authToken) {
      try {
        await fetch(`${API_BASE}/appointments/${targetApptId}/call/signal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ signal: { type: 'chat', senderName: selfName, senderEmail: selfEmail, text: textToSend } })
        });
      } catch (e) {}
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(!nextMuted);
    }
  };

  const handleToggleVideo = () => {
    const nextVideoOff = !videoOff;
    setVideoOff(nextVideoOff);
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.setEnabled(!nextVideoOff);
    }
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!pipRef.current) return;
    const rect = pipRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    setIsDragging(true);
    setPipPos({ x: rect.left, y: rect.top });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPipPos({
      x: clientX - dragOffsetRef.current.x,
      y: clientY - dragOffsetRef.current.y
    });
  };

  const handleDragEnd = () => {
    if (!isDragging || !pipRef.current) return;
    setIsDragging(false);

    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 700;
    const rect = pipRef.current.getBoundingClientRect();

    const padding = 16;
    const targetX = rect.left + rect.width / 2 > winWidth / 2 
      ? winWidth - rect.width - padding 
      : padding;
    
    const targetY = Math.max(
      padding + 70, 
      Math.min(rect.top, winHeight - rect.height - 95)
    );

    setPipPos({ x: targetX, y: targetY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className="fixed inset-0 z-[3000] bg-[#09090B] flex flex-col items-center justify-center overflow-hidden select-none touch-none">
      
      {/* Top Glassmorphism Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-4 sm:p-6 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-white flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-200">
              Live Consultation
            </span>
            <span className="text-white/40">•</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {formatDuration(callDuration)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onEndCall}
          className="px-4 py-2 bg-white/10 hover:bg-rose-600 hover:text-white border border-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer backdrop-blur-md"
        >
          Leave Room
        </button>
      </div>

      {/* Main Video Screen Container */}
      <div className="relative w-full h-full flex items-center justify-center bg-[#121215]">
        <div
          ref={remoteVideoRef}
          className={`w-full h-full transition-opacity duration-300 ${remoteConnected ? 'opacity-100' : 'opacity-0 absolute'}`}
          style={{ background: 'transparent' }}
        />

        {!remoteConnected && (
          <div className="flex flex-col items-center justify-center p-8 text-white text-center gap-4 animate-fadeIn">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-[#1C2E24] border border-emerald-600/40 flex items-center justify-center text-4xl shadow-2xl text-emerald-400 font-extrabold">
                {patientName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-white">{doctorOrTitle} & {patientName}</h4>
              <p className="text-xs text-stone-400 font-medium mt-1">
                {streamActive ? 'Connecting stream with participant...' : 'Initializing media stream...'}
              </p>
            </div>
          </div>
        )}

        <div
          ref={pipRef}
          onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
          onTouchStart={(e) => e.touches[0] && handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
          style={
            pipPos
              ? {
                  position: 'fixed',
                  left: `${pipPos.x}px`,
                  top: `${pipPos.y}px`,
                  transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }
              : undefined
          }
          className={`w-32 h-44 sm:w-40 sm:h-52 bg-black/90 rounded-2xl border border-white/20 overflow-hidden shadow-2xl z-40 group select-none ${
            pipPos ? '' : 'absolute bottom-24 right-4 sm:bottom-28 sm:right-6'
          } ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl' : 'cursor-grab hover:border-emerald-400/50'}`}
        >
          <div
            ref={selfVideoRef}
            className={`w-full h-full pointer-events-none ${!videoOff ? 'block' : 'hidden'}`}
            style={{ transform: 'scaleX(-1)' }}
          />

          {videoOff && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-400 text-xs font-bold gap-1 pointer-events-none">
              <svg className="w-6 h-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M21 21l-4.35-4.35M17 11V7a2 2 0 0 0-2-2H7" />
              </svg>
              <span>Camera Off</span>
            </div>
          )}

          <div className="absolute top-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded-md">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M8 9h8M8 15h8" />
            </svg>
          </div>

          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-white font-bold pointer-events-none">
            You
          </div>
        </div>

      </div>

      {/* FLOATING IN-CALL CHAT DRAWER */}
      {isChatOpen && (
        <div className="absolute bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 max-h-[420px] bg-[#18181C]/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-2xl z-50 flex flex-col gap-3 animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">In-Call Chat</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="text-stone-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-64 flex flex-col gap-2.5 pr-1 text-xs">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-[11px] font-medium italic">
                No messages yet. Type a message below...
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <span className="text-[9.5px] font-bold text-stone-400 mb-0.5 px-1">
                    {msg.senderName} • {msg.time}
                  </span>
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed break-words ${
                      msg.isSelf
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white/15 text-stone-100 rounded-bl-none border border-white/10'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-1 border-t border-white/10"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message..."
              className="flex-1 bg-white/10 text-white placeholder-stone-400 text-xs px-3.5 py-2.5 rounded-xl border border-white/15 focus:border-emerald-400 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Call Controls Panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#18181C]/90 backdrop-blur-xl border border-white/15 px-5 py-3 rounded-full flex items-center gap-4 shadow-2xl z-30 pointer-events-auto">
        
        <button
          type="button"
          onClick={handleToggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            muted
              ? 'bg-rose-600 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
          }`}
          title={muted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {muted ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={handleToggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            videoOff
              ? 'bg-rose-600 text-white'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
          }`}
          title={videoOff ? 'Turn On Camera' : 'Turn Off Camera'}
        >
          {videoOff ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsChatOpen((prev) => !prev)}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            isChatOpen
              ? 'bg-emerald-600 text-white border border-emerald-400'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
          }`}
          title="In-Call Chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#09090B] animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onEndCall}
          className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-md cursor-pointer shrink-0"
          title="End Call"
        >
          <svg className="w-5 h-5 transform rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.27 1.11l-2.2 2.2z" />
          </svg>
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
      console.warn('Caught call boundary error:', event.error);
      this.setState({ hasError: true, error: event.error });
      event.preventDefault();
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
      console.warn('Caught call promise rejection:', reason);
      const err = reason instanceof Error ? reason : new Error(String(reason));
      this.setState({ hasError: true, error: err });
      event.preventDefault();
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
    console.error('Call Boundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center gap-4 max-w-md mx-auto my-6 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xl font-bold">⚠️</div>
          <div>
            <h4 className="text-sm font-extrabold text-rose-800">Call Connection Failed</h4>
            <p className="text-xs text-rose-900/70 font-semibold leading-relaxed mt-1">
              The video session encountered a device conflict or permission issue. Please check your camera permissions and try again.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Retry Connection
          </button>
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

  const handleEndCall = async () => {
    try {
      if (targetApptId) {
        await fetch(`${API_BASE}/appointments/${targetApptId}/consultation/end`, {
          method: 'PUT',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });
        await fetch(`${API_BASE}/appointments/${targetApptId}/call/end`, {
          method: 'PUT',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });
      }
    } catch (err) {
      console.error('Error ending call:', err);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black flex flex-col animate-fadeIn">
      <SafeCallBoundary>
        <VideoCallInterface
          appointment={appointment}
          targetApptId={targetApptId}
          onEndCall={handleEndCall}
        />
      </SafeCallBoundary>
    </div>
  );
}

