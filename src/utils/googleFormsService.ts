/**
 * Google Forms API v1 & Drive integration service for Rufflo Agent Fleet
 */

export interface GoogleFormSummary {
  id: string;
  name: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  description?: string;
  questionsCount?: number;
  responseCount?: number;
}

export interface FormQuestionInput {
  title: string;
  type: 'RADIO' | 'CHECKBOX' | 'TEXT' | 'PARAGRAPH' | 'SCALE';
  options?: string[];
  required?: boolean;
  lowLabel?: string;
  highLabel?: string;
}

export interface GoogleFormQuestionItem {
  itemId: string;
  title: string;
  description?: string;
  type: string;
  options?: string[];
  required?: boolean;
}

export interface GoogleFormResponseItem {
  responseId: string;
  createTime: string;
  respondentEmail?: string;
  answers: Array<{
    questionId: string;
    questionTitle: string;
    values: string[];
  }>;
}

export interface FullGoogleForm {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  settings?: any;
  items: GoogleFormQuestionItem[];
  responderUri?: string;
  revisionId?: string;
}

/**
 * Fetch all Google Forms owned or accessed by the user via Google Drive API
 */
export async function fetchGoogleForms(accessToken: string): Promise<GoogleFormSummary[]> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.form' and trashed=false");
    const fields = encodeURIComponent('files(id,name,webViewLink,createdTime,modifiedTime)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=50&orderBy=modifiedTime%20desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch forms: HTTP ${res.status}`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name || 'Untitled Form',
      webViewLink: f.webViewLink || `https://docs.google.com/forms/d/${f.id}/edit`,
      createdTime: f.createdTime,
      modifiedTime: f.modifiedTime,
    }));
  } catch (error: any) {
    console.error('[GoogleFormsService] fetchGoogleForms error:', error);
    throw error;
  }
}

/**
 * Fetch full form schema including questions and metadata via Google Forms API v1
 */
export async function fetchFormDetails(accessToken: string, formId: string): Promise<FullGoogleForm> {
  try {
    const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to get form details: HTTP ${res.status}`);
    }

    const data = await res.json();

    const items: GoogleFormQuestionItem[] = (data.items || []).map((item: any) => {
      let type = 'TEXT';
      let options: string[] = [];
      let required = false;

      if (item.questionItem?.question) {
        const q = item.questionItem.question;
        required = !!q.required;
        if (q.choiceQuestion) {
          type = q.choiceQuestion.type || 'RADIO';
          options = (q.choiceQuestion.options || []).map((opt: any) => opt.value || '');
        } else if (q.textQuestion) {
          type = q.textQuestion.paragraph ? 'PARAGRAPH' : 'TEXT';
        } else if (q.scaleQuestion) {
          type = 'SCALE';
        }
      }

      return {
        itemId: item.itemId || item.questionItem?.question?.questionId || '',
        title: item.title || 'Untitled Question',
        description: item.description,
        type,
        options,
        required,
      };
    });

    return {
      formId: data.formId,
      info: data.info || { title: 'Untitled Form' },
      items,
      responderUri: data.responderUri || `https://docs.google.com/forms/d/e/${data.formId}/viewform`,
      revisionId: data.revisionId,
    };
  } catch (error: any) {
    console.error('[GoogleFormsService] fetchFormDetails error:', error);
    throw error;
  }
}

/**
 * Fetch responses submitted to a Google Form via Google Forms API v1
 */
export async function fetchFormResponses(
  accessToken: string,
  formId: string,
  formItems?: GoogleFormQuestionItem[]
): Promise<GoogleFormResponseItem[]> {
  try {
    const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch responses: HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawResponses = data.responses || [];

    const itemMap = new Map<string, string>();
    if (formItems) {
      formItems.forEach((it) => itemMap.set(it.itemId, it.title));
    }

    return rawResponses.map((r: any) => {
      const answers: Array<{ questionId: string; questionTitle: string; values: string[] }> = [];

      if (r.answers) {
        Object.keys(r.answers).forEach((qId) => {
          const ansObj = r.answers[qId];
          const vals: string[] = [];
          if (ansObj.textAnswers?.answers) {
            ansObj.textAnswers.answers.forEach((a: any) => {
              if (a.value) vals.push(a.value);
            });
          }
          answers.push({
            questionId: qId,
            questionTitle: itemMap.get(qId) || `Question (${qId.slice(0, 6)}...)`,
            values: vals,
          });
        });
      }

      return {
        responseId: r.responseId,
        createTime: r.createTime || r.lastSubmittedTime,
        respondentEmail: r.respondentEmail,
        answers,
      };
    });
  } catch (error: any) {
    console.error('[GoogleFormsService] fetchFormResponses error:', error);
    throw error;
  }
}

/**
 * Create a new Google Form and optionally populate questions
 */
export async function createGoogleFormWithQuestions(
  accessToken: string,
  title: string,
  description?: string,
  questions: FormQuestionInput[] = []
): Promise<FullGoogleForm> {
  try {
    // 1. Create base form
    const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        info: {
          title,
          documentTitle: title,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create form: HTTP ${createRes.status}`);
    }

    const created = await createRes.json();
    const formId = created.formId;

    // 2. Add description & questions via batchUpdate if provided
    const requests: any[] = [];

    if (description) {
      requests.push({
        updateFormInfo: {
          info: {
            description,
          },
          updateMask: 'description',
        },
      });
    }

    questions.forEach((q, index) => {
      let questionPayload: any = {};

      if (q.type === 'RADIO' || q.type === 'CHECKBOX') {
        questionPayload = {
          choiceQuestion: {
            type: q.type,
            options: (q.options || ['Option 1', 'Option 2']).map((val) => ({ value: val })),
            shuffle: false,
          },
        };
      } else if (q.type === 'PARAGRAPH') {
        questionPayload = {
          textQuestion: {
            paragraph: true,
          },
        };
      } else if (q.type === 'SCALE') {
        questionPayload = {
          scaleQuestion: {
            low: 1,
            high: 5,
            lowLabel: q.lowLabel || 'Poor',
            highLabel: q.highLabel || 'Exceptional',
          },
        };
      } else {
        questionPayload = {
          textQuestion: {
            paragraph: false,
          },
        };
      }

      if (q.required) {
        questionPayload.required = true;
      }

      requests.push({
        createItem: {
          item: {
            title: q.title,
            questionItem: {
              question: questionPayload,
            },
          },
          location: {
            index,
          },
        },
      });
    });

    if (requests.length > 0) {
      const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });

      if (!updateRes.ok) {
        console.warn('[GoogleFormsService] batchUpdate warning:', await updateRes.text());
      }
    }

    return fetchFormDetails(accessToken, formId);
  } catch (error: any) {
    console.error('[GoogleFormsService] createGoogleForm error:', error);
    throw error;
  }
}

/**
 * Delete a Google Form from Google Drive (MUST be confirmed by user in UI)
 */
export async function deleteGoogleForm(accessToken: string, formId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${formId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete form: HTTP ${res.status}`);
    }

    return true;
  } catch (error: any) {
    console.error('[GoogleFormsService] deleteGoogleForm error:', error);
    throw error;
  }
}

/**
 * Predefined Autonomous Agent & Enterprise Form Templates
 */
export const PRESET_FORM_TEMPLATES = [
  {
    id: 'agent_eval',
    name: 'AI Agent Workforce Performance Review',
    description: 'Autonomous multi-department agent benchmark evaluation and SLA verification questionnaire.',
    questions: [
      {
        title: 'Which agent persona did you interact with most frequently?',
        type: 'RADIO' as const,
        options: ['Michael Scott (CEO)', 'Dwight Schrute (CTO/Security)', 'Jim Halpert (Product)', 'Pam Beesly (Support/Ops)', 'Other Agent Worker'],
        required: true,
      },
      {
        title: 'Rate the autonomous execution speed and quality of deliverables:',
        type: 'SCALE' as const,
        lowLabel: 'Sub-par',
        highLabel: 'Flawless',
        required: true,
      },
      {
        title: 'What department deliverable required the most refinement?',
        type: 'CHECKBOX' as const,
        options: ['Engineering / Code Generation', 'Market Research & Intelligence', 'Corporate Strategy', 'Customer Support'],
        required: false,
      },
      {
        title: 'Specific recommendations or new agent skills requested:',
        type: 'PARAGRAPH' as const,
        required: false,
      },
    ],
  },
  {
    id: 'client_intake',
    name: 'Enterprise Client AI Integration Intake',
    description: 'Onboarding questionnaire for new enterprise partners adopting autonomous fleet agents.',
    questions: [
      {
        title: 'Company or Organization Name',
        type: 'TEXT' as const,
        required: true,
      },
      {
        title: 'Primary business objective for deploying autonomous agents:',
        type: 'RADIO' as const,
        options: ['24/7 Automated Customer Support', 'Autonomous Code Review & Development', 'Live Market & Competitor Intelligence', 'Workflow & Spreadsheet Automation'],
        required: true,
      },
      {
        title: 'What Google Workspace tools does your team primarily use?',
        type: 'CHECKBOX' as const,
        options: ['Google Forms', 'Google Drive & Docs', 'Google Sheets', 'Google Calendar', 'Gmail'],
        required: true,
      },
      {
        title: 'Expected initial agent worker volume:',
        type: 'RADIO' as const,
        options: ['1 - 5 Agents', '5 - 20 Agents', '20+ Fleet Agents'],
        required: true,
      },
      {
        title: 'Target deployment timeline and special requirements:',
        type: 'PARAGRAPH' as const,
        required: false,
      },
    ],
  },
  {
    id: 'incident_report',
    name: 'Fleet Anomaly & Incident Post-Mortem',
    description: 'Standardized operational anomaly report for tracking fleet execution interrupts.',
    questions: [
      {
        title: 'Incident Severity Level',
        type: 'RADIO' as const,
        options: ['P1 - Critical Blocker', 'P2 - High Degradation', 'P3 - Moderate', 'P4 - Low / Informational'],
        required: true,
      },
      {
        title: 'Affected Subsystem or Workflow',
        type: 'CHECKBOX' as const,
        options: ['Live Internet Discovery', 'Autonomous Model Routing', 'Corporate Cascade', 'Workspace Sync'],
        required: true,
      },
      {
        title: 'Root cause description and proposed preventive measure:',
        type: 'PARAGRAPH' as const,
        required: true,
      },
    ],
  },
];
