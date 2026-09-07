import React, { useState, useEffect, useMemo } from 'react';
import { KnowledgeCategory, KnowledgeEntry } from '../types/knowledgeBase';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { soundFx } from '../utils/speech';
import { 
  Network, 
  Shield, 
  Key, 
  FileText, 
  Users, 
  Award, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw,
  PlusCircle,
  FolderMinus,
  Globe,
  Cpu,
  Crown
} from 'lucide-react';
import { AutonomousLearningRadarTab } from './workforce/AutonomousLearningRadarTab';
import { VirtualWorkforceFleetTab } from './workforce/VirtualWorkforceFleetTab';
import { CorporateCascadeTab } from './workforce/CorporateCascadeTab';

interface DynamicKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DynamicKnowledgeBaseModal: React.FC<DynamicKnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'kb' | 'graph' | 'capabilities' | 'discovery' | 'workforce' | 'cascade'>('cascade');
  
  // Traditional KB State
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // New entry form
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<KnowledgeCategory>('hacking');
  const [formSummary, setFormSummary] = useState('');
  const [formInsight, setFormInsight] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Knowledge Graph State
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [graphEdges, setGraphEdges] = useState<any[]>([]);
  const [graphEpisodes, setGraphEpisodes] = useState<any[]>([]);
  const [graphSearch, setGraphSearch] = useState('');
  const [loadingGraph, setLoadingGraph] = useState(false);

  // Capability Registry State
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [capabilityRequests, setCapabilityRequests] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('ruflo');
  const [agentCapabilities, setAgentCapabilities] = useState<string[]>([]);
  const [loadingCaps, setLoadingCaps] = useState(false);

  // Grant Form State
  const [grantCapId, setGrantCapId] = useState('');
  const [grantAgentId, setGrantAgentId] = useState('ruflo');
  const [grantNotes, setGrantNotes] = useState('');

  // ---------------------------------------------------------
  // Subscriptions & Initial Sync
  // ---------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    // Load KB
    setEntries(knowledgeBaseService.getAll());
    const unsub = knowledgeBaseService.subscribe(() => {
      setEntries(knowledgeBaseService.getAll());
    });
    return unsub;
  }, [isOpen]);

  // Load Graph & Capabilities dynamically when tab switches
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'graph') {
      fetchGraphData();
    } else if (activeTab === 'capabilities') {
      fetchCapabilitiesData();
    }
  }, [isOpen, activeTab]);

  // ---------------------------------------------------------
  // Data Fetchers
  // ---------------------------------------------------------
  const fetchGraphData = async () => {
    setLoadingGraph(true);
    try {
      const res = await fetch('/api/knowledge/graph');
      const data = await res.json();
      if (data.success) {
        setGraphNodes(data.nodes || []);
        setGraphEdges(data.edges || []);
        setGraphEpisodes(data.episodes || []);
      }
    } catch (err) {
      console.error('Failed to fetch Knowledge Graph:', err);
    } finally {
      setLoadingGraph(false);
    }
  };

  const fetchCapabilitiesData = async () => {
    setLoadingCaps(true);
    try {
      // Definitions
      const defsRes = await fetch('/api/admin/capabilities');
      const defsData = await defsRes.json();
      if (defsData.success) setCapabilities(defsData.definitions || []);

      // Requests
      const reqsRes = await fetch('/api/admin/capabilities/requests');
      const reqsData = await reqsRes.json();
      if (reqsData.success) setCapabilityRequests(reqsData.requests || []);

      // Current agent capabilities
      fetchAgentCapabilities(selectedAgentId);
    } catch (err) {
      console.error('Failed to fetch Capabilities data:', err);
    } finally {
      setLoadingCaps(false);
    }
  };

  const fetchAgentCapabilities = async (agentId: string) => {
    try {
      const res = await fetch(`/api/admin/capabilities/agent/${agentId}`);
      const data = await res.json();
      if (data.success) {
        setAgentCapabilities(data.capabilities || []);
      }
    } catch (err) {
      console.error('Failed to fetch agent capabilities:', err);
    }
  };

  // ---------------------------------------------------------
  // Actions
  // ---------------------------------------------------------
  const handleResolveRequest = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    soundFx.playClick();
    try {
      const res = await fetch('/api/admin/capabilities/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, decision }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`✅ Request ${decision} successfully!`);
        fetchCapabilitiesData();
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(`❌ Error: ${data.error || 'Resolution failed'}`);
      }
    } catch (err: any) {
      setToast(`❌ Error: ${err.message}`);
    }
  };

  const handleGrantCapability = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    if (!grantCapId || !grantAgentId) return;

    try {
      const res = await fetch('/api/admin/capabilities/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: grantAgentId,
          capabilityId: grantCapId,
          notes: grantNotes
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`✨ Successfully granted ${grantCapId} to ${grantAgentId}!`);
        fetchCapabilitiesData();
        setGrantNotes('');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err: any) {
      setToast(`❌ Error: ${err.message}`);
    }
  };

  const handleRevokeCapability = async (agentId: string, capabilityId: string) => {
    soundFx.playClick();
    try {
      const res = await fetch('/api/admin/capabilities/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, capabilityId }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`🚫 Revoked ${capabilityId} from ${agentId}`);
        fetchAgentCapabilities(agentId);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err: any) {
      setToast(`❌ Error: ${err.message}`);
    }
  };

  // ---------------------------------------------------------
  // Mappings & Calculations
  // ---------------------------------------------------------
  const stats = useMemo(() => {
    return knowledgeBaseService.getStats();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return knowledgeBaseService.search({
      query: searchQuery,
      category: selectedCategory,
    });
  }, [entries, searchQuery, selectedCategory]);

  const activeEntry = useMemo(() => {
    if (!activeEntryId) return filteredEntries[0] || null;
    return entries.find((e) => e.id === activeEntryId) || filteredEntries[0] || null;
  }, [entries, filteredEntries, activeEntryId]);

  const filteredGraphNodes = useMemo(() => {
    if (!graphSearch) return graphNodes;
    const q = graphSearch.toLowerCase();
    return graphNodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [graphNodes, graphSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1d2021]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-[#fbf1c7] border-4 border-[#bdae93] rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-[#3c3836]"
        style={{
          backgroundImage: 'radial-gradient(#ebdbb2 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* MODAL HEADER */}
        <div className="bg-[#ebdbb2] border-b-2 border-[#d5c4a1] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#282828] uppercase tracking-wider">
                  Rufflo AI Memory & Dynamic Security OS
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#b8bb26] text-[#1d2021] font-bold border border-[#98971a]">
                  ACTIVE NEURAL FRAMEWORK
                </span>
              </div>
              <p className="text-[11px] text-[#7c6f64]">
                Manage long-term Knowledge Graphs, episodic Orchestration memory, and granular Agent Capabilities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundFx.playClick(); onClose(); }}
              className="w-8 h-8 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] font-bold flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="bg-[#ebdbb2] border-b-2 border-[#d5c4a1] px-6 flex gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('cascade'); }}
            className={`px-4 py-2 text-xs font-black uppercase border-t-4 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cascade'
                ? 'bg-[#fbf1c7] border-[#d79921] text-[#282828]'
                : 'border-transparent text-[#7c6f64] hover:text-[#3c3836]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#d79921]" />
            Corporate Command Cascade
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('discovery'); }}
            className={`px-4 py-2 text-xs font-black uppercase border-t-4 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'discovery'
                ? 'bg-[#fbf1c7] border-[#b57614] text-[#282828]'
                : 'border-transparent text-[#7c6f64] hover:text-[#3c3836]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#b57614]" />
            Continuous Learning Radar
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('workforce'); }}
            className={`px-4 py-2 text-xs font-black uppercase border-t-4 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'workforce'
                ? 'bg-[#fbf1c7] border-[#076678] text-[#282828]'
                : 'border-transparent text-[#7c6f64] hover:text-[#3c3836]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[#076678]" />
            Virtual Workforce Fleet
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('kb'); }}
            className={`px-4 py-2 text-xs font-black uppercase border-t-4 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'kb'
                ? 'bg-[#fbf1c7] border-[#427b58] text-[#282828]'
                : 'border-transparent text-[#7c6f64] hover:text-[#3c3836]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Knowledge Base
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('graph'); }}
            className={`px-4 py-2 text-xs font-black uppercase border-t-4 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'graph'
                ? 'bg-[#fbf1c7] border-[#af3a03] text-[#282828]'
                : 'border-transparent text-[#7c6f64] hover:text-[#3c3836]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Knowledge Graph
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('capabilities'); }}
            className={`px-4 py-2 text-xs font-black uppercase border-t-4 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'capabilities'
                ? 'bg-[#fbf1c7] border-[#8f3f71] text-[#282828]'
                : 'border-transparent text-[#7c6f64] hover:text-[#3c3836]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Granular Capabilities
          </button>
        </div>

        {/* TOAST PANEL */}
        {toast && (
          <div className="bg-[#b8bb26] text-[#1d2021] px-6 py-2 text-xs font-bold flex items-center justify-between border-b border-[#98971a]">
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="underline text-[10px]">Dismiss</button>
          </div>
        )}

        {/* MAIN BODY SCROLLER */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* TAB 1: TRADITIONAL KNOWLEDGE BASE */}
          {activeTab === 'kb' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-[#f9f5d7] border-b border-[#d5c4a1] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span>Total Insights: <strong className="text-[#b57614]">{entries.length}</strong></span>
                  <span>Learned by Agents: <strong className="text-[#427b58]">{stats.totalLearnedByAgents}</strong></span>
                  <span>Baseline: <strong className="text-[#282828]">Continuous Sync Active</strong></span>
                </div>
                <button
                  onClick={() => { soundFx.playClick(); setIsAdding(!isAdding); }}
                  className="px-3 py-1 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] text-xs font-bold"
                >
                  {isAdding ? '← View Catalog' : '+ Write Insight'}
                </button>
              </div>

              {isAdding ? (
                <div className="flex-1 p-6 overflow-y-auto max-w-2xl mx-auto w-full flex flex-col gap-4 text-xs">
                  <div className="border-b-2 border-dashed border-[#d5c4a1] pb-2">
                    <h3 className="text-sm font-black text-[#282828] uppercase">Publish Verified Finding</h3>
                    <p className="text-[11px] text-[#7c6f64]">This finding binds directly to fleet workflows as a hot reference.</p>
                  </div>
                  <div>
                    <label className="block font-bold text-[#3c3836] mb-1">Finding Title</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. CSRF Token Rotation and Origin Strictness"
                      className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#3c3836] mb-1">Domain</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as KnowledgeCategory)}
                        className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
                      >
                        <option value="hacking">🛡️ Cybersecurity & Hacking</option>
                        <option value="marketing">📢 B2B Marketing</option>
                        <option value="finance">📊 Finance Ledger</option>
                        <option value="coding">💻 Core Coding</option>
                        <option value="social_media">📱 Social Plugin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#3c3836] mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={formTags}
                        onChange={(e) => setFormTags(e.target.value)}
                        placeholder="zero-trust, csrf, security"
                        className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-[#3c3836] mb-1">Summary</label>
                    <textarea
                      rows={2}
                      value={formSummary}
                      onChange={(e) => setFormSummary(e.target.value)}
                      placeholder="Summary sentence..."
                      className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#3c3836] mb-1">Actionable Recommendation</label>
                    <input
                      type="text"
                      value={formInsight}
                      onChange={(e) => setFormInsight(e.target.value)}
                      placeholder="Mandatory check rule..."
                      className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#3c3836] mb-1">Technical Spec</label>
                    <textarea
                      rows={4}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Detailed standards or code payload..."
                      className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[#d5c4a1]">
                    <button
                      onClick={() => setIsAdding(false)}
                      className="px-4 py-1.5 rounded bg-[#ebdbb2] font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!formTitle.trim()) return;
                        knowledgeBaseService.addEntry({
                          title: formTitle.trim(),
                          category: formCategory,
                          summary: formSummary.trim() || formTitle.trim(),
                          content: formContent.trim() || formSummary.trim(),
                          actionableInsight: formInsight.trim() || 'Verify secure execution.',
                          tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
                          authorAgentId: 'commander',
                          authorAgentName: 'OS Fleet Commander',
                          confidenceScore: 0.99,
                        });
                        setIsAdding(false);
                        setFormTitle('');
                        setFormSummary('');
                        setFormInsight('');
                        setFormContent('');
                        setFormTags('');
                        setToast('✅ Insight compiled into dynamic database!');
                        setTimeout(() => setToast(null), 3000);
                      }}
                      className="px-5 py-1.5 rounded bg-[#b57614] text-[#fbf1c7] font-bold text-xs"
                    >
                      Publish Item
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* LEFT LIST PANEL */}
                  <div className="w-full md:w-5/12 border-r-2 border-[#d5c4a1] bg-[#ebdbb2]/30 flex flex-col p-4 gap-3 overflow-hidden">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search manual catalog..."
                        className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded px-3 py-1.5 pl-8 text-xs text-[#282828] outline-none focus:border-[#b57614]"
                      />
                      <Search className="w-3.5 h-3.5 text-[#7c6f64] absolute left-2.5 top-2" />
                    </div>

                    <div className="flex flex-wrap gap-1 text-[10px]">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-2 py-0.5 rounded font-bold ${
                          selectedCategory === 'all' ? 'bg-[#282828] text-[#fbf1c7]' : 'bg-[#fbf1c7] border border-[#d5c4a1]'
                        }`}
                      >
                        All ({entries.length})
                      </button>
                      <button
                        onClick={() => setSelectedCategory('hacking')}
                        className={`px-2 py-0.5 rounded font-bold ${
                          selectedCategory === 'hacking' ? 'bg-[#cc241d] text-[#fbf1c7]' : 'bg-[#fbf1c7] border border-[#d5c4a1]'
                        }`}
                      >
                        🛡️ Hacking
                      </button>
                      <button
                        onClick={() => setSelectedCategory('coding')}
                        className={`px-2 py-0.5 rounded font-bold ${
                          selectedCategory === 'coding' ? 'bg-[#458588] text-[#fbf1c7]' : 'bg-[#fbf1c7] border border-[#d5c4a1]'
                        }`}
                      >
                        💻 Coding
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {filteredEntries.map((item) => {
                        const isSel = activeEntry?.id === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => { soundFx.playClick(); setActiveEntryId(item.id); }}
                            className={`p-2.5 rounded border-2 cursor-pointer transition-all ${
                              isSel ? 'bg-[#fbf1c7] border-[#b57614]' : 'bg-[#f9f5d7] border-[#d5c4a1]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#ebdbb2]">
                                {item.category}
                              </span>
                              <span className="text-[9px] text-[#427b58] font-bold">
                                {Math.round(item.confidenceScore * 100)}% Conf
                              </span>
                            </div>
                            <div className="font-bold text-xs text-[#282828] line-clamp-1">{item.title}</div>
                            <p className="text-[10px] text-[#7c6f64] line-clamp-2 mt-0.5 leading-tight">{item.summary}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT INSPECTION PANEL */}
                  <div className="w-full md:w-7/12 p-6 overflow-y-auto flex flex-col gap-4 bg-[#fbf1c7]/40">
                    {activeEntry ? (
                      <>
                        <div className="border-b-2 border-dashed border-[#d5c4a1] pb-3">
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#ebdbb2] border border-[#d5c4a1] text-[#b57614]">
                            {activeEntry.category}
                          </span>
                          <h3 className="text-sm font-black text-[#282828] mt-1">{activeEntry.title}</h3>
                          <span className="text-[10px] text-[#7c6f64] block mt-1">Author: <strong>{activeEntry.authorAgentName}</strong></span>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-[#7c6f64] mb-1">Overview</h4>
                          <p className="text-xs text-[#3c3836] leading-relaxed">{activeEntry.summary}</p>
                        </div>
                        <div className="bg-[#f9f5d7] border border-[#d5c4a1] p-3 rounded">
                          <h4 className="text-[9px] font-black uppercase text-[#b57614] mb-1">Actionable Insight</h4>
                          <p className="text-xs text-[#282828] font-medium">{activeEntry.actionableInsight}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-[#7c6f64] mb-1">Full Documentation</h4>
                          <div className="bg-[#f9f5d7] border border-[#d5c4a1] p-3 rounded text-xs text-[#3c3836] whitespace-pre-wrap leading-relaxed">
                            {activeEntry.content}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {activeEntry.tags.map((tag, idx) => (
                            <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-[#ebdbb2] text-[#504945]">#{tag}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-20 text-[#7c6f64]">Select an entry on the left.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERSISTENT KNOWLEDGE GRAPH */}
          {activeTab === 'graph' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Graph Stats Bar */}
              <div className="bg-[#f9f5d7] border-b border-[#d5c4a1] px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-5">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Network className="w-4 h-4 text-[#458588]" />
                    Graph Nodes: <strong className="text-[#b57614]">{graphNodes.length}</strong>
                  </span>
                  <span className="font-bold">Relationships: <strong className="text-[#427b58]">{graphEdges.length}</strong></span>
                  <span className="font-bold">Episodic Logs: <strong className="text-[#d65d0e]">{graphEpisodes.length}</strong></span>
                </div>
                <button
                  onClick={() => { soundFx.playClick(); fetchGraphData(); }}
                  className="p-1 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] transition-colors"
                  title="Refresh Graph"
                >
                  <RefreshCw className="w-4 h-4 text-[#282828]" />
                </button>
              </div>

              {loadingGraph ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#b57614]" />
                  <span className="text-xs font-bold text-[#7c6f64]">Parsing memory nodes & associative maps...</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* LEFT PART: GRAPH NODES & RELATIONS */}
                  <div className="w-full md:w-6/12 border-r-2 border-[#d5c4a1] flex flex-col overflow-hidden">
                    {/* Node search */}
                    <div className="p-4 border-b border-[#d5c4a1] bg-[#ebdbb2]/20">
                      <div className="relative">
                        <input
                          type="text"
                          value={graphSearch}
                          onChange={(e) => setGraphSearch(e.target.value)}
                          placeholder="Search knowledge graph concepts..."
                          className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded px-3 py-1.5 pl-8 text-xs outline-none"
                        />
                        <Search className="w-3.5 h-3.5 text-[#7c6f64] absolute left-2.5 top-2" />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      <div className="text-[10px] uppercase font-black text-[#7c6f64] border-b border-dashed border-[#d5c4a1] pb-1">
                        Semantic Graph Nodes ({filteredGraphNodes.length})
                      </div>
                      {filteredGraphNodes.length === 0 ? (
                        <div className="text-center py-10 text-xs text-[#7c6f64]">
                          No semantic node records populated yet. Runs completed by the Master Orchestrator will automatically register events and notes here.
                        </div>
                      ) : (
                        filteredGraphNodes.map((node) => (
                          <div key={node.id} className="p-3 bg-[#f9f5d7] border border-[#d5c4a1] rounded hover:border-[#b57614] transition-all">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                node.type === 'concept' ? 'bg-[#ebdbb2] text-[#282828] border-[#bdae93]' :
                                node.type === 'agent_note' ? 'bg-[#d65d0e]/20 text-[#af3a03] border-[#fe8019]' :
                                'bg-[#458588]/20 text-[#076678] border-[#83a598]'
                              }`}>
                                {node.type}
                              </span>
                              <span className="text-[9px] text-[#7c6f64]">{new Date(node.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="font-bold text-xs text-[#282828]">{node.label}</div>
                            <p className="text-[10px] text-[#504945] mt-1 whitespace-pre-wrap leading-relaxed">{node.content}</p>
                            
                            {/* Render tags */}
                            {node.tags && node.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {node.tags.map((tag: string, idx: number) => (
                                  <span key={idx} className="text-[8px] bg-[#ebdbb2] text-[#3c3836] px-1.5 py-0.2 rounded font-mono">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {/* Display Relations */}
                      {graphEdges.length > 0 && (
                        <div className="pt-4 space-y-2">
                          <div className="text-[10px] uppercase font-black text-[#7c6f64] border-b border-dashed border-[#d5c4a1] pb-1">
                            Node Association Maps / Edges ({graphEdges.length})
                          </div>
                          {graphEdges.map((edge) => (
                            <div key={edge.id} className="p-2 bg-[#ebdbb2]/20 border border-[#d5c4a1] rounded text-[10px] flex items-center justify-between">
                              <div>
                                <span className="font-bold text-[#b57614]">{edge.from}</span>
                                <span className="text-[#7c6f64] px-1.5 font-bold uppercase">→ {edge.relation} →</span>
                                <span className="font-bold text-[#458588]">{edge.to}</span>
                              </div>
                              <span className="text-[9px] bg-[#ebdbb2] px-1 py-0.2 rounded font-mono">w: {edge.weight}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT PART: EPISODIC CONVERSATION/PLANNING LOGS */}
                  <div className="w-full md:w-6/12 p-4 flex flex-col overflow-hidden">
                    <div className="text-[10px] uppercase font-black text-[#7c6f64] border-b border-dashed border-[#d5c4a1] pb-2 flex items-center justify-between">
                      <span>Episodic Execution Memory ({graphEpisodes.length})</span>
                      <span className="text-[9px] text-[#427b58] font-bold uppercase">Orchestrator Core Sync</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
                      {graphEpisodes.length === 0 ? (
                        <div className="text-center py-20 text-xs text-[#7c6f64] border-2 border-dashed border-[#d5c4a1] rounded p-6">
                          <Activity className="w-8 h-8 text-[#7c6f64] mx-auto mb-2 opacity-50" />
                          <p className="font-bold mb-1">No execution episodes logged yet</p>
                          <p className="text-[10px] leading-relaxed">Runs executed inside the Master Orchestrator (hierarchical plan loops) are persistently logged here as long-term episodic memory.</p>
                        </div>
                      ) : (
                        graphEpisodes.map((ep) => (
                          <div key={ep.id} className="p-3.5 bg-[#ebdbb2]/30 border border-[#d5c4a1] rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-[#b57614] font-black uppercase">Plan: {ep.planId || 'Unknown'}</span>
                              <span className="text-[9px] text-[#7c6f64]">{new Date(ep.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div className="font-black text-xs text-[#282828] mb-1.5 flex items-start gap-1">
                              <span className="text-sm">🎯</span>
                              <div>{ep.objective}</div>
                            </div>

                            <div className="text-[11px] bg-[#fbf1c7] border border-[#d5c4a1] p-2.5 rounded font-mono text-[#3c3836] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {ep.summary}
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-[#d5c4a1]">
                              <span className="text-[9px] text-[#7c6f64]">
                                Operator: <strong className="text-[#3c3836]">{ep.agentId}</strong>
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                ep.outcome === 'success' ? 'bg-[#b8bb26]/20 text-[#427b58] border border-[#b8bb26]' : 'bg-[#cc241d]/20 text-[#cc241d] border border-[#cc241d]'
                              }`}>
                                {ep.outcome}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DYNAMIC CAPABILITY REGISTRY */}
          {activeTab === 'capabilities' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-[#f9f5d7] border-b border-[#d5c4a1] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-bold">
                    <Shield className="w-4 h-4 text-[#b8bb26]" />
                    Total Capabilities: <strong className="text-[#b57614]">{capabilities.length}</strong>
                  </span>
                  <span className="font-bold">Pending Requests: <strong className="text-[#cc241d]">{capabilityRequests.filter(r => r.status === 'PENDING').length}</strong></span>
                </div>
                <button
                  onClick={() => { soundFx.playClick(); fetchCapabilitiesData(); }}
                  className="p-1 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] transition-colors"
                  title="Refresh Capabilities"
                >
                  <RefreshCw className="w-4 h-4 text-[#282828]" />
                </button>
              </div>

              {loadingCaps ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#b57614]" />
                  <span className="text-xs font-bold text-[#7c6f64]">Reading role schemas & authorization matrix...</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* LEFT SUB-PANE: GRANULAR CONTROLS & MANUAL GRANT */}
                  <div className="w-full md:w-5/12 border-r-2 border-[#d5c4a1] flex flex-col p-4 gap-4 overflow-y-auto">
                    {/* Manual Grant Form */}
                    <div className="p-4 bg-[#f9f5d7] border border-[#d5c4a1] rounded-lg space-y-3">
                      <div className="text-[11px] uppercase font-black text-[#282828] border-b border-dashed border-[#d5c4a1] pb-1 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-[#b57614]" />
                        Authorize Agent Power (Manual)
                      </div>
                      <form onSubmit={handleGrantCapability} className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-[#7c6f64] mb-1">Assigned Agent</label>
                          <select
                            value={grantAgentId}
                            onChange={(e) => setGrantAgentId(e.target.value)}
                            className="w-full bg-[#fbf1c7] border border-[#d5c4a1] p-1.5 rounded outline-none"
                          >
                            <option value="ruflo">ruflo ( Ruflo Coder )</option>
                            <option value="pete">pete ( Pete Miller )</option>
                            <option value="michael">michael ( Michael G. Scott )</option>
                            <option value="stanley">stanley ( Stanley Hudson )</option>
                            <option value="dwight">dwight ( Dwight Schrute )</option>
                            <option value="toby">toby ( Toby Flenderson )</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#7c6f64] mb-1">Target Capability ID</label>
                          <select
                            value={grantCapId}
                            onChange={(e) => setGrantCapId(e.target.value)}
                            className="w-full bg-[#fbf1c7] border border-[#d5c4a1] p-1.5 rounded outline-none"
                          >
                            <option value="">-- Choose Power --</option>
                            {capabilities.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.id} ({c.baseRisk})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#7c6f64] mb-1">Clearance Reason / Note</label>
                          <input
                            type="text"
                            value={grantNotes}
                            onChange={(e) => setGrantNotes(e.target.value)}
                            placeholder="e.g. Authorized to run Playwright sandbox"
                            className="w-full bg-[#fbf1c7] border border-[#d5c4a1] p-1.5 rounded outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-1.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Commit Grant Clearance
                        </button>
                      </form>
                    </div>

                    {/* Active agent viewer */}
                    <div className="space-y-3">
                      <div className="text-[11px] uppercase font-black text-[#282828] border-b border-dashed border-[#d5c4a1] pb-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#458588]" />
                        Active Agent Grant Matrix
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#7c6f64]">Filter Agent:</span>
                        <select
                          value={selectedAgentId}
                          onChange={(e) => {
                            setSelectedAgentId(e.target.value);
                            fetchAgentCapabilities(e.target.value);
                          }}
                          className="bg-[#f9f5d7] border border-[#d5c4a1] px-2 py-1 rounded outline-none"
                        >
                          <option value="ruflo">ruflo</option>
                          <option value="pete">pete</option>
                          <option value="michael">michael</option>
                          <option value="stanley">stanley</option>
                          <option value="dwight">dwight</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {agentCapabilities.length === 0 ? (
                          <p className="text-[10px] text-center text-[#7c6f64] py-3">No custom dynamic capabilities assigned.</p>
                        ) : (
                          agentCapabilities.map((cap) => (
                            <div key={cap} className="p-2 bg-[#fbf1c7] border border-[#d5c4a1] rounded flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#3c3836] font-mono break-all pr-2">{cap}</span>
                              <button
                                onClick={() => handleRevokeCapability(selectedAgentId, cap)}
                                className="px-1.5 py-0.5 rounded bg-[#cc241d]/10 hover:bg-[#cc241d]/20 text-[#cc241d] font-bold transition-all text-[9px]"
                              >
                                Revoke
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SUB-PANE: DEFINITIONS & LIVE REQUESTS */}
                  <div className="w-full md:w-7/12 p-4 flex flex-col gap-4 overflow-y-auto">
                    {/* Capability Requests Box */}
                    <div className="space-y-3">
                      <div className="text-[11px] uppercase font-black text-[#282828] border-b border-dashed border-[#d5c4a1] pb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-[#d65d0e]" />
                          Incoming Runtime Power Requests ({capabilityRequests.length})
                        </span>
                        <span className="text-[8px] bg-[#cc241d]/10 text-[#cc241d] px-1.5 py-0.2 rounded font-bold uppercase">Human Gate Required</span>
                      </div>

                      {capabilityRequests.length === 0 ? (
                        <div className="text-center py-6 text-xs text-[#7c6f64] border-2 border-dashed border-[#d5c4a1] rounded p-4">
                          All agent requests processed. When agents encounter sandboxed gates (like Playwright browser automation or DB alter requests), they trigger dynamic authorization requests here.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {capabilityRequests.map((req) => (
                            <div key={req.id} className="p-3 bg-[#fbf1c7] border border-[#d5c4a1] rounded-lg">
                              <div className="flex items-center justify-between mb-1.5 text-[10px]">
                                <span className="font-bold text-[#b57614] uppercase">ID: {req.id}</span>
                                <span className="text-[#7c6f64]">{new Date(req.requestedAt).toLocaleTimeString()}</span>
                              </div>

                              <div className="text-xs font-bold text-[#282828] mb-1">
                                Agent <strong className="text-[#458588]">{req.agentId}</strong> requests power:
                              </div>
                              <div className="text-xs font-mono font-black text-[#3c3836] bg-[#ebdbb2]/30 p-1.5 rounded break-all border border-[#d5c4a1] mb-2">
                                {req.capabilityId}
                              </div>

                              <div className="text-[11px] text-[#504945] italic mb-2 leading-relaxed">
                                &quot;{req.reason}&quot;
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#d5c4a1]">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                  req.status === 'PENDING' ? 'bg-[#b57614]/20 text-[#b57614]' :
                                  req.status === 'APPROVED' ? 'bg-[#b8bb26]/20 text-[#427b58]' :
                                  'bg-[#cc241d]/20 text-[#cc241d]'
                                }`}>
                                  {req.status}
                                </span>

                                {req.status === 'PENDING' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleResolveRequest(req.id, 'APPROVED')}
                                      className="px-2.5 py-1 rounded bg-[#b8bb26] hover:bg-[#98971a] text-[#1d2021] text-[10px] font-bold flex items-center gap-1 transition-all"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleResolveRequest(req.id, 'REJECTED')}
                                      className="px-2.5 py-1 rounded bg-[#cc241d] hover:bg-[#9d0006] text-[#fbf1c7] text-[10px] font-bold flex items-center gap-1 transition-all"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Capability Definitions Reference Table */}
                    <div className="space-y-3 pt-2">
                      <div className="text-[11px] uppercase font-black text-[#282828] border-b border-dashed border-[#d5c4a1] pb-1">
                        Dynamic Capability Registry Index ({capabilities.length})
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {capabilities.map((c) => (
                          <div key={c.id} className="p-2.5 bg-[#ebdbb2]/15 border border-[#d5c4a1] rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold font-mono text-[#3c3836] break-all">{c.id}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.1 rounded border ${
                                c.baseRisk === 'LOW' ? 'bg-[#b8bb26]/10 text-[#427b58] border-[#b8bb26]' :
                                c.baseRisk === 'MEDIUM' ? 'bg-[#b57614]/10 text-[#b57614] border-[#b57614]' :
                                'bg-[#cc241d]/10 text-[#cc241d] border-[#cc241d]'
                              }`}>
                                {c.baseRisk}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#7c6f64] leading-normal">{c.description}</p>
                            <div className="flex gap-2 mt-1.5 text-[8px] font-bold text-[#7c6f64] uppercase">
                              <span>Tool: {c.tool}</span>
                              <span>·</span>
                              <span>Action: {c.action}</span>
                              {c.requiresEngineeringRole && (
                                <>
                                  <span>·</span>
                                  <span className="text-[#af3a03]">Engineer Role Required</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTINUOUS LEARNING RADAR */}
          {activeTab === 'discovery' && <AutonomousLearningRadarTab />}

          {/* TAB 5: UNLIMITED VIRTUAL WORKFORCE */}
          {activeTab === 'workforce' && <VirtualWorkforceFleetTab />}

          {/* TAB 6: CORPORATE COMMAND CASCADE LOOP */}
          {activeTab === 'cascade' && <CorporateCascadeTab />}
        </div>
      </div>
    </div>
  );
};
