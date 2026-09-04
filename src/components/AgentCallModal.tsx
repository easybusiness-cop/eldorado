import React, { useState, useEffect, useRef } from 'react';
import { Agent, AgentCallSession } from '../types';
import { soundFx, speakText } from '../utils/speech';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  Sparkles,
  RotateCcw,
  Clock,
  UserCheck,
} from 'lucide-react';

interface AgentCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  currentAgent?: Agent | null;
  onSelectAgent: (agentId: string) => void;
  onExecutePrompt: (prompt: string) => Promise<void>;
  userDisplayName: string;
}

export const AgentCallModal: React.FC<AgentCallModalProps> = ({
  isOpen,
  onClose,
  agents,
  currentAgent,
  onSelectAgent,
  onExecutePrompt,
  userDisplayName,
}) => {
  const [session, setSession] = useState<AgentCallSession>(() => ({
    agentId: currentAgent?.id || '',
    status: 'ringing',
    durationSeconds: 0,
    isMuted: false,
    transcripts: [],
  }));

  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [waveBars, setWaveBars] = useState<number[]>([15, 25, 45, 60, 30, 20, 50, 75, 40, 25]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Sync session when agent changes or modal opens
  useEffect(() => {
    if (isOpen && currentAgent) {
      soundFx.playNotification();
      setSession({
        agentId: currentAgent.id,
        status: 'ringing',
        durationSeconds: 0,
        isMuted: false,
        transcripts: [
          {
            sender: 'agent',
            text: `Connecting to ${currentAgent.name}'s direct office line...`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      });

      // Simulate ring-then-pickup
      const pickupTimer = setTimeout(() => {
        setSession((prev) => ({
          ...prev,
          status: 'connected',
          startedAt: Date.now(),
          transcripts: [
            ...prev.transcripts,
            {
              sender: 'agent',
              text: `Hello ${userDisplayName || 'Operator'}, this is ${currentAgent.name} (${currentAgent.role.split('/')[0]}). Line is secure. How can I assist you right now?`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ],
        }));

        speakText(
          `Hello ${userDisplayName || 'Operator'}, this is ${currentAgent.name}. Line is secure. How can I assist you right now?`,
          currentAgent,
          1.0,
          currentAgent.voicePitch
        );
      }, 1500);

      return () => clearTimeout(pickupTimer);
    } else if (!isOpen) {
      handleEndCall();
    }
  }, [isOpen, currentAgent?.id]);

  // Duration timer
  useEffect(() => {
    if (session.status === 'connected') {
      timerRef.current = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
        }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session.status]);

  // Animated wave visualizer effect
  useEffect(() => {
    if (session.status === 'connected') {
      const waveInterval = setInterval(() => {
        setWaveBars((prev) =>
          prev.map(() => Math.floor(Math.random() * (isAgentSpeaking || isListening ? 85 : 20)) + 10)
        );
      }, 120);
      return () => clearInterval(waveInterval);
    }
  }, [session.status, isAgentSpeaking, isListening]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setSpokenTranscript(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (spokenTranscript.trim()) {
            handleSendUserVoice(spokenTranscript);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [spokenTranscript]);

  const handleToggleMic = () => {
    soundFx.playClick();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setSpokenTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        // Handle quick restart
        setIsListening(true);
      }
    }
  };

  const handleSendUserVoice = async (text: string) => {
    if (!text.trim() || !currentAgent) return;

    soundFx.playNotification();
    const userMsg = text.trim();
    setSpokenTranscript('');

    setSession((prev) => ({
      ...prev,
      transcripts: [
        ...prev.transcripts,
        {
          sender: 'user',
          text: userMsg,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    }));

    setIsAgentSpeaking(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: currentAgent.id,
          agentName: currentAgent.name,
          agentRole: currentAgent.role,
          prompt: `[Phone Call Direct Audio Interaction] User says: "${userMsg}". Respond concisely and directly as spoken over telephone audio.`,
          userProfile: { displayName: userDisplayName },
        }),
      });

      const data = await res.json();
      const reply = data.text || 'Understood, executing your instruction right away.';

      setSession((prev) => ({
        ...prev,
        transcripts: [
          ...prev.transcripts,
          {
            sender: 'agent',
            text: reply,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));

      speakText(reply, currentAgent, 1.0, currentAgent.voicePitch);
    } catch (e) {
      setSession((prev) => ({
        ...prev,
        transcripts: [
          ...prev.transcripts,
          {
            sender: 'agent',
            text: `[Audio Transmission Error] Patching line connection.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));
    } finally {
      setIsAgentSpeaking(false);
    }
  };

  const handleEndCall = () => {
    soundFx.playClick();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSession((prev) => ({ ...prev, status: 'ended' }));
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen || !currentAgent) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs font-mono select-none p-4">
      <div className="w-full max-w-lg bg-[#181615] border-2 border-[#fabd2f] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-200 text-[#ebdbb2]">
        {/* Call Top Header */}
        <div className="px-4 py-3 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
              1-ON-1 AGENT HOTLINE • SECURE VOIP
            </span>
          </div>

          <button
            onClick={handleEndCall}
            className="p-1 hover:text-red-400 rounded text-[#a89984]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Agent Switcher Pills */}
        <div className="px-3 py-2 bg-[#1d2021] border-b border-[#3c3836] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {agents.map((agt) => (
            <button
              key={agt.id}
              onClick={() => {
                soundFx.playClick();
                onSelectAgent(agt.id);
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 flex items-center gap-1 border transition-colors ${
                agt.id === currentAgent.id
                  ? 'bg-[#fabd2f] text-[#1d2021] border-[#fabd2f]'
                  : 'bg-[#282828] text-[#a89984] border-[#3c3836] hover:text-[#ebdbb2]'
              }`}
            >
              <span>{agt.avatar}</span>
              <span>{agt.nickname}</span>
            </button>
          ))}
        </div>

        {/* Calling / Connected Central Stage */}
        <div className="p-4 bg-gradient-to-b from-[#1d2021] to-[#141312] border-b border-[#3c3836] flex flex-col items-center justify-center text-center">
          {/* Avatar Ring */}
          <div className="relative mb-3">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2 transition-all ${
                session.status === 'connected'
                  ? 'ring-4 ring-emerald-500/40 border-emerald-500 shadow-lg shadow-emerald-950'
                  : 'border-[#fabd2f] animate-bounce'
              }`}
              style={{ backgroundColor: currentAgent.color + '20' }}
            >
              <span>{currentAgent.avatar}</span>
            </div>

            {session.status === 'connected' && (
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#181615]" />
            )}
          </div>

          <div className="font-bold text-sm text-[#ebdbb2]">{currentAgent.name}</div>
          <div className="text-[11px] text-[#a89984]">{currentAgent.title}</div>

          {/* Status badge & Duration */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                session.status === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {session.status === 'connected' ? '● LIVE SECURE CALL' : '◌ RINGING DESK...'}
            </span>

            {session.status === 'connected' && (
              <div className="flex items-center gap-1 text-[11px] text-[#fabd2f] font-bold">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(session.durationSeconds)}</span>
              </div>
            )}
          </div>

          {/* Audio Waveform Bars */}
          {session.status === 'connected' && (
            <div className="flex items-center justify-center gap-1 h-10 mt-3 w-48">
              {waveBars.map((height, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    isAgentSpeaking
                      ? 'bg-[#fabd2f]'
                      : isListening
                      ? 'bg-emerald-400'
                      : 'bg-[#3c3836]'
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Live Audio Transcript Scroll */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs bg-[#121110]">
          <div className="text-[10px] text-[#7c6f64] uppercase font-bold tracking-wider mb-1 text-center">
            REAL-TIME CALL TRANSCRIPT
          </div>

          {session.transcripts.map((t, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                t.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="text-[9px] text-[#7c6f64] mb-0.5">
                {t.sender === 'user' ? userDisplayName || 'Operator' : currentAgent.nickname} •{' '}
                {t.timestamp}
              </div>
              <div
                className={`px-3 py-1.5 rounded-lg max-w-[85%] text-[11px] leading-relaxed select-text ${
                  t.sender === 'user'
                    ? 'bg-[#fabd2f] text-[#1d2021] font-medium'
                    : 'bg-[#282828] text-[#ebdbb2] border border-[#3c3836]'
                }`}
              >
                {t.text}
              </div>
            </div>
          ))}

          {spokenTranscript && (
            <div className="flex flex-col items-end">
              <div className="text-[9px] text-emerald-400">Listening to voice...</div>
              <div className="px-3 py-1.5 rounded-lg max-w-[85%] text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse">
                {spokenTranscript}
              </div>
            </div>
          )}
        </div>

        {/* Call Action Controls Dock */}
        <div className="p-3 bg-[#1d2021] border-t border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMic}
              className={`p-3 rounded-full font-bold flex items-center gap-1.5 transition-all shadow-md ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-[#1d2021]'
              }`}
              title={isListening ? 'Stop Speaking' : 'Hold to Speak / Talk'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="text-[11px] pr-1">{isListening ? 'Listening...' : 'Speak'}</span>
            </button>

            <button
              onClick={() => {
                const manual = prompt('Type quick message to speak over hotline:');
                if (manual) handleSendUserVoice(manual);
              }}
              className="px-2.5 py-2 rounded bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] border border-[#3c3836] text-[11px] font-bold"
            >
              Text-in
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              }}
              className="p-2 rounded bg-[#282828] text-[#a89984] hover:text-[#ebdbb2] border border-[#3c3836]"
              title="Stop current speech"
            >
              <VolumeX className="w-4 h-4" />
            </button>

            <button
              onClick={handleEndCall}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Hang Up</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
