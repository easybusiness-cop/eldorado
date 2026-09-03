import React, { useState, useEffect } from 'react';
import { OpenSourceRepo, DynamicFeature } from '../types';
import { soundFx } from '../utils/speech';
import {
  FolderGit2,
  Star,
  GitFork,
  Search,
  ExternalLink,
  Code,
  Download,
  Check,
  X,
  Sparkles,
  Terminal,
  Layers,
  FileCode,
} from 'lucide-react';

interface RepoExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRepoTool: (feature: Partial<DynamicFeature>) => void;
  onOpenIdeWithCode: (code: string, title: string) => void;
}

export const RepoExplorerModal: React.FC<RepoExplorerModalProps> = ({
  isOpen,
  onClose,
  onImportRepoTool,
  onOpenIdeWithCode,
}) => {
  const [repos, setRepos] = useState<OpenSourceRepo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<OpenSourceRepo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importedRepoId, setImportedRepoId] = useState<string | null>(null);

  // Fetch repositories from API
  useEffect(() => {
    if (isOpen) {
      fetchRepos('');
    }
  }, [isOpen]);

  const fetchRepos = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/web/search-repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.repos) {
        setRepos(data.repos);
        if (!selectedRepo && data.repos.length > 0) {
          setSelectedRepo(data.repos[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    fetchRepos(searchQuery);
  };

  const handleImportToFleet = (repo: OpenSourceRepo) => {
    soundFx.playNotification();
    const dynamicTool: Partial<DynamicFeature> = {
      name: `${repo.name.toUpperCase()} Connector`,
      description: repo.description,
      category: 'code',
      icon: 'FolderGit2',
      enabled: true,
      addedByAgent: 'Stanley Hudson / OSINT Hub',
      code: `// Dynamic Tool imported from ${repo.name}\n// ${repo.url}\n${repo.sampleCode || '// Executable module'}\n\nfunction execute() {\n  return { status: "success", repo: "${repo.name}", stars: "${repo.stars}" };\n}\nreturn execute();`,
    };

    onImportRepoTool(dynamicTool);
    setImportedRepoId(repo.id);
    setTimeout(() => setImportedRepoId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-mono select-none p-4">
      <div className="w-full max-w-5xl bg-[#1d2021] border-2 border-[#fabd2f] rounded-lg shadow-2xl overflow-hidden flex flex-col h-[700px] max-h-[90vh] animate-in zoom-in-95 duration-200 text-[#ebdbb2]">
        {/* Header */}
        <div className="px-4 py-2.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[#fabd2f]" />
            <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
              OPEN-SOURCE REPOSITORIES & AGENT FRAMEWORKS HUB
            </span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1 hover:text-red-400 rounded text-[#a89984]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2 bg-[#181615] border-b border-[#3c3836] flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search open-source repos (e.g. ruflo, autogen, crewai, browser-use, smolagents)..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#1d2021] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#7c6f64]" />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold rounded text-xs"
            >
              Search Hub
            </button>
          </form>

          <span className="text-[11px] text-[#7c6f64] font-bold">
            {repos.length} Repositories Indexed
          </span>
        </div>

        {/* Split Layout: Left Repo List, Right Repo Inspector */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Repository Cards */}
          <div className="w-full md:w-80 border-r border-[#3c3836] bg-[#181615] overflow-y-auto p-2.5 space-y-2">
            {repos.map((repo) => {
              const isSelected = selectedRepo?.id === repo.id;
              return (
                <div
                  key={repo.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedRepo(repo);
                  }}
                  className={`p-2.5 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#282828] border-[#fabd2f] ring-1 ring-[#fabd2f]/40'
                      : 'bg-[#1d2021] border-[#3c3836] hover:border-[#504945]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-[#fabd2f]" />
                      <span className="font-bold text-xs text-[#ebdbb2] truncate">
                        {repo.owner}/{repo.name}
                      </span>
                    </div>

                    <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#3c3836] text-[#fabd2f]">
                      {repo.language}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#a89984] mt-1 line-clamp-2 leading-normal">
                    {repo.description}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#3c3836]/60 text-[9px] text-[#7c6f64]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-400" />
                        <span>{repo.stars}</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <GitFork className="w-2.5 h-2.5" />
                        <span>{repo.forks}</span>
                      </span>
                    </div>

                    <span>{repo.license}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Repository View */}
          {selectedRepo ? (
            <div className="flex-1 flex flex-col bg-[#1d2021] overflow-hidden">
              {/* Repo Title & Header Actions */}
              <div className="p-4 border-b border-[#3c3836] bg-[#282828] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-[#ebdbb2]">
                      {selectedRepo.owner}/{selectedRepo.name}
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {selectedRepo.license}
                    </span>
                  </div>

                  <p className="text-xs text-[#a89984] mt-1 leading-relaxed">
                    {selectedRepo.description}
                  </p>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedRepo.topics.map((t, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-[#181615] text-[#83a598] border border-[#3c3836]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Import & GitHub Action Buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleImportToFleet(selectedRepo)}
                    className="px-3 py-1.5 bg-[#fabd2f] hover:bg-[#d79921] text-[#1d2021] font-bold text-xs rounded flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    {importedRepoId === selectedRepo.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-950" />
                        <span>Tool Mounted!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Import Tool to Fleet</span>
                      </>
                    )}
                  </button>

                  <a
                    href={selectedRepo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-[#181615] hover:bg-[#3c3836] text-[#ebdbb2] border border-[#3c3836] font-bold text-xs rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Core Features & Capabilities */}
              <div className="p-3 border-b border-[#3c3836] bg-[#181615]">
                <div className="text-[10px] uppercase font-bold text-[#a89984] mb-1">
                  CORE ARCHITECTURAL CAPABILITIES:
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {selectedRepo.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded bg-[#282828] border border-[#3c3836] text-[10px] text-emerald-400 font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-[#fabd2f] shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Code / Integration Blueprint */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#181615]">
                <div className="px-3 py-1.5 bg-[#282828] border-b border-[#3c3836] flex items-center justify-between text-[10px] text-[#a89984]">
                  <div className="flex items-center gap-1.5 font-bold text-[#ebdbb2]">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>INTEGRATION CODE SNIPPET (Sandboxed TypeScript / Python)</span>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenIdeWithCode(
                        selectedRepo.sampleCode || '',
                        `${selectedRepo.name} Integration`
                      );
                    }}
                    className="text-[#fabd2f] hover:underline font-bold"
                  >
                    Open in Live IDE →
                  </button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-emerald-300 bg-[#121110] select-text">
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {selectedRepo.sampleCode}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#7c6f64] text-xs">
              Select a repository to inspect its architecture and integration code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
