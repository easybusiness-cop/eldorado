import React, { useState, useEffect } from 'react';
import {
  Table,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Database,
  Download,
  Search,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  type GoogleSheetSummary,
  fetchGoogleSheets,
  fetchSpreadsheetData,
  appendSpreadsheetRow,
  createGoogleSpreadsheet,
} from '../../utils/googleSheetsService';

interface GoogleSheetsTabProps {
  token: string | null;
  onSignIn: () => void;
  statusMsg?: string | null;
  setStatusMsg: (msg: string | null) => void;
}

export function GoogleSheetsTab({ token, onSignIn, setStatusMsg }: GoogleSheetsTabProps) {
  const [sheets, setSheets] = useState<GoogleSheetSummary[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<GoogleSheetSummary | null>(null);
  const [gridTitle, setGridTitle] = useState('');
  const [gridRows, setGridRows] = useState<string[][]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);

  // New row input
  const [newRowValues, setNewRowValues] = useState<string[]>([]);
  const [isAppending, setIsAppending] = useState(false);

  // Create sheet modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetHeaders, setNewSheetHeaders] = useState('Timestamp, Metric, Value, Agent ID, Status');

  useEffect(() => {
    loadSheets();
  }, [token]);

  useEffect(() => {
    if (selectedSheet) {
      loadGridData(selectedSheet.id);
    }
  }, [selectedSheet, token]);

  const loadSheets = async () => {
    setIsLoadingSheets(true);
    try {
      const data = await fetchGoogleSheets(token);
      setSheets(data);
      if (data.length > 0 && !selectedSheet) {
        setSelectedSheet(data[0]);
      }
    } catch (err: any) {
      console.error('Error loading sheets:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const loadGridData = async (sheetId: string) => {
    setIsLoadingGrid(true);
    try {
      const data = await fetchSpreadsheetData(token, sheetId);
      setGridTitle(data.title);
      setGridRows(data.rows);
      const colCount = data.rows[0]?.length || 4;
      setNewRowValues(new Array(colCount).fill(''));
    } catch (err: any) {
      console.error('Error loading grid data:', err);
    } finally {
      setIsLoadingGrid(false);
    }
  };

  const handleAppendRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheet || newRowValues.every((v) => !v.trim())) return;

    setIsAppending(true);
    try {
      await appendSpreadsheetRow(token, selectedSheet.id, newRowValues);
      setGridRows((prev) => [...prev, [...newRowValues]]);
      setNewRowValues(new Array(newRowValues.length).fill(''));
      setStatusMsg('New row appended to Google Sheet!');
    } catch (err: any) {
      setStatusMsg(`Failed to append row: ${err.message}`);
    } finally {
      setIsAppending(false);
    }
  };

  const handleCreateSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim()) return;

    try {
      const headers = newSheetHeaders.split(',').map((h) => h.trim()).filter(Boolean);
      const created = await createGoogleSpreadsheet(token, newSheetTitle.trim(), headers);
      setSheets((prev) => [created, ...prev]);
      setSelectedSheet(created);
      setIsCreateModalOpen(false);
      setNewSheetTitle('');
      setStatusMsg(`Google Spreadsheet "${created.name}" created!`);
    } catch (err: any) {
      setStatusMsg(`Failed to create spreadsheet: ${err.message}`);
    }
  };

  const handleExportAgentFleetData = async () => {
    const title = `Autonomous Fleet Audit - ${new Date().toISOString().split('T')[0]}`;
    const headers = ['Agent Name', 'Department', 'Task ID', 'Tokens Used', 'Latency', 'Accuracy', 'Timestamp'];
    const rows = [
      ['CEO Autonomous Lead', 'Executive', 'TSK-101', '124,000', '320ms', '99.4%', new Date().toISOString()],
      ['CTO Tech Lead', 'Engineering', 'TSK-102', '310,000', '280ms', '100%', new Date().toISOString()],
      ['CMO Growth Director', 'Marketing', 'TSK-103', '95,000', '310ms', '98.8%', new Date().toISOString()],
      ['Autonomous Code Agent', 'Engineering', 'TSK-104', '420,000', '190ms', '99.9%', new Date().toISOString()],
    ];

    try {
      const created = await createGoogleSpreadsheet(token, title, headers, rows);
      setSheets((prev) => [created, ...prev]);
      setSelectedSheet(created);
      setStatusMsg(`Autonomous Agent Fleet metrics exported to Google Sheet "${title}"!`);
    } catch (err: any) {
      setStatusMsg(`Failed to export sheet: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#181615]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#1d2021]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Google Spreadsheets Enterprise Manager
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Google Sheets API v4
              </span>
            </h3>
            <p className="text-xs text-[#a89984]">
              Browse drive spreadsheets, inspect live cell grids, append rows, and export autonomous fleet analytics
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
            onClick={handleExportAgentFleetData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors border border-emerald-500/30 shadow"
            title="Export real-time agent metrics to new Google Sheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Fleet Metrics</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sheet</span>
          </button>
          <button
            onClick={loadSheets}
            disabled={isLoadingSheets}
            className="p-1.5 text-[#a89984] hover:text-white bg-[#282828] hover:bg-[#3c3836] border border-[#3c3836] rounded-lg transition-colors"
            title="Refresh Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSheets ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Sheets List */}
        <div className="w-72 border-r border-[#3c3836] bg-[#141211] flex flex-col">
          <div className="p-3 border-b border-[#3c3836]/60 text-[11px] font-bold text-[#a89984] tracking-wider uppercase flex items-center justify-between">
            <span>Spreadsheets ({sheets.length})</span>
            <span className="text-[10px] text-emerald-400 font-mono">Live</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {sheets.map((sheet) => {
              const isSelected = selectedSheet?.id === sheet.id;
              return (
                <button
                  key={sheet.id}
                  onClick={() => setSelectedSheet(sheet)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'hover:bg-[#282828] text-[#ebdbb2] border-transparent'
                  }`}
                >
                  <div className="font-bold text-white line-clamp-1 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{sheet.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#3c3836]/40 text-[10px] text-[#7c6f64]">
                    <span>Modified: {sheet.modifiedTime}</span>
                    <span className="text-emerald-400 font-semibold">{sheet.rowCount || 50} rows</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Grid Viewer & Row Appender */}
        <div className="flex-1 flex flex-col bg-[#121110] overflow-hidden">
          {selectedSheet ? (
            <>
              {/* Sheet Header */}
              <div className="px-6 py-3 border-b border-[#3c3836] bg-[#181615] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white truncate max-w-md">
                    {gridTitle || selectedSheet.name}
                  </h4>
                </div>
                <a
                  href={selectedSheet.webViewLink || 'https://sheets.google.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  <span>Open in Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Grid Table */}
              <div className="flex-1 overflow-auto p-6">
                {isLoadingGrid ? (
                  <div className="flex items-center justify-center h-48 text-xs text-[#a89984]">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-400" />
                    Loading sheet rows...
                  </div>
                ) : gridRows.length === 0 ? (
                  <div className="text-center py-16 text-xs text-[#a89984]">
                    No rows found in this spreadsheet.
                  </div>
                ) : (
                  <div className="border border-[#3c3836] rounded-xl overflow-hidden bg-[#181615] shadow-lg">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-[#282828] border-b border-[#3c3836]">
                          <th className="p-3 text-[11px] font-bold text-[#a89984] w-12 text-center border-r border-[#3c3836]">#</th>
                          {gridRows[0]?.map((header, colIdx) => (
                            <th key={colIdx} className="p-3 text-[11px] font-bold text-emerald-400 border-r border-[#3c3836] last:border-r-0">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gridRows.slice(1).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-[#3c3836]/60 hover:bg-[#282828]/50 transition-colors">
                            <td className="p-2.5 text-[10px] text-[#7c6f64] font-mono text-center border-r border-[#3c3836]/60 bg-[#1d2021]/50">
                              {rowIdx + 2}
                            </td>
                            {gridRows[0]?.map((_, colIdx) => (
                              <td key={colIdx} className="p-2.5 text-[#ebdbb2] border-r border-[#3c3836]/60 last:border-r-0 truncate max-w-xs font-mono text-[11px]">
                                {row[colIdx] || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Row Append Bar */}
              {gridRows.length > 0 && (
                <form onSubmit={handleAppendRow} className="p-4 border-t border-[#3c3836] bg-[#181615]">
                  <div className="text-[11px] font-bold text-[#a89984] mb-2 flex items-center justify-between">
                    <span>APPEND NEW ROW TO SPREADSHEET</span>
                    <span className="text-emerald-400 text-[10px]">Google Sheets API v4 append</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {gridRows[0]?.map((header, idx) => (
                      <input
                        key={idx}
                        type="text"
                        placeholder={header}
                        value={newRowValues[idx] || ''}
                        onChange={(e) => {
                          const updated = [...newRowValues];
                          updated[idx] = e.target.value;
                          setNewRowValues(updated);
                        }}
                        className="bg-[#121110] border border-[#3c3836] focus:border-emerald-500 rounded-lg p-2 text-xs text-white placeholder-[#7c6f64] focus:outline-none"
                      />
                    ))}
                    <button
                      type="submit"
                      disabled={isAppending || newRowValues.every((v) => !v.trim())}
                      className="col-span-2 md:col-span-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAppending ? 'Adding...' : 'Add Row'}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#a89984]">
              Select a spreadsheet on the left to view data
            </div>
          )}
        </div>
      </div>

      {/* Create Spreadsheet Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-emerald-400" />
                Create Google Spreadsheet
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#a89984] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSpreadsheet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Spreadsheet Title</label>
                <input
                  type="text"
                  required
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="e.g. Q4 Executive Budget & Token Ledger"
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Column Headers (Comma Separated)</label>
                <input
                  type="text"
                  value={newSheetHeaders}
                  onChange={(e) => setNewSheetHeaders(e.target.value)}
                  placeholder="Timestamp, Agent, Metric, Value, Status"
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-emerald-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSheetTitle.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow"
                >
                  Create Spreadsheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
