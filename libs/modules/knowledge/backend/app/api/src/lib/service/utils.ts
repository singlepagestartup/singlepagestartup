import { createHash } from "node:crypto";

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
