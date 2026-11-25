import { constants } from "node:fs";
import { link, mkdir, open, realpath, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

export class PrivateDirectory {
  private async location(id: string) {
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) {
      throw new Error("Validation error. Invalid protected file id");
    }
    const folder =
      process.env.FILE_STORAGE_PRIVATE_DIRECTORY ??
      path.join(
        homedir(),
        ".local",
        "share",
        "singlepagestartup",
        "private-files",
      );
    if (
      !path.isAbsolute(folder) ||
      path.normalize(folder).split(path.sep).includes("public")
    ) {
      throw new Error(
        "Configuration error. Choose an absolute private directory outside public storage",
      );
    }
    await mkdir(folder, { recursive: true, mode: 0o700 });
    const root = await realpath(folder);
    if (root.split(path.sep).includes("public")) {
      throw new Error(
        "Configuration error. Private storage resolves inside public storage",
      );
    }
    return path.join(root, id);
  }

  async read(id: string, digest: string, size: number) {
    const file = await open(
      await this.location(id),
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    try {
      const stat = await file.stat();
      if (!stat.isFile() || stat.size !== size) {
        throw new Error(
          "Conflict error. Protected file size differs from its metadata",
        );
      }
      const bytes = await file.readFile();
      if (createHash("sha256").update(bytes).digest("hex") !== digest) {
        throw new Error(
          "Conflict error. Protected file checksum differs from its metadata",
        );
      }
      return bytes;
    } finally {
      await file.close();
    }
  }

  async write(id: string, bytes: Buffer, digest: string) {
    const destination = await this.location(id);
    const temporary = destination + "." + randomUUID();
    const file = await open(temporary, "wx", 0o600);
    try {
      try {
        await file.writeFile(bytes);
        await file.sync();
      } finally {
        await file.close();
      }
      try {
        await link(temporary, destination);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
          throw error;
        }
        // Retry a migration interrupted between the durable write and metadata insert.
        await this.read(id, digest, bytes.length);
      }
    } finally {
      await unlink(temporary);
    }
    // Persist the directory entry before PostgreSQL can commit metadata pointing to it.
    const folder = await open(path.dirname(destination), constants.O_RDONLY);
    try {
      await folder.sync();
    } finally {
      await folder.close();
    }
  }

  async remove(id: string) {
    await unlink(await this.location(id));
  }
}
