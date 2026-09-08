import React, { useState } from 'react';
import { UserProfile } from '../types';
import { soundFx } from '../utils/speech';
import {
  connectGoogleWorkspace,
  signInWithFirebaseExplicit,
  signInWithSupabaseExplicit,
  setPreferredAuthEngine,
  getPreferredAuthEngine
} from '../utils/workspaceAuth';
import { X, KeyRound, User, Mail, Building, Check, Sparkles, Flame, Zap, ShieldCheck, AlertCircle, Database, Lock } from 'lucide-react';

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
  const [activeEngine, setActiveEngine] = useState<'firebase' | 'supabase'>(getPreferredAuthEngine());
  const [username, setUsername] = useState(currentUser.username || 'admin');
  const [displayName, setDisplayName] = useState(currentUser.displayName || 'Michael G. Scott');
  const [email, setEmail] = useState(currentUser.email || 'easybusiness.cop@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState(currentUser.preferences.companyName || 'Dunder Mifflin Paper Co.');
  const [tone, setTone] = useState(currentUser.preferences.tone || 'Witty & Professional');
  const [customInstructions, setCustomInstructions] = useState(currentUser.preferences.customInstructions || '');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; provider?: 'firebase' | 'supabase' } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectEngine = (engine: 'firebase' | 'supabase') => {
    soundFx.playClick();
    setActiveEngine(engine);
    setPreferredAuthEngine(engine);
    setStatusMessage({
      type: 'info',
      text: `Primary authentication engine set to ${engine.toUpperCase()}`,
      provider: engine,
    });
  };

  const handleFirebaseSignIn = async () => {
    setIsAuthLoading(true);
    setStatusMessage(null);
    soundFx.playClick();
    try {
      const res = await connectGoogleWorkspace();
      const fbUser = res?.user;
      const firebaseProfile: UserProfile = {
        ...currentUser,
        id: fbUser?.uid || `user-firebase-${Date.now()}`,
        username: fbUser?.email?.split('@')[0] || username,
        displayName: fbUser?.displayName || displayName,
        email: fbUser?.email || email,
        avatar: fbUser?.photoURL || '🔥',
        lastLogin: Date.now(),
      };
      await signInWithFirebaseExplicit(firebaseProfile.email, password);
      setStatusMessage({
        type: 'success',
        text: `🔥 Firebase Auth Connected: ${firebaseProfile.displayName} (${firebaseProfile.email})`,
        provider: 'firebase',
      });
      setTimeout(() => {
        onLogin(firebaseProfile);
        onClose();
      }, 800);
    } catch (err: any) {
      const res = await signInWithFirebaseExplicit(email, password);
      const fallbackProfile: UserProfile = {
        ...currentUser,
        id: res.user.uid,
        email: res.user.email || email,
        displayName: displayName,
        avatar: '🔥',
        lastLogin: Date.now(),
      };
      setStatusMessage({
        type: 'success',
        text: `🔥 Firebase Session Token Active (${fallbackProfile.email})`,
        provider: 'firebase',
      });
      setTimeout(() => {
        onLogin(fallbackProfile);
        onClose();
      }, 800);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSupabaseSignIn = async () => {
    setIsAuthLoading(true);
    setStatusMessage(null);
    soundFx.playClick();
    try {
      const res = await signInWithSupabaseExplicit(email, password);
      const supaProfile: UserProfile = {
        ...currentUser,
        id: res.user.uid,
        username: email.split('@')[0],
        displayName: displayName,
        email: email,
        avatar: '⚡',
        lastLogin: Date.now(),
      };
      setStatusMessage({
        type: 'success',
        text: `⚡ Supabase RLS Session Active: ${supaProfile.displayName} (${supaProfile.email})`,
        provider: 'supabase',
      });
      setTimeout(() => {
        onLogin(supaProfile);
        onClose();
      }, 800);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Supabase authentication notice: ${err.message || 'Session established'}`,
        provider: 'supabase',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleQuickDemoUser = async (name: string, mail: string, roleTitle: string, providerChoice: 'firebase' | 'supabase') => {
    soundFx.playClick();
    setIsAuthLoading(true);

    if (providerChoice === 'firebase') {
      const res = await signInWithFirebaseExplicit(mail, 'password123');
      const demoProfile: UserProfile = {
        ...currentUser,
        id: res.user.uid,
        username: mail.split('@')[0],
        displayName: name,
        email: mail,
        avatar: '🔥',
        role: 'admin',
        lastLogin: Date.now(),
      };
      setStatusMessage({ type: 'success', text: `🔥 Firebase Quick Sign-In: ${name} (${roleTitle})`, provider: 'firebase' });
      setTimeout(() => {
        onLogin(demoProfile);
        onClose();
      }, 600);
    } else {
      const res = await signInWithSupabaseExplicit(mail, 'password123');
      const demoProfile: UserProfile = {
        ...currentUser,
        id: res.user.uid,
        username: mail.split('@')[0],
        displayName: name,
        email: mail,
        avatar: '⚡',
        role: 'admin',
        lastLogin: Date.now(),
      };
      setStatusMessage({ type: 'success', text: `⚡ Supabase Quick Sign-In: ${name} (${roleTitle})`, provider: 'supabase' });
      setTimeout(() => {
        onLogin(demoProfile);
        onClose();
      }, 600);
    }
    setIsAuthLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid operator username.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    soundFx.playNotification();

    if (activeEngine === 'firebase') {
      await signInWithFirebaseExplicit(email, password);
    } else {
      await signInWithSupabaseExplicit(email, password);
    }

    const updatedProfile: UserProfile = {
      id: `user-${activeEngine}-${Date.now()}`,
      username,
      displayName,
      email,
      avatar: activeEngine === 'firebase' ? '🔥' : '⚡',
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

    setStatusMessage({
      type: 'success',
      text: `${activeEngine === 'firebase' ? '🔥 Firebase' : '⚡ Supabase'} Authentication Complete: ${displayName}`,
      provider: activeEngine,
    });

    setTimeout(() => {
      onLogin(updatedProfile);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs font-mono select-none p-4">
      <div className="w-full max-w-lg bg-[#fbf1c7] dark:bg-[#1d2021] border-2 border-[#fabd2f] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#ebdbb2] dark:bg-[#282828] border-b border-[#d5c4a1] dark:border-[#3c3836]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#b57614] dark:text-[#fabd2f]" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#3c3836] dark:text-[#ebdbb2]">
              OPERATOR AUTHENTICATION (FIREBASE & SUPABASE)
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

        {/* Dual Engine Selector Bar */}
        <div className="p-2.5 bg-[#ebdbb2]/60 dark:bg-[#181615] border-b border-[#d5c4a1] dark:border-[#3c3836]">
          <div className="text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Select Active Authentication Provider:</span>
            <span className="font-mono text-[#b57614] dark:text-[#fabd2f]">{activeEngine.toUpperCase()} ENGINE ACTIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectEngine('firebase')}
              className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeEngine === 'firebase'
                  ? 'bg-[#fb4934]/20 border-[#fb4934] text-[#fb4934] shadow-sm ring-1 ring-[#fb4934]'
                  : 'bg-[#fbf1c7] dark:bg-[#282828] border-[#d5c4a1] dark:border-[#3c3836] text-[#665c54] dark:text-[#a89984] hover:bg-[#ebdbb2]'
              }`}
            >
              <Flame className="w-4 h-4 text-[#fb4934]" />
              <span>Firebase Auth</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectEngine('supabase')}
              className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeEngine === 'supabase'
                  ? 'bg-[#b8bb26]/20 border-[#b8bb26] text-[#b8bb26] shadow-sm ring-1 ring-[#b8bb26]'
                  : 'bg-[#fbf1c7] dark:bg-[#282828] border-[#d5c4a1] dark:border-[#3c3836] text-[#665c54] dark:text-[#a89984] hover:bg-[#ebdbb2]'
              }`}
            >
              <Zap className="w-4 h-4 text-[#b8bb26]" />
              <span>Supabase Auth</span>
            </button>
          </div>
        </div>

        {/* Quick OAuth Side-by-Side Buttons */}
        <div className="p-3 border-b border-[#d5c4a1] dark:border-[#3c3836] bg-[#f5e5c0] dark:bg-[#1d2021]/90 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFirebaseSignIn}
              disabled={isAuthLoading}
              className="py-2 px-2.5 bg-[#fb4934] hover:bg-[#cc241d] text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="truncate">Sign in with Firebase</span>
            </button>

            <button
              type="button"
              onClick={handleSupabaseSignIn}
              disabled={isAuthLoading}
              className="py-2 px-2.5 bg-[#427b58] hover:bg-[#2b5338] text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-[#fabd2f]" />
              <span className="truncate">Sign in with Supabase</span>
            </button>
          </div>

          {/* Quick Operator Preset Profiles for both */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#7c6f64] dark:text-[#a89984] mb-1">
              <span>Quick Preset Sign-In:</span>
              <span className="text-[#b57614]">1-Click Session Activation</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoUser('Michael G. Scott', 'm.scott@dundermifflin.com', 'Regional Manager', activeEngine)}
                className="px-2 py-1 bg-[#ebdbb2] dark:bg-[#282828] hover:bg-[#fabd2f] hover:text-[#1d2021] text-[10px] font-bold rounded border border-[#d5c4a1] dark:border-[#3c3836] text-left truncate transition-colors flex items-center gap-1"
              >
                {activeEngine === 'firebase' ? <Flame className="w-3 h-3 text-[#fb4934]" /> : <Zap className="w-3 h-3 text-[#b8bb26]" />}
                <span>Michael S. (Manager)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoUser('Dwight Schrute', 'd.schrute@dundermifflin.com', 'Security Chief', activeEngine)}
                className="px-2 py-1 bg-[#ebdbb2] dark:bg-[#282828] hover:bg-[#fabd2f] hover:text-[#1d2021] text-[10px] font-bold rounded border border-[#d5c4a1] dark:border-[#3c3836] text-left truncate transition-colors flex items-center gap-1"
              >
                {activeEngine === 'firebase' ? <Flame className="w-3 h-3 text-[#fb4934]" /> : <Zap className="w-3 h-3 text-[#b8bb26]" />}
                <span>Dwight S. (Security)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Message Banner */}
        {statusMessage && (
          <div className={`p-2.5 mx-4 mt-3 rounded text-xs flex items-center gap-2 border font-bold ${
            statusMessage.type === 'success'
              ? 'bg-[#b8bb26]/20 border-[#b8bb26] text-[#427b58] dark:text-[#b8bb26]'
              : statusMessage.type === 'error'
              ? 'bg-[#fb4934]/20 border-[#fb4934] text-[#cc241d] dark:text-[#fb4934]'
              : 'bg-[#fabd2f]/20 border-[#fabd2f] text-[#b57614] dark:text-[#fabd2f]'
          }`}>
            {statusMessage.provider === 'firebase' ? (
              <Flame className="w-4 h-4 shrink-0 text-[#fb4934]" />
            ) : statusMessage.provider === 'supabase' ? (
              <Zap className="w-4 h-4 shrink-0 text-[#b8bb26]" />
            ) : statusMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Switcher for LogIn vs Register */}
        <div className="flex border-b border-[#d5c4a1] dark:border-[#3c3836] text-xs mt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setStatusMessage(null);
            }}
            className={`flex-1 py-1.5 font-bold text-center transition-colors ${
              !isSignUp
                ? 'bg-[#fabd2f] text-[#1d2021]'
                : 'bg-[#ebdbb2] dark:bg-[#181615] text-[#7c6f64] dark:text-[#a89984]'
            }`}
          >
            {activeEngine === 'firebase' ? '🔥 Firebase Log In' : '⚡ Supabase Log In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setStatusMessage(null);
            }}
            className={`flex-1 py-1.5 font-bold text-center transition-colors ${
              isSignUp
                ? 'bg-[#fabd2f] text-[#1d2021]'
                : 'bg-[#ebdbb2] dark:bg-[#181615] text-[#7c6f64] dark:text-[#a89984]'
            }`}
          >
            Create {activeEngine.toUpperCase()} User
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-2 text-xs text-[#3c3836] dark:text-[#ebdbb2]">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-0.5">
                OPERATOR USERNAME
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-2.5 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-0.5">
                DISPLAY NAME
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Michael G. Scott"
                className="w-full px-2.5 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-0.5">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@dundermifflin.com"
              className="w-full px-2.5 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-0.5">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-2.5 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1 px-1 py-0.5 text-[9px] font-bold text-[#7c6f64] hover:text-[#282828] dark:hover:text-[#fbf1c7]"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-0.5">
                COMPANY ORG
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#7c6f64] dark:text-[#a89984] mb-0.5">
                PERSONALIZATION TONE
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#fbf1c7] dark:bg-[#181615] border border-[#d5c4a1] dark:border-[#3c3836] rounded font-mono text-xs focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
              >
                <option className="text-slate-900 bg-white" value="Witty & Professional">Witty & Professional</option>
                <option className="text-slate-900 bg-white" value="Ultra-Concise Enterprise">Ultra-Concise Enterprise</option>
                <option className="text-slate-900 bg-white" value="Deeply Technical">Deeply Technical</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            id="btn-auth-submit"
            className="w-full py-2 bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors mt-3 cursor-pointer"
          >
            {activeEngine === 'firebase' ? <Flame className="w-3.5 h-3.5 text-[#fb4934]" /> : <Zap className="w-3.5 h-3.5 text-[#b57614]" />}
            <span>{isSignUp ? `Create & Authenticate with ${activeEngine.toUpperCase()}` : `Sign In via ${activeEngine.toUpperCase()}`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};


