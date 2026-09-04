import { spawn } from "node:child_process";
import fs from "node:fs/promises";

export class RepositoryCloner {
  async clone(url: string, destination: string) {
    await fs.mkdir(destination, {
      recursive: true,
    });

    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        "git",
        ["clone", "--depth", "1", url, destination],
        {
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      let stderr = "";

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Git clone failed: ${stderr}`));
        }
      });
    });
  }
}
