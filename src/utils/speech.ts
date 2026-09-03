import { Agent } from '../types';

// Web Audio sound synthesizer for retro office sounds and clicks
class SoundFX {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }

  playNotification() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playSuccessChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const time = this.ctx!.currentTime + i * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(time);
        osc.stop(time + 0.2);
      });
    } catch (e) {}
  }

  playSuccess() {
    this.playSuccessChime();
  }

  playWarning() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(320, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }
}

export const soundFx = new SoundFX();

// Text to Speech
export function speakText(text: string, agent?: Agent, rateMultiplier = 1, pitchMultiplier = 1) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Clean text from code blocks or markdown tokens before speaking
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code block generated.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*#_>-]/g, '')
    .slice(0, 300); // Limit length for crisp voice responses

  window.speechSynthesis.cancel(); // Cancel any ongoing speech

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voices = window.speechSynthesis.getVoices();

  // Find a good English voice if available
  const enVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('Samantha') || v.name.includes('Alex')));
  if (enVoice) {
    utterance.voice = enVoice;
  }

  utterance.pitch = (agent ? agent.voicePitch : 1.0) * pitchMultiplier;
  utterance.rate = (agent ? agent.voiceRate : 1.0) * rateMultiplier;

  window.speechSynthesis.speak(utterance);
}

// Speech to Text (Web Speech Recognition)
export function createSpeechRecognizer(
  onResult: (transcript: string, isFinal?: boolean) => void,
  onError: (err: string) => void,
  onEnd: () => void,
  options: { continuous?: boolean; lang?: string } = {}
) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onError('Speech recognition not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = true;
  recognition.lang = options.lang || 'en-US';

  recognition.onresult = (event: any) => {
    let current = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      current += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }
    if (current) {
      onResult(current, isFinal);
    }
  };

  recognition.onerror = (event: any) => {
    onError(event.error || 'Speech recognition error');
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}

/**
 * Parses user speech for the wake phrase:
 * "Rufflo, initialize [Mission Name]" or "Ruflo, initialize [Mission Name]"
 * Also supports natural variations:
 * - "Hey Rufflo, initialize [Mission Name]"
 * - "Rufflo initialize [Mission Name]"
 * - "Initialize mission [Mission Name]"
 */
export function parseMissionVoiceTrigger(transcript: string): string | null {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.trim();

  // Primary pattern: "Rufflo/Ruflo, initialize <Mission Name>" or "Hey Rufflo, initialize <Mission Name>"
  const primaryRegex = /(?:hey\s+)?(?:rufflo|ruflo)[,\s:]+initialize\s+(?:mission\s+)?(.+)/i;
  const matchPrimary = text.match(primaryRegex);
  if (matchPrimary && matchPrimary[1]) {
    const missionName = cleanMissionName(matchPrimary[1]);
    if (missionName) return missionName;
  }

  // Secondary pattern: "Initialize mission <Mission Name>" or "Initialize <Mission Name>"
  const secondaryRegex = /^(?:please\s+)?initialize\s+(?:mission\s+)?(.+)/i;
  const matchSecondary = text.match(secondaryRegex);
  if (matchSecondary && matchSecondary[1]) {
    const missionName = cleanMissionName(matchSecondary[1]);
    if (missionName) return missionName;
  }

  return null;
}

/**
 * Parses user speech for direct agent task delegation:
 * "Rufflo, tell [Agent] to [Task / Command]" or "Rufflo, ask [Agent] to [Task]" or "Rufflo, assign [Agent] to [Task]"
 */
export function parseAgentVoiceDelegation(transcript: string): { agentName: string; taskDescription: string } | null {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.trim();

  // Pattern: "Rufflo/Ruflo, (tell|ask|assign|instruct) [Agent] to [Task]"
  const delegationRegex = /(?:hey\s+)?(?:rufflo|ruflo)[,\s:]+(?:tell|ask|assign|instruct|have)\s+([a-zA-Z\s]+?)\s+(?:to|for|with)\s+(.+)/i;
  const match = text.match(delegationRegex);
  if (match && match[1] && match[2]) {
    const rawAgent = match[1].trim();
    const rawTask = match[2].trim().replace(/[.,!?;:]+$/, '');
    if (rawAgent && rawTask) {
      return {
        agentName: cleanAgentName(rawAgent),
        taskDescription: cleanMissionName(rawTask)
      };
    }
  }

  return null;
}

function cleanAgentName(raw: string): string {
  const normalized = raw.toLowerCase().trim();
  if (normalized.includes('michael')) return 'michael';
  if (normalized.includes('dwight')) return 'dwight';
  if (normalized.includes('jim')) return 'jim';
  if (normalized.includes('pam')) return 'pam';
  if (normalized.includes('kevin')) return 'kevin';
  if (normalized.includes('ryan')) return 'ryan';
  if (normalized.includes('stanley')) return 'stanley';
  if (normalized.includes('toby')) return 'toby';
  if (normalized.includes('cline') || normalized.includes('coder') || normalized.includes('developer')) return 'cline';
  if (normalized.includes('osint') || normalized.includes('intel')) return 'osint-crawler';
  if (normalized.includes('security') || normalized.includes('sentinel')) return 'security-sentinel';
  return normalized;
}

function cleanMissionName(raw: string): string {
  let cleaned = raw.trim();
  // Strip trailing punctuation
  cleaned = cleaned.replace(/[.,!?;:]+$/, '').trim();
  // Remove wrapping quotes if present
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  // Capitalize nicely if lowercase
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

export interface AudioCaptureController {
  stop: () => void;
  stream: MediaStream | null;
}

/**
 * Microphone Browser API helper
 * Captures live audio from navigator.mediaDevices.getUserMedia and reports real-time audio volume levels (0-100)
 */
export async function startMicrophoneAudioCapture(
  onAudioLevel?: (level: number) => void
): Promise<AudioCaptureController | null> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      return {
        stream,
        stop: () => {
          stream.getTracks().forEach((track) => track.stop());
        },
      };
    }

    const audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrameId: number;

    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      // Scale to roughly 0-100%
      const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));

      if (onAudioLevel) {
        onAudioLevel(normalizedLevel);
      }
      animationFrameId = requestAnimationFrame(checkLevel);
    };

    checkLevel();

    return {
      stream,
      stop: () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        stream.getTracks().forEach((track) => track.stop());
        try {
          audioCtx.close();
        } catch (e) {}
      },
    };
  } catch (err) {
    console.warn('Microphone audio capture error / permission denied:', err);
    return null;
  }
}
