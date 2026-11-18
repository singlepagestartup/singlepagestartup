import { createHash } from "node:crypto";

export function overlayServices<T extends object>(
  services: T,
  replacements: Partial<T>,
): T {
  return Object.create(Object.getPrototypeOf(services), {
    ...Object.getOwnPropertyDescriptors(services),
    ...Object.getOwnPropertyDescriptors(replacements),
  });
}

export function normalizeContent(content: string) {
  return content.replace(/\r\n?/g, "\n").trim();
}

export function hashContent(content: string) {
  return createHash("sha256").update(normalizeContent(content)).digest("hex");
}

export {
  readKnowledgeUserContext as readUserContext,
  assembleKnowledgeContent as assembleContent,
} from "@sps/shared-utils";
