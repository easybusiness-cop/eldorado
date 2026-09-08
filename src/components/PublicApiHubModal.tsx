import React, { useState } from 'react';
import {
  Globe,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Sliders,
  Terminal,
  Database,
  Search,
  CloudSun,
  Coins,
  FileCode,
  X,
  FileJson
} from 'lucide-react';
import { Agent, FleetTask } from '../types';
import { soundFx } from '../utils/speech';

interface PublicApiHubProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onAddTask?: (task: Partial<FleetTask>) => void;
}

interface ApiEndpoint {
  id: string;
  name: string;
  category: 'weather' | 'finance' | 'testing' | 'placeholder';
  description: string;
  url: string;
  method: 'GET' | 'POST';
  defaultParams: Record<string, string>;
}

const POPULAR_PUBLIC_APIS: ApiEndpoint[] = [
  {
    id: 'open_meteo_tokyo',
    name: 'Open-Meteo (Tokyo Weather)',
    category: 'weather',
    description: 'Fetch current weather forecasts for Tokyo with real-time temperature and wind speeds.',
    url: 'https://api.open-meteo.com/v1/forecast',
    method: 'GET',
    defaultParams: {
      latitude: '35.6895',
      longitude: '139.6917',
      current_weather: 'true',
      timezone: 'Asia/Tokyo'
    }
  },
  {
    id: 'open_meteo_ny',
    name: 'Open-Meteo (New York Weather)',
    category: 'weather',
    description: 'Fetch current temperature and atmospheric statistics for New York City.',
    url: 'https://api.open-meteo.com/v1/forecast',
    method: 'GET',
    defaultParams: {
      latitude: '40.7128',
      longitude: '-74.0060',
      current_weather: 'true',
      timezone: 'America/New_York'
    }
  },
  {
    id: 'coingecko_simple',
    name: 'CoinGecko Live Crypto prices',
    category: 'finance',
    description: 'Query live market prices for Bitcoin, Ethereum, and Solana without requiring api keys.',
    url: 'https://api.coingecko.com/api/v3/simple/price',
    method: 'GET',
    defaultParams: {
      ids: 'bitcoin,ethereum,solana',
      vs_currencies: 'usd',
      include_24hr_change: 'true'
    }
  },
  {
    id: 'jsonplaceholder_users',
    name: 'JSONPlaceholder (Users Database)',
    category: 'placeholder',
    description: 'Mock client directory database serving rich synthetic user objects for simulation testing.',
    url: 'https://jsonplaceholder.typicode.com/users',
    method: 'GET',
    defaultParams: {}
  },
  {
    id: 'jsonplaceholder_posts',
    name: 'JSONPlaceholder (Posts Repository)',
    category: 'placeholder',
    description: 'Mock REST repository of community blog posts, perfect for automated content crawlers.',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    defaultParams: {}
  },
  {
    id: 'n8n_inbound_webhook',
    name: 'n8n Inbound Webhook Orchestration',
    category: 'testing',
    description: 'Internal gateway endpoint receiving automated node triggers from self-hosted or cloud n8n workflows.',
    url: '/api/n8n/webhook/fleet-task',
    method: 'POST',
    defaultParams: {
      action: 'ASSIGN_TASK',
      targetAgent: 'CoreCoder'
    }
  }
];

export function PublicApiHubModal({ isOpen, onClose, agents, onAddTask }: PublicApiHubProps) {
  const [selectedApiId, setSelectedApiId] = useState<string>(POPULAR_PUBLIC_APIS[0].id);
  const [queryParams, setQueryParams] = useState<Record<string, string>>(POPULAR_PUBLIC_APIS[0].defaultParams);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responsePayload, setResponsePayload] = useState<any>(null);
  const [fetchTimeMs, setFetchTimeMs] = useState<number | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || 'cline');
  const [isPiped, setIsPiped] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentEndpoint = POPULAR_PUBLIC_APIS.find(api => api.id === selectedApiId) || POPULAR_PUBLIC_APIS[0];

  const handleSelectApi = (apiId: string) => {
    soundFx.playClick();
    const target = POPULAR_PUBLIC_APIS.find(api => api.id === apiId);
    if (target) {
      setSelectedApiId(apiId);
      setQueryParams(target.defaultParams);
      setResponsePayload(null);
      setResponseStatus(null);
      setFetchTimeMs(null);
      setIsPiped(false);
    }
  };

  const handleParamChange = (key: string, value: string) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExecuteRequest = async () => {
    soundFx.playClick();
    setIsLoading(true);
    setResponsePayload(null);
    setResponseStatus(null);
    setFetchTimeMs(null);
    setIsPiped(false);

    const startTime = performance.now();
    try {
      const urlObj = new URL(currentEndpoint.url);
      Object.entries(queryParams).forEach(([k, v]) => {
        urlObj.searchParams.append(k, String(v));
      });

      const response = await fetch(urlObj.toString());
      const endTime = performance.now();
      setFetchTimeMs(Math.round(endTime - startTime));
      setResponseStatus(response.status);

      // Extract brief headers
      const headersMap: Record<string, string> = {};
      response.headers.forEach((v, k) => {
        if (['content-type', 'cache-control', 'server', 'date'].includes(k.toLowerCase())) {
          headersMap[k] = v;
        }
      });
      setResponseHeaders(headersMap);

      const json = await response.json();
      setResponsePayload(json);
    } catch (error: any) {
      setResponsePayload({ error: error.message || 'Network connection failed' });
      setResponseStatus(500);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePipeToAgent = () => {
    if (!onAddTask || !responsePayload) return;
    soundFx.playClick();

    const targetAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
    const briefContext = JSON.stringify(responsePayload).substring(0, 500);

    onAddTask({
      title: `[API Pipeline] Process ${currentEndpoint.name} Context`,
      description: `Target agent ${targetAgent.name} (${targetAgent.role}) is tasked with parsing the live public api response payload context. Payload summary: ${briefContext}... Implement structured reporting based on these metrics.`,
      assignedTo: selectedAgentId,
      priority: 'medium',
      status: 'queued'
    });

    setIsPiped(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-mono">
      <div className="w-full max-w-4xl bg-slate-50 dark:bg-[#181615] rounded-3xl border-2 border-slate-300 dark:border-[#3c3836] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header bar */}
        <div className="bg-[#ebdbb2] dark:bg-[#282828] px-5 py-4 border-b border-slate-300 dark:border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white shadow-sm">
              <Globe className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">PUBLIC API INTEGRATION WORKBENCH</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Explore free public API endpoints and pipe structured live data into active agent workflows.</p>
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

        {/* Content grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: API Selector */}
            <div className="space-y-4 md:col-span-1">
              <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-[#3c3836] pb-2">
                <Sliders className="w-4 h-4 text-cyan-600" /> Select Public API
              </div>
              <div className="space-y-2">
                {POPULAR_PUBLIC_APIS.map(api => {
                  const isSelected = api.id === selectedApiId;
                  return (
                    <button
                      key={api.id}
                      onClick={() => handleSelectApi(api.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-1.5 shadow-sm ${
                        isSelected
                          ? 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-400 dark:border-cyan-800'
                          : 'bg-white dark:bg-[#1d2021] border-slate-200 dark:border-[#3c3836] hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {api.category === 'weather' && <CloudSun className="w-4 h-4 text-amber-500" />}
                        {api.category === 'finance' && <Coins className="w-4 h-4 text-emerald-500" />}
                        {api.category === 'placeholder' && <FileCode className="w-4 h-4 text-purple-500" />}
                        <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                          {api.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2 font-medium">
                        {api.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Parameters & Fetch controls */}
            <div className="space-y-4 md:col-span-2 flex flex-col">
              <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 dark:border-[#3c3836] pb-2">
                <span className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" /> Request Payload Parameters
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                  {currentEndpoint.method}
                </span>
              </div>

              {/* URL bar */}
              <div className="p-3 bg-slate-100 dark:bg-[#1d2021] border border-slate-200 dark:border-[#3c3836] rounded-2xl flex items-center gap-2">
                <span className="font-bold text-[10px] text-indigo-600 dark:text-indigo-400 uppercase">GET</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-nowrap scrollbar-none flex-1 font-mono">
                  {currentEndpoint.url}
                </span>
              </div>

              {/* Dynamic inputs based on query fields */}
              <div className="bg-white dark:bg-[#1d2021] p-4 rounded-2xl border border-slate-200 dark:border-[#3c3836] space-y-3 flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Query Parameters</div>
                
                {Object.keys(queryParams).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(queryParams).map(([key, val]) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">{key}:</label>
                        <input
                          type="text"
                          value={val}
                          onChange={e => handleParamChange(key, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#181615] text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic py-6 text-center">
                    This endpoint takes no custom parameters. Click fetch to retrieve payload instantly.
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleExecuteRequest}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    {isLoading ? 'Executing Network Request...' : 'Execute Live API Request'}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Row: Network Response and Agent Pipelnig */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Response Console */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <span className="flex items-center gap-2 text-[11px] font-bold text-slate-300 font-mono">
                  <Terminal className="w-4 h-4 text-emerald-500" /> Response Payload Console
                </span>
                {responseStatus !== null && (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500">Time: <span className="text-slate-300 font-bold">{fetchTimeMs}ms</span></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-red-950 text-red-400'
                    }`}>
                      Status: {responseStatus}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[11px] text-emerald-400 p-2 space-y-1 select-text scrollbar-thin max-h-[300px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-2 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
                    <span>Resolving public Domain name...</span>
                  </div>
                ) : responsePayload ? (
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(responsePayload, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-500 py-24 text-center italic">
                    Execute an API request to view structured response headers and live payload values.
                  </div>
                )}
              </div>
            </div>

            {/* Agent Integration Gateway */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1d2021] border border-slate-200 dark:border-[#3c3836] shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-xs border-b border-slate-100 dark:border-[#3c3836] pb-3">
                  <Send className="w-4 h-4 text-indigo-600" /> Pipe Live Context to Agent Task Queue
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Directly dispatch a live operational context task. The selected autonomous agent will parse the retrieved API payload parameters, verify compliance thresholds, and update local logs dynamically.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block">Select Assigned Workforce Agent:</label>
                    <select
                      value={selectedAgentId}
                      onChange={e => setSelectedAgentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#181615] text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                    >
                      {agents.map(agent => (
                        <option className="text-slate-900 bg-white" key={agent.id} value={agent.id}>
                          {agent.avatar} {agent.name} — {agent.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isPiped && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-emerald-900 dark:text-emerald-400 block mb-0.5">Payload Piped successfully!</span>
                      The API data package has been dispatched to the fleet task router. Watch the physical board or top ticker for autonomous execution outputs.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#3c3836]">
                <button
                  onClick={handlePipeToAgent}
                  disabled={!responsePayload || isPiped}
                  className={`w-full py-3 rounded-2xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 ${
                    !responsePayload
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-zinc-800 cursor-not-allowed shadow-none'
                      : isPiped
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-zinc-800 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Pipe Data Context into Agent Queue
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
