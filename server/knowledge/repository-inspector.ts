import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export interface RepoStructure {
  fileCount: number;
  totalSizeKb: number;
  languages: Record<string, number>;
  frameworks: string[];
  entryPoints: string[];
  fileTree: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  architecturalLayers: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    config?: string[];
    tests?: string[];
  };
}

export interface DiffFile {
  file: string;
  status: "added" | "modified" | "deleted";
  additions: number;
  deletions: number;
  patch?: string;
}

export interface DiffReview {
  files: DiffFile[];
  totalAdditions: number;
  totalDeletions: number;
  summary: string;
  securityWarnings: string[];
}

export class RepositoryInspector {
  private ignoreDirs = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "coverage",
    ".rufflo-workspaces",
    ".cache",
  ]);

  public inspect(repoPath: string): RepoStructure {
    const fileTree: string[] = [];
    const languages: Record<string, number> = {};
    let totalSizeKb = 0;

    const walk = (currentPath: string, relativePath = "") => {
      if (!fs.existsSync(currentPath)) return;
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (this.ignoreDirs.has(entry.name)) continue;

        const fullPath = path.join(currentPath, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          walk(fullPath, relPath);
        } else if (entry.isFile()) {
          fileTree.push(relPath);
          try {
            const stat = fs.statSync(fullPath);
            totalSizeKb += stat.size / 1024;
            const ext = path.extname(entry.name).toLowerCase();
            if (ext) {
              languages[ext] = (languages[ext] || 0) + 1;
            }
          } catch {
            // ignore unreadable stats
          }
        }
      }
    };

    walk(repoPath);

    // Dependency & package analysis
    let dependencies: Record<string, string> = {};
    let devDependencies: Record<string, string> = {};
    let scripts: Record<string, string> = {};
    const frameworks: string[] = [];
    const entryPoints: string[] = [];

    const pkgPath = path.join(repoPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        dependencies = pkg.dependencies || {};
        devDependencies = pkg.devDependencies || {};
        scripts = pkg.scripts || {};

        if (dependencies.react || devDependencies.react) frameworks.push("React");
        if (dependencies.express) frameworks.push("Express");
        if (dependencies.vite || devDependencies.vite) frameworks.push("Vite");
        if (dependencies.next) frameworks.push("Next.js");
        if (dependencies.typescript || devDependencies.typescript) frameworks.push("TypeScript");
        if (dependencies.tailwindcss || devDependencies.tailwindcss) frameworks.push("Tailwind CSS");
      } catch {
        // invalid JSON
      }
    }

    // Detect entry points
    const candidateEntries = [
      "server.ts",
      "src/main.tsx",
      "src/App.tsx",
      "index.ts",
      "src/index.ts",
      "server.js",
      "index.js",
    ];

    for (const entry of candidateEntries) {
      if (fs.existsSync(path.join(repoPath, entry))) {
        entryPoints.push(entry);
      }
    }

    // Architectural layers detection
    const layers: RepoStructure["architecturalLayers"] = {
      frontend: fileTree.filter(f => f.startsWith("src/components") || f.startsWith("src/pages") || f.startsWith("src/views")),
      backend: fileTree.filter(f => f.startsWith("server/") || f.startsWith("api/")),
      database: fileTree.filter(f => f.includes("db/") || f.includes("schema") || f.includes("migration")),
      config: fileTree.filter(f => f.endsWith(".config.ts") || f.endsWith(".config.js") || f.endsWith(".json")),
      tests: fileTree.filter(f => f.includes("test") || f.includes("spec")),
    };

    return {
      fileCount: fileTree.length,
      totalSizeKb: Math.round(totalSizeKb),
      languages,
      frameworks,
      entryPoints,
      fileTree: fileTree.slice(0, 300), // Cap for JSON responses
      dependencies,
      devDependencies,
      scripts,
      architecturalLayers: layers,
    };
  }

  public getDiff(repoPath: string): DiffReview {
    try {
      const gitStatus = execSync("git status --porcelain", {
        cwd: repoPath,
        encoding: "utf-8",
      });

      const files: DiffFile[] = [];
      const securityWarnings: string[] = [];
      let totalAdditions = 0;
      let totalDeletions = 0;

      const lines = gitStatus.split("\n").filter(Boolean);

      for (const line of lines) {
        const statusCode = line.slice(0, 2).trim();
        const filePath = line.slice(3).trim();

        let status: DiffFile["status"] = "modified";
        if (statusCode.includes("A") || statusCode.includes("??")) {
          status = "added";
        } else if (statusCode.includes("D")) {
          status = "deleted";
        }

        let patch = "";
        try {
          patch = execSync(`git diff HEAD -- "${filePath}"`, {
            cwd: repoPath,
            encoding: "utf-8",
          });
        } catch {
          // untracked file or deletion
        }

        const addCount = (patch.match(/^\+[^+]/gm) || []).length;
        const delCount = (patch.match(/^-[^-]/gm) || []).length;

        totalAdditions += addCount;
        totalDeletions += delCount;

        // Security inspection of diff patch
        if (patch) {
          if (/process\.env\.[A-Z0-9_]+\s*=\s*['"][^'"]+['"]/i.test(patch)) {
            securityWarnings.push(`Hardcoded API key or secret detected in ${filePath}`);
          }
          if (/eval\(|exec\(/i.test(patch)) {
            securityWarnings.push(`Potentially unsafe dynamic execution function in ${filePath}`);
          }
        }

        files.push({
          file: filePath,
          status,
          additions: addCount,
          deletions: delCount,
          patch: patch.slice(0, 2000), // truncation guard
        });
      }

      return {
        files,
        totalAdditions,
        totalDeletions,
        summary: `Changed ${files.length} file(s) with +${totalAdditions}/-${totalDeletions} lines.`,
        securityWarnings,
      };
    } catch (err: any) {
      return {
        files: [],
        totalAdditions: 0,
        totalDeletions: 0,
        summary: `Git diff unavailable: ${err.message}`,
        securityWarnings: [],
      };
    }
  }
}

export const repositoryInspector = new RepositoryInspector();
