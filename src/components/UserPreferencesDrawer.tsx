import React from 'react';
import { UserProfile, UserPreferences } from '../types';
import { soundFx } from '../utils/speech';
import { X, Volume2, Cpu, Sliders, Moon, Sparkles, Check, RefreshCw } from 'lucide-react';

interface UserPreferencesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const UserPreferencesDrawer: React.FC<UserPreferencesDrawerProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePreferences,
}) => {
  if (!isOpen) return null;

  const prefs = userProfile.preferences;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs font-mono select-none">
      <div className="w-full max-w-sm h-full bg-[#fbf1c7] dark:bg-[#1d2021] border-l-2 border-[#d5c4a1] dark:border-[#3c3836] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#ebdbb2] dark:bg-[#282828] border-b border-[#d5c4a1] dark:border-[#3c3836]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#b57614] dark:text-[#fabd2f]" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#3c3836] dark:text-[#ebdbb2]">
              AGENT & FLEET PREFERENCES
            </span>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 hover:text-red-500 rounded text-[#7c6f64] dark:text-[#a89984]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-[#3c3836] dark:text-[#ebdbb2]">
          {/* Voice Settings */}
          <div className="p-3 rounded bg-[#ebdbb2]/40 dark:bg-[#282828]/50 border border-[#d5c4a1] dark:border-[#3c3836] space-y-3">
            <div className="flex items-center justify-between font-bold text-[11px] pb-1 border-b border-[#d5c4a1] dark:border-[#3c3836]">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#b57614] dark:text-[#fabd2f]" />
                <span>VOICE & AUDIO (TTS)</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.voiceAutoSpeak}
                onChange={(e) => onUpdatePreferences({ voiceAutoSpeak: e.target.checked })}
                className="accent-[#fabd2f]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span>Speech Rate Multiplier</span>
                <span>{prefs.speechRate || 1.0}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={prefs.speechRate || 1.0}
                onChange={(e) => onUpdatePreferences({ speechRate: parseFloat(e.target.value) })}
                className="w-full accent-[#fabd2f]"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span>Voice Pitch Multiplier</span>
                <span>{prefs.speechPitch || 1.0}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={prefs.speechPitch || 1.0}
                onChange={(e) => onUpdatePreferences({ speechPitch: parseFloat(e.target.value) })}
                className="w-full accent-[#fabd2f]"
              />
            </div>
          </div>

          {/* 24*7 Continuous Auto-Debugger Setting */}
          <div className="p-3 rounded bg-[#ebdbb2]/40 dark:bg-[#282828]/50 border border-[#d5c4a1] dark:border-[#3c3836] space-y-2">
            <div className="flex items-center justify-between font-bold text-[11px] pb-1 border-b border-[#d5c4a1] dark:border-[#3c3836]">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                <span>24*7 CONTINUOUS DEBUGGER</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.continuousDebug ?? true}
                onChange={(e) => onUpdatePreferences({ continuousDebug: e.target.checked })}
                className="accent-[#fabd2f]"
              />
            </div>
            <p className="text-[10px] text-[#7c6f64] dark:text-[#a89984]">
              When enabled, Toby Flenderson background daemon continuously scans memory, prevents event loop lag, and applies self-healing code patches non-stop.
            </p>
          </div>

          {/* Persona Tone */}
          <div>
            <label className="block text-[11px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-1">
              FLEET RESPONSE TONE
            </label>
            <select
              value={prefs.tone}
              onChange={(e) => onUpdatePreferences({ tone: e.target.value })}
              className="w-full px-3 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
            >
              <option className="text-slate-900 bg-white" value="Witty & Professional (The Office style)">Witty & Professional (The Office style)</option>
              <option className="text-slate-900 bg-white" value="Ultra-Concise Enterprise">Ultra-Concise Enterprise</option>
              <option className="text-slate-900 bg-white" value="Deeply Technical / Coding Specialist">Deeply Technical / Coding Specialist</option>
              <option className="text-slate-900 bg-white" value="Executive Briefing & Strategic">Executive Briefing & Strategic</option>
            </select>
          </div>

          {/* Custom User Instructions */}
          <div>
            <label className="block text-[11px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-1">
              CUSTOM INSTRUCTIONS (Applied across all agents)
            </label>
            <textarea
              rows={4}
              value={prefs.customInstructions}
              onChange={(e) => onUpdatePreferences({ customInstructions: e.target.value })}
              placeholder="e.g. Always output code snippets in TypeScript with unit tests..."
              className="w-full px-3 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-[#ebdbb2] dark:bg-[#282828] border-t border-[#d5c4a1] dark:border-[#3c3836]">
          <button
            onClick={() => {
              soundFx.playNotification();
              onClose();
            }}
            className="w-full py-2 bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
