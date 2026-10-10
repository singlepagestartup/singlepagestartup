import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { KnowledgeRepository } from "@sps/knowledge/backend/app/api/src/lib/repository";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { api as fileApi } from "@sps/file-storage/models/file/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export class Handler {
  async execute(c: Context): Promise<Response> {
    try {
      const sourceId = c.req.param("knowledgeModuleSourceId");
      if (!sourceId) throw new Error("Knowledge Source is required.");
      const repository = new KnowledgeRepository();
      if (c.req.method === "GET")
        return c.json({ data: await repository.sourceFiles(sourceId) });
      const body = await c.req.formData();
      const removeFileId = body.get("removeFileId");
      const replaceFileId = body.get("replaceFileId");
      const current = await repository.sourceFiles(sourceId);
      for (const id of [removeFileId, replaceFileId]) {
        if (id && !current.some((item) => item.file.id === id))
          throw new Error("File is not attached to this Source.");
      }
      const uploadedIds: string[] = [];
      const uploads = body
        .getAll("files")
        .filter((value): value is File => value instanceof File);
      if (replaceFileId && !uploads.length)
        throw new Error("Select a replacement file.");
      if (!uploads.length && !removeFileId && body.get("reanalyze") !== "true")
        throw new Error("Select files to attach.");
      for (const file of uploads) {
        const saved = await fileApi.create({
          data: { adminTitle: file.name, alt: file.name, file },
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
      await repository.setFiles(
        sourceId,
        ids,
        current.map(({ file }) => file.id),
      );
      let processingError: string | undefined;
      try {
        await new KnowledgeService().rebuildFiles(sourceId);
      } catch (error) {
        processingError =
          error instanceof Error ? error.message : String(error);
      }
      return c.json({
        data: {
          files: await repository.sourceFiles(sourceId),
          source: await repository.findSourceById(sourceId),
          processingError,
        },
      });
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
