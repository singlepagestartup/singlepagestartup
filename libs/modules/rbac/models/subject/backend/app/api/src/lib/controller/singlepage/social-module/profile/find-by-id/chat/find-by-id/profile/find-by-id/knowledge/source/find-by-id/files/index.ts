import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import {
  getHttpErrorType,
  logger,
  assertKnowledgeAttachmentBytes,
} from "@sps/backend-utils";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import {
  RBAC_SECRET_KEY,
  assertSupportedAiChatAttachments,
} from "@sps/shared-utils";

export class Handler {
  async execute(c: Context): Promise<Response> {
    try {
      const sourceId = c.req.param("knowledgeModuleSourceId");
      if (!sourceId) throw new Error("Knowledge Source is required.");
      const knowledge = new KnowledgeService();
      const source = knowledge.source;
      if (c.req.method === "GET")
        return c.json({ data: await source.sourceFiles(sourceId) });
      const body = await c.req.formData();
      const removeFileId = body.get("removeFileId");
      const replaceFileId = body.get("replaceFileId");
      const expectedContentHash = body.get("expectedContentHash");
      if (
        expectedContentHash !== null &&
        typeof expectedContentHash !== "string"
      )
        throw new Error("Expected Source content hash must be a string.");
      const current = await source.sourceFiles(sourceId);
      for (const id of [removeFileId, replaceFileId]) {
        if (id && !current.some((item) => item.file.id === id))
          throw new Error("File is not attached to this Source.");
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
          "Remove a file separately from an upload or replacement.",
        );
      if (replaceFileId && !uploads.length)
        throw new Error("Select a replacement file.");
      if (!uploads.length && !removeFileId && body.get("reanalyze") !== "true")
        throw new Error("Select files to attach.");
      for (const file of uploads) {
        const saved = await fileStorageFileApi.create({
          data: {
            adminTitle: file.name,
            alt: file.name,
            file: new File([Buffer.from(await file.arrayBuffer())], file.name, {
              type: file.type,
              lastModified: file.lastModified,
            }),
          },
          options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY! } },
        });
        uploadedIds.push(saved.id);
      }
      const ids = current.flatMap(({ file }) => {
        if (file.id === removeFileId) return [];
        if (file.id === replaceFileId) return uploadedIds;
        return [file.id];
      });
      if (!replaceFileId) ids.push(...uploadedIds);
      await source.setFiles(
        sourceId,
        ids,
        current.map(({ file }) => file.id),
        expectedContentHash || undefined,
      );
      let processingError: string | undefined;
      const detached = Boolean(removeFileId);
      if (detached) {
        // The internal request retains normal cache invalidation and WebSocket
        // notification when analysis finishes, after this unlink has returned.
        void subjectApi
          .socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate(
            {
              id: c.req.param("id")!,
              socialModuleProfileId: c.req.param("socialModuleProfileId")!,
              socialModuleChatId: c.req.param("socialModuleChatId")!,
              targetSocialModuleProfileId: c.req.param(
                "targetSocialModuleProfileId",
              )!,
              knowledgeModuleSourceId: sourceId,
              data: { reanalyze: true },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY!,
                  "Cache-Control": "no-store",
                },
              },
            },
          )
          .then((result) => {
            if (result.processingError)
              logger.error(
                new Error(
                  `Knowledge attachment rebuild failed for ${sourceId}: ${result.processingError}`,
                ),
              );
          })
          .catch((error) => logger.error(error));
      } else {
        try {
          await knowledge.rebuildFiles(sourceId);
        } catch (error) {
          processingError =
            error instanceof Error ? error.message : String(error);
        }
      }
      const savedSource = await source.findSourceById(sourceId);
      return c.json({
        data: {
          files: await source.sourceFiles(sourceId),
          source: savedSource,
          processingError,
          analysisPending:
            detached &&
            Boolean(
              savedSource &&
                savedSource.contentHash !== savedSource.indexedContentHash,
            ),
        },
      });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
