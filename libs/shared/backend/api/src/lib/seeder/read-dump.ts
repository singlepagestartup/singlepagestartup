import fs from "fs/promises";
import { join } from "node:path";

export async function readDump<T>(directory: string): Promise<T[]> {
  const rows: T[] = [];
  const files = await fs.readdir(directory);
  for (const file of files) {
    if (file.endsWith(".json")) {
      const content = await fs.readFile(join(directory, file), {
        encoding: "utf-8",
      });
      rows.push(JSON.parse(content));
    }
  }
  return rows;
}
