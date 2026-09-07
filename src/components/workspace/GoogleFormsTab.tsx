import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Eye,
  BarChart2,
  Sparkles,
  HelpCircle,
  Clock,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  GoogleFormSummary,
  FullGoogleForm,
  GoogleFormResponseItem,
  PRESET_FORM_TEMPLATES,
} from '../../utils/googleFormsService';

interface GoogleFormsTabProps {
  token: string | null;
  forms: GoogleFormSummary[];
  selectedForm: FullGoogleForm | null;
  selectedFormResponses: GoogleFormResponseItem[];
  isLoadingForms: boolean;
  isLoadingDetails: boolean;
  onRefreshForms: () => void;
  onSelectForm: (formId: string) => void;
  onOpenCreateModal: () => void;
  onCreatePresetForm: (presetId: string) => void;
  onDeleteForm: (formId: string, formTitle: string) => void;
  onSignIn: () => void;
}

export const GoogleFormsTab: React.FC<GoogleFormsTabProps> = ({
  token,
  forms,
  selectedForm,
  selectedFormResponses,
  isLoadingForms,
  isLoadingDetails,
  onRefreshForms,
  onSelectForm,
  onOpenCreateModal,
  onCreatePresetForm,
  onDeleteForm,
  onSignIn,
}) => {
  const [detailTab, setDetailTab] = useState<'questions' | 'responses'>('questions');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#181615]">
      {/* Forms Subheader & Actions */}
      <div className="p-4 bg-[#201d1b] border-b border-[#3c3836] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-purple-400" />
            <span>Google Forms Automation & Live Responses</span>
            {token && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                API Connected
              </span>
            )}
          </h3>
          <p className="text-[11px] text-[#a89984]">
            Create forms, inspect question schemas, and read incoming submissions using Google Forms API v1.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-forms"
            onClick={onRefreshForms}
            disabled={isLoadingForms}
            className="p-2 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] border border-[#3c3836] rounded-lg text-xs transition-colors flex items-center gap-1.5"
            title="Refresh Forms"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingForms ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            id="btn-open-create-form"
            onClick={onOpenCreateModal}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create Form</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Generator Bar */}
      <div className="px-4 py-2.5 bg-[#141211] border-b border-[#3c3836] flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[10px] font-bold text-[#a89984] uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-purple-400" /> Quick Presets:
        </span>
        {PRESET_FORM_TEMPLATES.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onCreatePresetForm(preset.id)}
            className="px-2.5 py-1 bg-[#282828] hover:bg-purple-950/40 hover:text-purple-300 hover:border-purple-500/50 border border-[#3c3836] rounded text-[11px] text-[#ebdbb2] transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Main Dual-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Forms Catalog List */}
        <div className="w-1/2 border-r border-[#3c3836] flex flex-col bg-[#161413]">
          <div className="p-3 border-b border-[#3c3836] bg-[#1a1816] flex items-center justify-between text-xs">
            <span className="font-bold text-[#d5c4a1]">Available Forms ({forms.length})</span>
            {!token && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Sign in to sync live Drive forms
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {forms.length === 0 ? (
              <div className="text-center py-12 text-[#a89984] text-xs">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-[#504945]" />
                <p>No Google Forms detected.</p>
                <button
                  onClick={onOpenCreateModal}
                  className="mt-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs"
                >
                  Create Your First Form
                </button>
              </div>
            ) : (
              forms.map((form) => {
                const isSelected = selectedForm?.formId === form.id;
                return (
                  <div
                    key={form.id}
                    onClick={() => onSelectForm(form.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500/50 shadow-sm'
                        : 'bg-[#1f1d1b] border-[#3c3836] hover:border-[#504945]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ClipboardList className={`w-4 h-4 shrink-0 ${isSelected ? 'text-purple-400' : 'text-[#a89984]'}`} />
                          <h4 className="text-xs font-bold text-white truncate">{form.name}</h4>
                        </div>
                        {form.description && (
                          <p className="text-[11px] text-[#a89984] line-clamp-2 mt-1 pl-6">
                            {form.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 pl-6 text-[10px] text-[#928374]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {form.modifiedTime || 'Recently'}
                          </span>
                          {form.responseCount !== undefined && (
                            <span className="flex items-center gap-1 text-purple-300">
                              <Users className="w-3 h-3" /> {form.responseCount} responses
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {form.webViewLink && (
                          <a
                            href={form.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-[#3c3836] text-[#a89984] hover:text-purple-300 rounded transition-colors"
                            title="Open in Google Forms"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleCopyLink(form.webViewLink || `https://docs.google.com/forms/d/${form.id}/edit`, form.id)}
                          className="p-1.5 hover:bg-[#3c3836] text-[#a89984] hover:text-white rounded transition-colors"
                          title="Copy Link"
                        >
                          {copiedId === form.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => onDeleteForm(form.id, form.name)}
                          className="p-1.5 hover:bg-red-950/40 text-[#a89984] hover:text-red-400 rounded transition-colors"
                          title="Delete Form from Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Form Schema & Live Submissions */}
        <div className="w-1/2 flex flex-col bg-[#141211]">
          {isLoadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-xs text-[#a89984]">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mb-2" />
              <span>Loading schema & live responses...</span>
            </div>
          ) : selectedForm ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Form Details Header */}
              <div className="p-4 bg-[#1b1917] border-b border-[#3c3836]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedForm.info.title}
                    </h3>
                    {selectedForm.info.description && (
                      <p className="text-xs text-[#a89984] mt-1 leading-relaxed">
                        {selectedForm.info.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedForm.responderUri || `https://docs.google.com/forms/d/${selectedForm.formId}/edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow"
                    >
                      <span>Open Live Form</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Sub-tabs: Questions vs Responses */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#2d2a28] text-xs">
                  <button
                    onClick={() => setDetailTab('questions')}
                    className={`flex items-center gap-1.5 pb-1 font-bold transition-colors border-b-2 ${
                      detailTab === 'questions'
                        ? 'border-purple-400 text-purple-400'
                        : 'border-transparent text-[#a89984] hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Questions ({selectedForm.items.length})</span>
                  </button>
                  <button
                    onClick={() => setDetailTab('responses')}
                    className={`flex items-center gap-1.5 pb-1 font-bold transition-colors border-b-2 ${
                      detailTab === 'responses'
                        ? 'border-purple-400 text-purple-400'
                        : 'border-transparent text-[#a89984] hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Live Responses ({selectedFormResponses.length})</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab Body */}
              <div className="flex-1 overflow-y-auto p-4">
                {detailTab === 'questions' ? (
                  <div className="space-y-3">
                    {selectedForm.items.length === 0 ? (
                      <div className="text-center py-8 text-[#a89984] text-xs">
                        No questions found in this form.
                      </div>
                    ) : (
                      selectedForm.items.map((q, idx) => (
                        <div
                          key={q.itemId || idx}
                          className="p-3 bg-[#1d1b19] border border-[#3c3836] rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-[#a89984]">Question {idx + 1}</span>
                            <div className="flex items-center gap-2">
                              {q.required && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-bold">
                                  Required
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#282828] text-purple-300 border border-[#3c3836] rounded font-mono">
                                {q.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-white mb-2">{q.title}</div>
                          {q.options && q.options.length > 0 && (
                            <div className="space-y-1 pl-2 border-l border-[#3c3836]">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="text-[11px] text-[#ebdbb2] flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedFormResponses.length === 0 ? (
                      <div className="text-center py-12 text-[#a89984] text-xs">
                        <Users className="w-8 h-8 mx-auto mb-2 text-[#504945]" />
                        <p>No submissions recorded yet for this form.</p>
                        <a
                          href={selectedForm.responderUri || `https://docs.google.com/forms/d/${selectedForm.formId}/viewform`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit a Test Response</span>
                        </a>
                      </div>
                    ) : (
                      selectedFormResponses.map((resp, rIdx) => (
                        <div
                          key={resp.responseId || rIdx}
                          className="p-3 bg-[#1d1b19] border border-[#3c3836] rounded-lg"
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#a89984] mb-2 pb-1 border-b border-[#2d2a28]">
                            <span className="font-bold text-white">
                              Submission #{rIdx + 1} {resp.respondentEmail && `• ${resp.respondentEmail}`}
                            </span>
                            <span>{new Date(resp.createTime).toLocaleString()}</span>
                          </div>
                          <div className="space-y-2">
                            {resp.answers.map((ans, aIdx) => (
                              <div key={aIdx} className="text-[11px]">
                                <span className="text-[#a89984] font-medium">{ans.questionTitle}: </span>
                                <span className="text-purple-300 font-bold">{ans.values.join(', ') || 'No answer'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[#a89984]">
              <ClipboardList className="w-10 h-10 text-[#3c3836] mb-3" />
              <p className="font-bold text-white text-sm mb-1">No Form Selected</p>
              <p className="max-w-xs text-[#a89984]">
                Select a form from the catalog on the left to inspect its questions, responder URL, and live response submissions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
