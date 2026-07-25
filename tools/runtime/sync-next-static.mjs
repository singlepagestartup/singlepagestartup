import { cp, mkdir, readdir, rm, stat, utimes } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function directoryExists(directory) {
  try {
    return (await stat(directory)).isDirectory();
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function listFiles(directory, relativeDirectory = "") {
  const absoluteDirectory = path.join(directory, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(directory, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

async function removeEmptyDirectories(directory, rootDirectory = directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await removeEmptyDirectories(
        path.join(directory, entry.name),
        rootDirectory,
      );
    }
  }

  if (directory !== rootDirectory) {
    const remainingEntries = await readdir(directory);

    if (remainingEntries.length === 0) {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

export async function syncNextStatic({
  bundledDirectory,
  sharedDirectory,
  retentionDays = 30,
  now = Date.now(),
  logger = console,
}) {
  if (!Number.isInteger(retentionDays) || retentionDays < 0) {
    throw new Error(
      `NEXT_STATIC_RETENTION_DAYS must be a non-negative integer, received: ${retentionDays}`,
    );
  }

  if (!(await directoryExists(bundledDirectory))) {
    logger.info(
      `[next-static] Bundled directory does not exist, skipping: ${bundledDirectory}`,
    );

    return { copied: 0, removed: 0, skipped: true };
  }

  await mkdir(sharedDirectory, { recursive: true });

  const bundledFiles = await listFiles(bundledDirectory);
  const currentFiles = new Set(bundledFiles);

  await cp(bundledDirectory, sharedDirectory, {
    recursive: true,
    force: true,
    preserveTimestamps: false,
  });

  const currentDate = new Date(now);

  await Promise.all(
    bundledFiles.map((relativePath) =>
      utimes(
        path.join(sharedDirectory, relativePath),
        currentDate,
        currentDate,
      ),
    ),
  );

  let removed = 0;

  if (retentionDays > 0) {
    const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
    const sharedFiles = await listFiles(sharedDirectory);

    for (const relativePath of sharedFiles) {
      if (currentFiles.has(relativePath)) {
        continue;
      }

      const absolutePath = path.join(sharedDirectory, relativePath);
      const fileStats = await stat(absolutePath);

      if (fileStats.mtimeMs < cutoff) {
        await rm(absolutePath, { force: true });
        removed += 1;
      }
    }

    await removeEmptyDirectories(sharedDirectory);
  }

  logger.info(
    `[next-static] Synced ${bundledFiles.length} current files and removed ${removed} expired files.`,
  );

  return {
    copied: bundledFiles.length,
    removed,
    skipped: false,
  };
}

async function main() {
  const applicationRoot =
    process.env.HOST_APPLICATION_ROOT ||
    path.resolve(process.cwd(), "apps/host");
  const retentionDays = Number.parseInt(
    process.env.NEXT_STATIC_RETENTION_DAYS || "30",
    10,
  );

  await syncNextStatic({
    bundledDirectory: path.join(applicationRoot, ".next-static-release"),
    sharedDirectory: path.join(applicationRoot, ".next", "static"),
    retentionDays,
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error("[next-static] Synchronization failed.", error);
    process.exitCode = 1;
  });
}
