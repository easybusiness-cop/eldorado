import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

export const VoiceWaveform = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
        isActive 
          ? 'bg-emerald-950/30 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
          : 'bg-[#282828] border-[#3c3836] hover:bg-[#32302f]'
      }`}
      onClick={() => setIsActive(!isActive)}
      title="Toggle Voice Command Interface"
    >
      {isActive ? (
        <Mic className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <MicOff className="w-3.5 h-3.5 text-[#928374]" />
      )}
      
      {isActive ? (
        <div className="flex items-center gap-0.5 h-3.5">
          <div className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-full" style={{ animationDuration: '0.5s' }} />
          <div className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2/3" style={{ animationDuration: '0.7s', animationDelay: '0.1s' }} />
          <div className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1/2" style={{ animationDuration: '0.4s', animationDelay: '0.2s' }} />
          <div className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-full" style={{ animationDuration: '0.6s', animationDelay: '0.3s' }} />
          <div className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2/3" style={{ animationDuration: '0.5s', animationDelay: '0.4s' }} />
        </div>
      ) : (
        <span className="text-[10px] font-bold text-[#928374] uppercase tracking-wider">Voice</span>
      )}
    </div>
  );
};
