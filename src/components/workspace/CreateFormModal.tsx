import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  X,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { FormQuestionInput } from '../../utils/googleFormsService';

interface CreateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, questions: FormQuestionInput[]) => Promise<void>;
  isLoading: boolean;
}

export const CreateFormModal: React.FC<CreateFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<FormQuestionInput[]>([
    {
      title: 'Overall satisfaction with autonomous output',
      type: 'SCALE',
      lowLabel: 'Poor',
      highLabel: 'Flawless',
      required: true,
    },
    {
      title: 'Which agent department performed the best?',
      type: 'RADIO',
      options: ['Executive Office', 'Engineering & Development', 'Market Intelligence', 'Operations'],
      required: true,
    },
  ]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        title: '',
        type: 'TEXT',
        required: false,
      },
    ]);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<FormQuestionInput>) => {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const opts = q.options || [];
    handleUpdateQuestion(qIndex, {
      options: [...opts, `Option ${opts.length + 1}`],
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    const q = questions[qIndex];
    const opts = [...(q.options || [])];
    opts[optIndex] = val;
    handleUpdateQuestion(qIndex, { options: opts });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    const opts = (q.options || []).filter((_, i) => i !== optIndex);
    handleUpdateQuestion(qIndex, { options: opts });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit(title.trim(), description.trim(), questions.filter((q) => q.title.trim()));
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#1a1816] border border-[#504945] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden text-[#ebdbb2] my-8 max-h-[90vh] flex flex-col font-mono">
        {/* Header */}
        <div className="px-6 py-4 bg-[#24211e] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Create New Google Form</h3>
              <p className="text-[11px] text-[#a89984]">
                Directly publishes a new live questionnaire to your Google account via Forms API v1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#a89984] hover:text-white text-lg font-bold p-1 rounded hover:bg-[#3c3836]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-white mb-1.5">
              Form Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Enterprise Agent Capability Survey 2026"
              className="w-full bg-[#12100f] border border-[#3c3836] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or instructions for respondents..."
              className="w-full bg-[#12100f] border border-[#3c3836] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>

          <div className="border-t border-[#2d2a28] pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-purple-400" /> Form Questions ({questions.length})
              </span>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-2.5 py-1 bg-[#282828] hover:bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#201d1b] border border-[#3c3836] rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-[#a89984]">Question {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-[#a89984] hover:text-red-400 transition-colors"
                      title="Remove Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        value={q.title}
                        onChange={(e) => handleUpdateQuestion(idx, { title: e.target.value })}
                        placeholder="Enter question text..."
                        className="w-full bg-[#141211] border border-[#3c3836] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const newType = e.target.value as any;
                          const updates: Partial<FormQuestionInput> = { type: newType };
                          if ((newType === 'RADIO' || newType === 'CHECKBOX') && (!q.options || q.options.length === 0)) {
                            updates.options = ['Option 1', 'Option 2'];
                          }
                          handleUpdateQuestion(idx, updates);
                        }}
                        className="w-full bg-[#141211] border border-[#3c3836] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="RADIO">Multiple Choice</option>
                        <option value="CHECKBOX">Checkboxes</option>
                        <option value="TEXT">Short Answer</option>
                        <option value="PARAGRAPH">Paragraph</option>
                        <option value="SCALE">Linear Scale (1-5)</option>
                      </select>
                    </div>
                  </div>

                  {/* Options editor for choice questions */}
                  {(q.type === 'RADIO' || q.type === 'CHECKBOX') && (
                    <div className="pl-3 border-l-2 border-purple-500/30 space-y-2 mt-2">
                      <div className="text-[10px] text-[#a89984] font-bold">Answer Choices:</div>
                      {(q.options || ['Option 1']).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                            className="flex-1 bg-[#141211] border border-[#3c3836] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-400"
                          />
                          {(q.options?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx, optIdx)}
                              className="text-[#a89984] hover:text-red-400 p-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddOption(idx)}
                        className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold mt-1"
                      >
                        <Plus className="w-3 h-3" /> Add Choice
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs text-[#ebdbb2] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required || false}
                        onChange={(e) => handleUpdateQuestion(idx, { required: e.target.checked })}
                        className="rounded border-[#3c3836] text-purple-600 focus:ring-purple-500"
                      />
                      <span>Required question</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#3c3836]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#282828] hover:bg-[#3c3836] text-[#ebdbb2] text-xs font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Creating Form...' : 'Publish to Google Forms'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
