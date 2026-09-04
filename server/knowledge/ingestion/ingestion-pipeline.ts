import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { RepositoryCloner } from "./repository-cloner.ts";

export interface RepositoryKnowledge {
  id: string;
  repository: string;
  languages: string[];
  files: string[];
  dependencies: string[];
  documentation: string[];
  tests: string[];
  architectureSignals: string[];
  createdAt: string;
}

export class IngestionPipeline {
  private cloner = new RepositoryCloner();

  async ingest(repository: string): Promise<RepositoryKnowledge> {
    const id = crypto.randomUUID();

    const workspace = path.join(
      process.cwd(),
      ".rufflo-repositories",
      id
    );

    await this.cloner.clone(repository, workspace);

    const files = await this.discoverFiles(workspace);

    const languages = this.detectLanguages(files);

    const dependencies = await this.detectDependencies(workspace, files);

    const documentation = files.filter((x) =>
      /readme|docs?|\.md$/i.test(x)
    );

    const tests = files.filter((x) => /test|spec/i.test(x));

    const architectureSignals = this.detectArchitecture(files);

    return {
      id,
      repository,
      languages,
      files,
      dependencies,
      documentation,
      tests,
      architectureSignals,
      createdAt: new Date().toISOString(),
    };
  }

  private async discoverFiles(root: string): Promise<string[]> {
    const result: string[] = [];

    async function walk(directory: string) {
      const entries = await fs.readdir(directory, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (
          [".git", "node_modules", "dist", "build"].includes(entry.name)
        ) {
          continue;
        }

        const full = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          await walk(full);
        } else {
          result.push(path.relative(root, full));
        }
      }
    }

    await walk(root);

    return result;
  }

  private detectLanguages(files: string[]) {
    const counts = new Map<string, number>();

    for (const file of files) {
      const extension = path.extname(file).toLowerCase();

      const language = ({
        ".ts": "TypeScript",
        ".tsx": "TypeScript/React",
        ".js": "JavaScript",
        ".jsx": "JavaScript/React",
        ".py": "Python",
        ".go": "Go",
        ".rs": "Rust",
        ".java": "Java",
        ".cpp": "C++",
        ".c": "C",
      } as Record<string, string>)[extension];

      if (language) {
        counts.set(language, (counts.get(language) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([language]) => language);
  }

  private async detectDependencies(root: string, files: string[]) {
    const result: string[] = [];

    if (files.includes("package.json")) {
      try {
        const raw = await fs.readFile(
          path.join(root, "package.json"),
          "utf8"
        );
        const pkg = JSON.parse(raw);

        result.push(
          ...Object.keys(pkg.dependencies ?? {}),
          ...Object.keys(pkg.devDependencies ?? {})
        );
      } catch {}
    }

    return [...new Set(result)];
  }

  private detectArchitecture(files: string[]) {
    const signals: string[] = [];

    if (files.some((x) => /controller|route/i.test(x))) {
      signals.push("HTTP/API layer");
    }

    if (files.some((x) => /service/i.test(x))) {
      signals.push("Service layer");
    }

    if (files.some((x) => /repository|dao/i.test(x))) {
      signals.push("Data access layer");
    }

    if (files.some((x) => /worker|queue|job/i.test(x))) {
      signals.push("Asynchronous processing");
    }

    if (files.some((x) => /agent|workflow|orchestrat/i.test(x))) {
      signals.push("Agent/workflow architecture");
    }

    return signals;
  }
}
