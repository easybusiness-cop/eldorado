import * as fs from "node:fs";
import * as path from "node:path";

export interface EditResult {
  success: boolean;
  modified: boolean;
  diff?: string;
  error?: string;
}

function isInsideWorkspace(
  workspace: string,
  target: string,
): boolean {
  const workspacePath = path.resolve(workspace);
  const targetPath = path.resolve(target);

  const relative = path.relative(
    workspacePath,
    targetPath,
  );

  return (
    relative === "" ||
    (!relative.startsWith("..") &&
      !path.isAbsolute(relative))
  );
}

export class CodeEditor {
  public static async applyEdits(
    workspace: string,
    filePath: string,
    targetContent: string,
    replacementContent: string,
  ): Promise<EditResult> {
    if (!workspace) {
      return {
        success: false,
        modified: false,
        error: "Workspace is required.",
      };
    }

    if (!filePath) {
      return {
        success: false,
        modified: false,
        error: "File path is required.",
      };
    }

    if (
      typeof targetContent !== "string" ||
      typeof replacementContent !== "string"
    ) {
      return {
        success: false,
        modified: false,
        error:
          "Target and replacement content must be strings.",
      };
    }

    const resolvedWorkspace =
      path.resolve(workspace);

    const resolvedFile =
      path.resolve(
        resolvedWorkspace,
        filePath,
      );

    if (
      !isInsideWorkspace(
        resolvedWorkspace,
        resolvedFile,
      )
    ) {
      return {
        success: false,
        modified: false,
        error:
          "Path traversal blocked: file is outside workspace.",
      };
    }

    /*
     * Never allow agents to modify Git internals,
     * environment files or dependency directories
     * through this primitive.
     */
    const relative =
      path.relative(
        resolvedWorkspace,
        resolvedFile,
      );

    const blockedSegments = [
      ".git",
      "node_modules",
      ".env",
      ".env.local",
      ".env.production",
      ".env.development",
    ];

    const segments = relative.split(
      path.sep,
    );

    if (
      segments.some((segment) =>
        blockedSegments.includes(segment),
      )
    ) {
      return {
        success: false,
        modified: false,
        error:
          "Modification of protected workspace files is blocked.",
      };
    }

    try {
      const stat =
        await fs.promises.stat(resolvedFile);

      if (!stat.isFile()) {
        return {
          success: false,
          modified: false,
          error: "Target is not a regular file.",
        };
      }

      const fileContent =
        await fs.promises.readFile(
          resolvedFile,
          "utf8",
        );

      if (!fileContent.includes(targetContent)) {
        return {
          success: false,
          modified: false,
          error:
            "Target content was not found. File was not changed.",
        };
      }

      const occurrences =
        fileContent.split(targetContent).length - 1;

      if (occurrences !== 1) {
        return {
          success: false,
          modified: false,
          error:
            `Target content occurs ${occurrences} times. ` +
            "Refusing ambiguous replacement.",
        };
      }

      const updated =
        fileContent.replace(
          targetContent,
          replacementContent,
        );

      await fs.promises.writeFile(
        resolvedFile,
        updated,
        "utf8",
      );

      return {
        success: true,
        modified: true,
        diff:
          `@@ ${relative} @@\n` +
          `- ${targetContent.slice(0, 500)}\n` +
          `+ ${replacementContent.slice(0, 500)}`,
      };
    } catch (error) {
      return {
        success: false,
        modified: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      };
    }
  }
}
