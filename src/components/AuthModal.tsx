import React, { useState } from 'react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/speech';
import { X, KeyRound, User, Mail, Building, Check, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState(currentUser.username || 'admin');
  const [displayName, setDisplayName] = useState(currentUser.displayName || 'Michael G. Scott');
  const [email, setEmail] = useState(currentUser.email || 'easybusiness.cop@gmail.com');
  const [password, setPassword] = useState('password123');
  const [companyName, setCompanyName] = useState(currentUser.preferences.companyName || 'Dunder Mifflin Paper Co.');
  const [tone, setTone] = useState(currentUser.preferences.tone || 'Witty & Professional');
  const [customInstructions, setCustomInstructions] = useState(currentUser.preferences.customInstructions || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playNotification();

    const updatedProfile: UserProfile = {
      id: isSignUp ? `user-${Date.now()}` : currentUser.id,
      username,
      displayName,
      email,
      avatar: isSignUp ? '🧑‍💼' : currentUser.avatar,
      role: 'admin',
      preferences: {
        ...currentUser.preferences,
        companyName,
        tone,
        customInstructions,
      },
      createdAt: currentUser.createdAt || Date.now(),
      lastLogin: Date.now(),
    };

    onLogin(updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs font-mono select-none p-4">
      <div className="w-full max-w-md bg-[#fbf1c7] dark:bg-[#1d2021] border-2 border-[#fabd2f] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#ebdbb2] dark:bg-[#282828] border-b border-[#d5c4a1] dark:border-[#3c3836]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#b57614] dark:text-[#fabd2f]" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#3c3836] dark:text-[#ebdbb2]">
              {isSignUp ? 'REGISTER AGENT OPERATOR' : 'OPERATOR AUTHENTICATION'}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-[#d5c4a1] dark:border-[#3c3836] text-xs">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 font-bold text-center transition-colors ${
              !isSignUp
                ? 'bg-[#fabd2f] text-[#1d2021]'
                : 'bg-[#ebdbb2] dark:bg-[#181615] text-[#7c6f64] dark:text-[#a89984]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 font-bold text-center transition-colors ${
              isSignUp
                ? 'bg-[#fabd2f] text-[#1d2021]'
                : 'bg-[#ebdbb2] dark:bg-[#181615] text-[#7c6f64] dark:text-[#a89984]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs text-[#3c3836] dark:text-[#ebdbb2]">
          <div>
            <label className="block text-[11px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-1">
              OPERATOR USERNAME
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
              />
              <User className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#7c6f64] dark:text-[#928374]" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-1">
              DISPLAY NAME (Personalized Greeting)
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-1">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
              />
              <Mail className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#7c6f64] dark:text-[#928374]" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-1">
              COMPANY / FLEET ORG
            </label>
            <div className="relative">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
              />
              <Building className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[#7c6f64] dark:text-[#928374]" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-1">
              AGENT PERSONALIZATION TONE
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
            >
              <option className="text-slate-900 bg-white" value="Witty & Professional (The Office style)">Witty & Professional (The Office style)</option>
              <option className="text-slate-900 bg-white" value="Ultra-Concise Enterprise">Ultra-Concise Enterprise</option>
              <option className="text-slate-900 bg-white" value="Deeply Technical / Coding Specialist">Deeply Technical / Coding Specialist</option>
              <option className="text-slate-900 bg-white" value="Executive Briefing & Strategic">Executive Briefing & Strategic</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-1">
              CUSTOM PROMPT DIRECTIVES (Applies to all agents)
            </label>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Always output code in TypeScript, prioritize unit economics in finance..."
              className="w-full px-3 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            id="btn-auth-submit"
            className="w-full py-2 bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors mt-2"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSignUp ? 'Create Account & Sync Fleet' : 'Sign In to Command Center'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
