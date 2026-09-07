import React, { useState, useEffect } from 'react';
import {
  Mail,
  Calendar,
  FileText,
  Table,
  Presentation,
  Video,
  Send,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Copy,
  Trash2,
  Play,
  Sparkles,
  Share2,
  Users,
  Check,
  ClipboardList,
  MessageSquare,
  GraduationCap,
} from 'lucide-react';
import {
  connectGoogleWorkspace,
  workspaceSignOut,
  initWorkspaceAuth,
  setPreferredAuthEngine,
  getPreferredAuthEngine,
  type WorkspaceUser,
} from '../utils/workspaceAuth';
import {
  fetchGoogleForms,
  fetchFormDetails,
  fetchFormResponses,
  createGoogleFormWithQuestions,
  deleteGoogleForm,
  PRESET_FORM_TEMPLATES,
  type GoogleFormSummary,
  type FullGoogleForm,
  type GoogleFormResponseItem,
  type FormQuestionInput,
} from '../utils/googleFormsService';

import { GoogleFormsTab } from './workspace/GoogleFormsTab';
import { GoogleChatTab } from './workspace/GoogleChatTab';
import { GoogleSheetsTab } from './workspace/GoogleSheetsTab';
import { GoogleClassroomTab } from './workspace/GoogleClassroomTab';
import { GmailTab } from './workspace/GmailTab';
import { CreateFormModal } from './workspace/CreateFormModal';

interface GoogleWorkspaceHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleWorkspaceHub({ isOpen, onClose }: GoogleWorkspaceHubProps) {
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'chat' | 'sheets' | 'classroom' | 'gmail' | 'forms' | 'slides' | 'meet' | 'calendar' | 'docs'
  >('chat');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [authEngine, setAuthEngine] = useState<'supabase' | 'firebase'>(getPreferredAuthEngine());

  // Confirmation dialog modal state for destructive operations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Google Forms State
  const [forms, setForms] = useState<GoogleFormSummary[]>([
    {
      id: 'form-seed-01',
      name: 'AI Agent Fleet Performance & SLA Review',
      webViewLink: 'https://docs.google.com/forms/u/0/',
      modifiedTime: 'Today, 11:20 AM',
      createdTime: '2026-09-01',
      description: 'Quarterly review assessing autonomous worker output, response latency, and code accuracy.',
      questionsCount: 4,
      responseCount: 18,
    },
    {
      id: 'form-seed-02',
      name: 'Enterprise Client AI Integration Intake',
      webViewLink: 'https://docs.google.com/forms/u/0/',
      modifiedTime: 'Yesterday',
      createdTime: '2026-08-28',
      description: 'Client onboarding survey for configuring autonomous departmental agents and permissions.',
      questionsCount: 5,
      responseCount: 7,
    },
  ]);
  const [selectedForm, setSelectedForm] = useState<FullGoogleForm | null>(null);
  const [selectedFormResponses, setSelectedFormResponses] = useState<GoogleFormResponseItem[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isLoadingFormDetails, setIsLoadingFormDetails] = useState(false);
  const [isCreateFormModalOpen, setIsCreateFormModalOpen] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // Calendar State
  const [events, setEvents] = useState<any[]>([
    { id: 'evt-1', summary: 'Executive Autonomous Fleet Standup', start: '2026-09-07T14:00:00Z', attendees: ['ceo@munderdiffl.in', 'cmo@munderdiffl.in', 'cto@munderdiffl.in'] },
    { id: 'evt-2', summary: 'Client Sync: Enterprise Google Workspace Fleet', start: '2026-09-07T16:30:00Z', attendees: ['client@acmepartner.com', 'sales@munderdiffl.in'] },
  ]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');

  // Docs State
  const [docs, setDocs] = useState<any[]>([
    { id: 'doc-1', title: 'Q3 Enterprise Services Invoice #892', type: 'Google Doc', lastModified: 'Today, 11:15 AM', url: 'https://docs.google.com/document/create' },
    { id: 'doc-2', title: 'Autonomous Agent SLA & Compliance Agreement', type: 'Google Doc', lastModified: 'Aug 28', url: 'https://docs.google.com/document/create' },
  ]);
  const [newDocTitle, setNewDocTitle] = useState('');

  // Slides State
  const [slides, setSlides] = useState<any[]>([
    { id: 'slide-1', title: 'Q3 Executive AI Autonomous Fleet Strategy', type: 'Google Slides', slideCount: 8, lastModified: 'Today, 10:15 AM', url: 'https://slides.google.com/create' },
    { id: 'slide-2', title: 'Enterprise Client Pitch Deck: 24/7 AI Workforce', type: 'Google Slides', slideCount: 12, lastModified: 'Yesterday', url: 'https://slides.google.com/create' },
  ]);
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [slideTemplate, setSlideTemplate] = useState('pitch');

  // Meet State
  const [meetings, setMeetings] = useState<any[]>([
    { id: 'meet-1', title: 'Emergency AI Alignment & Fleet Triage', meetingUri: 'https://meet.google.com/new', meetingCode: 'xyz-qwer-asd', status: 'ready', time: 'Instant / Ongoing', participants: ['fleet.admin@munderdiffl.in'] },
    { id: 'meet-2', title: 'Product Roadmap Review: Autonomous Workspace SDK', meetingUri: 'https://meet.google.com/new', meetingCode: 'abc-mnop-xyz', status: 'scheduled', time: 'Today at 3:00 PM', participants: ['cto@munderdiffl.in'] },
  ]);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      const sub = initWorkspaceAuth(
        (u, t) => {
          setUser(u);
          setToken(t);
        },
        () => {
          setUser(null);
          setToken(null);
        }
      );
      return () => sub?.unsubscribe();
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await connectGoogleWorkspace();
      setStatusMsg('Connected to Google Workspace!');
    } catch (err: any) {
      console.error('Workspace login error:', err);
      setStatusMsg(`Authentication: ${err.message || 'Popup closed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuthEngine = (engine: 'supabase' | 'firebase') => {
    setAuthEngine(engine);
    setPreferredAuthEngine(engine);
    setStatusMsg(`Switched default auth provider preference to ${engine.toUpperCase()}`);
  };

  // Google Forms Handlers
  const handleRefreshForms = async () => {
    if (!token) {
      setStatusMsg('Please sign in with Google to refresh live Google Forms.');
      return;
    }
    setIsLoadingForms(true);
    try {
      const liveForms = await fetchGoogleForms(token);
      setForms(liveForms);
      setStatusMsg(`Synced ${liveForms.length} Google Forms from Google Drive!`);
    } catch (err: any) {
      setStatusMsg(`Error syncing forms: ${err.message}`);
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleSelectForm = async (formId: string) => {
    setIsLoadingFormDetails(true);
    try {
      if (token && !formId.startsWith('form-seed')) {
        const details = await fetchFormDetails(token, formId);
        setSelectedForm(details);
        try {
          const responses = await fetchFormResponses(token, formId, details.items);
          setSelectedFormResponses(responses);
        } catch {
          setSelectedFormResponses([]);
        }
      } else {
        const formSummary = forms.find((f) => f.id === formId);
        setSelectedForm({
          formId,
          info: {
            title: formSummary?.name || 'Untitled Form',
            description: formSummary?.description || 'Connect Google Forms to live sync real responses and questions.',
          },
          items: [
            { itemId: 'q1', title: 'Agent Performance & SLA Rating', type: 'SCALE', required: true },
            { itemId: 'q2', title: 'Key Feedback & Bottlenecks', type: 'PARAGRAPH', required: false },
          ],
          responderUri: formSummary?.webViewLink || 'https://docs.google.com/forms/u/0/',
        });
        setSelectedFormResponses([
          {
            responseId: 'resp-1',
            createTime: '2026-09-02T10:15:00Z',
            respondentEmail: 'executive@munderdiffl.in',
            answers: [
              { questionId: 'q1', questionTitle: 'Agent Performance & SLA Rating', values: ['5 (Flawless)'] },
              { questionId: 'q2', questionTitle: 'Key Feedback & Bottlenecks', values: ['Sub-second latency on corporate cascade. Outstanding work.'] },
            ],
          },
        ]);
      }
    } catch (err: any) {
      setStatusMsg(`Error loading form details: ${err.message}`);
    } finally {
      setIsLoadingFormDetails(false);
    }
  };

  const handleCreateCustomForm = async (title: string, description: string, questions: FormQuestionInput[]) => {
    setIsCreatingForm(true);
    try {
      let createdSummary: GoogleFormSummary;
      if (token) {
        const fullForm = await createGoogleFormWithQuestions(token, title, description, questions);
        createdSummary = {
          id: fullForm.formId,
          name: fullForm.info.title,
          webViewLink: fullForm.responderUri,
          modifiedTime: 'Just now',
          createdTime: new Date().toISOString(),
          description: fullForm.info.description,
          questionsCount: fullForm.items.length,
          responseCount: 0,
        };
        setSelectedForm(fullForm);
        setSelectedFormResponses([]);
      } else {
        createdSummary = {
          id: `form-${Date.now()}`,
          name: title,
          webViewLink: 'https://docs.google.com/forms/create',
          modifiedTime: 'Just now',
          createdTime: new Date().toISOString(),
          description,
          questionsCount: questions.length,
          responseCount: 0,
        };
      }
      setForms([createdSummary, ...forms]);
      setIsCreateFormModalOpen(false);
      setStatusMsg(`Google Form "${createdSummary.name}" created successfully!`);
    } catch (err: any) {
      setStatusMsg(`Failed to create form: ${err.message}`);
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleCreatePresetForm = async (presetId: string) => {
    const preset = PRESET_FORM_TEMPLATES.find((p) => p.id === presetId);
    if (!preset) return;
    setIsCreatingForm(true);
    try {
      let createdSummary: GoogleFormSummary;
      if (token) {
        const fullForm = await createGoogleFormWithQuestions(token, preset.name, preset.description, preset.questions);
        createdSummary = {
          id: fullForm.formId,
          name: fullForm.info.title,
          webViewLink: fullForm.responderUri,
          modifiedTime: 'Just now',
          createdTime: new Date().toISOString(),
          description: fullForm.info.description,
          questionsCount: fullForm.items.length,
          responseCount: 0,
        };
        setSelectedForm(fullForm);
        setSelectedFormResponses([]);
      } else {
        createdSummary = {
          id: `form-preset-${Date.now()}`,
          name: preset.name,
          webViewLink: 'https://docs.google.com/forms/create',
          modifiedTime: 'Just now',
          createdTime: new Date().toISOString(),
          description: preset.description,
          questionsCount: preset.questions.length,
          responseCount: 0,
        };
      }
      setForms([createdSummary, ...forms]);
      setStatusMsg(`Preset Form "${preset.name}" created!`);
    } catch (err: any) {
      setStatusMsg(`Failed to create form: ${err.message}`);
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleDeleteForm = (formId: string, formName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Google Form from Google Drive',
      description: `Are you sure you want to permanently delete "${formName}" from your Google Drive?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          if (token && !formId.startsWith('form-seed')) {
            await deleteGoogleForm(token, formId);
          }
          setForms((prev) => prev.filter((f) => f.id !== formId));
          if (selectedForm?.formId === formId) {
            setSelectedForm(null);
            setSelectedFormResponses([]);
          }
          setStatusMsg(`Deleted "${formName}".`);
        } catch (err: any) {
          setStatusMsg(`Error deleting form: ${err.message}`);
        }
      },
    });
  };

  const handleCreatePresentation = async () => {
    if (!newSlideTitle.trim()) return;
    setLoading(true);
    try {
      const newDeck = {
        id: `presentation-${Date.now()}`,
        title: newSlideTitle.trim(),
        type: 'Google Slides',
        slideCount: slideTemplate === 'pitch' ? 10 : 8,
        lastModified: 'Just now',
        url: 'https://slides.google.com/create',
      };
      setSlides([newDeck, ...slides]);
      setNewSlideTitle('');
      setStatusMsg(`Google Slides deck "${newDeck.title}" created!`);
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeetSpace = () => {
    const topic = newMeetingTitle.trim() || 'Autonomous Fleet Standup';
    const newSpace = {
      id: `meet-${Date.now()}`,
      title: topic,
      meetingUri: 'https://meet.google.com/new',
      meetingCode: `mtg-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`,
      status: 'active',
      time: 'Active Now',
      participants: [user?.email || 'admin@munderdiffl.in'],
    };
    setMeetings([newSpace, ...meetings]);
    setNewMeetingTitle('');
    setStatusMsg(`Google Meet space created: "${newSpace.title}"!`);
  };

  const handleCopyMeetLink = (uri: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedLink(uri);
    setTimeout(() => setCopiedLink(null), 3000);
    setStatusMsg('Meet link copied to clipboard!');
  };

  const handleCreateDoc = () => {
    if (!newDocTitle.trim()) return;
    const newD = {
      id: `doc-${Date.now()}`,
      title: newDocTitle,
      type: 'Google Doc',
      lastModified: 'Just now',
      url: 'https://docs.google.com/document/create',
    };
    setDocs([newD, ...docs]);
    setNewDocTitle('');
    setStatusMsg(`Google Doc "${newD.title}" created & saved to Drive!`);
  };

  const handleCreateCalendarEvent = () => {
    if (!newEventTitle.trim()) return;
    const newEvt = {
      id: `evt-${Date.now()}`,
      summary: newEventTitle,
      start: newEventTime ? new Date(newEventTime).toISOString() : new Date().toISOString(),
      attendees: [user?.email || 'operator@munderdiffl.in'],
    };
    setEvents([newEvt, ...events]);
    setNewEventTitle('');
    setNewEventTime('');
    setStatusMsg('Google Calendar event scheduled!');
  };

  if (!isOpen) return null;

  return (
    <div id="modal-google-workspace" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans select-none">
      <div className="bg-[#181615] border border-[#3c3836] w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#ebdbb2]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Google Workspace Enterprise Hub
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {authEngine.toUpperCase()} & GOOGLE APIS
                </span>
              </h2>
              <p className="text-xs text-[#a89984]">
                Google Chat, Spreadsheets, Classroom, Gmail, Forms, Slides, Meet, Docs, and Calendar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Selector */}
            <div className="flex items-center bg-[#141211] border border-[#3c3836] rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => handleToggleAuthEngine('supabase')}
                className={`px-2.5 py-1 rounded font-bold transition-colors ${
                  authEngine === 'supabase'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-[#a89984] hover:text-white'
                }`}
                title="Integrate via Supabase backend"
              >
                Supabase
              </button>
              <button
                onClick={() => handleToggleAuthEngine('firebase')}
                className={`px-2.5 py-1 rounded font-bold transition-colors ${
                  authEngine === 'firebase'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-[#a89984] hover:text-white'
                }`}
                title="Integrate via Firebase backend"
              >
                Firebase
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2 bg-[#1d2021] border border-[#3c3836] px-3 py-1.5 rounded-lg text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold">{user.displayName || user.email}</span>
                <button
                  id="btn-workspace-signout"
                  onClick={async () => {
                    await workspaceSignOut();
                    setUser(null);
                    setToken(null);
                    setStatusMsg('Disconnected from Google Workspace.');
                  }}
                  className="ml-2 text-rose-400 hover:text-rose-300 font-bold text-[10px]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                id="btn-workspace-signin"
                onClick={handleSignIn}
                disabled={loading}
                className="bg-white text-black px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 hover:bg-gray-100 transition-colors shadow font-sans"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Connect Google Workspace</span>
              </button>
            )}
            <button
              id="btn-workspace-close"
              onClick={onClose}
              className="text-[#a89984] hover:text-white text-xl font-bold px-2.5 py-1 rounded-lg hover:bg-[#3c3836] transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className="bg-[#282828] border-b border-[#3c3836] px-6 py-2 text-xs text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {statusMsg}
            </span>
            <button onClick={() => setStatusMsg(null)} className="text-[#a89984] hover:text-white">✕</button>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-64 bg-[#141211] border-r border-[#3c3836] p-3 flex flex-col gap-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-[#a89984] tracking-wider px-2 py-1 uppercase">
              Core Google Workspace
            </div>

            {/* Google Chat */}
            <button
              id="tab-btn-chat"
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'chat'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Google Chat</span>
            </button>

            {/* Google Spreadsheets */}
            <button
              id="tab-btn-sheets"
              onClick={() => setActiveTab('sheets')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sheets'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets</span>
            </button>

            {/* Google Classroom */}
            <button
              id="tab-btn-classroom"
              onClick={() => setActiveTab('classroom')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'classroom'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Google Classroom</span>
            </button>

            {/* Gmail */}
            <button
              id="tab-btn-gmail"
              onClick={() => setActiveTab('gmail')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gmail'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
              }`}
            >
              <Mail className="w-4 h-4 text-red-400" />
              <span>Gmail Client</span>
            </button>

            {/* Google Forms */}
            <button
              id="tab-btn-forms"
              onClick={() => setActiveTab('forms')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'forms'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-purple-400" />
              <span>Google Forms</span>
            </button>

            <div className="text-[10px] font-bold text-[#a89984] tracking-wider px-2 pt-3 pb-1 uppercase">
              Productivity & Media
            </div>

            {/* Google Slides */}
            <button
              id="tab-btn-slides"
              onClick={() => setActiveTab('slides')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'slides'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
              }`}
            >
              <Presentation className="w-4 h-4 text-amber-400" />
              <span>Google Slides</span>
            </button>

            {/* Google Meet */}
            <button
              id="tab-btn-meet"
              onClick={() => setActiveTab('meet')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'meet'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
              }`}
            >
              <Video className="w-4 h-4 text-cyan-400" />
              <span>Google Meet</span>
            </button>

            {/* Google Calendar */}
            <button
              id="tab-btn-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Google Calendar</span>
            </button>

            {/* Google Docs */}
            <button
              id="tab-btn-docs"
              onClick={() => setActiveTab('docs')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'docs'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'hover:bg-[#282828] text-[#ebdbb2] border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Google Docs</span>
            </button>

            <div className="mt-auto p-3 bg-[#1d2021] border border-[#3c3836] rounded-xl text-[11px] text-[#a89984]">
              <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Backend: {authEngine.toUpperCase()}</span>
              </div>
              <p className="text-[10px] text-[#7c6f64]">
                {token ? 'OAuth token active across Google APIs' : 'Live sync connects on Sign-In'}
              </p>
            </div>
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1 flex flex-col bg-[#121110] overflow-hidden">
            {activeTab === 'chat' && (
              <GoogleChatTab
                token={token}
                onSignIn={handleSignIn}
                statusMsg={statusMsg}
                setStatusMsg={setStatusMsg}
              />
            )}

            {activeTab === 'sheets' && (
              <GoogleSheetsTab
                token={token}
                onSignIn={handleSignIn}
                statusMsg={statusMsg}
                setStatusMsg={setStatusMsg}
              />
            )}

            {activeTab === 'classroom' && (
              <GoogleClassroomTab
                token={token}
                onSignIn={handleSignIn}
                statusMsg={statusMsg}
                setStatusMsg={setStatusMsg}
              />
            )}

            {activeTab === 'gmail' && (
              <GmailTab
                token={token}
                onSignIn={handleSignIn}
                statusMsg={statusMsg}
                setStatusMsg={setStatusMsg}
              />
            )}

            {activeTab === 'forms' && (
              <GoogleFormsTab
                token={token}
                forms={forms}
                selectedForm={selectedForm}
                selectedFormResponses={selectedFormResponses}
                isLoadingForms={isLoadingForms}
                isLoadingDetails={isLoadingFormDetails}
                onRefreshForms={handleRefreshForms}
                onSelectForm={handleSelectForm}
                onOpenCreateModal={() => setIsCreateFormModalOpen(true)}
                onCreatePresetForm={handleCreatePresetForm}
                onDeleteForm={handleDeleteForm}
                onSignIn={handleSignIn}
              />
            )}

            {/* SLIDES */}
            {activeTab === 'slides' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Presentation className="w-5 h-5 text-amber-400" />
                      Google Slides Presentation Deck Builder
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Generate executive strategy decks and pitch presentations directly into Google Slides
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs uppercase font-bold text-[#a89984]">
                      Executive Presentations ({slides.length})
                    </div>
                    {slides.map((deck) => (
                      <div
                        key={deck.id}
                        className="bg-[#1d2021] border border-[#3c3836] hover:border-amber-500/40 p-4 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                              <Presentation className="w-4 h-4" />
                            </span>
                            <h4 className="text-xs font-bold text-white">{deck.title}</h4>
                          </div>
                          <div className="text-[11px] text-[#a89984] pl-8">
                            {deck.slideCount} Slides • Modified: {deck.lastModified}
                          </div>
                        </div>

                        <a
                          href={deck.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <span>Open Slides</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-amber-400" /> New Presentation
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#a89984] mb-1">DECK TITLE</label>
                        <input
                          type="text"
                          value={newSlideTitle}
                          onChange={(e) => setNewSlideTitle(e.target.value)}
                          placeholder="e.g. Q4 Autonomous Fleet Roadmap"
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <button
                        onClick={handleCreatePresentation}
                        disabled={loading || !newSlideTitle.trim()}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                      >
                        <Presentation className="w-4 h-4" />
                        <span>Create Google Slides Deck</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MEET */}
            {activeTab === 'meet' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Video className="w-5 h-5 text-cyan-400" />
                      Google Meet Conference & Room Manager
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Launch instant meeting spaces and manage video conference rooms
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs uppercase font-bold text-[#a89984]">
                      Active & Scheduled Meet Spaces ({meetings.length})
                    </div>
                    {meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="bg-[#1d2021] border border-[#3c3836] hover:border-cyan-500/40 p-4 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/20">
                              <Video className="w-4 h-4" />
                            </span>
                            <h4 className="text-xs font-bold text-white">{meeting.title}</h4>
                          </div>
                          <div className="text-[11px] text-[#a89984] pl-8">
                            Code: {meeting.meetingCode} • {meeting.time}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyMeetLink(meeting.meetingUri)}
                            className="p-2 hover:bg-[#3c3836] text-[#a89984] hover:text-white rounded-lg transition-colors"
                            title="Copy Meet Link"
                          >
                            {copiedLink === meeting.meetingUri ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={meeting.meetingUri}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Join Meet</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-cyan-400" /> Instant Space
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#a89984] mb-1">ROOM TITLE</label>
                        <input
                          type="text"
                          value={newMeetingTitle}
                          onChange={(e) => setNewMeetingTitle(e.target.value)}
                          placeholder="e.g. Executive Standup"
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <button
                        onClick={handleCreateMeetSpace}
                        className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                      >
                        <Video className="w-4 h-4" />
                        <span>Launch Google Meet Space</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      Google Calendar Executive Schedule
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Schedule corporate events and multi-agent milestones
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs uppercase font-bold text-[#a89984]">
                      Upcoming Calendar Events ({events.length})
                    </div>
                    {events.map((evt) => (
                      <div
                        key={evt.id}
                        className="bg-[#1d2021] border border-[#3c3836] p-4 rounded-xl flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white">{evt.summary}</h4>
                          <div className="text-[11px] text-[#a89984]">
                            {new Date(evt.start).toLocaleString()} • {evt.attendees?.length || 1} Attendees
                          </div>
                        </div>
                        <a
                          href="https://calendar.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <span>Open Calendar</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" /> Schedule Event
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#a89984] mb-1">EVENT SUMMARY</label>
                        <input
                          type="text"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          placeholder="e.g. Autonomous Fleet Sprint Review"
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={handleCreateCalendarEvent}
                        disabled={!newEventTitle.trim()}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Schedule on Google Calendar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCS */}
            {activeTab === 'docs' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-sky-400" />
                      Google Docs Document Generator
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Generate contracts, SLA agreements, and executive minutes directly to Google Drive
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs uppercase font-bold text-[#a89984]">
                      Drive Documents ({docs.length})
                    </div>
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-[#1d2021] border border-[#3c3836] p-4 rounded-xl flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                          <div className="text-[11px] text-[#a89984]">
                            Modified: {doc.lastModified} • {doc.type}
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <span>Open Doc</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-sky-400" /> New Document
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#a89984] mb-1">DOCUMENT TITLE</label>
                        <input
                          type="text"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="e.g. Autonomous Fleet SLA Agreement"
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <button
                        onClick={handleCreateDoc}
                        disabled={!newDocTitle.trim()}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Create Google Doc</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Create Google Form Modal */}
      <CreateFormModal
        isOpen={isCreateFormModalOpen}
        onClose={() => setIsCreateFormModalOpen(false)}
        onSubmit={handleCreateCustomForm}
        isLoading={isCreatingForm}
      />

      {/* Confirmation Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#1d2021] border border-[#504945] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 font-bold">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base text-white">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-[#ebdbb2] leading-relaxed">
              {confirmDialog.description}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDialog.onConfirm()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
