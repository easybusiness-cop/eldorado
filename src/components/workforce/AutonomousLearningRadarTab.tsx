import React, { useState, useEffect } from 'react';
import {
  Globe,
  RefreshCw,
  Search,
  ExternalLink,
  BookOpen,
  Sparkles,
  Zap,
  CheckCircle,
  Clock,
  ArrowRight,
  Terminal,
  Activity,
  Layers,
  FileText
} from 'lucide-react';
import { soundFx } from '../../utils/speech';

export interface TechDiscovery {
  id: string;
  source: string;
  title: string;
  url: string;
  summary: string;
  technologies: string[];
  departments?: string[];
  severity: 'info' | 'important' | 'critical';
  timestamp: string;
  category?: 'technology' | 'research_paper' | 'market_development';
  keyFindings?: string[];
}

export interface ResearchBrief {
  discoveryId: string;
  topic: string;
  assignedAgentId: string;
  briefContent: string;
  keyTakeaways: string[];
  recommendedSkills: string[];
  status: 'pending' | 'researching' | 'completed' | 'failed';
  completedAt?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  sourceUrl?: string;
  tags: string[];
  departmentScope: string[];
  discoveredAt: string;
  verified: boolean;
  learningImpact: 'high' | 'medium' | 'low';
}

export interface SystemOptimization {
  id: string;
  targetFile: string;
  finding: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
}

export const AutonomousLearningRadarTab: React.FC = () => {
  const [discoveries, setDiscoveries] = useState<TechDiscovery[]>([]);
  const [briefs, setBriefs] = useState<ResearchBrief[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [optimizations, setOptimizations] = useState<SystemOptimization[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanningRadar, setIsScanningRadar] = useState(false);
  const [isScanningCodebase, setIsScanningCodebase] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<ResearchBrief | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [subView, setSubView] = useState<'discoveries' | 'briefs' | 'articles' | 'optimizations'>('discoveries');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'technology' | 'research_paper' | 'market_development'>('all');
  const [intelQuery, setIntelQuery] = useState('');
  const [isSearchingIntel, setIsSearchingIntel] = useState(false);
  const [forceLiveSearch, setForceLiveSearch] = useState(false);
  const [intelAnswer, setIntelAnswer] = useState<string | null>(null);

  const handleQueryIntelligence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intelQuery.trim()) return;
    soundFx.playClick();
    setIsSearchingIntel(true);
    setIntelAnswer(null);

    try {
      const res = await fetch('/api/autonomy/knowledge/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: intelQuery.trim(),
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          forceLiveSearch,
          limit: 3,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setIntelAnswer(data.result.answer);
        if (data.result.discoveries?.length > 0) {
          // Refresh list to include newly ingested discoveries
          await loadAllRadarData();
        }
      } else {
        setIntelAnswer('Query completed with zero matches. The continuous radar remains active.');
      }
    } catch (err: any) {
      setIntelAnswer(`Intelligence query error: ${err.message}`);
    } finally {
      setIsSearchingIntel(false);
    }
  };

  const loadAllRadarData = async () => {
    setLoading(true);
    try {
      const [discRes, briefsRes, artRes, optRes] = await Promise.all([
        fetch('/api/autonomy/knowledge/discoveries').then(r => r.json()).catch(() => ({ discoveries: [] })),
        fetch('/api/autonomy/knowledge/briefs').then(r => r.json()).catch(() => ({ briefs: [] })),
        fetch('/api/autonomy/knowledge/articles').then(r => r.json()).catch(() => ({ articles: [] })),
        fetch('/api/autonomy/knowledge/optimizations').then(r => r.json()).catch(() => ({ optimizations: [] })),
      ]);

      if (discRes.discoveries) setDiscoveries(discRes.discoveries);
      if (briefsRes.briefs) setBriefs(briefsRes.briefs);
      if (artRes.articles) setArticles(artRes.articles);
      if (optRes.optimizations) setOptimizations(optRes.optimizations);
    } catch (e) {
      console.error('Failed to load radar data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllRadarData();
  }, []);

  const triggerWebSweep = async () => {
    soundFx.playClick();
    setIsScanningRadar(true);
    setActionMessage('Scanning arXiv, GitHub releases, and W3C tech radar...');
    try {
      const res = await fetch('/api/autonomy/knowledge/discover', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message || 'Web radar sweep complete! Proactive research launched.');
        await loadAllRadarData();
      }
    } catch (err: any) {
      setActionMessage(`Sweep failed: ${err.message}`);
    } finally {
      setIsScanningRadar(false);
      setTimeout(() => setActionMessage(null), 6000);
    }
  };

  const triggerCodebaseScan = async () => {
    soundFx.playClick();
    setIsScanningCodebase(true);
    setActionMessage('Scanning codebase architecture and modern tech alignments...');
    try {
      const res = await fetch('/api/autonomy/knowledge/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message || 'Codebase scan completed! Modern upgrades detected.');
        await loadAllRadarData();
      }
    } catch (err: any) {
      setActionMessage(`Codebase scan failed: ${err.message}`);
    } finally {
      setIsScanningCodebase(false);
      setTimeout(() => setActionMessage(null), 6000);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#fbf1c7] text-[#3c3836]">
      {/* ACTION BANNER & TELEMETRY */}
      <div className="bg-[#f9f5d7] border-b border-[#d5c4a1] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#98971a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#427b58]"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#282828]">
              Autonomous Radar Pipeline Online
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs border-l border-[#d5c4a1] pl-4 text-[#7c6f64]">
            <span>Breakthroughs: <strong className="text-[#b57614] font-black">{discoveries.length}</strong></span>
            <span>Research Briefs: <strong className="text-[#076678] font-black">{briefs.length}</strong></span>
            <span>Corporate Articles: <strong className="text-[#427b58] font-black">{articles.length}</strong></span>
            <span>Upgrades: <strong className="text-[#af3a03] font-black">{optimizations.length}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerCodebaseScan}
            disabled={isScanningCodebase}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isScanningCodebase
                ? 'bg-[#ebdbb2] text-[#7c6f64] border-[#d5c4a1] cursor-not-allowed'
                : 'bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] border-[#bdae93]'
            }`}
          >
            <Terminal className={`w-3.5 h-3.5 ${isScanningCodebase ? 'animate-spin' : ''}`} />
            {isScanningCodebase ? 'Scanning Code...' : 'Scan Codebase Upgrades'}
          </button>

          <button
            onClick={triggerWebSweep}
            disabled={isScanningRadar}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isScanningRadar
                ? 'bg-[#d5c4a1] text-[#7c6f64] border-[#bdae93] cursor-not-allowed'
                : 'bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] border-[#8f5d0f] shadow-sm'
            }`}
          >
            <Globe className={`w-3.5 h-3.5 ${isScanningRadar ? 'animate-spin' : ''}`} />
            {isScanningRadar ? 'Crawling Web...' : 'Sweep Live Web Breakthroughs'}
          </button>

          <button
            onClick={loadAllRadarData}
            title="Refresh Radar Data"
            className="p-1.5 rounded hover:bg-[#ebdbb2] text-[#7c6f64] hover:text-[#282828] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUS ALERT */}
      {actionMessage && (
        <div className="bg-[#b8bb26]/20 border-b border-[#98971a] px-6 py-2 text-xs font-bold text-[#282828] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#427b58]" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* SUB-TABS */}
      <div className="bg-[#ebdbb2] border-b border-[#d5c4a1] px-6 flex gap-2">
        <button
          onClick={() => { soundFx.playClick(); setSubView('discoveries'); }}
          className={`px-3 py-2 text-xs font-bold uppercase transition-all flex items-center gap-1.5 border-b-2 ${
            subView === 'discoveries'
              ? 'border-[#b57614] text-[#282828] font-black'
              : 'border-transparent text-[#7c6f64] hover:text-[#282828]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Web Breakthroughs ({discoveries.length})
        </button>

        <button
          onClick={() => { soundFx.playClick(); setSubView('briefs'); }}
          className={`px-3 py-2 text-xs font-bold uppercase transition-all flex items-center gap-1.5 border-b-2 ${
            subView === 'briefs'
              ? 'border-[#076678] text-[#282828] font-black'
              : 'border-transparent text-[#7c6f64] hover:text-[#282828]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Autonomous Research Briefs ({briefs.length})
        </button>

        <button
          onClick={() => { soundFx.playClick(); setSubView('articles'); }}
          className={`px-3 py-2 text-xs font-bold uppercase transition-all flex items-center gap-1.5 border-b-2 ${
            subView === 'articles'
              ? 'border-[#427b58] text-[#282828] font-black'
              : 'border-transparent text-[#7c6f64] hover:text-[#282828]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Corporate Knowledge Base ({articles.length})
        </button>

        <button
          onClick={() => { soundFx.playClick(); setSubView('optimizations'); }}
          className={`px-3 py-2 text-xs font-bold uppercase transition-all flex items-center gap-1.5 border-b-2 ${
            subView === 'optimizations'
              ? 'border-[#af3a03] text-[#282828] font-black'
              : 'border-transparent text-[#7c6f64] hover:text-[#282828]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Code Modernization ({optimizations.length})
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* SUBVIEW 1: WEB BREAKTHROUGHS */}
        {subView === 'discoveries' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-[#282828]">
                  Continuous Discovery Stream & Unlimited Intelligence
                </h3>
                <p className="text-xs text-[#7c6f64]">
                  Continuous scanning for new technologies, research papers, and market developments integrated with live internet search.
                </p>
              </div>
            </div>

            {/* UNLIMITED INTELLIGENCE QUERY INTERFACE */}
            <div className="bg-[#f9f5d7] border border-[#d5c4a1] rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#b57614]" />
                  <h4 className="text-xs font-black uppercase text-[#282828]">
                    Unlimited Intelligence Engine Query
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-[#427b58] font-bold">Continuous Autonomous Scanning: ONLINE</span>
              </div>
              <form onSubmit={handleQueryIntelligence} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#7c6f64] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={intelQuery}
                    onChange={(e) => setIntelQuery(e.target.value)}
                    placeholder="Query any technology, research paper, or market trend across the web..."
                    className="w-full bg-[#fbf1c7] border border-[#d5c4a1] rounded pl-8 pr-3 py-1.5 text-xs text-[#282828] placeholder-[#928374] focus:outline-none focus:border-[#b57614]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] font-bold text-[#504945] cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={forceLiveSearch}
                      onChange={(e) => setForceLiveSearch(e.target.checked)}
                      className="rounded text-[#b57614] focus:ring-0"
                    />
                    Live Internet Search
                  </label>
                  <button
                    type="submit"
                    disabled={isSearchingIntel || !intelQuery.trim()}
                    className="px-3 py-1.5 rounded text-xs font-bold bg-[#b57614] hover:bg-[#8f5d0f] disabled:bg-[#d5c4a1] text-[#fbf1c7] border border-[#8f5d0f] flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Search className={`w-3.5 h-3.5 ${isSearchingIntel ? 'animate-spin' : ''}`} />
                    {isSearchingIntel ? 'Querying...' : 'Query Intel'}
                  </button>
                </div>
              </form>

              {/* INTEL SYNTHESIS ANSWER */}
              {intelAnswer && (
                <div className="mt-3 p-3 bg-[#ebdbb2] border border-[#d5c4a1] rounded text-xs font-medium text-[#282828] leading-relaxed whitespace-pre-line">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="font-black text-[#b57614] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Intelligence Output:
                    </strong>
                    <button
                      onClick={() => setIntelAnswer(null)}
                      className="text-[10px] text-[#7c6f64] hover:text-[#282828] font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                  {intelAnswer}
                </div>
              )}
            </div>

            {/* CATEGORY FILTER PILLS */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs font-black uppercase text-[#7c6f64]">Category:</span>
              {[
                { key: 'all', label: `All (${discoveries.length})` },
                { key: 'technology', label: `Technologies (${discoveries.filter(d => d.category === 'technology').length})` },
                { key: 'research_paper', label: `Research Papers (${discoveries.filter(d => d.category === 'research_paper').length})` },
                { key: 'market_development', label: `Market Developments (${discoveries.filter(d => d.category === 'market_development').length})` },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { soundFx.playClick(); setCategoryFilter(cat.key as any); }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all border ${
                    categoryFilter === cat.key
                      ? 'bg-[#282828] text-[#fbf1c7] border-[#282828]'
                      : 'bg-[#f9f5d7] text-[#504945] border-[#d5c4a1] hover:bg-[#ebdbb2]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {discoveries.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-[#d5c4a1] rounded-lg">
                <Globe className="w-8 h-8 text-[#7c6f64] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#7c6f64]">No discoveries indexed yet. Click "Sweep Live Web Breakthroughs" above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveries
                  .filter((disc) => categoryFilter === 'all' || disc.category === categoryFilter)
                  .map((disc) => (
                  <div
                    key={disc.id}
                    className="bg-[#f9f5d7] border border-[#d5c4a1] rounded-lg p-4 shadow-sm hover:border-[#bdae93] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#ebdbb2] text-[#3c3836] border border-[#d5c4a1]">
                            {disc.source}
                          </span>
                          {disc.category && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#076678]/10 text-[#076678] border border-[#076678]/30 uppercase">
                              {disc.category.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            disc.severity === 'critical'
                              ? 'bg-[#cc241d]/10 text-[#cc241d] border-[#cc241d]'
                              : disc.severity === 'important'
                              ? 'bg-[#b57614]/10 text-[#b57614] border-[#b57614]'
                              : 'bg-[#427b58]/10 text-[#427b58] border-[#427b58]'
                          }`}
                        >
                          {disc.severity}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-[#282828] mb-1.5 leading-snug">
                        {disc.title}
                      </h4>
                      <p className="text-[11px] text-[#504945] leading-relaxed mb-2">
                        {disc.summary}
                      </p>

                      {disc.keyFindings && disc.keyFindings.length > 0 && (
                        <div className="mb-3 pl-2 border-l-2 border-[#b57614] text-[10px] text-[#3c3836] space-y-1">
                          {disc.keyFindings.map((kf, i) => (
                            <div key={i} className="flex items-start gap-1">
                              <span className="text-[#b57614] font-black">•</span>
                              <span>{kf}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {disc.technologies.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[#ebdbb2] text-[#3c3836] font-mono font-bold"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#ebdbb2] text-[10px] text-[#7c6f64]">
                        <span>{new Date(disc.timestamp).toLocaleDateString()}</span>
                        {disc.url && (
                          <a
                            href={disc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#076678] hover:underline font-bold"
                          >
                            Source Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW 2: RESEARCH BRIEFS */}
        {subView === 'briefs' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-[#282828]">
                  Autonomous Agent Research Briefs
                </h3>
                <p className="text-xs text-[#7c6f64]">
                  Playwright browser extractions digested by virtual research analysts into operational insights.
                </p>
              </div>
            </div>

            {briefs.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-[#d5c4a1] rounded-lg">
                <BookOpen className="w-8 h-8 text-[#7c6f64] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#7c6f64]">No research briefs compiled yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {briefs.map((brief) => (
                  <div
                    key={brief.discoveryId}
                    className="bg-[#f9f5d7] border border-[#d5c4a1] rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#ebdbb2] text-[#282828]">
                          Analyst: {brief.assignedAgentId}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            brief.status === 'completed'
                              ? 'bg-[#b8bb26]/20 text-[#427b58] border-[#98971a]'
                              : 'bg-[#b57614]/20 text-[#b57614] border-[#b57614]'
                          }`}
                        >
                          {brief.status}
                        </span>
                      </div>
                      {brief.completedAt && (
                        <span className="text-[10px] text-[#7c6f64]">
                          Completed: {new Date(brief.completedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-black text-[#282828] mb-2">{brief.topic}</h4>

                    {brief.keyTakeaways && brief.keyTakeaways.length > 0 && (
                      <div className="bg-[#ebdbb2]/30 p-2.5 rounded mb-3 border border-[#ebdbb2]">
                        <div className="text-[10px] font-black uppercase text-[#282828] mb-1">
                          Key Analytical Findings:
                        </div>
                        <ul className="space-y-1">
                          {brief.keyTakeaways.map((takeaway, idx) => (
                            <li key={idx} className="text-[11px] text-[#3c3836] flex items-start gap-1.5">
                              <CheckCircle className="w-3 h-3 text-[#427b58] shrink-0 mt-0.5" />
                              <span>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-wrap gap-1">
                        {brief.recommendedSkills.map((sk) => (
                          <span
                            key={sk}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#b8bb26]/20 text-[#427b58] border border-[#98971a]/30"
                          >
                            + skill: {sk}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => { soundFx.playClick(); setSelectedBrief(brief); }}
                        className="text-xs font-bold text-[#076678] hover:underline flex items-center gap-1"
                      >
                        Read Full Synthesis <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW 3: CORPORATE KNOWLEDGE BASE */}
        {subView === 'articles' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div>
              <h3 className="text-sm font-black uppercase text-[#282828]">
                Corporate Neural Intelligence Repository
              </h3>
              <p className="text-xs text-[#7c6f64]">
                Self-taught technical knowledge articles distributed to agents to upgrade fleet performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="bg-[#f9f5d7] border border-[#d5c4a1] rounded-lg p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#ebdbb2] text-[#504945]">
                        {art.id}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#427b58]/10 text-[#427b58] border border-[#427b58]">
                        Impact: {art.learningImpact}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-[#282828] mb-1.5">{art.title}</h4>
                    <p className="text-[11px] text-[#504945] leading-relaxed mb-3">{art.summary}</p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {art.tags.map((tg) => (
                        <span key={tg} className="text-[9px] px-1.5 py-0.5 rounded bg-[#ebdbb2] text-[#3c3836]">
                          #{tg}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ebdbb2]">
                      <span className="text-[10px] text-[#7c6f64]">
                        Scope: {art.departmentScope.join(', ')}
                      </span>
                      <button
                        onClick={() => { soundFx.playClick(); setSelectedArticle(art); }}
                        className="text-xs font-bold text-[#427b58] hover:underline"
                      >
                        Inspect Article
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBVIEW 4: CODEBASE MODERNIZATION */}
        {subView === 'optimizations' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div>
              <h3 className="text-sm font-black uppercase text-[#282828]">
                Autonomous Codebase Modernization Scan
              </h3>
              <p className="text-xs text-[#7c6f64]">
                Self-directed audits of local file architectures to upgrade tools and eliminate system lag.
              </p>
            </div>

            {optimizations.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-[#d5c4a1] rounded-lg">
                <Terminal className="w-8 h-8 text-[#7c6f64] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#7c6f64]">No system optimizations scanned yet. Click "Scan Codebase Upgrades" above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {optimizations.map((opt) => (
                  <div
                    key={opt.id}
                    className="bg-[#f9f5d7] border border-[#d5c4a1] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#ebdbb2] text-[#af3a03]">
                          Target: {opt.targetFile}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#af3a03]/10 text-[#af3a03] border border-[#af3a03]">
                          Priority: {opt.priority}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#7c6f64]">
                        {new Date(opt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-xs text-[#3c3836] mb-2 font-medium">
                      <strong className="text-[#282828]">Finding:</strong> {opt.finding}
                    </div>

                    <div className="bg-[#ebdbb2]/30 p-2.5 rounded border border-[#ebdbb2] text-xs">
                      <strong className="text-[#427b58]">Autonomous Directive:</strong> {opt.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: READ FULL RESEARCH BRIEF */}
      {selectedBrief && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fbf1c7] border-4 border-[#bdae93] rounded-xl max-w-2xl w-full p-6 shadow-2xl font-mono text-[#3c3836] flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b-2 border-[#d5c4a1] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-[#282828] uppercase">{selectedBrief.topic}</h3>
                <span className="text-[10px] text-[#7c6f64]">Synthesized by: {selectedBrief.assignedAgentId}</span>
              </div>
              <button
                onClick={() => setSelectedBrief(null)}
                className="w-7 h-7 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-2 whitespace-pre-wrap leading-relaxed">
              {selectedBrief.briefContent}
            </div>

            <div className="pt-4 border-t border-[#d5c4a1] flex justify-end">
              <button
                onClick={() => setSelectedBrief(null)}
                className="px-4 py-2 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] text-xs font-bold"
              >
                Close Synthesis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: READ FULL KNOWLEDGE ARTICLE */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fbf1c7] border-4 border-[#bdae93] rounded-xl max-w-2xl w-full p-6 shadow-2xl font-mono text-[#3c3836] flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b-2 border-[#d5c4a1] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-[#282828] uppercase">{selectedArticle.title}</h3>
                <span className="text-[10px] text-[#427b58] font-bold">Scope: {selectedArticle.departmentScope.join(', ')}</span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-7 h-7 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-2 whitespace-pre-wrap leading-relaxed">
              {selectedArticle.content}
            </div>

            <div className="pt-4 border-t border-[#d5c4a1] flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded bg-[#427b58] hover:bg-[#2d523b] text-[#fbf1c7] text-xs font-bold"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
