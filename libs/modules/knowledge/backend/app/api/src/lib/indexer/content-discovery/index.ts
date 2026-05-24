import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { KnowledgeSourceInput } from "../../types";

export const SUPPORTED_CONTENT_FILE_NAMES = new Set([
  "content.txt",
  "content.md",
  "transcript.txt",
  "transcript.md",
  "transcription.txt",
  "transcription.md",
]);

export interface DiscoverContentFilesProps {
  rootPath: string;
  limit?: number;
}

export async function discoverContentFiles(props: DiscoverContentFilesProps) {
  const files: string[] = [];
  await walk(props.rootPath, files, props.limit);
  return files;
}

export async function readKnowledgeSourceFile(props: {
  rootPath: string;
  filePath: string;
}): Promise<KnowledgeSourceInput> {
  const content = await fs.readFile(props.filePath, "utf-8");
  return parseKnowledgeSourceFile({
    rootPath: props.rootPath,
    filePath: props.filePath,
    content,
  });
}

export function parseKnowledgeSourceFile(props: {
  rootPath: string;
  filePath: string;
  content: string;
}): KnowledgeSourceInput {
  const relativePath = path.relative(props.rootPath, props.filePath);
  const filename = path.basename(props.filePath);
  const directoryName = path.basename(path.dirname(props.filePath));
  const title = extractTitle(props.content) || humanize(directoryName);
  const type = inferSourceType(relativePath, filename);
  const timestamps = extractTimestamps(props.content);
  const normalizedContent = props.content.trim();

  return {
    title,
    type,
    content: normalizedContent,
    description: filename.includes("description") ? normalizedContent : null,
    originalPath: relativePath,
    contentHash: hashContent(normalizedContent),
    metadata: {
      filename,
      directoryName,
      relativePath,
      absolutePath: props.filePath,
      hasTimestamps: timestamps.length > 0,
      timestamps: timestamps.slice(0, 50),
    },
  };
}

function extractTitle(content: string) {
  const markdownTitle = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (markdownTitle) {
    return markdownTitle;
  }

  const firstMeaningfulLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !/^\d{1,2}:\d{2}/.test(line));

  return firstMeaningfulLine?.slice(0, 120);
}

function inferSourceType(relativePath: string, filename: string) {
  if (
    filename.startsWith("transcript.") ||
    filename.startsWith("transcription.")
  ) {
    return "transcript";
  }

  if (
    relativePath.includes("/podcast/") ||
    relativePath.startsWith("podcast/")
  ) {
    return "podcast";
  }

  if (relativePath.includes("/video/") || relativePath.startsWith("video/")) {
    return "video";
  }

  if (filename.endsWith(".md")) {
    return "article";
  }

  return "document";
}

function extractTimestamps(content: string) {
  return Array.from(content.matchAll(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g)).map(
    (match) => match[0],
  );
}

function humanize(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

async function walk(rootPath: string, files: string[], limit?: number) {
  if (typeof limit === "number" && files.length >= limit) {
    return;
  }

  const entries = await fs.readdir(rootPath, { withFileTypes: true });

  for (const entry of entries) {
    if (typeof limit === "number" && files.length >= limit) {
      break;
    }

    const entryPath = path.join(rootPath, entry.name);

    if (entry.isDirectory()) {
      await walk(entryPath, files, limit);
      continue;
    }

    if (entry.isFile() && SUPPORTED_CONTENT_FILE_NAMES.has(entry.name)) {
      files.push(entryPath);
    }
  }
}
