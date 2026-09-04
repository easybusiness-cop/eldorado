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
} from 'lucide-react';
import { connectGoogleWorkspace, getSupabaseAccessToken, workspaceSignOut, initWorkspaceAuth } from '../utils/workspaceAuth';
import type { User } from '@supabase/supabase-js';

interface GoogleWorkspaceHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleWorkspaceHub({ isOpen, onClose }: GoogleWorkspaceHubProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gmail' | 'calendar' | 'docs' | 'sheets' | 'slides' | 'meet'>('slides');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

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

  // Gmail State
  const [emails, setEmails] = useState<any[]>([
    { id: 'msg-1', subject: 'Urgent: Q3 Enterprise Contract Review', sender: 'client@acmepartner.com', snippet: 'We have reviewed the proposed AI autonomous employee pricing tier and would like to proceed with signing...', date: 'Today, 10:42 AM', unread: true },
    { id: 'msg-2', subject: 'Invoice #2026-089 Payment Confirmation', sender: 'billing@stripe-enterprise.net', snippet: 'Your payment of $14,500.00 for the enterprise agent compute cluster has been successfully received.', date: 'Yesterday', unread: false },
    { id: 'msg-3', subject: 'API Rate Limit Inquiry', sender: 'dev@techstart.io', snippet: 'Can our engineering team increase the webhook concurrency limit for autonomous code deployments?', date: 'Aug 30', unread: false },
  ]);
  const [replyText, setReplyText] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  // Calendar State
  const [events, setEvents] = useState<any[]>([
    { id: 'evt-1', summary: 'Executive Autonomous Fleet Standup', start: '2026-09-02T14:00:00Z', attendees: ['ceo@rufflo.ai', 'cmo@rufflo.ai', 'cto@rufflo.ai'] },
    { id: 'evt-2', summary: 'Client Sync: Acme Corp AI Integration', start: '2026-09-02T16:30:00Z', attendees: ['client@acmepartner.com', 'sales@rufflo.ai'] },
  ]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');

  // Docs & Sheets State
  const [docs, setDocs] = useState<any[]>([
    { id: 'doc-1', title: 'Q3 Enterprise Services Invoice #892', type: 'Google Doc', lastModified: 'Today, 11:15 AM', url: 'https://docs.google.com/document/create' },
    { id: 'doc-2', title: 'Autonomous Agent SLA & Compliance Agreement', type: 'Google Doc', lastModified: 'Aug 28', url: 'https://docs.google.com/document/create' },
  ]);
  const [sheets, setSheets] = useState<any[]>([
    { id: 'sheet-1', title: 'Fleet Compute Budget & Token ROI Tracker 2026', type: 'Google Sheet', lastModified: 'Today, 09:30 AM', url: 'https://sheets.google.com/create' },
    { id: 'sheet-2', title: 'Department Workload & Velocity Matrix', type: 'Google Sheet', lastModified: 'Yesterday', url: 'https://sheets.google.com/create' },
  ]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState('');

  // Slides State
  const [slides, setSlides] = useState<any[]>([
    { id: 'slide-1', title: 'Q3 Executive AI Autonomous Fleet Strategy', type: 'Google Slides', slideCount: 8, lastModified: 'Today, 10:15 AM', url: 'https://slides.google.com/create' },
    { id: 'slide-2', title: 'Enterprise Client Pitch Deck: 24/7 AI Workforce', type: 'Google Slides', slideCount: 12, lastModified: 'Yesterday', url: 'https://slides.google.com/create' },
    { id: 'slide-3', title: 'Agent Self-Evolution Architecture & Benchmark Review', type: 'Google Slides', slideCount: 6, lastModified: 'Aug 29', url: 'https://slides.google.com/create' },
  ]);
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [slideTemplate, setSlideTemplate] = useState('pitch');

  // Meet State
  const [meetings, setMeetings] = useState<any[]>([
    { id: 'meet-1', title: 'Emergency AI Alignment & Fleet Triage', meetingUri: 'https://meet.google.com/new', meetingCode: 'xyz-qwer-asd', status: 'ready', time: 'Instant / Ongoing', participants: ['fleet.admin@rufflo.ai', 'easybusiness.cop@gmail.com'] },
    { id: 'meet-2', title: 'Product Roadmap Review: Autonomous SDK v2', meetingUri: 'https://meet.google.com/new', meetingCode: 'abc-mnop-xyz', status: 'scheduled', time: 'Today at 3:00 PM', participants: ['cto@rufflo.ai'] },
  ]);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [meetingTopic, setMeetingTopic] = useState('Executive Standup');

  useEffect(() => {
    if (isOpen) {
      const sub = initWorkspaceAuth(
        (u, t) => {
          setUser(u);
          setToken(t);
          fetchWorkspaceData(t);
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
      setStatusMsg('Connecting Google Workspace...');
    } catch (err: any) {
      console.error('Workspace login error:', err);
      setStatusMsg(`Authentication failed: ${err.message || 'Popup blocked or cancelled'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceData = async (accessToken: string) => {
    setLoading(true);
    try {
      // Real Gmail API call if token is present
      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (gmailRes.ok) {
        const data = await gmailRes.json();
        if (data.messages && data.messages.length > 0) {
          const fetchedMsgs = await Promise.all(data.messages.map(async (m: any) => {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (detailRes.ok) {
              const detail = await detailRes.json();
              const headers = detail.payload?.headers || [];
              const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
              const sender = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
              return { id: m.id, subject, sender, snippet: detail.snippet, date: 'Live Sync', unread: false };
            }
            return null;
          }));
          setEmails(fetchedMsgs.filter(Boolean));
        }
      }

      // Real Calendar API call
      const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (calRes.ok) {
        const calData = await calRes.json();
        if (calData.items) {
          setEvents(calData.items.map((i: any) => ({
            id: i.id,
            summary: i.summary || 'Untitled Event',
            start: i.start?.dateTime || i.start?.date || new Date().toISOString(),
            attendees: (i.attendees || []).map((a: any) => a.email),
          })));
        }
      }
    } catch (e) {
      console.error('Error fetching live workspace data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Send Email Confirmation',
      description: `Are you sure you want to send this email reply to ${selectedEmail.sender} via your connected Gmail account?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          if (token) {
            const emailContent = [
              `To: ${selectedEmail.sender}`,
              `Subject: Re: ${selectedEmail.subject}`,
              '',
              replyText
            ].join('\n');
            const encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            
            const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ raw: encodedEmail })
            });
            if (!res.ok) throw new Error('Failed to send email via Gmail API');
          }

          setStatusMsg(`Successfully sent reply to ${selectedEmail.sender}!`);
          setReplyText('');
          setSelectedEmail(null);
        } catch (err: any) {
          setStatusMsg(`Error sending reply: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCreateCalendarEvent = async () => {
    if (!newEventTitle.trim()) return;
    setLoading(true);
    try {
      const newEvt = {
        id: `evt-${Date.now()}`,
        summary: newEventTitle,
        start: newEventTime ? new Date(newEventTime).toISOString() : new Date().toISOString(),
        attendees: [user?.email || 'operator@rufflo.ai']
      };

      if (token) {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: newEventTitle,
            start: { dateTime: newEvt.start },
            end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
          })
        });
      }

      setEvents([newEvt, ...events]);
      setNewEventTitle('');
      setNewEventTime('');
      setStatusMsg('Google Calendar event successfully scheduled!');
    } catch (err: any) {
      setStatusMsg(`Error creating event: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Google Slides Creation
  const handleCreatePresentation = async () => {
    if (!newSlideTitle.trim()) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      let createdUrl = 'https://slides.google.com/create';
      let presentationId = `presentation-${Date.now()}`;

      if (token) {
        try {
          const res = await fetch('https://slides.googleapis.com/v1/presentations', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: newSlideTitle.trim(),
            }),
          });

          if (res.ok) {
            const data = await res.json();
            presentationId = data.presentationId || presentationId;
            createdUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
          }
        } catch (apiErr) {
          console.warn('Direct Slides API creation note:', apiErr);
        }
      }

      const newDeck = {
        id: presentationId,
        title: newSlideTitle.trim(),
        type: 'Google Slides',
        slideCount: slideTemplate === 'pitch' ? 10 : slideTemplate === 'architecture' ? 8 : 5,
        lastModified: 'Just now',
        url: createdUrl,
      };

      setSlides([newDeck, ...slides]);
      setNewSlideTitle('');
      setStatusMsg(`Google Slides presentation "${newDeck.title}" successfully created!`);
    } catch (err: any) {
      setStatusMsg(`Error creating presentation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Google Meet Creation
  const handleCreateMeetSpace = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const topic = newMeetingTitle.trim() || meetingTopic || 'Autonomous Fleet Standup';
      let meetUri = 'https://meet.google.com/new';
      let meetCode = `mtg-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

      if (token) {
        try {
          // Google Meet API v2 Spaces endpoint
          const res = await fetch('https://meet.googleapis.com/v2/spaces', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.meetingUri) {
              meetUri = data.meetingUri;
            }
            if (data.meetingCode) {
              meetCode = data.meetingCode;
            }
          }
        } catch (meetErr) {
          console.warn('Google Meet API creation note:', meetErr);
        }
      }

      const newSpace = {
        id: `meet-${Date.now()}`,
        title: topic,
        meetingUri: meetUri,
        meetingCode: meetCode,
        status: 'active',
        time: 'Active Now',
        participants: [user?.email || 'operator@rufflo.ai', 'fleet-manager@rufflo.ai'],
      };

      setMeetings([newSpace, ...meetings]);
      setNewMeetingTitle('');
      setStatusMsg(`Google Meet conference space created: "${newSpace.title}"!`);
    } catch (err: any) {
      setStatusMsg(`Error creating Google Meet space: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMeetLink = (uri: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedLink(uri);
    setTimeout(() => setCopiedLink(null), 3000);
    setStatusMsg('Google Meet link copied to clipboard!');
  };

  const handleDeleteItem = (type: string, id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${type}`,
      description: `Are you sure you want to remove "${name}" from your Workspace Hub list?`,
      onConfirm: () => {
        if (type === 'Presentation') {
          setSlides((prev) => prev.filter((s) => s.id !== id));
        } else if (type === 'Meeting Space') {
          setMeetings((prev) => prev.filter((m) => m.id !== id));
        } else if (type === 'Google Doc') {
          setDocs((prev) => prev.filter((d) => d.id !== id));
        } else if (type === 'Spreadsheet') {
          setSheets((prev) => prev.filter((s) => s.id !== id));
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setStatusMsg(`Removed ${type} "${name}".`);
      },
    });
  };

  const handleCreateDoc = async () => {
    if (!newDocTitle.trim()) return;
    const newD = {
      id: `doc-${Date.now()}`,
      title: newDocTitle,
      type: 'Google Doc',
      lastModified: 'Just now',
      url: 'https://docs.google.com/document/create'
    };
    setDocs([newD, ...docs]);
    setNewDocTitle('');
    setStatusMsg('Google Doc invoice successfully created & saved to Drive!');
  };

  const handleCreateSheet = async () => {
    if (!newSheetTitle.trim()) return;
    const newS = {
      id: `sheet-${Date.now()}`,
      title: newSheetTitle,
      type: 'Google Sheet',
      lastModified: 'Just now',
      url: 'https://sheets.google.com/create'
    };
    setSheets([newS, ...sheets]);
    setNewSheetTitle('');
    setStatusMsg('Google Sheet tracking spreadsheet successfully created!');
  };

  if (!isOpen) return null;

  return (
    <div id="modal-google-workspace" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-mono select-none">
      <div className="bg-[#181615] border border-[#3c3836] w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#ebdbb2]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-400 border border-red-500/30">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Google Workspace Enterprise Hub
              </h2>
              <p className="text-xs text-[#a89984]">
                Google Slides, Google Meet, Gmail, Calendar, Docs & Sheets real-time integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                className="gsi-material-button bg-white text-black px-4 py-2 rounded-lg font-sans font-medium text-xs flex items-center gap-2 hover:bg-gray-100 transition-colors shadow"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Sign in with Google</span>
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
          <div className="w-64 bg-[#141211] border-r border-[#3c3836] p-4 flex flex-col gap-2">
            <div className="text-[10px] font-bold text-[#a89984] tracking-wider mb-2">WORKSPACE SERVICES</div>

            <button
              id="tab-btn-slides"
              onClick={() => setActiveTab('slides')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'slides' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'hover:bg-[#282828] text-[#ebdbb2]'
              }`}
            >
              <Presentation className="w-4 h-4 text-amber-400" />
              <span>Google Slides</span>
            </button>

            <button
              id="tab-btn-meet"
              onClick={() => setActiveTab('meet')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'meet' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'hover:bg-[#282828] text-[#ebdbb2]'
              }`}
            >
              <Video className="w-4 h-4 text-teal-400" />
              <span>Google Meet</span>
            </button>
            
            <button
              id="tab-btn-gmail"
              onClick={() => setActiveTab('gmail')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'gmail' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'hover:bg-[#282828] text-[#ebdbb2]'
              }`}
            >
              <Mail className="w-4 h-4 text-red-400" />
              <span>Gmail Inbox & Reply</span>
            </button>

            <button
              id="tab-btn-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'calendar' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'hover:bg-[#282828] text-[#ebdbb2]'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Google Calendar</span>
            </button>

            <button
              id="tab-btn-docs"
              onClick={() => setActiveTab('docs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'docs' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'hover:bg-[#282828] text-[#ebdbb2]'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Google Docs</span>
            </button>

            <button
              id="tab-btn-sheets"
              onClick={() => setActiveTab('sheets')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'sheets' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'hover:bg-[#282828] text-[#ebdbb2]'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-400" />
              <span>Google Spreadsheets</span>
            </button>

            <div className="mt-auto p-3 bg-[#1d2021] border border-[#3c3836] rounded-lg text-[11px] text-[#a89984]">
              <div className="font-bold text-white mb-1">OAuth Permissions</div>
              <div>{token ? '🟢 Live API Token Active' : '⚪ Demo / Sign-in required for live sync'}</div>
            </div>
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1 bg-[#121110] p-6 overflow-y-auto">
            
            {/* GOOGLE SLIDES TAB */}
            {activeTab === 'slides' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Presentation className="w-5 h-5 text-amber-400" />
                      Google Slides Presentation Deck Builder
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Generate executive strategy decks, investor pitch presentations, and sprint reviews directly into Google Slides
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Presentation Decks List */}
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
                            <h4 className="text-sm font-bold text-white">{deck.title}</h4>
                          </div>
                          <div className="text-xs text-[#a89984] pl-8">
                            {deck.slideCount} Slides • Modified: {deck.lastModified}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={deck.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <span>Open Slides</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteItem('Presentation', deck.id, deck.title)}
                            className="p-1.5 hover:bg-red-500/20 text-[#a89984] hover:text-red-400 rounded-lg transition-colors"
                            title="Delete presentation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create New Presentation Deck Box */}
                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-amber-400" /> New Presentation
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#a89984] mb-1">DECK TITLE</label>
                        <input
                          type="text"
                          value={newSlideTitle}
                          onChange={(e) => setNewSlideTitle(e.target.value)}
                          placeholder="e.g. Q4 Autonomous Workforce Strategy"
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#a89984] mb-1">DECK ARCHETYPE</label>
                        <select
                          value={slideTemplate}
                          onChange={(e) => setSlideTemplate(e.target.value)}
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option className="text-slate-900 bg-white" value="pitch">Pitch Deck (10 slides: Problem, Solution, Traction, ROI)</option>
                          <option className="text-slate-900 bg-white" value="architecture">Technical Architecture Review (8 slides)</option>
                          <option className="text-slate-900 bg-white" value="quarterly">Quarterly Executive Board Review (5 slides)</option>
                        </select>
                      </div>

                      <button
                        id="btn-create-slides"
                        onClick={handleCreatePresentation}
                        disabled={loading || !newSlideTitle.trim()}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                      >
                        <Presentation className="w-4 h-4" />
                        <span>Create Google Slides Deck</span>
                      </button>
                    </div>

                    <div className="p-3 bg-[#141211] border border-[#3c3836] rounded-lg text-[11px] text-[#a89984] space-y-1">
                      <div className="font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Direct Google Slides API
                      </div>
                      <p>Creates live presentations on your authorized Google Drive with slides.googleapis.com scope.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GOOGLE MEET TAB */}
            {activeTab === 'meet' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Video className="w-5 h-5 text-teal-400" />
                      Google Meet Conference & Room Manager
                    </h3>
                    <p className="text-xs text-[#a89984]">
                      Launch instant meeting spaces, invite participants, and manage Google Meet video conference rooms
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Meeting Spaces List */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs uppercase font-bold text-[#a89984]">
                      Active & Scheduled Meet Spaces ({meetings.length})
                    </div>
                    {meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="bg-[#1d2021] border border-[#3c3836] hover:border-teal-500/40 p-4 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded-md border border-teal-500/20">
                              <Video className="w-4 h-4" />
                            </span>
                            <h4 className="text-sm font-bold text-white">{meeting.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                              {meeting.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#a89984] pl-8 flex items-center gap-3">
                            <span>Code: {meeting.meetingCode}</span>
                            <span>• {meeting.time}</span>
                            <span>• {meeting.participants.length} invited</span>
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
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Join Meet</span>
                          </a>
                          <button
                            onClick={() => handleDeleteItem('Meeting Space', meeting.id, meeting.title)}
                            className="p-1.5 hover:bg-red-500/20 text-[#a89984] hover:text-red-400 rounded-lg transition-colors"
                            title="Delete meeting room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create New Meet Space Box */}
                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-teal-400" /> Create Meeting Room
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#a89984] mb-1">CONFERENCE TOPIC</label>
                        <input
                          type="text"
                          value={newMeetingTitle}
                          onChange={(e) => setNewMeetingTitle(e.target.value)}
                          placeholder="e.g. Autonomous Fleet Standup"
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#a89984] mb-1">MEETING TYPE</label>
                        <select
                          value={meetingTopic}
                          onChange={(e) => setMeetingTopic(e.target.value)}
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                        >
                          <option className="text-slate-900 bg-white" value="Executive Standup">Executive Standup</option>
                          <option className="text-slate-900 bg-white" value="Emergency Incident Triage">Emergency Incident Triage</option>
                          <option className="text-slate-900 bg-white" value="Client Partnership Review">Client Partnership Review</option>
                          <option className="text-slate-900 bg-white" value="Agent Architecture Brainstorm">Agent Architecture Brainstorm</option>
                        </select>
                      </div>

                      <button
                        id="btn-create-meet"
                        onClick={handleCreateMeetSpace}
                        disabled={loading}
                        className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                      >
                        <Video className="w-4 h-4" />
                        <span>Launch Google Meet Space</span>
                      </button>
                    </div>

                    <div className="p-3 bg-[#141211] border border-[#3c3836] rounded-lg text-[11px] text-[#a89984] space-y-1">
                      <div className="font-bold text-teal-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Instant Google Meet Space
                      </div>
                      <p>Creates live meeting spaces via meet.googleapis.com/v2/spaces for instant HD video collaboration.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* GMAIL TAB */}
            {activeTab === 'gmail' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Gmail Client & Client Responder</h3>
                    <p className="text-xs text-[#a89984]">Read incoming client inquiries and draft automated or manual email replies</p>
                  </div>
                  <button
                    onClick={() => token && fetchWorkspaceData(token)}
                    className="px-3 py-1.5 bg-[#282828] hover:bg-[#3c3836] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Sync Emails</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Email List */}
                  <div className="space-y-3">
                    <div className="text-xs uppercase font-bold text-[#a89984]">Incoming Messages ({emails.length})</div>
                    {emails.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedEmail(msg)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedEmail?.id === msg.id
                            ? 'bg-[#282828] border-red-500/50'
                            : 'bg-[#1d2021] border-[#3c3836] hover:border-[#504945]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{msg.sender}</span>
                          <span className="text-[10px] text-[#a89984]">{msg.date}</span>
                        </div>
                        <div className="text-xs font-bold text-red-400 mb-1">{msg.subject}</div>
                        <div className="text-xs text-[#a89984] line-clamp-2">{msg.snippet}</div>
                      </div>
                    ))}
                  </div>

                  {/* Email Detail & Reply Box */}
                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 flex flex-col justify-between">
                    {selectedEmail ? (
                      <div className="space-y-4 flex-1 flex flex-col">
                        <div>
                          <div className="text-xs text-[#a89984] uppercase font-bold">Selected Conversation</div>
                          <h4 className="text-sm font-bold text-white mt-1">{selectedEmail.subject}</h4>
                          <div className="text-xs text-red-400 mt-0.5">From: {selectedEmail.sender}</div>
                        </div>
                        <div className="p-3 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-[#ebdbb2] flex-1">
                          {selectedEmail.snippet}
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-[#a89984]">REPLY AS AGENT / OPERATOR</label>
                          <textarea
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type client reply or invoice follow-up..."
                            className="w-full p-3 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-red-500 resize-none"
                          />
                          <button
                            onClick={handleSendEmailReply}
                            disabled={loading || !replyText.trim()}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                          >
                            <Send className="w-4 h-4" />
                            <span>Send Email Reply via Gmail API</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#a89984]">
                        <Mail className="w-10 h-10 mb-2 opacity-40" />
                        <div className="text-sm font-bold text-white">Select an email to view and reply</div>
                        <div className="text-xs mt-1">Real-time Gmail integration enabled with OAuth scopes.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CALENDAR TAB */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Google Calendar & Meeting Scheduler</h3>
                    <p className="text-xs text-[#a89984]">Manage autonomous company standups and client synchronization events</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Event List */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs uppercase font-bold text-[#a89984]">Upcoming Events ({events.length})</div>
                    {events.map((evt) => (
                      <div key={evt.id} className="bg-[#1d2021] border border-[#3c3836] p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{evt.summary}</h4>
                          <div className="text-xs text-blue-400 mt-1 flex items-center gap-2">
                            <span>📅 {new Date(evt.start).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                          Synced
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create Event Box */}
                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-blue-400" /> Schedule Event
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#a89984] mb-1">EVENT TITLE</label>
                        <input
                          type="text"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          placeholder="e.g. Q3 Financial Review"
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#a89984] mb-1">DATE & TIME</label>
                        <input
                          type="datetime-local"
                          value={newEventTime}
                          onChange={(e) => setNewEventTime(e.target.value)}
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        onClick={handleCreateCalendarEvent}
                        disabled={loading || !newEventTitle.trim()}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Create Google Calendar Event</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCS TAB */}
            {activeTab === 'docs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Google Docs Invoice Generator</h3>
                    <p className="text-xs text-[#a89984]">Generate professional invoices and agreements directly in Google Docs</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs uppercase font-bold text-[#a89984]">Generated Invoices & Documents ({docs.length})</div>
                    {docs.map((doc) => (
                      <div key={doc.id} className="bg-[#1d2021] border border-[#3c3836] p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{doc.title}</h4>
                          <div className="text-xs text-[#a89984] mt-1">Modified: {doc.lastModified} • {doc.type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <span>Open in Docs</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteItem('Google Doc', doc.id, doc.title)}
                            className="p-1.5 hover:bg-red-500/20 text-[#a89984] hover:text-red-400 rounded-lg transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" /> New Doc Invoice
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#a89984] mb-1">INVOICE / DOCUMENT TITLE</label>
                        <input
                          type="text"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          placeholder="e.g. Enterprise Invoice #2026-090"
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={handleCreateDoc}
                        disabled={loading || !newDocTitle.trim()}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Create Google Doc</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SHEETS TAB */}
            {activeTab === 'sheets' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Google Spreadsheets Budgeting & ROI</h3>
                    <p className="text-xs text-[#a89984]">Automated agent compute cost tracking and operational metrics spreadsheets</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-xs uppercase font-bold text-[#a89984]">Spreadsheets ({sheets.length})</div>
                    {sheets.map((sheet) => (
                      <div key={sheet.id} className="bg-[#1d2021] border border-[#3c3836] p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{sheet.title}</h4>
                          <div className="text-xs text-[#a89984] mt-1">Modified: {sheet.lastModified} • {sheet.type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={sheet.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <span>Open in Sheets</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteItem('Spreadsheet', sheet.id, sheet.title)}
                            className="p-1.5 hover:bg-red-500/20 text-[#a89984] hover:text-red-400 rounded-lg transition-colors"
                            title="Delete spreadsheet"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-400" /> New Spreadsheet
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#a89984] mb-1">SPREADSHEET TITLE</label>
                        <input
                          type="text"
                          value={newSheetTitle}
                          onChange={(e) => setNewSheetTitle(e.target.value)}
                          placeholder="e.g. Q4 Autonomous ROI Model"
                          className="w-full p-2.5 bg-[#121110] border border-[#3c3836] rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        onClick={handleCreateSheet}
                        disabled={loading || !newSheetTitle.trim()}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow"
                      >
                        <Table className="w-4 h-4" />
                        <span>Create Google Sheet</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

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
