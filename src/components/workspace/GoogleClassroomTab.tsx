import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Plus,
  RefreshCw,
  ExternalLink,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  FileText,
  Megaphone,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  type GoogleClassroomCourse,
  type GoogleClassroomCourseWork,
  type GoogleClassroomAnnouncement,
  fetchClassroomCourses,
  fetchCourseWork,
  fetchCourseAnnouncements,
  createClassroomCourse,
  createCourseWorkItem,
  createCourseAnnouncement,
} from '../../utils/googleClassroomService';

interface GoogleClassroomTabProps {
  token: string | null;
  onSignIn: () => void;
  statusMsg?: string | null;
  setStatusMsg: (msg: string | null) => void;
}

export function GoogleClassroomTab({ token, onSignIn, setStatusMsg }: GoogleClassroomTabProps) {
  const [courses, setCourses] = useState<GoogleClassroomCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<GoogleClassroomCourse | null>(null);
  const [courseWork, setCourseWork] = useState<GoogleClassroomCourseWork[]>([]);
  const [announcements, setAnnouncements] = useState<GoogleClassroomAnnouncement[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'stream' | 'classwork'>('classwork');

  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Modal states
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  // Form states
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSection, setNewCourseSection] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignPoints, setNewAssignPoints] = useState(100);

  const [newAnnText, setNewAnnText] = useState('');

  useEffect(() => {
    loadCourses();
  }, [token]);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseDetails(selectedCourse.id);
    }
  }, [selectedCourse, token]);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const data = await fetchClassroomCourses(token);
      setCourses(data);
      if (data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching Classroom courses:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadCourseDetails = async (courseId: string) => {
    setIsLoadingDetails(true);
    try {
      const [workData, annData] = await Promise.all([
        fetchCourseWork(token, courseId),
        fetchCourseAnnouncements(token, courseId),
      ]);
      setCourseWork(workData);
      setAnnouncements(annData);
    } catch (err: any) {
      console.error('Error fetching course details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    try {
      const created = await createClassroomCourse(
        token,
        newCourseName.trim(),
        newCourseSection.trim(),
        newCourseName.trim(),
        newCourseDesc.trim()
      );
      setCourses((prev) => [created, ...prev]);
      setSelectedCourse(created);
      setIsCourseModalOpen(false);
      setNewCourseName('');
      setNewCourseSection('');
      setNewCourseDesc('');
      setStatusMsg(`Course "${created.name}" created in Google Classroom!`);
    } catch (err: any) {
      setStatusMsg(`Failed to create course: ${err.message}`);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newAssignTitle.trim()) return;

    try {
      const created = await createCourseWorkItem(
        token,
        selectedCourse.id,
        newAssignTitle.trim(),
        newAssignDesc.trim(),
        newAssignPoints
      );
      setCourseWork((prev) => [created, ...prev]);
      setIsAssignmentModalOpen(false);
      setNewAssignTitle('');
      setNewAssignDesc('');
      setStatusMsg(`Coursework "${created.title}" published!`);
    } catch (err: any) {
      setStatusMsg(`Failed to publish coursework: ${err.message}`);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newAnnText.trim()) return;

    try {
      const created = await createCourseAnnouncement(token, selectedCourse.id, newAnnText.trim());
      setAnnouncements((prev) => [created, ...prev]);
      setIsAnnouncementModalOpen(false);
      setNewAnnText('');
      setStatusMsg('Announcement posted to Google Classroom stream!');
    } catch (err: any) {
      setStatusMsg(`Failed to post announcement: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#181615]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#1d2021]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Google Classroom Enterprise Academy Hub
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                Google Classroom API v1
              </span>
            </h3>
            <p className="text-xs text-[#a89984]">
              Manage courses, distribute coursework assignments, track agent milestones, and broadcast class announcements
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
            onClick={() => setIsCourseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Course</span>
          </button>
          <button
            onClick={loadCourses}
            disabled={isLoadingCourses}
            className="p-1.5 text-[#a89984] hover:text-white bg-[#282828] hover:bg-[#3c3836] border border-[#3c3836] rounded-lg transition-colors"
            title="Refresh Courses"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingCourses ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Courses List */}
        <div className="w-72 border-r border-[#3c3836] bg-[#141211] flex flex-col">
          <div className="p-3 border-b border-[#3c3836]/60 text-[11px] font-bold text-[#a89984] tracking-wider uppercase flex items-center justify-between">
            <span>Courses ({courses.length})</span>
            <span className="text-[10px] text-blue-400 font-mono font-normal">Active</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {courses.map((course) => {
              const isSelected = selectedCourse?.id === course.id;
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all border ${
                    isSelected
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-sm'
                      : 'hover:bg-[#282828] text-[#ebdbb2] border-transparent'
                  }`}
                >
                  <div className="font-bold text-white line-clamp-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>{course.name}</span>
                  </div>
                  {course.section && (
                    <div className="text-[11px] text-[#a89984] mt-0.5 font-medium">
                      {course.section}
                    </div>
                  )}
                  {course.description && (
                    <p className="text-[10px] text-[#7c6f64] line-clamp-2 mt-1">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#3c3836]/40 text-[10px] text-[#7c6f64]">
                    <span>Code: <code className="text-white font-mono">{course.enrollmentCode || 'auto'}</code></span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Course Workspace */}
        <div className="flex-1 flex flex-col bg-[#121110] overflow-y-auto">
          {selectedCourse ? (
            <div className="p-6 space-y-6">
              {/* Course Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-[#1d2021] border border-blue-500/30 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      {selectedCourse.section || 'Academic Section'}
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {selectedCourse.name}
                    </h2>
                    {selectedCourse.descriptionHeading && (
                      <p className="text-xs text-[#ebdbb2] mt-1 font-medium">
                        {selectedCourse.descriptionHeading}
                      </p>
                    )}
                    {selectedCourse.description && (
                      <p className="text-xs text-[#a89984] mt-1 max-w-2xl">
                        {selectedCourse.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={selectedCourse.alternateLink || 'https://classroom.google.com'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open in Google Classroom</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Subtabs & Actions */}
              <div className="flex items-center justify-between border-b border-[#3c3836] pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSubTab('classwork')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      activeSubTab === 'classwork'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-[#a89984] hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Coursework & Assignments ({courseWork.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveSubTab('stream')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      activeSubTab === 'stream'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-[#a89984] hover:text-white'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Stream Announcements ({announcements.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeSubTab === 'classwork' ? (
                    <button
                      onClick={() => setIsAssignmentModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Assignment</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAnnouncementModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Post Announcement</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Coursework View */}
              {activeSubTab === 'classwork' && (
                <div className="space-y-3">
                  {isLoadingDetails ? (
                    <div className="text-center py-12 text-xs text-[#a89984]">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-400" />
                      Loading assignments...
                    </div>
                  ) : courseWork.length === 0 ? (
                    <div className="text-center py-12 bg-[#181615] border border-[#3c3836] rounded-xl text-xs text-[#a89984]">
                      No assignments published yet. Click "Create Assignment" to assign tasks to learners.
                    </div>
                  ) : (
                    courseWork.map((cw) => (
                      <div
                        key={cw.id}
                        className="p-4 rounded-xl bg-[#181615] border border-[#3c3836] hover:border-blue-500/40 transition-colors flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{cw.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#282828] text-blue-300 border border-[#3c3836]">
                                {cw.maxPoints ? `${cw.maxPoints} pts` : 'Ungraded'}
                              </span>
                            </div>
                            {cw.description && (
                              <p className="text-xs text-[#a89984] mt-1 leading-relaxed">
                                {cw.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-[#7c6f64]">
                              <span>Type: {cw.workType || 'ASSIGNMENT'}</span>
                              <span>•</span>
                              <span>Published: {new Date(cw.creationTime || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={cw.alternateLink || 'https://classroom.google.com'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                        >
                          <span>View</span>
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Stream Announcements View */}
              {activeSubTab === 'stream' && (
                <div className="space-y-3">
                  {isLoadingDetails ? (
                    <div className="text-center py-12 text-xs text-[#a89984]">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-400" />
                      Loading announcements...
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-12 bg-[#181615] border border-[#3c3836] rounded-xl text-xs text-[#a89984]">
                      No announcements posted to this stream yet.
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-4 rounded-xl bg-[#181615] border border-[#3c3836] hover:border-indigo-500/40 transition-colors flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">
                            {ann.text}
                          </p>
                          <div className="mt-2 text-[10px] text-[#7c6f64]">
                            Posted {new Date(ann.creationTime || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#a89984]">
              Select a course on the left to view coursework and announcements
            </div>
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-400" />
                Create Google Classroom Course
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-[#a89984] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. CS501: Autonomous Agent Development"
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Section</label>
                <input
                  type="text"
                  value={newCourseSection}
                  onChange={(e) => setNewCourseSection(e.target.value)}
                  placeholder="e.g. Fall 2026 Cohort"
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Course Description</label>
                <textarea
                  rows={3}
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Curriculum overview and objectives..."
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCourseName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Publish Coursework Assignment
              </h3>
              <button onClick={() => setIsAssignmentModalOpen(false)} className="text-[#a89984] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={newAssignTitle}
                  onChange={(e) => setNewAssignTitle(e.target.value)}
                  placeholder="e.g. Lab 3: Build a Google Workspace Integration"
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Instructions & Rubric</label>
                <textarea
                  rows={3}
                  value={newAssignDesc}
                  onChange={(e) => setNewAssignDesc(e.target.value)}
                  placeholder="Provide step-by-step instructions for students..."
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Max Grade Points</label>
                <input
                  type="number"
                  value={newAssignPoints}
                  onChange={(e) => setNewAssignPoints(Number(e.target.value))}
                  min={0}
                  max={1000}
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newAssignTitle.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1d2021] border border-[#3c3836] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" />
                Post Stream Announcement
              </h3>
              <button onClick={() => setIsAnnouncementModalOpen(false)} className="text-[#a89984] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#ebdbb2] mb-1">Announcement Text</label>
                <textarea
                  rows={4}
                  required
                  value={newAnnText}
                  onChange={(e) => setNewAnnText(e.target.value)}
                  placeholder="Broadcast an update, reading materials, or milestone announcement to the entire class..."
                  className="w-full bg-[#121110] border border-[#3c3836] focus:border-indigo-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newAnnText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow"
                >
                  Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
