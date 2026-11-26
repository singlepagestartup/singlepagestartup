import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  getHttpErrorType,
  logger,
  assertKnowledgeAttachmentBytes,
} from "@sps/backend-utils";
import { Service as KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import {
  RBAC_SECRET_KEY,
  assertSupportedAiChatAttachments,
} from "@sps/shared-utils";

export class Handler {
  async execute(c: Context): Promise<Response> {
    try {
      const sourceId = c.req.param("knowledgeModuleSourceId");
      if (!sourceId)
        throw new Error("Validation error. Knowledge Source is required.");
      const knowledge = new KnowledgeService();
      const source = knowledge.source;
      if (c.req.method === "GET") {
        const fileId = c.req.query("image");
        if (fileId) {
          const file = await source.readPrivateMaterial(sourceId, fileId);
          return new Response(Uint8Array.from(file.bytes), {
            headers: {
              "Content-Type": file.mimeType,
              "Content-Disposition": "attachment",
              "Cache-Control": "private, no-store",
              "Content-Length": String(file.bytes.length),
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
        const files = await source.sourceFiles(sourceId);

        return c.json({ data: files });
      }
      const body = await c.req.formData();
      const removeFileId = body.get("removeFileId");
      const replaceFileId = body.get("replaceFileId");
      const expectedContentHash = body.get("expectedContentHash");
      if (
        expectedContentHash !== null &&
        typeof expectedContentHash !== "string"
      )
        throw new Error(
          "Validation error. Expected Source content hash must be a string.",
        );
      const current = await source.sourceFiles(sourceId);
      for (const id of [removeFileId, replaceFileId]) {
        if (id && !current.some((item) => item.file.id === id))
          throw new Error(
            "Validation error. File is not attached to this Source.",
          );
      }
      const uploadedIds: string[] = [];
      const uploads = body
        .getAll("files")
        .filter((value) => typeof value !== "string");
      try {
        assertSupportedAiChatAttachments(uploads);
        for (const file of uploads)
          assertKnowledgeAttachmentBytes({
            bytes: new Uint8Array(await file.arrayBuffer()),
            name: file.name,
            mimeType: file.type,
          });
      } catch (error) {
        throw new Error(
          `Validation error. ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      if (removeFileId && (replaceFileId || uploads.length))
        throw new Error(
          "Validation error. Remove a file separately from an upload or replacement.",
        );
      if (replaceFileId && !uploads.length)
        throw new Error("Validation error. Select a replacement file.");
      if (!uploads.length && !removeFileId && body.get("reanalyze") !== "true")
        throw new Error("Validation error. Select files to attach.");
      try {
        for (const file of uploads) {
          const saved = await fileStorageFileApi.create({
            data: {
              adminTitle: file.name,
              alt: file.name,
              file: new File(
                [Buffer.from(await file.arrayBuffer())],
                file.name,
                {
                  type: file.type,
                  lastModified: file.lastModified,
                },
              ),
            },
            options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY! } },
          });
          uploadedIds.push(saved.id);
        }
        const ids = current.flatMap(({ file }) => {
          if (file.id === removeFileId) {
            return [];
          }
          if (file.id === replaceFileId) {
            return uploadedIds;
          }
          return [file.id];
        });
        if (!replaceFileId) {
          ids.push(...uploadedIds);
        }
        const data = await source.withTransaction(async (scope) => {
          await scope.setFiles(
            sourceId,
            ids,
            current.map(({ file }) => file.id),
            expectedContentHash || undefined,
          );
          const saved = await knowledge.rebuildFiles(sourceId, scope);
          const files = await scope.sourceFiles(sourceId);
          return { source: saved, files };
        });
        return c.json({ data });
      } catch (error) {
        for (const id of uploadedIds) {
          try {
            await fileStorageFileApi.delete({
              id,
              options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY! } },
            });
          } catch {
            logger.error("Failed to discard unattached Knowledge upload", {
              id,
            });
          }
        }
        throw error;
      }
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
