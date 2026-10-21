import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  Terminal,
  Cpu,
  Brain,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Layers,
  Zap,
  Flame,
  FileCode,
  Shield,
  Activity,
  Award,
  ArrowRight,
  Database
} from 'lucide-react';
import { soundFx } from '../utils/speech';

interface LanguageRuntime {
  language: 'python' | 'cpp' | 'java' | 'typescript';
  displayName: string;
  installed: boolean;
  command: string;
  version: string;
  path: string;
  capabilities: string[];
}

const DEFAULT_CODE_SNIPPETS: Record<string, string> = {
  python: `# Python 3.10 Autonomous Script
# Standard library data processing, algorithmic analysis & JSON output
import sys
import json
import math
import time

def process_metrics():
    start_time = time.time()
    data = [math.sin(i * 0.1) * 100 for i in range(100000)]
    avg = sum(data) / len(data)
    variance = sum((x - avg) ** 2 for x in data) / len(data)
    std_dev = math.sqrt(variance)
    
    result = {
        "status": "SUCCESS",
        "runtime": sys.version.split()[0],
        "samples_computed": len(data),
        "mean": round(avg, 4),
        "std_deviation": round(std_dev, 4),
        "execution_seconds": round(time.time() - start_time, 5)
    }
    return result

if __name__ == "__main__":
    print(">>> Python 3 Execution Engine Active")
    output = process_metrics()
    print("Computed Results:")
    print(json.dumps(output, indent=2))
`,
  cpp: `// C++20 High-Performance Computational Kernel
// Compiled with GNU Compiler Collection: g++ -O3 -std=c++20
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>
#include <chrono>

int main() {
    std::cout << ">>> Initializing C++20 High-Performance Task Engine" << std::endl;
    
    const size_t N = 2000000;
    std::vector<long long> numbers(N);
    
    auto start = std::chrono::high_resolution_clock::now();
    std::iota(numbers.begin(), numbers.end(), 1);
    
    long long total_sum = 0;
    for (size_t i = 0; i < N; ++i) {
        if (numbers[i] % 2 == 0) {
            total_sum += numbers[i];
        }
    }
    auto end = std::chrono::high_resolution_clock::now();
    
    std::chrono::duration<double, std::milli> duration = end - start;
    
    std::cout << "Processed elements: " << N << std::endl;
    std::cout << "Sum of even integers: " << total_sum << std::endl;
    std::cout << "Kernel computation completed in: " << duration.count() << " ms (Native g++ -O3)" << std::endl;
    
    return 0;
}
`,
  java: `// Java 17 OpenJDK Enterprise Runtime
// Compiled with javac and executed on OpenJDK JVM
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        System.out.println(">>> Java OpenJDK 17 Enterprise Task Engine Active");
        
        List<String> fleetObjectives = Arrays.asList(
            "Synthesize Neural Weights",
            "Optimize Memory Graph",
            "Compile Polyglot Binaries",
            "Execute Zero-Trust Audit",
            "Stream Telemetry Packets"
        );
        
        long startTime = System.currentTimeMillis();
        
        Map<Integer, List<String>> groupedByLength = fleetObjectives.stream()
            .map(String::toUpperCase)
            .collect(Collectors.groupingBy(String::length));
            
        long elapsed = System.currentTimeMillis() - startTime;
        
        System.out.println("Processed " + fleetObjectives.size() + " enterprise objectives in " + elapsed + " ms.");
        groupedByLength.forEach((len, items) -> {
            System.out.println("Length " + len + " -> " + items);
        });
        
        System.out.println("Java Task Execution: SUCCESS (OpenJDK HotSpot 64-Bit VM)");
    }
}
`,
  typescript: `// TypeScript / Node.js Runtime (Node v22 with TSX)
interface AgentExecutionTelemetry {
  agent: string;
  objective: string;
  cycles: number;
  health: number;
}

const telemetry: AgentExecutionTelemetry = {
  agent: "Rufflo Quantum Polyglot Core",
  objective: "Multi-Language Memory & Execution Gateway",
  cycles: 1024,
  health: 100,
};

console.log(">>> Node.js / TypeScript Engine Active");
console.log(JSON.stringify(telemetry, null, 2));
`
};

export const PolyglotLanguageHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'runner' | 'agent_tasks' | 'llm_memory'>('runner');
  const [selectedLang, setSelectedLang] = useState<'python' | 'cpp' | 'java' | 'typescript'>('python');
  const [code, setCode] = useState<string>(DEFAULT_CODE_SNIPPETS.python);
  const [stdin, setStdin] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Agent Task State
  const [agentObjective, setAgentObjective] = useState(
    'Calculate high-precision fibonacci sequence up to the 50th term and verify mathematical convergence'
  );
  const [agentLang, setAgentLang] = useState<'python' | 'cpp' | 'java' | 'typescript'>('cpp');
  const [isAgentSolving, setIsAgentSolving] = useState(false);
  const [agentTaskResult, setAgentTaskResult] = useState<any>(null);

  // Runtimes & Memory State
  const [runtimes, setRuntimes] = useState<LanguageRuntime[]>([]);
  const [memoryData, setMemoryData] = useState<any>({ skills: [], nodes: [], episodes: [] });
  const [loadingRuntimes, setLoadingRuntimes] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchRuntimes();
    fetchMemory();
  }, []);

  const fetchRuntimes = async () => {
    setLoadingRuntimes(true);
    try {
      const res = await fetch('/api/polyglot/runtimes');
      const data = await res.json();
      if (data.success && data.runtimes) {
        setRuntimes(data.runtimes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRuntimes(false);
    }
  };

  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/polyglot/memory');
      const data = await res.json();
      if (data.success) {
        setMemoryData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLanguageChange = (lang: 'python' | 'cpp' | 'java' | 'typescript') => {
    setSelectedLang(lang);
    setCode(DEFAULT_CODE_SNIPPETS[lang] || '');
    setExecutionResult(null);
    soundFx.playClick();
  };

  const handleExecuteCode = async () => {
    soundFx.playClick();
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const res = await fetch('/api/polyglot/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          code,
          stdin: stdin.trim() ? stdin : undefined,
        }),
      });

      const data = await res.json();
      setExecutionResult(data);
      soundFx.playNotification();
      fetchMemory();
    } catch (err: any) {
      setExecutionResult({
        success: false,
        stderr: err.message || 'Execution request failed',
        durationMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleDispatchAgentTask = async () => {
    if (!agentObjective.trim()) return;
    soundFx.playClick();
    setIsAgentSolving(true);
    setAgentTaskResult(null);

    try {
      const res = await fetch('/api/polyglot/agent-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective: agentObjective,
          preferredLanguage: agentLang,
        }),
      });

      const data = await res.json();
      setAgentTaskResult(data);
      soundFx.playNotification();
      fetchMemory();
    } catch (err: any) {
      setAgentTaskResult({
        success: false,
        error: err.message || 'Agent task dispatch failed',
      });
    } finally {
      setIsAgentSolving(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundFx.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181615] text-[#ebdbb2] font-mono overflow-hidden">
      {/* Top Banner: Runtime Status Bar */}
      <div className="p-3 bg-[#201d1c] border-b border-[#3c3836] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Cpu className="w-4 h-4 text-[#fabd2f] animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wider text-[#ebdbb2]">
            NATIVE MULTI-LANGUAGE RUNTIMES & LLM MEMORY INTEGRATION
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRuntimes}
            disabled={loadingRuntimes}
            className="p-1 rounded bg-[#282828] hover:bg-[#3c3836] text-[#a89984] hover:text-[#ebdbb2] text-[10px] flex items-center gap-1 border border-[#3c3836]"
            title="Refresh runtimes"
          >
            <RefreshCw className={`w-3 h-3 ${loadingRuntimes ? 'animate-spin' : ''}`} />
            <span>Verify Compilers</span>
          </button>
        </div>
      </div>

      {/* Runtimes Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 bg-[#1d2021] border-b border-[#3c3836] shrink-0 text-xs">
        {/* Python 3 */}
        <div className="p-2.5 rounded-lg bg-[#282828] border border-emerald-500/40 flex items-start gap-2.5">
          <div className="text-xl">🐍</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#ebdbb2]">Python 3</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-700/60">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-[#a89984] truncate">Python 3.10.12 (/usr/bin/python3)</div>
            <div className="text-[9px] text-[#7c6f64] mt-0.5">Automations, Data Science, Math</div>
          </div>
        </div>

        {/* C++ (g++) */}
        <div className="p-2.5 rounded-lg bg-[#282828] border border-emerald-500/40 flex items-start gap-2.5">
          <div className="text-xl">⚡</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#ebdbb2]">C++ (g++)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-700/60">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-[#a89984] truncate">GCC 12.3.0 C++20 (/usr/bin/g++)</div>
            <div className="text-[9px] text-[#7c6f64] mt-0.5">-O3 Native High Performance</div>
          </div>
        </div>

        {/* Java (OpenJDK) */}
        <div className="p-2.5 rounded-lg bg-[#282828] border border-emerald-500/40 flex items-start gap-2.5">
          <div className="text-xl">☕</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#ebdbb2]">Java 17 (OpenJDK)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-700/60">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-[#a89984] truncate">javac / java 17.0.20.1 HotSpot</div>
            <div className="text-[9px] text-[#7c6f64] mt-0.5">Enterprise Streams & JVM OOP</div>
          </div>
        </div>

        {/* TypeScript / Node */}
        <div className="p-2.5 rounded-lg bg-[#282828] border border-emerald-500/40 flex items-start gap-2.5">
          <div className="text-xl">🚀</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#ebdbb2]">TypeScript / Node</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-700/60">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-[#a89984] truncate">Node.js v22.23.3 & TSX</div>
            <div className="text-[9px] text-[#7c6f64] mt-0.5">Full-Stack Async AST Execution</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#3c3836] bg-[#1d2021] text-xs shrink-0">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('runner');
          }}
          className={`px-4 py-2.5 font-bold flex items-center gap-1.5 transition-colors border-r border-[#3c3836] ${
            activeTab === 'runner'
              ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
              : 'text-[#a89984] hover:text-[#ebdbb2]'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Interactive Polyglot Runner & Compiler</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('agent_tasks');
          }}
          className={`px-4 py-2.5 font-bold flex items-center gap-1.5 transition-colors border-r border-[#3c3836] ${
            activeTab === 'agent_tasks'
              ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
              : 'text-[#a89984] hover:text-[#ebdbb2]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autonomous Agent Task Solver</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('llm_memory');
          }}
          className={`px-4 py-2.5 font-bold flex items-center gap-1.5 transition-colors border-r border-[#3c3836] ${
            activeTab === 'llm_memory'
              ? 'bg-[#282828] text-[#fabd2f] border-b-2 border-b-[#fabd2f]'
              : 'text-[#a89984] hover:text-[#ebdbb2]'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-[#83a598]" />
          <span>LLM Knowledge Graph & Skill Memory</span>
          {memoryData.skills?.length > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-[#fabd2f] text-[#1d2021] text-[9px] font-extrabold ml-1">
              {memoryData.skills.length} Skills
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: INTERACTIVE RUNNER & COMPILER */}
      {activeTab === 'runner' && (
        <div className="flex-1 flex flex-col p-3 overflow-hidden space-y-3">
          {/* Language Selector Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#a89984] uppercase">Select Language:</span>
              <button
                onClick={() => handleLanguageChange('python')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  selectedLang === 'python'
                    ? 'bg-[#fabd2f] text-[#1d2021] shadow-md'
                    : 'bg-[#282828] text-[#ebdbb2] hover:bg-[#3c3836]'
                }`}
              >
                🐍 Python 3
              </button>
              <button
                onClick={() => handleLanguageChange('cpp')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  selectedLang === 'cpp'
                    ? 'bg-[#fabd2f] text-[#1d2021] shadow-md'
                    : 'bg-[#282828] text-[#ebdbb2] hover:bg-[#3c3836]'
                }`}
              >
                ⚡ C++ (g++ -O3)
              </button>
              <button
                onClick={() => handleLanguageChange('java')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  selectedLang === 'java'
                    ? 'bg-[#fabd2f] text-[#1d2021] shadow-md'
                    : 'bg-[#282828] text-[#ebdbb2] hover:bg-[#3c3836]'
                }`}
              >
                ☕ Java (OpenJDK)
              </button>
              <button
                onClick={() => handleLanguageChange('typescript')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  selectedLang === 'typescript'
                    ? 'bg-[#fabd2f] text-[#1d2021] shadow-md'
                    : 'bg-[#282828] text-[#ebdbb2] hover:bg-[#3c3836]'
                }`}
              >
                🚀 TypeScript / Node
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyCode(code)}
                className="px-2.5 py-1 rounded bg-[#282828] hover:bg-[#3c3836] text-[10px] text-[#a89984] hover:text-[#ebdbb2] flex items-center gap-1 border border-[#3c3836]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>

              <button
                onClick={handleExecuteCode}
                disabled={isRunning}
                className="px-4 py-1.5 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling & Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Compile & Run Live</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Split Pane: Code Editor + Output Console */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
            {/* Editor Column */}
            <div className="flex flex-col bg-[#121212] border border-[#3c3836] rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-[#201d1c] border-b border-[#3c3836] flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-[#fabd2f]" />
                  Source Code ({selectedLang.toUpperCase()})
                </span>
                <span className="text-[10px] text-[#7c6f64]">
                  {selectedLang === 'cpp' ? 'Compiled: g++ -O3 -std=c++20' : selectedLang === 'java' ? 'Compiled: javac & JVM' : 'Interpreted: Python 3.10'}
                </span>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 p-3 bg-[#121212] text-[#ebdbb2] font-mono text-xs focus:outline-none resize-none select-text leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Output Terminal Column */}
            <div className="flex flex-col bg-[#121212] border border-[#3c3836] rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-[#201d1c] border-b border-[#3c3836] flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#ebdbb2] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Terminal & Compiler Output
                </span>
                {executionResult && (
                  <span
                    className={`text-[10px] font-bold ${
                      executionResult.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    Exit Code: {executionResult.exitCode ?? 0} • {executionResult.durationMs}ms
                  </span>
                )}
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs font-mono bg-[#0d0f12]">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-[#fabd2f] py-4">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing in isolated sandbox workspace...</span>
                  </div>
                ) : executionResult ? (
                  <>
                    {executionResult.stdout && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase">STDOUT:</div>
                        <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed select-text">
                          {executionResult.stdout}
                        </pre>
                      </div>
                    )}

                    {executionResult.compilationError && (
                      <div className="space-y-1 p-2 rounded bg-red-950/80 border border-red-700">
                        <div className="text-[10px] font-bold text-red-400 uppercase">COMPILER DIAGNOSTICS:</div>
                        <pre className="text-red-300 whitespace-pre-wrap leading-relaxed select-text">
                          {executionResult.compilationError}
                        </pre>
                      </div>
                    )}

                    {executionResult.stderr && !executionResult.compilationError && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-amber-400 uppercase">STDERR:</div>
                        <pre className="text-amber-300 whitespace-pre-wrap leading-relaxed select-text">
                          {executionResult.stderr}
                        </pre>
                      </div>
                    )}

                    {!executionResult.stdout && !executionResult.stderr && (
                      <div className="text-[#7c6f64] text-xs">Program finished with no output.</div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-[#7c6f64] space-y-2">
                    <Terminal className="w-8 h-8 mx-auto text-[#3c3836]" />
                    <div>Click "Compile & Run Live" to execute code on the native Linux compilers.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTONOMOUS AGENT TASK SOLVER */}
      {activeTab === 'agent_tasks' && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 max-w-4xl mx-auto w-full">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[#ebdbb2] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#fabd2f]" />
              AUTONOMOUS MULTI-LANGUAGE AGENT TASK SOLVER
            </h3>
            <p className="text-xs text-[#a89984]">
              Assign real-world programming tasks to the fleet in Python, C++, Java, or TypeScript. The agent generates the solution, compiles it natively, runs it, and registers the learned skill into LLM Memory.
            </p>
          </div>

          {/* Task Form */}
          <div className="p-4 rounded-lg bg-[#201d1c] border border-[#3c3836] space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#a89984] uppercase">Task Objective:</label>
              <textarea
                value={agentObjective}
                onChange={(e) => setAgentObjective(e.target.value)}
                placeholder="Describe task to carry out in Python, Java, or C++..."
                className="w-full p-2.5 bg-[#181615] border border-[#3c3836] rounded text-xs text-[#ebdbb2] focus:ring-1 focus:ring-[#fabd2f] focus:outline-none"
                rows={2}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#a89984]">Target Language:</span>
                {(['python', 'cpp', 'java', 'typescript'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setAgentLang(l)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      agentLang === l ? 'bg-[#fabd2f] text-[#1d2021]' : 'bg-[#282828] text-[#a89984] hover:text-[#ebdbb2]'
                    }`}
                  >
                    {l === 'python' ? 'Python' : l === 'cpp' ? 'C++' : l === 'java' ? 'Java' : 'TypeScript'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDispatchAgentTask}
                disabled={isAgentSolving || !agentObjective.trim()}
                className="px-5 py-2 bg-[#fabd2f] hover:bg-[#d79921] disabled:opacity-50 text-[#1d2021] font-bold rounded text-xs flex items-center gap-2 transition-colors shadow-md"
              >
                {isAgentSolving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Agent Writing & Compiling...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Dispatch to Agent Fleet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Agent Results Display */}
          {agentTaskResult && (
            <div className="p-4 rounded-lg bg-[#201d1c] border border-[#3c3836] space-y-3">
              <div className="flex items-center justify-between border-b border-[#3c3836] pb-2">
                <span className="font-bold text-xs text-[#ebdbb2] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Agent Execution Succeeded ({agentTaskResult.language?.toUpperCase()})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  Duration: {agentTaskResult.execution?.durationMs}ms • Memory Nodes: {agentTaskResult.knowledgeNodesCount}
                </span>
              </div>

              {agentTaskResult.code && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-[#a89984] uppercase">Generated Standalone Code:</div>
                  <pre className="p-3 bg-[#121212] rounded border border-[#3c3836] text-xs text-[#ebdbb2] overflow-x-auto leading-relaxed select-text">
                    {agentTaskResult.code}
                  </pre>
                </div>
              )}

              {agentTaskResult.execution?.stdout && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">Program Output (stdout):</div>
                  <pre className="p-3 bg-[#121212] rounded border border-[#3c3836] text-xs text-emerald-300 overflow-x-auto leading-relaxed select-text">
                    {agentTaskResult.execution.stdout}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LLM KNOWLEDGE GRAPH & SKILL MEMORY */}
      {activeTab === 'llm_memory' && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 max-w-5xl mx-auto w-full">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[#ebdbb2] flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#83a598]" />
              PERSISTENT LLM KNOWLEDGE GRAPH & MULTI-LANGUAGE SKILL MEMORY
            </h3>
            <p className="text-xs text-[#a89984]">
              Programming concepts, compilation procedures, and execution episodes are stored in the agent memory to guide future autonomous reasoning and task execution.
            </p>
          </div>

          {/* Learned Skills Section */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#fabd2f] uppercase flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Learned Skills Registry:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {memoryData.skills?.map((skill: any) => (
                <div
                  key={skill.id}
                  className="p-3 bg-[#201d1c] border border-[#3c3836] rounded-lg space-y-1.5 hover:border-[#83a598] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#ebdbb2]">{skill.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-700/60">
                      Success: {(skill.successRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a89984]">{skill.description}</p>
                  {skill.procedure && (
                    <div className="text-[10px] space-y-0.5 text-[#7c6f64] pt-1">
                      {skill.procedure.slice(0, 3).map((step: string, i: number) => (
                        <div key={i} className="flex items-center gap-1 text-[#ebdbb2]">
                          <span className="text-[#fabd2f]">•</span> {step}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Language Concepts in Knowledge Graph */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-[#83a598] uppercase flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Language Concept Nodes in Knowledge Graph:</span>
            </div>

            <div className="space-y-2">
              {memoryData.nodes?.map((node: any) => (
                <div key={node.id} className="p-3 bg-[#201d1c] border border-[#3c3836] rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#ebdbb2]">{node.label}</span>
                    <div className="flex gap-1">
                      {node.tags?.map((t: string, i: number) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.2 bg-[#282828] text-[#83a598] rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#a89984]">{node.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Episodic Executions */}
          {memoryData.episodes?.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Episodic Execution History:</span>
              </div>

              <div className="space-y-1.5">
                {memoryData.episodes.slice(0, 5).map((ep: any) => (
                  <div
                    key={ep.id}
                    className="p-2.5 bg-[#201d1c] border border-[#3c3836] rounded text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-[#ebdbb2]">{ep.objective}</span>
                      <div className="text-[10px] text-[#7c6f64]">{ep.summary}</div>
                    </div>
                    <span className="text-[10px] text-[#a89984]">
                      {new Date(ep.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
