import React, { useState } from 'react';
import { WebFetchedResource, WebProfileResult, Agent } from '../types';
import { soundFx } from '../utils/speech';
import {
  Globe,
  FileCode,
  User,
  Search,
  Download,
  ExternalLink,
  Sparkles,
  X,
  Play,
  Copy,
  Check,
  Code,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface WebAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeContent: (content: string, title: string) => void;
  onMountToIde: (code: string, name: string) => void;
  agents: Agent[];
  selectedAgentId: string;
}

export const WebAccessModal: React.FC<WebAccessModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeContent,
  onMountToIde,
  agents,
  selectedAgentId,
}) => {
  const [activeTab, setActiveTab] = useState<'fetch-file' | 'search-profile' | 'explore-web'>('fetch-file');

  // Fetch File Tab state
  const [fileUrl, setFileUrl] = useState('https://raw.githubusercontent.com/ruflo-ai/ruflo/main/README.md');
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  const [fetchedFile, setFetchedFile] = useState<WebFetchedResource | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Search Profile Tab state
  const [profileQuery, setProfileQuery] = useState('antigravity-dev');
  const [isSearchingProfile, setIsSearchingProfile] = useState(false);
  const [profileResult, setProfileResult] = useState<WebProfileResult | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Handler for Fetching any public web file
  const handleFetchFile = async () => {
    if (!fileUrl.trim()) return;
    soundFx.playClick();
    setIsFetchingFile(true);
    setFileError(null);
    try {
      const res = await fetch('/api/web/fetch-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fileUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setFetchedFile({
          url: data.url,
          status: data.status,
          contentType: data.contentType,
          title: data.url.split('/').pop() || 'Web Document',
          content: data.content,
          fetchedAt: data.fetchedAt,
        });
        soundFx.playNotification();
      } else {
        setFileError(data.error || 'Failed to fetch web resource');
      }
    } catch (err: any) {
      setFileError(err.message || 'Network request failed');
    } finally {
      setIsFetchingFile(false);
    }
  };

  // Handler for Searching public web account / dev profile
  const handleSearchProfile = async () => {
    if (!profileQuery.trim()) return;
    soundFx.playClick();
    setIsSearchingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch('/api/web/search-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profileQuery }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileResult(data.profile);
        soundFx.playNotification();
      } else {
        setProfileError(data.error || 'Profile not found');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Profile search failed');
    } finally {
      setIsSearchingProfile(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundFx.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-mono select-none p-4">
      <div className="w-full max-w-3xl bg-[#1d2021] border-2 border-[#fabd2f] rounded-lg shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh] animate-in zoom-in-95 duration-200 text-[#ebdbb2]">
        {/* Modal Header */}
        <div className="px-4 py-2.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#fabd2f]" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
              WEB FILE & ACCOUNT PROFILE INTELLIGENCE ACCESS
            </span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 hover:text-red-400 rounded text-[#a89984]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#3c3836] text-xs bg-[#181615]">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('fetch-file');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'fetch-file'
                ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Fetch Web File / Raw Code</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('search-profile');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'search-profile'
                ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Search Account / Profile</span>
          </button>
        </div>

        {/* Tab 1: Fetch Any Web File */}
        {activeTab === 'fetch-file' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#a89984]">
                ENTER ANY PUBLIC WEB URL (GitHub Raw Code, JSON, API Docs, Markdown, Config):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://example.com/api/data.json or https://raw.githubusercontent.com/..."
                  className="flex-1 px-3 py-1.5 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                />
                <button
                  onClick={handleFetchFile}
                  disabled={isFetchingFile}
                  className="px-4 py-1.5 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isFetchingFile ? 'Fetching...' : 'Fetch Web File'}</span>
                </button>
              </div>
            </div>

            {/* Quick Samples */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#a89984] overflow-x-auto no-scrollbar">
              <span className="font-bold shrink-0">Quick Presets:</span>
              <button
                onClick={() => setFileUrl('https://raw.githubusercontent.com/ruflo-ai/ruflo/main/README.md')}
                className="px-1.5 py-0.5 rounded bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] shrink-0"
              >
                Ruflo README
              </button>
              <button
                onClick={() => setFileUrl('https://raw.githubusercontent.com/anthropics/claude-code/main/README.md')}
                className="px-1.5 py-0.5 rounded bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] shrink-0"
              >
                Claude CLI Spec
              </button>
              <button
                onClick={() => setFileUrl('https://api.github.com/repos/microsoft/autogen')}
                className="px-1.5 py-0.5 rounded bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] shrink-0"
              >
                AutoGen Repo JSON
              </button>
            </div>

            {fileError && (
              <div className="p-2 rounded bg-red-950 border border-red-700 text-red-300 text-xs">
                {fileError}
              </div>
            )}

            {/* Fetched Content Viewer */}
            {fetchedFile && (
              <div className="flex-1 flex flex-col bg-[#181615] border border-[#3c3836] rounded overflow-hidden">
                {/* Result header bar */}
                <div className="px-3 py-1.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">HTTP {fetchedFile.status}</span>
                    <span className="text-[#a89984]">|</span>
                    <span className="text-[#ebdbb2] font-bold truncate max-w-[200px]">
                      {fetchedFile.title}
                    </span>
                    <span className="text-[10px] px-1.5 rounded bg-[#3c3836] text-[#a89984]">
                      {fetchedFile.length} bytes
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(fetchedFile.content)}
                      className="p-1 rounded hover:bg-[#3c3836] text-[#a89984] hover:text-[#ebdbb2]"
                      title="Copy content"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onAnalyzeContent(fetchedFile.content, fetchedFile.title);
                      }}
                      className="px-2 py-0.5 rounded bg-[#fabd2f] text-[#1d2021] font-bold text-[10px] flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Analyze with Fleet</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onMountToIde(fetchedFile.content, fetchedFile.title);
                      }}
                      className="px-2 py-0.5 rounded bg-[#83a598]/20 text-[#83a598] border border-[#83a598]/40 font-bold text-[10px] flex items-center gap-1"
                    >
                      <Code className="w-3 h-3" />
                      <span>Mount to IDE</span>
                    </button>
                  </div>
                </div>

                {/* Preformatted Text */}
                <textarea
                  readOnly
                  value={fetchedFile.content}
                  className="flex-1 p-3 bg-[#181615] text-[#ebdbb2] font-mono text-xs focus:outline-none resize-none select-text"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Search Public Profile / Account */}
        {activeTab === 'search-profile' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#a89984]">
                SEARCH ANY DEVELOPER USERNAME / PROFILE ACROSS THE WEB:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profileQuery}
                  onChange={(e) => setProfileQuery(e.target.value)}
                  placeholder="e.g. torvalds, gaearon, ruflo-lead, user handle..."
                  className="flex-1 px-3 py-1.5 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                />
                <button
                  onClick={handleSearchProfile}
                  disabled={isSearchingProfile}
                  className="px-4 py-1.5 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-md"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isSearchingProfile ? 'Searching...' : 'Search Profile'}</span>
                </button>
              </div>
            </div>

            {profileError && (
              <div className="p-2 rounded bg-red-950 border border-red-700 text-red-300 text-xs">
                {profileError}
              </div>
            )}

            {/* Profile Result Display */}
            {profileResult && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#181615] border border-[#3c3836] rounded space-y-4">
                {/* Profile Header */}
                <div className="flex items-start gap-4 pb-3 border-b border-[#3c3836]">
                  {profileResult.avatarUrl ? (
                    <img
                      src={profileResult.avatarUrl}
                      alt={profileResult.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-lg border-2 border-[#fabd2f] bg-[#282828]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-[#282828] border-2 border-[#fabd2f] flex items-center justify-center text-2xl">
                      🧑‍💻
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[#ebdbb2]">{profileResult.name}</h3>
                        <div className="text-[11px] text-[#fabd2f]">@{profileResult.username}</div>
                      </div>

                      <a
                        href={profileResult.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] text-[10px] font-bold flex items-center gap-1 border border-[#3c3836]"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <p className="text-xs text-[#a89984] mt-1.5 leading-relaxed">
                      {profileResult.bio}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[#7c6f64]">
                      {profileResult.company && <span>🏢 {profileResult.company}</span>}
                      {profileResult.location && <span>📍 {profileResult.location}</span>}
                      {profileResult.publicRepos !== undefined && (
                        <span>📦 {profileResult.publicRepos} Repositories</span>
                      )}
                      {profileResult.followers !== undefined && (
                        <span>⭐ {profileResult.followers} Followers</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills Chips */}
                <div>
                  <div className="text-[11px] font-bold text-[#a89984] mb-1.5 uppercase">
                    SKILLS & TECH STACK:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profileResult.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-[#282828] text-emerald-400 border border-[#3c3836] text-[10px] font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent Activity / Repos */}
                <div>
                  <div className="text-[11px] font-bold text-[#a89984] mb-1.5 uppercase">
                    PUBLIC REPOSITORIES & RECENT ACTIVITY:
                  </div>
                  <div className="space-y-1.5">
                    {profileResult.recentActivity.map((act, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-[#282828] border border-[#3c3836] text-xs text-[#ebdbb2] flex items-center justify-between"
                      >
                        <span>{act}</span>
                        <button
                          onClick={() => {
                            onClose();
                            onAnalyzeContent(
                              `Analyze public work of developer @${profileResult.username}: ${act}`,
                              `Dev Profile @${profileResult.username}`
                            );
                          }}
                          className="px-2 py-0.5 bg-[#fabd2f] text-[#1d2021] font-bold text-[9px] rounded"
                        >
                          Audit with Agent
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
