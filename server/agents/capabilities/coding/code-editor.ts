import * as fs from 'fs';
import * as path from 'path';

export class CodeEditor {
  public static async applyEdits(filePath: string, targetContent: string, replacementContent: string): Promise<{
    success: boolean;
    modified: boolean;
    diff?: string;
  }> {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, modified: false };
    }

    const fileContent = await fs.promises.readFile(resolvedPath, 'utf-8');
    if (!fileContent.includes(targetContent)) {
      return { success: false, modified: false };
    }

    const updated = fileContent.replace(targetContent, replacementContent);
    await fs.promises.writeFile(resolvedPath, updated, 'utf-8');

    return {
      success: true,
      modified: true,
      diff: `@@ edited ${filePath} @@\n- ${targetContent.slice(0, 100)}\n+ ${replacementContent.slice(0, 100)}`
    };
  }
}
