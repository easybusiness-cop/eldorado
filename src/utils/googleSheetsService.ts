/**
 * Google Sheets API Client Service
 * Uses Google Sheets API v4 and Google Drive API v3 to list, view, edit, and create Spreadsheets.
 */

export interface GoogleSheetSummary {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime: string;
  createdTime?: string;
  rowCount?: number;
  columnCount?: number;
}

export interface GoogleSpreadsheetDetail {
  spreadsheetId: string;
  properties: {
    title: string;
    locale?: string;
    timeZone?: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      gridProperties?: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
  spreadsheetUrl: string;
}

const SEED_SHEETS: GoogleSheetSummary[] = [
  {
    id: 'sheet-seed-01',
    name: 'Fleet Compute Budget & Token ROI Tracker 2026',
    webViewLink: 'https://sheets.google.com/create',
    modifiedTime: 'Today, 09:30 AM',
    createdTime: '2026-09-01',
    rowCount: 45,
    columnCount: 8
  },
  {
    id: 'sheet-seed-02',
    name: 'Department Workload & Velocity Matrix (Q3)',
    webViewLink: 'https://sheets.google.com/create',
    modifiedTime: 'Yesterday',
    createdTime: '2026-08-28',
    rowCount: 60,
    columnCount: 6
  },
  {
    id: 'sheet-seed-03',
    name: 'Autonomous Agent SLA & Incident Resolution Logs',
    webViewLink: 'https://sheets.google.com/create',
    modifiedTime: 'Aug 30',
    createdTime: '2026-08-25',
    rowCount: 120,
    columnCount: 10
  }
];

const SEED_GRID_DATA: Record<string, string[][]> = {
  'sheet-seed-01': [
    ['Department', 'Agent Lead', 'Monthly Budget', 'Token Consumption', 'Cache Hit %', 'Tasks Resolved', 'Avg Latency (ms)', 'ROI Multiplier'],
    ['Executive', 'CEO Autonomous Lead', '$8,500', '14.2M tokens', '94.2%', '1,420', '410ms', '18.4x'],
    ['Engineering', 'CTO Tech Director', '$12,000', '28.6M tokens', '91.8%', '3,890', '320ms', '24.1x'],
    ['Marketing', 'CMO Brand Growth', '$5,400', '9.1M tokens', '96.5%', '2,110', '280ms', '14.8x'],
    ['Operations', 'COO Logistics Bot', '$6,100', '11.8M tokens', '93.0%', '2,840', '350ms', '19.2x'],
    ['Customer SLA', 'SLA Dispatcher', '$4,200', '8.4M tokens', '97.1%', '4,520', '190ms', '32.0x']
  ],
  'sheet-seed-02': [
    ['Sprint ID', 'Feature Target', 'Responsible Agent', 'Story Points', 'Status', 'QA Verification'],
    ['SPRINT-44', 'Google Workspace Hub Unified Suite', 'Full-Stack Agent #1', '13', 'COMPLETED', 'PASSED (100%)'],
    ['SPRINT-44', 'Autonomous Discovery Radar Engine', 'Research Agent #3', '8', 'COMPLETED', 'PASSED (100%)'],
    ['SPRINT-45', 'Corporate Cascade Executive Loop', 'Workforce Manager', '21', 'IN_PROGRESS', 'RUNNING BENCHMARK'],
    ['SPRINT-45', 'Multi-Agent Self-Evolution Graph', 'Evolution Pod #2', '13', 'PLANNED', 'PENDING']
  ],
  'sheet-seed-03': [
    ['Timestamp', 'Incident ID', 'Component', 'Severity', 'Autonomous Fix Applied', 'Recovery Time', 'Impact'],
    ['2026-09-07 04:12', 'INC-902', 'OAuth Token Refresh', 'LOW', 'Automatic token re-issue', '80ms', 'Zero user impact'],
    ['2026-09-06 18:30', 'INC-901', 'Drive API Webhook Rate', 'MEDIUM', 'Exponential backoff throttle', '1.2s', 'Zero data loss'],
    ['2026-09-05 11:45', 'INC-900', 'Agent Context Window Overrun', 'LOW', 'Sliding context compression', '210ms', 'Resolved in flight']
  ]
};

/**
 * Fetch list of Google Spreadsheets from Google Drive
 */
export async function fetchGoogleSheets(accessToken: string | null): Promise<GoogleSheetSummary[]> {
  if (!accessToken) return SEED_SHEETS;

  try {
    const q = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink,modifiedTime,createdTime)&pageSize=25&orderBy=modifiedTime desc`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      console.warn('Drive API fetch spreadsheets notice:', res.status);
      return SEED_SHEETS;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files.map((f: any) => ({
        id: f.id,
        name: f.name || 'Untitled Spreadsheet',
        webViewLink: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
        modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'Recent',
        createdTime: f.createdTime,
        rowCount: 50,
        columnCount: 8
      }));
    }
    return SEED_SHEETS;
  } catch (err) {
    console.error('Failed to fetch Google Sheets:', err);
    return SEED_SHEETS;
  }
}

/**
 * Fetch spreadsheet structure and grid values
 */
export async function fetchSpreadsheetData(
  accessToken: string | null,
  spreadsheetId: string,
  range: string = 'Sheet1!A1:Z100'
): Promise<{ title: string; rows: string[][]; spreadsheetUrl: string }> {
  if (!accessToken || spreadsheetId.startsWith('sheet-seed')) {
    const rows = SEED_GRID_DATA[spreadsheetId] || [
      ['Column A', 'Column B', 'Column C'],
      ['Value 1', 'Value 2', 'Value 3']
    ];
    const summary = SEED_SHEETS.find((s) => s.id === spreadsheetId);
    return {
      title: summary?.name || 'Spreadsheet',
      rows,
      spreadsheetUrl: summary?.webViewLink || 'https://sheets.google.com/create'
    };
  }

  try {
    const [metaRes, valRes] = await Promise.all([
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,spreadsheetUrl,sheets.properties`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ]);

    let title = 'Spreadsheet';
    let spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    if (metaRes.ok) {
      const meta = await metaRes.json();
      title = meta.properties?.title || title;
      spreadsheetUrl = meta.spreadsheetUrl || spreadsheetUrl;
    }

    let rows: string[][] = [];
    if (valRes.ok) {
      const valData = await valRes.json();
      rows = valData.values || [];
    }

    return { title, rows, spreadsheetUrl };
  } catch (err) {
    console.error('Failed to fetch spreadsheet data:', err);
    return {
      title: 'Spreadsheet',
      rows: SEED_GRID_DATA['sheet-seed-01'],
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    };
  }
}

/**
 * Append a row to a spreadsheet
 */
export async function appendSpreadsheetRow(
  accessToken: string | null,
  spreadsheetId: string,
  rowValues: string[],
  range: string = 'Sheet1!A1'
): Promise<boolean> {
  if (accessToken && !spreadsheetId.startsWith('sheet-seed')) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [rowValues]
          })
        }
      );
      return res.ok;
    } catch (err) {
      console.error('Failed to append row via Sheets API:', err);
      throw err;
    }
  }

  if (!SEED_GRID_DATA[spreadsheetId]) {
    SEED_GRID_DATA[spreadsheetId] = [];
  }
  SEED_GRID_DATA[spreadsheetId].push(rowValues);
  return true;
}

/**
 * Create a new Google Spreadsheet
 */
export async function createGoogleSpreadsheet(
  accessToken: string | null,
  title: string,
  initialHeaders?: string[],
  initialRows?: string[][]
): Promise<GoogleSheetSummary> {
  if (accessToken) {
    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const spreadsheetId = data.spreadsheetId;

        // If headers or rows provided, populate them
        if (initialHeaders || initialRows) {
          const allRows = [];
          if (initialHeaders) allRows.push(initialHeaders);
          if (initialRows) allRows.push(...initialRows);

          await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ values: allRows })
            }
          ).catch(() => {});
        }

        return {
          id: spreadsheetId,
          name: title,
          webViewLink: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          modifiedTime: 'Just now',
          createdTime: new Date().toISOString(),
          rowCount: (initialRows?.length || 0) + 1,
          columnCount: initialHeaders?.length || 5
        };
      }
    } catch (err) {
      console.warn('Create spreadsheet API notice:', err);
    }
  }

  const newId = `sheet-custom-${Date.now()}`;
  const newSheet: GoogleSheetSummary = {
    id: newId,
    name: title,
    webViewLink: 'https://sheets.google.com/create',
    modifiedTime: 'Just now',
    createdTime: new Date().toISOString(),
    rowCount: (initialRows?.length || 0) + (initialHeaders ? 1 : 0) || 10,
    columnCount: initialHeaders?.length || 6
  };

  SEED_SHEETS.unshift(newSheet);
  const rows: string[][] = [];
  if (initialHeaders) rows.push(initialHeaders);
  if (initialRows) rows.push(...initialRows);
  if (rows.length === 0) {
    rows.push(['Header 1', 'Header 2', 'Header 3'], ['Data 1', 'Data 2', 'Data 3']);
  }
  SEED_GRID_DATA[newId] = rows;

  return newSheet;
}
