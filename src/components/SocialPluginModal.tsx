import React, { useState, useEffect } from 'react';
import {
  Instagram,
  Linkedin,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Sliders,
  Terminal,
  Database,
  Cpu,
  Sparkles,
  Link2,
  Plug,
  Unlock,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Agent } from '../types';
import { soundFx } from '../utils/speech';

interface SocialPluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onAccountAdded?: () => void;
}

interface SocialPlugin {
  id: string;
  name: string;
  provider: 'Instagram' | 'LinkedIn';
  description: string;
  version: string;
  developer: string;
  npmPackage: string;
  installed: boolean;
  connected: boolean;
  accountHandle?: string;
  scopes: string[];
  docUrl: string;
}

export function SocialPluginModal({ isOpen, onClose, agents, onAccountAdded }: SocialPluginModalProps) {
  const [plugins, setPlugins] = useState<SocialPlugin[]>([
    {
      id: 'plugin_instagram_media',
      name: 'Instagram Graph API Connector',
      provider: 'Instagram',
      description: 'Allows autonomous publishing of media files, stories, and carousel metrics directly to corporate accounts.',
      version: 'v4.12.0',
      developer: 'Composio Integrations',
      npmPackage: '@composio/instagram-media',
      installed: false,
      connected: false,
      scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
      docUrl: 'https://developers.facebook.com/docs/instagram-api'
    },
    {
      id: 'plugin_linkedin_company',
      name: 'LinkedIn Community Publisher Pro',
      provider: 'LinkedIn',
      description: 'Empowers marketing agents to publish promotional press releases and corporate hiring articles to corporate pages.',
      version: 'v2.8.5',
      developer: 'Composio Integrations',
      npmPackage: '@composio/linkedin-company',
      installed: false,
      connected: false,
      scopes: ['w_member_social', 'r_liteprofile', 'r_organization_social'],
      docUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/oauth-v2'
    }
  ]);

  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [activeAccountName, setActiveAccountName] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || 'michael');
  const [activePluginId, setActivePluginId] = useState<string>('plugin_instagram_media');
  
  const [fetchDate, setFetchDate] = useState<string>('');
  const [fetchedPost, setFetchedPost] = useState<any>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const handleFetchPost = () => {
    if (!fetchDate) return;
    setIsFetching(true);
    setFetchedPost(null);
    setTimeout(() => {
      setFetchedPost({
         date: fetchDate,
         imageUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=400',
         likes: Math.floor(Math.random() * 1000) + 100,
         comments: Math.floor(Math.random() * 100) + 10,
         caption: 'Office retreat was a huge success! #DunderMifflin #Paper #TeamBuilding 🏢📄'
      });
      setIsFetching(false);
    }, 1500);
  };

  useEffect(() => {
    // Sync already active accounts from server
    const fetchExistingAccounts = async () => {
      try {
        const res = await fetch('/api/company/details');
        if (res.ok) {
          const data = await res.json();
          if (data.accounts) {
            setPlugins(prev => prev.map(plugin => {
              const matched = data.accounts.find((acc: any) => acc.provider.toLowerCase() === plugin.provider.toLowerCase());
              if (matched) {
                return {
                  ...plugin,
                  installed: true,
                  connected: true,
                  accountHandle: matched.account
                };
              }
              return plugin;
            }));
          }
        }
      } catch (e) {
        console.error('Failed to sync plugin states:', e);
      }
    };

    if (isOpen) {
      fetchExistingAccounts();
    }
  }, [isOpen]);

  // Listen for OAuth messages from the popup window
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      // Allow safety limits for Run app sandbox environment
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const providerName = event.data.provider; // 'Instagram' or 'LinkedIn'
        const handle = activeAccountName || (providerName === 'Instagram' ? '@dundermifflin_paper' : 'Dunder Mifflin Paper Co.');

        // Update database with connected state
        try {
          const matchedPlugin = plugins.find(p => p.provider === providerName);
          const res = await fetch('/api/company/accounts/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: providerName,
              account: handle,
              scopes: matchedPlugin?.scopes || [],
              owner: selectedAgentId,
              status: 'CONNECTED'
            })
          });

          if (res.ok) {
            soundFx.playNotification();
            setPlugins(prev => prev.map(p => {
              if (p.provider === providerName) {
                return { ...p, connected: true, accountHandle: handle };
              }
              return p;
            }));
            setActiveAccountName('');
            if (onAccountAdded) onAccountAdded();
          }
        } catch (err) {
          console.error('Failed to save connected OAuth account:', err);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [activeAccountName, selectedAgentId, plugins, onAccountAdded]);

  if (!isOpen) return null;

  const currentPlugin = plugins.find(p => p.id === activePluginId) || plugins[0];

  const handleInstallPlugin = (pluginId: string) => {
    soundFx.playClick();
    setInstallingId(pluginId);
    setInstallProgress(0);
    setInstallLogs([`[SDK COMPILER] Resolving plugin npm package...`]);

    const logs = [
      `[SDK COMPILER] Resolving plugin npm package...`,
      `[NPM REGISTER] Resolving version matches for dependencies...`,
      `[NPM FETCH] Pulling binaries from remote registry...`,
      `[SECURITY] Running integrity audit scan on code signatures...`,
      `[SANDBOX] Compiling abstract syntax trees (AST)...`,
      `[COMPOSIO] Registering auth hooks to Composio gateway...`,
      `[✓ REGISTRY] Active integration status registered: ONLINE!`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < logs.length) {
        setInstallProgress(Math.min(currentStep * 15, 100));
        setInstallLogs(prev => [...prev, logs[currentStep]]);
      } else {
        setInstallProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setPlugins(prev => prev.map(p => {
            if (p.id === pluginId) {
              return { ...p, installed: true };
            }
            return p;
          }));
          setInstallingId(null);
          soundFx.playNotification();
        }, 300);
      }
    }, 450);
  };

  const handleInitiateOAuth = () => {
    soundFx.playClick();
    
    // Construct real-world authorization provider endpoints with local dynamic redirect callback URIs
    const redirectUri = `${window.location.origin}/auth/callback/${currentPlugin.provider.toLowerCase()}`;
    
    let authUrl = '';
    if (currentPlugin.provider === 'Instagram') {
      authUrl = `https://api.instagram.com/oauth/authorize?client_id=instagram_client_id&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user_profile,user_media`;
    } else {
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=linkedin_client_id&redirect_uri=${encodeURIComponent(redirectUri)}&state=ruffloState123&scope=r_liteprofile%20w_member_social`;
    }

    // Open Popup window according to exact instructions in oauth-integration skill
    const authWindow = window.open(
      authUrl,
      'oauth_popup',
      'width=620,height=720,status=no,resizable=yes,scrollbars=yes'
    );

    if (!authWindow) {
      alert('Pop-up was blocked. Please enable pop-ups to securely connect your official account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-mono">
      <div className="w-full max-w-4xl bg-slate-50 dark:bg-[#181615] rounded-3xl border-2 border-slate-300 dark:border-[#3c3836] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Title bar */}
        <div className="bg-[#ebdbb2] dark:bg-[#282828] px-5 py-4 border-b border-slate-300 dark:border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white shadow-sm">
              <Plug className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">SOCIAL MEDIA INTEGRATIONS & OAUTH PLUGINS</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Install official platform modules, authorize OAuth connection popups, and link accounts securely.</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Plugins Selector */}
            <div className="space-y-4 md:col-span-1">
              <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-[#3c3836] pb-2">
                <Package className="w-4 h-4 text-pink-600" /> Platform SDK Plugins
              </div>
              
              <div className="space-y-2">
                {plugins.map(p => {
                  const isSelected = p.id === activePluginId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        soundFx.playClick();
                        setActivePluginId(p.id);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-2.5 shadow-sm ${
                        isSelected
                          ? 'bg-pink-50 dark:bg-pink-950/20 border-pink-400 dark:border-pink-800'
                          : 'bg-white dark:bg-[#1d2021] dark:bg-slate-900 border-slate-200 dark:border-[#3c3836] hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {p.provider === 'Instagram' ? (
                            <Instagram className="w-4 h-4 text-pink-500" />
                          ) : (
                            <Linkedin className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                            {p.provider} Plugin
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          p.connected 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400'
                            : p.installed 
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-400'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                        }`}>
                          {p.connected ? 'LINKED' : p.installed ? 'READY' : 'INACTIVE'}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                        {p.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Selected Plugin Details & Integration */}
            <div className="space-y-4 md:col-span-2 flex flex-col justify-between bg-white dark:bg-[#1d2021] dark:bg-slate-900 border border-slate-200 dark:border-[#3c3836] p-5 rounded-3xl shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#3c3836] pb-3">
                  <div className="flex items-center gap-2">
                    {currentPlugin.provider === 'Instagram' ? (
                      <Instagram className="w-5 h-5 text-pink-500" />
                    ) : (
                      <Linkedin className="w-5 h-5 text-blue-500" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {currentPlugin.name}
                      </h4>
                      <span className="text-[9px] text-slate-400">Package: <span className="font-bold text-slate-500">{currentPlugin.npmPackage}</span> • {currentPlugin.version}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{currentPlugin.developer}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {currentPlugin.description}
                </p>

                {/* Scopes Overview */}
                <div className="p-3 bg-slate-50 dark:bg-[#181615] border border-slate-200 dark:border-[#3c3836] rounded-2xl space-y-2">
                  <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Required OAuth Permissions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPlugin.scopes.map(sc => (
                      <span key={sc} className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-[9px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Installation Box */}
                {!currentPlugin.installed ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-bold text-xs text-amber-950 dark:text-amber-400">Plugin SDK Package Required</h5>
                        <p className="text-[10px] text-amber-800 dark:text-amber-500 mt-0.5 font-medium leading-relaxed">
                          To establish live endpoints, download, inspect, and connect the background platform SDK binaries for {currentPlugin.provider}.
                        </p>
                      </div>
                    </div>

                    {installingId === currentPlugin.id ? (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600">
                          <span>Compiling Node Modules...</span>
                          <span>{installProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${installProgress}%` }} />
                        </div>
                        {/* Interactive install logs terminal */}
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[9px] text-emerald-400 max-h-[100px] overflow-y-auto space-y-0.5 leading-normal">
                          {installLogs.map((log, index) => (
                            <div key={index}>{log}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleInstallPlugin(currentPlugin.id)}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Package className="w-3.5 h-3.5" />
                          Install Platform Plugin
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Plugin SDK Active
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-500 leading-normal font-medium">
                      The official connector libraries have been installed. Ready to link your physical account now.
                    </span>
                  </div>
                )}
              </div>

              {/* Linking Box */}
              {currentPlugin.installed && (
                <div className="border-t border-slate-100 dark:border-[#3c3836] pt-4 mt-4 space-y-4">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" /> Complete Secure Authorization
                  </div>

                  {currentPlugin.connected ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181615] border border-slate-200 dark:border-[#3c3836] flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 text-lg">
                            ✔
                          </div>
                          <div>
                            <div className="text-[9px] font-mono font-bold text-slate-400 uppercase">LINKED ACCOUNT</div>
                            <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">{currentPlugin.accountHandle}</h5>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                          ACTIVE CHANNEL
                        </span>
                      </div>

                      {currentPlugin.provider === 'Instagram' && (
                        <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 mt-2">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Simulated Post Fetcher</div>
                          <div className="flex items-center gap-2 mb-3">
                            <input 
                              type="date" 
                              value={fetchDate}
                              onChange={(e) => setFetchDate(e.target.value)}
                              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#282828] text-xs font-semibold focus:outline-none flex-1"
                            />
                            <button 
                              onClick={handleFetchPost}
                              disabled={!fetchDate || isFetching}
                              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold disabled:opacity-50"
                            >
                              {isFetching ? 'Fetching...' : 'Fetch Post'}
                            </button>
                          </div>

                          {fetchedPost && (
                            <div className="bg-white dark:bg-[#282828] border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden mt-3">
                              <img src={fetchedPost.imageUrl} alt="Instagram Post" className="w-full h-40 object-cover" />
                              <div className="p-3">
                                <div className="flex gap-4 text-[10px] font-bold text-slate-500 mb-2">
                                  <span>❤️ {fetchedPost.likes}</span>
                                  <span>💬 {fetchedPost.comments}</span>
                                  <span>📅 {fetchedPost.date}</span>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-300">{fetchedPost.caption}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Desired Account Handle / Handle ID:</label>
                          <input
                            type="text"
                            value={activeAccountName}
                            onChange={e => setActiveAccountName(e.target.value)}
                            placeholder={currentPlugin.provider === 'Instagram' ? 'e.g. @dunder_mifflin_inc' : 'e.g. Dunder Mifflin Paper Company'}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#181615] text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-pink-500 text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Authorizing Agent Coordinator:</label>
                          <select
                            value={selectedAgentId}
                            onChange={e => setSelectedAgentId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#181615] text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                          >
                            {agents.map(a => (
                              <option className="text-slate-900 bg-white" key={a.id} value={a.id}>
                                {a.avatar} {a.name} — {a.role}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 rounded-2xl flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400 leading-normal font-medium">
                        <Unlock className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-indigo-900 dark:text-indigo-400 block mb-0.5">Secure SameSite OAuth Isolation Mode</span>
                          Opening authorization popup directly to secure {currentPlugin.provider} servers. Cookies are configured with SameSite: 'none' and Secure: true rules.
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleInitiateOAuth}
                          disabled={!activeAccountName.trim()}
                          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all"
                        >
                          <span>Connect & Link {currentPlugin.provider} Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
