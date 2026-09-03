import React, { useState, useEffect, useMemo } from 'react';
import { KnowledgeCategory, KnowledgeEntry } from '../types/knowledgeBase';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { soundFx } from '../utils/speech';

interface DynamicKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DynamicKnowledgeBaseModal: React.FC<DynamicKnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
}) => {
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

  useEffect(() => {
    if (!isOpen) return;
    setEntries(knowledgeBaseService.getAll());
    const unsub = knowledgeBaseService.subscribe(() => {
      setEntries(knowledgeBaseService.getAll());
    });
    return unsub;
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1d2021]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-[#fbf1c7] border-4 border-[#bdae93] rounded-xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden font-mono text-[#3c3836]"
        style={{
          backgroundImage: 'radial-gradient(#ebdbb2 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* MODAL HEADER */}
        <div className="bg-[#ebdbb2] border-b-2 border-[#d5c4a1] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#282828] uppercase tracking-wider">
                  Dynamic Knowledge Base
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#b8bb26] text-[#1d2021] font-bold border border-[#98971a]">
                  AUTONOMOUS FLEET INTELLIGENCE
                </span>
              </div>
              <p className="text-[11px] text-[#7c6f64]">
                Self-updating intelligence repository across Hacking, Marketing, Finance, Coding & Social Media
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { soundFx.playClick(); setIsAdding(!isAdding); }}
              className="px-3 py-1.5 rounded bg-[#b57614] hover:bg-[#8f5d0f] text-[#fbf1c7] text-xs font-bold transition-colors"
            >
              {isAdding ? '← View Knowledge' : '+ New Insight'}
            </button>
            <button
              onClick={() => { soundFx.playClick(); onClose(); }}
              className="w-8 h-8 rounded bg-[#d5c4a1] hover:bg-[#bdae93] text-[#282828] font-bold flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TOAST */}
        {toast && (
          <div className="bg-[#b8bb26] text-[#1d2021] px-4 py-1.5 text-xs font-bold flex items-center justify-between border-b border-[#98971a]">
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="underline text-[10px]">Dismiss</button>
          </div>
        )}

        {/* STATS STRIP */}
        <div className="bg-[#f9f5d7] border-b border-[#d5c4a1] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span>Total Insights: <strong className="text-[#b57614]">{entries.length}</strong></span>
            <span>Learned by Agents: <strong className="text-[#427b58]">{stats.totalLearnedByAgents}</strong></span>
            <span>Verification Rate: <strong className="text-[#282828]">100% Deterministic</strong></span>
          </div>

          <div className="text-[11px] text-[#7c6f64]">
            Continuous sync enabled · No external cloud file dependencies
          </div>
        </div>

        {/* CONTENT AREA */}
        {isAdding ? (
          /* ADD NEW INSIGHT FORM */
          <div className="flex-1 p-6 overflow-y-auto max-w-2xl mx-auto w-full flex flex-col gap-4 text-xs">
            <div className="border-b-2 border-dashed border-[#d5c4a1] pb-2">
              <h3 className="text-sm font-black text-[#282828] uppercase">Submit Verified Knowledge Insight</h3>
              <p className="text-[11px] text-[#7c6f64]">This insight will become immediately available to all fleet agents during task execution.</p>
            </div>

            <div>
              <label className="block font-bold text-[#3c3836] mb-1">Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Distributed Rate-Limiting with Sliding Window"
                className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none focus:border-[#b57614]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#3c3836] mb-1">Domain Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as KnowledgeCategory)}
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
                >
                  <option value="hacking">🛡️ Hacking & Cyber Security</option>
                  <option value="marketing">📢 Marketing & Outreach</option>
                  <option value="finance">📊 Finance & Accounting</option>
                  <option value="coding">💻 Coding & Engineering</option>
                  <option value="social_media">📱 Social Media Management</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#3c3836] mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="zero-trust, rate-limit, auth"
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
                placeholder="Core summary of the pattern or finding..."
                className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#3c3836] mb-1">Actionable Insight / Takeaway</label>
              <input
                type="text"
                value={formInsight}
                onChange={(e) => setFormInsight(e.target.value)}
                placeholder="Specific operational recommendation for agents..."
                className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#3c3836] mb-1">Detailed Technical Content / Rules</label>
              <textarea
                rows={4}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Comprehensive technical details or code standards..."
                className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded p-2 text-xs outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#d5c4a1]">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-1.5 rounded bg-[#ebdbb2] text-[#3c3836] font-bold"
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
                    actionableInsight: formInsight.trim() || 'Follow verified operational baseline.',
                    tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
                    authorAgentId: 'operator',
                    authorAgentName: 'Fleet Commander',
                    confidenceScore: 0.98,
                  });
                  setIsAdding(false);
                  setFormTitle('');
                  setFormSummary('');
                  setFormInsight('');
                  setFormContent('');
                  setFormTags('');
                  setToast('✅ Insight stored in Dynamic Knowledge Base!');
                  setTimeout(() => setToast(null), 3000);
                }}
                className="px-5 py-1.5 rounded bg-[#b57614] text-[#fbf1c7] font-bold shadow-xs"
              >
                Publish Knowledge Item
              </button>
            </div>
          </div>
        ) : (
          /* DUAL PANE KNOWLEDGE BROWSER */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* LEFT PANE: SEARCH & LIST */}
            <div className="w-full md:w-5/12 border-r-2 border-[#d5c4a1] bg-[#ebdbb2] flex flex-col p-4 gap-3">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search knowledge repository..."
                  className="w-full bg-[#f9f5d7] border border-[#d5c4a1] rounded px-3 py-1.5 pl-8 text-xs text-[#282828] outline-none focus:border-[#b57614]"
                />
                <span className="absolute left-2.5 top-1.5 text-xs text-[#7c6f64]">⌕</span>
              </div>

              {/* Category selector */}
              <div className="flex flex-wrap gap-1 text-[11px]">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-[#282828] text-[#fbf1c7]'
                      : 'bg-[#fbf1c7] text-[#3c3836] border border-[#d5c4a1]'
                  }`}
                >
                  All ({entries.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('hacking')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    selectedCategory === 'hacking'
                      ? 'bg-[#cc241d] text-[#fbf1c7]'
                      : 'bg-[#fbf1c7] text-[#3c3836] border border-[#d5c4a1]'
                  }`}
                >
                  🛡️ Hacking
                </button>
                <button
                  onClick={() => setSelectedCategory('marketing')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    selectedCategory === 'marketing'
                      ? 'bg-[#b57614] text-[#fbf1c7]'
                      : 'bg-[#fbf1c7] text-[#3c3836] border border-[#d5c4a1]'
                  }`}
                >
                  📢 Marketing
                </button>
                <button
                  onClick={() => setSelectedCategory('finance')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    selectedCategory === 'finance'
                      ? 'bg-[#d65d0e] text-[#fbf1c7]'
                      : 'bg-[#fbf1c7] text-[#3c3836] border border-[#d5c4a1]'
                  }`}
                >
                  📊 Finance
                </button>
                <button
                  onClick={() => setSelectedCategory('coding')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    selectedCategory === 'coding'
                      ? 'bg-[#458588] text-[#fbf1c7]'
                      : 'bg-[#fbf1c7] text-[#3c3836] border border-[#d5c4a1]'
                  }`}
                >
                  💻 Coding
                </button>
                <button
                  onClick={() => setSelectedCategory('social_media')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    selectedCategory === 'social_media'
                      ? 'bg-[#b16286] text-[#fbf1c7]'
                      : 'bg-[#fbf1c7] text-[#3c3836] border border-[#d5c4a1]'
                  }`}
                >
                  📱 Social
                </button>
              </div>

              {/* Entries list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredEntries.length === 0 ? (
                  <p className="text-center py-8 text-xs text-[#7c6f64]">
                    No entries match your search criteria.
                  </p>
                ) : (
                  filteredEntries.map((item) => {
                    const isSelected = activeEntry?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => { soundFx.playClick(); setActiveEntryId(item.id); }}
                        className={`p-2.5 rounded border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#fbf1c7] border-[#b57614] shadow-xs'
                            : 'bg-[#f9f5d7] border-[#d5c4a1] hover:bg-[#fbf1c7]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#ebdbb2] text-[#504945]">
                            {item.category}
                          </span>
                          <span className="text-[9px] text-[#427b58] font-bold">
                            {Math.round(item.confidenceScore * 100)}% Confidence
                          </span>
                        </div>
                        <div className="font-bold text-xs text-[#282828] line-clamp-1">
                          {item.title}
                        </div>
                        <p className="text-[10px] text-[#7c6f64] line-clamp-2 mt-0.5 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANE: DETAILED INSPECTION */}
            <div className="w-full md:w-7/12 p-6 overflow-y-auto flex flex-col gap-4 bg-[#fbf1c7]">
              {activeEntry ? (
                <>
                  <div className="border-b-2 border-dashed border-[#d5c4a1] pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#ebdbb2] text-[#b57614] border border-[#d5c4a1]">
                        {activeEntry.category}
                      </span>
                      <span className="text-xs text-[#7c6f64]">
                        Author: <strong>{activeEntry.authorAgentName}</strong>
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#282828] mt-1">
                      {activeEntry.title}
                    </h3>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold uppercase text-[#7c6f64] mb-1">Overview</h4>
                    <p className="text-xs text-[#3c3836] leading-relaxed">
                      {activeEntry.summary}
                    </p>
                  </div>

                  <div className="bg-[#f9f5d7] border border-[#d5c4a1] p-3 rounded">
                    <h4 className="text-[10px] font-bold uppercase text-[#b57614] mb-1">Actionable Recommendation</h4>
                    <p className="text-xs text-[#282828] font-medium">
                      {activeEntry.actionableInsight}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold uppercase text-[#7c6f64] mb-1">Full Technical Documentation</h4>
                    <div className="bg-[#f9f5d7] border border-[#d5c4a1] p-3 rounded text-xs text-[#3c3836] whitespace-pre-wrap leading-relaxed">
                      {activeEntry.content}
                    </div>
                  </div>

                  {activeEntry.codeOrPayload && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-[#7c6f64] mb-1">Code / Verification Spec</h4>
                      <pre className="bg-[#1d2021] text-[#ebdbb2] p-3 rounded text-[11px] overflow-x-auto border border-[#3c3836]">
                        <code>{activeEntry.codeOrPayload}</code>
                      </pre>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {activeEntry.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#ebdbb2] text-[#504945] font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#d5c4a1] flex items-center justify-between text-xs text-[#7c6f64]">
                    <span>Times Referenced: <strong>{activeEntry.usageCount}</strong></span>
                    <button
                      onClick={() => {
                        knowledgeBaseService.upvote(activeEntry.id);
                        setToast(`👍 Validated ${activeEntry.title}`);
                        setTimeout(() => setToast(null), 2500);
                      }}
                      className="px-3 py-1 rounded bg-[#ebdbb2] hover:bg-[#d5c4a1] text-[#282828] font-bold transition-colors"
                    >
                      ▲ Endorse Finding ({activeEntry.usageCount})
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-[#7c6f64]">
                  <p className="font-bold text-sm">Select an insight on the left to inspect details.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
