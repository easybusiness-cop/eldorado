import * as fs from 'fs';
import * as path from 'path';

export class RepositoryInspector {
  public static async inspectFileStructure(rootDir: string = '.'): Promise<{
    files: string[];
    directories: string[];
    packageJson: any | null;
  }> {
    const files: string[] = [];
    const directories: string[] = [];
    let packageJson: any = null;

    try {
      const walk = async (dir: string) => {
        const list = await fs.promises.readdir(dir);
        for (const file of list) {
          if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.next') {
            continue;
          }
          const fullPath = path.join(dir, file);
          const stat = await fs.promises.stat(fullPath);
          if (stat.isDirectory()) {
            directories.push(fullPath);
            await walk(fullPath);
          } else {
            files.push(fullPath);
            if (file === 'package.json') {
              const pkgContent = await fs.promises.readFile(fullPath, 'utf-8');
              packageJson = JSON.parse(pkgContent);
            }
          }
        }
      };
      await walk(rootDir);
    } catch {
      // Fallback
    }

    return { files, directories, packageJson };
  }
}
