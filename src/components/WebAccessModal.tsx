import React, { useState, useEffect } from 'react';
import { WebFetchedResource, WebProfileResult, Agent, OpenSourceRepo, DynamicFeature } from '../types';
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
  RefreshCw,
  Compass,
  Monitor,
  Cpu,
  Radio,
  Terminal,
  Eye,
  Zap,
  FolderGit2,
  Star,
  GitFork,
} from 'lucide-react';

interface WebAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeContent: (content: string, title: string) => void;
  onMountToIde: (code: string, name: string) => void;
  onImportRepoTool?: (feature: Partial<DynamicFeature>) => void;
  agents: Agent[];
  selectedAgentId: string;
}

interface BrowserStatusState {
  status: 'online' | 'degraded' | 'offline';
  browser: string;
  version: string;
  isOpenSource: boolean;
  capabilities: string[];
}

interface WebDiscoveryItem {
  id: string;
  title: string;
  url: string;
  source: string;
  category: string;
  summary: string;
  keyInsights: string[];
  investigatingAgent: string;
  timestamp: number;
  engine: string;
  screenshot?: string;
  wordCount?: number;
  tags: string[];
}

export const WebAccessModal: React.FC<WebAccessModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeContent,
  onMountToIde,
  onImportRepoTool,
  agents,
  selectedAgentId,
}) => {
  const [activeTab, setActiveTab] = useState<'browser-gateway' | 'news-radar' | 'repos-catalog' | 'fetch-file'>('browser-gateway');

  // Browser Gateway State
  const [browseUrl, setBrowseUrl] = useState('https://news.ycombinator.com');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browseResult, setBrowseResult] = useState<any | null>(null);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [browserStatus, setBrowserStatus] = useState<BrowserStatusState | null>(null);

  // News Radar State
  const [discoveries, setDiscoveries] = useState<WebDiscoveryItem[]>([]);
  const [isLoadingRadar, setIsLoadingRadar] = useState(false);
  const [isScanningLive, setIsScanningLive] = useState(false);

  // Repos Catalog State
  const [reposQuery, setReposQuery] = useState('');
  const [repos, setRepos] = useState<OpenSourceRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<OpenSourceRepo | null>(null);
  const [importedRepoId, setImportedRepoId] = useState<string | null>(null);

  // Fetch File Tab state
  const [fileUrl, setFileUrl] = useState('https://raw.githubusercontent.com/ruflo-ai/ruflo/main/README.md');
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  const [fetchedFile, setFetchedFile] = useState<WebFetchedResource | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // Quick preset destinations for testing real browser navigation
  const PRESET_URLS = [
    { label: 'Hacker News', url: 'https://news.ycombinator.com' },
    { label: 'Meta AI Blog', url: 'https://research.meta.ai/blog/muse-spark-open' },
    { label: 'GitHub Trending', url: 'https://github.com/trending' },
    { label: 'Playwright Docs', url: 'https://playwright.dev' },
    { label: 'Cheerio Project', url: 'https://cheerio.js.org' },
  ];

  // Initial load
  useEffect(() => {
    if (isOpen) {
      fetchBrowserStatus();
      fetchNewsFeed();
      fetchRepos('');
    }
  }, [isOpen]);

  const fetchBrowserStatus = async () => {
    try {
      const res = await fetch('/api/browser/status');
      const data = await res.json();
      if (data.success) {
        setBrowserStatus({
          status: data.status,
          browser: data.browser,
          version: data.version,
          isOpenSource: data.isOpenSource,
          capabilities: data.capabilities || [],
        });
      }
    } catch {}
  };

  const fetchNewsFeed = async () => {
    setIsLoadingRadar(true);
    try {
      const res = await fetch('/api/web/news-feed');
      const data = await res.json();
      if (data.success && Array.isArray(data.discoveries)) {
        setDiscoveries(data.discoveries);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRadar(false);
    }
  };

  const handleScanWebLive = async () => {
    soundFx.playClick();
    setIsScanningLive(true);
    try {
      const res = await fetch('/api/web/news-feed/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success && Array.isArray(data.discoveries)) {
        setDiscoveries(data.discoveries);
        soundFx.playNotification();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanningLive(false);
    }
  };

  const handleBrowseLive = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || browseUrl).trim();
    if (!urlToFetch) return;

    soundFx.playClick();
    setIsBrowsing(true);
    setBrowseError(null);

    try {
      const res = await fetch('/api/browser/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      });
      const data = await res.json();
      if (data.success) {
        setBrowseResult(data);
        soundFx.playNotification();
      } else {
        setBrowseError(data.error || 'Failed to browse URL');
      }
    } catch (err: any) {
      setBrowseError(err.message || 'Browser gateway connection failed');
    } finally {
      setIsBrowsing(false);
    }
  };

  const fetchRepos = async (queryStr: string) => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch('/api/web/search-repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryStr }),
      });
      const data = await res.json();
      if (data.repos) {
        setRepos(data.repos);
        if (!selectedRepo && data.repos.length > 0) {
          setSelectedRepo(data.repos[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleImportRepo = (repo: OpenSourceRepo) => {
    if (!onImportRepoTool) return;
    soundFx.playNotification();
    const dynamicTool: Partial<DynamicFeature> = {
      name: `${repo.name.toUpperCase()} Gateway`,
      description: repo.description,
      category: 'code',
      icon: 'FolderGit2',
      enabled: true,
      addedByAgent: 'Autonomous Research Fleet',
      code: `// Verified Open-Source Module from ${repo.url}\n${repo.sampleCode || '// Executable module'}\n\nexport default async function run() {\n  return { success: true, repo: "${repo.name}", stars: "${repo.stars}" };\n}`,
    };
    onImportRepoTool(dynamicTool);
    setImportedRepoId(repo.id);
    setTimeout(() => setImportedRepoId(null), 2500);
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundFx.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs font-mono select-none p-4">
      <div className="w-full max-w-6xl bg-[#1d2021] border-2 border-[#fabd2f] rounded-lg shadow-2xl overflow-hidden flex flex-col h-[780px] max-h-[92vh] animate-in zoom-in-95 duration-200 text-[#ebdbb2]">
        {/* Header */}
        <div className="px-4 py-2.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-[#fabd2f] animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
              AUTONOMOUS WEB INTELLIGENCE & OPEN-SOURCE BROWSER GATEWAY
            </span>
            {browserStatus && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {browserStatus.browser} • {browserStatus.version}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 hover:text-red-400 rounded text-[#a89984] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#3c3836] text-xs bg-[#181615]">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('browser-gateway');
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'browser-gateway'
                ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Open-Source Browser Gateway</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('news-radar');
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-colors border-r border-[#3c3836] relative ${
              activeTab === 'news-radar'
                ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Autonomous News & Tech Radar</span>
            {discoveries.length > 0 && (
              <span className="px-1.5 py-0.2 bg-[#fabd2f] text-[#1d2021] text-[9px] rounded font-extrabold ml-1">
                {discoveries.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('repos-catalog');
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'repos-catalog'
                ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-[#83a598]" />
            <span>Open-Source Repos & Tools</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('fetch-file');
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-bold transition-colors border-r border-[#3c3836] ${
              activeTab === 'fetch-file'
                ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw File & Docs Reader</span>
          </button>
        </div>

        {/* Tab 1: Live Open-Source Browser Gateway */}
        {activeTab === 'browser-gateway' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            {/* Address Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#a89984]">
                <span>BROWSER GATEWAY URL (RENDERED VIA CHROMIUM / PLAYWRIGHT):</span>
                <span className="text-emerald-400">Headless Engine: Active</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={browseUrl}
                    onChange={(e) => setBrowseUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBrowseLive()}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => handleBrowseLive()}
                  disabled={isBrowsing}
                  className="px-5 py-2 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-2 transition-colors shrink-0 shadow-md"
                >
                  {isBrowsing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Rendering in Chromium...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Navigate & Capture</span>
                    </>
                  )}
                </button>
              </div>

              {/* Preset Shortcuts */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-[#7c6f64] uppercase font-bold">Quick Presets:</span>
                {PRESET_URLS.map((preset) => (
                  <button
                    key={preset.url}
                    onClick={() => {
                      setBrowseUrl(preset.url);
                      handleBrowseLive(preset.url);
                    }}
                    className="px-2 py-0.5 rounded bg-[#282828] hover:bg-[#3c3836] text-[10px] text-[#ebdbb2] border border-[#3c3836] transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {browseError && (
              <div className="p-2.5 rounded bg-red-950/80 border border-red-700 text-red-300 text-xs">
                {browseError}
              </div>
            )}

            {/* Results Grid: Screenshot & Extracted Content */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
              {/* Left Column: Visual Viewport Preview */}
              <div className="flex flex-col bg-[#181615] border border-[#3c3836] rounded overflow-hidden">
                <div className="px-3 py-1.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                    <Monitor className="w-3 h-3 text-[#fabd2f]" />
                    Visual Browser Viewport (Screenshot)
                  </span>
                  {browseResult && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {browseResult.engine} • {browseResult.durationMs || 120}ms
                    </span>
                  )}
                </div>

                <div className="flex-1 bg-[#121212] overflow-auto flex items-center justify-center p-2">
                  {browseResult?.screenshot ? (
                    <img
                      src={browseResult.screenshot}
                      alt="Browser Screenshot"
                      className="max-w-full max-h-full rounded border border-[#3c3836] object-contain shadow-md"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <div className="text-3xl">🌐</div>
                      <div className="text-xs font-bold text-[#ebdbb2]">Chromium Open-Source Viewport</div>
                      <p className="text-[11px] text-[#7c6f64] max-w-sm">
                        Enter any URL above and click "Navigate & Capture". The agent launches headless Chromium, renders HTML/CSS/JS, and returns a high-resolution visual snapshot and DOM data.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Extracted DOM Information */}
              <div className="flex flex-col bg-[#181615] border border-[#3c3836] rounded overflow-hidden">
                <div className="px-3 py-1.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                    <FileCode className="w-3 h-3 text-[#83a598]" />
                    Extracted Semantic Intelligence
                  </span>
                  {browseResult?.info && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const text = JSON.stringify(browseResult.info, null, 2);
                          copyToClipboard(text);
                        }}
                        className="text-[10px] text-[#a89984] hover:text-[#ebdbb2] flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onAnalyzeContent(
                            `Synthesized Web Intelligence for ${browseResult.url}:\n\nTitle: ${browseResult.info.title}\nDescription: ${browseResult.info.description}\nParagraphs:\n${browseResult.info.paragraphs.join('\n')}`,
                            browseResult.info.title
                          );
                        }}
                        className="px-2 py-0.5 rounded bg-[#fabd2f] text-[#1d2021] font-bold text-[10px]"
                      >
                        Dispatch to Fleet
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                  {browseResult?.info ? (
                    <>
                      <div>
                        <div className="text-[10px] font-bold text-[#7c6f64] uppercase">Page Title:</div>
                        <div className="text-sm font-bold text-[#ebdbb2] mt-0.5">{browseResult.info.title}</div>
                      </div>

                      {browseResult.info.description && (
                        <div>
                          <div className="text-[10px] font-bold text-[#7c6f64] uppercase">Description:</div>
                          <div className="text-[11px] text-[#a89984] mt-0.5">{browseResult.info.description}</div>
                        </div>
                      )}

                      {browseResult.info.headings?.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-[#7c6f64] uppercase mb-1">Extracted Headings:</div>
                          <div className="space-y-1">
                            {browseResult.info.headings.slice(0, 5).map((h: string, idx: number) => (
                              <div key={idx} className="p-1 rounded bg-[#282828] text-[#fabd2f] text-[11px]">
                                • {h}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-[10px] font-bold text-[#7c6f64] uppercase mb-1">
                          Article Paragraphs ({browseResult.info.wordCount || 0} words):
                        </div>
                        <div className="space-y-2 text-[#ebdbb2] text-[11px] leading-relaxed">
                          {browseResult.info.paragraphs.slice(0, 6).map((p: string, idx: number) => (
                            <p key={idx} className="p-2 rounded bg-[#282828]/50 border border-[#3c3836]/40">
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>

                      {browseResult.info.links?.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-[#7c6f64] uppercase mb-1">Discovered Links:</div>
                          <div className="space-y-1">
                            {browseResult.info.links.slice(0, 5).map((link: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[10px] p-1 bg-[#282828] rounded">
                                <span className="truncate max-w-[280px] text-[#83a598]">{link.text}</span>
                                <button
                                  onClick={() => {
                                    const fullUrl = link.href.startsWith('http') ? link.href : new URL(link.href, browseResult.url).toString();
                                    setBrowseUrl(fullUrl);
                                    handleBrowseLive(fullUrl);
                                  }}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-[#3c3836] text-[#ebdbb2] hover:bg-[#504945]"
                                >
                                  Follow Link
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10 text-[#7c6f64] text-xs">
                      No URL loaded yet. Submit a URL or pick a preset above to inspect live DOM data.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Autonomous News & Tech Radar */}
        {activeTab === 'news-radar' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-[#ebdbb2] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  REAL-TIME WEB RADAR: BREAKING NEWS, TECHNOLOGIES & DISCOVERIES
                </h3>
                <p className="text-[11px] text-[#a89984] mt-0.5">
                  Autonomous agents scour the web 24/7, browse sources via Chromium, and extract genuine technical breakthroughs.
                </p>
              </div>

              <button
                onClick={handleScanWebLive}
                disabled={isScanningLive}
                className="px-4 py-1.5 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningLive ? 'animate-spin' : ''}`} />
                <span>{isScanningLive ? 'Agents Scanning Web...' : 'Scan Web Now'}</span>
              </button>
            </div>

            {/* Discoveries Stream */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {isLoadingRadar ? (
                <div className="flex items-center justify-center h-40 text-xs text-[#a89984]">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Connecting to agent web radar...
                </div>
              ) : discoveries.length === 0 ? (
                <div className="text-center py-12 text-[#7c6f64] text-xs space-y-2">
                  <div>📡</div>
                  <div>No radar items collected yet. Click "Scan Web Now" to dispatch agents.</div>
                </div>
              ) : (
                discoveries.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#181615] border border-[#3c3836] hover:border-[#fabd2f]/50 rounded-lg transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[9px] uppercase font-extrabold rounded bg-[#fabd2f]/20 text-[#fabd2f] border border-[#fabd2f]/30">
                            {item.category}
                          </span>
                          <span className="text-[10px] text-[#7c6f64]">
                            {new Date(item.timestamp).toLocaleTimeString()} • {item.source}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#ebdbb2] hover:text-[#fabd2f] transition-colors">
                          {item.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setBrowseUrl(item.url);
                            setActiveTab('browser-gateway');
                            handleBrowseLive(item.url);
                          }}
                          className="px-2.5 py-1 rounded bg-[#282828] hover:bg-[#3c3836] text-[10px] text-[#ebdbb2] font-bold flex items-center gap-1 border border-[#3c3836]"
                        >
                          <Eye className="w-3 h-3 text-[#fabd2f]" />
                          <span>Browse Live</span>
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded hover:bg-[#3c3836] text-[#a89984] hover:text-[#ebdbb2]"
                          title="Open external link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <p className="text-xs text-[#a89984] leading-relaxed">{item.summary}</p>

                    {item.keyInsights && item.keyInsights.length > 0 && (
                      <div className="p-2 rounded bg-[#282828]/60 border border-[#3c3836]/40 text-[11px] space-y-1">
                        <div className="text-[10px] font-bold text-[#fabd2f] uppercase">Key Intelligence:</div>
                        {item.keyInsights.map((insight, idx) => (
                          <div key={idx} className="text-[#ebdbb2] flex items-start gap-1.5">
                            <span className="text-emerald-400">▹</span>
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-[#7c6f64] pt-1">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-[#83a598]" />
                        Investigated by: <strong className="text-[#ebdbb2]">{item.investigatingAgent}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {item.tags.map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-[#282828] rounded text-[#a89984]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Open-Source Repositories & Tools */}
        {activeTab === 'repos-catalog' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#7c6f64]" />
                <input
                  type="text"
                  value={reposQuery}
                  onChange={(e) => setReposQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchRepos(reposQuery)}
                  placeholder="Search live GitHub open-source repositories (e.g. playwright, cheerio, gemini, agents)..."
                  className="w-full pl-9 pr-3 py-2 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                />
              </div>
              <button
                onClick={() => fetchRepos(reposQuery)}
                disabled={isLoadingRepos}
                className="px-4 py-2 bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5"
              >
                <span>{isLoadingRepos ? 'Searching...' : 'Search GitHub'}</span>
              </button>
            </div>

            {/* Repos Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-3 bg-[#181615] border border-[#3c3836] hover:border-[#83a598] rounded-lg flex flex-col justify-between space-y-2 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-[#fabd2f]" />
                        <span className="font-bold text-xs text-[#ebdbb2]">{repo.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#fabd2f]">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-[#fabd2f]" />
                          {repo.stars}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#a89984] line-clamp-3 leading-relaxed">
                      {repo.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {repo.topics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-[#282828] text-[9px] text-[#83a598] rounded">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#3c3836] flex items-center justify-between text-[10px]">
                    <span className="text-[#7c6f64]">{repo.language || 'Code'} • {repo.license}</span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:text-[#ebdbb2] text-[#a89984]"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => handleImportRepo(repo)}
                        className={`px-2 py-1 rounded font-bold text-[10px] flex items-center gap-1 ${
                          importedRepoId === repo.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#fabd2f] text-[#1d2021] hover:bg-[#d79921]'
                        }`}
                      >
                        {importedRepoId === repo.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Installed</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            <span>Install to Fleet</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Raw File & Docs Reader */}
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
                  placeholder="https://raw.githubusercontent.com/..."
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

            {fileError && (
              <div className="p-2 rounded bg-red-950 border border-red-700 text-red-300 text-xs">
                {fileError}
              </div>
            )}

            {fetchedFile && (
              <div className="flex-1 overflow-hidden flex flex-col border border-[#3c3836] rounded bg-[#181615]">
                <div className="px-3 py-1.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">HTTP {fetchedFile.status}</span>
                    <span className="text-[#a89984]">|</span>
                    <span className="text-[#ebdbb2] font-bold truncate max-w-[200px]">
                      {fetchedFile.title}
                    </span>
                    <span className="text-[10px] px-1.5 rounded bg-[#3c3836] text-[#a89984]">
                      {fetchedFile.content?.length || 0} bytes
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

                <textarea
                  readOnly
                  value={fetchedFile.content}
                  className="flex-1 p-3 bg-[#181615] text-[#ebdbb2] font-mono text-xs focus:outline-none resize-none select-text"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
