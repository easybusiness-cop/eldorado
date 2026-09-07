import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Inbox,
  Star,
  Tag,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  type GmailMessageSummary,
  fetchGmailMessages,
  sendGmailEmail,
} from '../../utils/gmailService';

interface GmailTabProps {
  token: string | null;
  onSignIn: () => void;
  statusMsg?: string | null;
  setStatusMsg: (msg: string | null) => void;
}

export function GmailTab({ token, onSignIn, setStatusMsg }: GmailTabProps) {
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Compose Modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [toInput, setToInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');

  // Confirmation state
  const [confirmSend, setConfirmSend] = useState(false);

  useEffect(() => {
    loadEmails();
  }, [token]);

  const loadEmails = async (query?: string) => {
    setIsLoading(true);
    try {
      const data = await fetchGmailMessages(token, 15, query);
      setMessages(data);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching emails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadEmails(searchQuery.trim());
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toInput.trim() || !subjectInput.trim() || !bodyInput.trim()) return;

    if (!confirmSend) {
      setConfirmSend(true);
      return;
    }

    setIsSending(true);
    try {
      await sendGmailEmail(token, toInput.trim(), subjectInput.trim(), bodyInput.trim());
      setStatusMsg(`Email sent successfully to ${toInput.trim()}!`);
      setIsComposeOpen(false);
      setConfirmSend(false);
      setToInput('');
      setSubjectInput('');
      setBodyInput('');
      loadEmails();
    } catch (err: any) {
      setStatusMsg(`Failed to send email: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSmartDraft = () => {
    setToInput('executive-board@munderdiffl.in');
    setSubjectInput('Autonomous Fleet Q3 Performance Report & ROI Confirmation');
    setBodyInput(
      `Dear Executive Committee,\n\nPlease find the autonomous fleet operations summary for Q3:\n- 18 autonomous agents active across Engineering, Marketing, Executive, and Ops.\n- Over 99.8% SLA resolution rate with average turnaround time of 280ms.\n- Zero human intervention required for daily Google Workspace triage and synchronization.\n\nBest regards,\nMunderdiffl.in Autonomous Operations Fleet`
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#181615]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#1d2021]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Gmail Enterprise Client & Mail Dispatch
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                Gmail API v1
              </span>
            </h3>
            <p className="text-xs text-[#a89984]">
              Manage live inbox, compose messages, autonomous email drafting, and real-time thread inspection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!token && (
            <button
              onClick={onSignIn}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              Sign In with Google
            </button>
          )}
          <button
            onClick={() => {
              setIsComposeOpen(true);
              setConfirmSend(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compose</span>
          </button>
          <button
            onClick={() => loadEmails(searchQuery)}
            disabled={isLoading}
            className="p-1.5 text-[#a89984] hover:text-white bg-[#282828] hover:bg-[#3c3836] border border-[#3c3836] rounded-lg transition-colors"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Messages List with Search */}
        <div className="w-80 border-r border-[#3c3836] bg-[#141211] flex flex-col">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="p-3 border-b border-[#3c3836]/60">
            <div className="relative">
              <input
                type="text"
                placeholder="Search mail (e.g. from, subject)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121110] border border-[#3c3836] focus:border-red-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#7c6f64] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-[#7c6f64] absolute left-2.5 top-2.5" />
            </div>
          </form>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-xs text-[#a89984]">
                <RefreshCw className="w-4 h-4 animate-spin mr-2 text-red-400" />
                Loading emails...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#a89984]">
                No messages found.
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                      isSelected
                        ? 'bg-red-500/15 border-red-500/40 text-red-300 shadow-sm'
                        : 'hover:bg-[#282828] text-[#ebdbb2] border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-bold truncate text-[11px] ${msg.unread ? 'text-white' : 'text-[#a89984]'}`}>
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-[#7c6f64] flex-shrink-0">
                        {msg.date}
                      </span>
                    </div>
                    <div className={`line-clamp-1 text-xs mb-1 ${msg.unread ? 'font-bold text-white' : 'text-[#ebdbb2]'}`}>
                      {msg.subject}
                    </div>
                    <p className="text-[11px] text-[#7c6f64] line-clamp-2 leading-relaxed">
                      {msg.snippet}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Email Thread Reader */}
        <div className="flex-1 flex flex-col bg-[#121110] overflow-y-auto">
          {selectedMessage ? (
            <div className="p-6 space-y-6">
              {/* Message Header */}
              <div className="p-5 rounded-2xl bg-[#181615] border border-[#3c3836]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-white leading-snug">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#a89984]">
                      <span className="font-semibold text-white">From:</span>
                      <span>{selectedMessage.sender}</span>
                      <span>•</span>
                      <span>{selectedMessage.date}</span>
                    </div>
                  </div>
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors flex-shrink-0"
                  >
                    <span>Open in Gmail</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Message Body */}
              <div className="p-6 rounded-2xl bg-[#181615] border border-[#3c3836] text-xs text-[#ebdbb2] leading-relaxed whitespace-pre-wrap">
                {selectedMessage.snippet}
                {'\n\n'}
                --{'\n'}
                This message was retrieved directly via the Gmail API v1 with OAuth security policies enabled.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#a89984]">
              Select an email on the left to read
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-red-400" />
                Compose Gmail Message
              </h3>
              <button
                onClick={() => {
                  setIsComposeOpen(false);
                  setConfirmSend(false);
                }}
                className="text-[#a89984] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSmartDraft}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" /> Auto-Fill Autonomous Status Draft
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">To</label>
                <input
                  type="email"
                  required
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-red-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-red-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Message</label>
                <textarea
                  rows={6}
                  required
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  placeholder="Write your email body..."
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-red-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {confirmSend && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Are you sure you want to send this email to <strong>{toInput}</strong>? Click "Confirm & Send" below.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsComposeOpen(false);
                    setConfirmSend(false);
                  }}
                  className="px-4 py-2 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !toInput.trim() || !subjectInput.trim() || !bodyInput.trim()}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors shadow flex items-center gap-1.5 ${
                    confirmSend ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600/90 hover:bg-red-600'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : confirmSend ? 'Confirm & Send' : 'Send Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
