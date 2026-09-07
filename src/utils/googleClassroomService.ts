/**
 * Google Classroom API Client Service
 * Uses Google Classroom API v1 to manage Courses, CourseWork (Assignments), and Announcements.
 */

export interface GoogleClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  room?: string;
  ownerId?: string;
  enrollmentCode?: string;
  courseState?: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  alternateLink?: string;
  teacherGroupEmail?: string;
  courseGroupEmail?: string;
}

export interface GoogleClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  state?: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  maxPoints?: number;
  workType?: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION';
}

export interface GoogleClassroomAnnouncement {
  id: string;
  courseId: string;
  text: string;
  state?: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  creatorUserId?: string;
}

const SEED_COURSES: GoogleClassroomCourse[] = [
  {
    id: 'course-ai-101',
    name: 'CS490: Autonomous Agent Architectures & Multi-Agent Swarms',
    section: 'Fall 2026',
    descriptionHeading: 'Foundations of Autonomous Corporate Cascades',
    description: 'Advanced study in autonomous agentic frameworks, live radar intelligence pipelines, and self-evolution systems.',
    room: 'Lab 402 / Virtual Fleet',
    enrollmentCode: 'auto77x',
    courseState: 'ACTIVE',
    alternateLink: 'https://classroom.google.com/u/0/h'
  },
  {
    id: 'course-ai-202',
    name: 'AI-620: Enterprise Workspace Automation & Security Governance',
    section: 'Executive Cohort B',
    descriptionHeading: 'Google Workspace API Security & Zero-Trust Policies',
    description: 'Practicum for deploying Google Chat, Sheets, Classroom, and Gmail APIs into autonomous workflows with strict OAuth RBAC.',
    room: 'Online Portal',
    enrollmentCode: 'wrkspc9',
    courseState: 'ACTIVE',
    alternateLink: 'https://classroom.google.com/u/0/h'
  }
];

const SEED_COURSEWORK: Record<string, GoogleClassroomCourseWork[]> = {
  'course-ai-101': [
    {
      id: 'cw-1',
      courseId: 'course-ai-101',
      title: 'Lab 1: Implement Dynamic Role Selection & Workforce Dispatch',
      description: 'Design a workforce manager that analyzes executive commands and instantiates specialized agent roles dynamically.',
      maxPoints: 100,
      workType: 'ASSIGNMENT',
      state: 'PUBLISHED',
      creationTime: '2026-09-02T10:00:00Z',
      alternateLink: 'https://classroom.google.com'
    },
    {
      id: 'cw-2',
      courseId: 'course-ai-101',
      title: 'Milestone 2: Autonomous Discovery & Live Radar Grounding',
      description: 'Integrate the live web discovery engine to provide continuous intelligence to coding and research agents.',
      maxPoints: 100,
      workType: 'ASSIGNMENT',
      state: 'PUBLISHED',
      creationTime: '2026-09-05T14:30:00Z',
      alternateLink: 'https://classroom.google.com'
    }
  ],
  'course-ai-202': [
    {
      id: 'cw-3',
      courseId: 'course-ai-202',
      title: 'Project 1: Secure Google Workspace Enterprise Hub Integration',
      description: 'Build a compliant Google Workspace dashboard supporting Chat, Sheets, Forms, Classroom, and Gmail with dual auth.',
      maxPoints: 100,
      workType: 'ASSIGNMENT',
      state: 'PUBLISHED',
      creationTime: '2026-09-06T09:00:00Z',
      alternateLink: 'https://classroom.google.com'
    }
  ]
};

const SEED_ANNOUNCEMENTS: Record<string, GoogleClassroomAnnouncement[]> = {
  'course-ai-101': [
    {
      id: 'ann-1',
      courseId: 'course-ai-101',
      text: 'Welcome to CS490! The virtual agent fleet command center is live. Review the syllabus and launch your autonomous pods.',
      state: 'PUBLISHED',
      creationTime: '2026-09-01T08:00:00Z',
      alternateLink: 'https://classroom.google.com'
    }
  ],
  'course-ai-202': [
    {
      id: 'ann-2',
      courseId: 'course-ai-202',
      text: 'Reminder: Live Google Workspace OAuth scopes must be granted during sign-in to test real classroom endpoints.',
      state: 'PUBLISHED',
      creationTime: '2026-09-04T11:00:00Z',
      alternateLink: 'https://classroom.google.com'
    }
  ]
};

/**
 * Fetch list of courses for the active teacher / student
 */
export async function fetchClassroomCourses(accessToken: string | null): Promise<GoogleClassroomCourse[]> {
  if (!accessToken) return SEED_COURSES;

  try {
    const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      console.warn('Classroom API fetch courses notice:', res.status);
      return SEED_COURSES;
    }
    const data = await res.json();
    if (data.courses && data.courses.length > 0) {
      return data.courses;
    }
    return SEED_COURSES;
  } catch (err) {
    console.error('Failed to fetch Classroom courses:', err);
    return SEED_COURSES;
  }
}

/**
 * Fetch coursework for a specific course
 */
export async function fetchCourseWork(accessToken: string | null, courseId: string): Promise<GoogleClassroomCourseWork[]> {
  if (!accessToken || courseId.startsWith('course-ai-')) {
    return SEED_COURSEWORK[courseId] || [];
  }

  try {
    const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return SEED_COURSEWORK[courseId] || [];
    const data = await res.json();
    return data.courseWork || [];
  } catch (err) {
    console.error('Failed to fetch Classroom coursework:', err);
    return SEED_COURSEWORK[courseId] || [];
  }
}

/**
 * Fetch announcements for a specific course
 */
export async function fetchCourseAnnouncements(accessToken: string | null, courseId: string): Promise<GoogleClassroomAnnouncement[]> {
  if (!accessToken || courseId.startsWith('course-ai-')) {
    return SEED_ANNOUNCEMENTS[courseId] || [];
  }

  try {
    const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return SEED_ANNOUNCEMENTS[courseId] || [];
    const data = await res.json();
    return data.announcements || [];
  } catch (err) {
    console.error('Failed to fetch Classroom announcements:', err);
    return SEED_ANNOUNCEMENTS[courseId] || [];
  }
}

/**
 * Create a new Classroom Course
 */
export async function createClassroomCourse(
  accessToken: string | null,
  name: string,
  section?: string,
  descriptionHeading?: string,
  description?: string
): Promise<GoogleClassroomCourse> {
  if (accessToken) {
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          section: section || 'Autonomous Section 1',
          descriptionHeading: descriptionHeading || name,
          description: description || 'Created via Google Workspace Hub',
          ownerId: 'me',
          courseState: 'ACTIVE'
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Classroom create course notice:', err);
    }
  }

  const newCourse: GoogleClassroomCourse = {
    id: `course-${Date.now()}`,
    name,
    section: section || 'Autonomous Section',
    descriptionHeading: descriptionHeading || name,
    description: description || 'Created by Autonomous Fleet Manager',
    enrollmentCode: Math.random().toString(36).substring(2, 8),
    courseState: 'ACTIVE',
    alternateLink: 'https://classroom.google.com/u/0/h'
  };
  SEED_COURSES.unshift(newCourse);
  return newCourse;
}

/**
 * Create a new CourseWork (assignment)
 */
export async function createCourseWorkItem(
  accessToken: string | null,
  courseId: string,
  title: string,
  description?: string,
  maxPoints: number = 100
): Promise<GoogleClassroomCourseWork> {
  if (accessToken && !courseId.startsWith('course-ai-')) {
    try {
      const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          maxPoints,
          workType: 'ASSIGNMENT',
          state: 'PUBLISHED'
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Classroom create coursework notice:', err);
    }
  }

  const newWork: GoogleClassroomCourseWork = {
    id: `cw-${Date.now()}`,
    courseId,
    title,
    description: description || 'Autonomous agent curriculum task.',
    maxPoints,
    workType: 'ASSIGNMENT',
    state: 'PUBLISHED',
    creationTime: new Date().toISOString(),
    alternateLink: 'https://classroom.google.com'
  };

  if (!SEED_COURSEWORK[courseId]) {
    SEED_COURSEWORK[courseId] = [];
  }
  SEED_COURSEWORK[courseId].unshift(newWork);
  return newWork;
}

/**
 * Post an announcement to a course
 */
export async function createCourseAnnouncement(
  accessToken: string | null,
  courseId: string,
  text: string
): Promise<GoogleClassroomAnnouncement> {
  if (accessToken && !courseId.startsWith('course-ai-')) {
    try {
      const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          state: 'PUBLISHED'
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Classroom create announcement notice:', err);
    }
  }

  const newAnn: GoogleClassroomAnnouncement = {
    id: `ann-${Date.now()}`,
    courseId,
    text,
    state: 'PUBLISHED',
    creationTime: new Date().toISOString(),
    alternateLink: 'https://classroom.google.com'
  };

  if (!SEED_ANNOUNCEMENTS[courseId]) {
    SEED_ANNOUNCEMENTS[courseId] = [];
  }
  SEED_ANNOUNCEMENTS[courseId].unshift(newAnn);
  return newAnn;
}
