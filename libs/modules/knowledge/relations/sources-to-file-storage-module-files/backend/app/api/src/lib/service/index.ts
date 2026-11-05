import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/repository/database";
import type { Repository } from "../repository";
import type { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import { assertKnowledgeAttachmentBytes } from "@sps/backend-utils";
type Relation = typeof Table.$inferSelect;
export interface IFileRelationMutation {
  action: "create" | "update" | "delete";
  id?: string;
  data?: Partial<typeof Table.$inferInsert>;
}
export interface IFileRelationServices {
  inTransaction: boolean;
  fileStorageFile: FileStorageFileService;
  mutate: (props: IFileRelationMutation) => Promise<Relation | null>;
}
@injectable()
export class Service extends CRUDService<Relation> {
  private services?: IFileRelationServices;
  configure(services: IFileRelationServices) {
    this.services = services;
  }
  async create(props: { data: any }): Promise<Relation> {
    if (!this.services)
      throw new Error("Knowledge file relation services are not configured.");
    if (this.services.inTransaction) return super.create(props);
    return (await this.services.mutate({
      action: "create",
      data: props.data,
    }))!;
  }
  async update(props: { id: string; data: any }): Promise<Relation | null> {
    if (!this.services)
      throw new Error("Knowledge file relation services are not configured.");
    if (this.services.inTransaction) return super.update(props);
    return this.services.mutate({ action: "update", ...props });
  }
  async delete(props: { id: string }): Promise<Relation> {
    if (!this.services)
      throw new Error("Knowledge file relation services are not configured.");
    if (this.services.inTransaction) return super.delete(props);
    return (await this.services.mutate({ action: "delete", ...props }))!;
  }
  async findOrCreate(props: { data: any }) {
    const existing = await this.find({
      params: {
        filters: {
          and: [
            { column: "sourceId", method: "eq", value: props.data.sourceId },
            {
              column: "fileStorageModuleFileId",
              method: "eq",
              value: props.data.fileStorageModuleFileId,
            },
          ],
        },
      },
    });
    if (existing.length)
      return { entity: existing[0], statusCode: 200 as const };
    return { entity: await this.create(props), statusCode: 201 as const };
  }
  lockById(id: string) {
    return (this.repository as Repository).lockById(id);
  }
  async forSource(sourceId: string) {
    const links = await this.find({
      params: {
        filters: {
          and: [{ column: "sourceId", method: "eq", value: sourceId }],
        },
      },
    });
    return links.sort(
      (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
    );
  }
  async fileSourceIds(fileId: string) {
    const links = await this.find({
      params: {
        filters: {
          and: [
            { column: "fileStorageModuleFileId", method: "eq", value: fileId },
          ],
        },
      },
    });
    return [...new Set(links.map((link) => link.sourceId))];
  }
  async sourceFiles(sourceId: string) {
    const links = await this.forSource(sourceId);
    if (!links.length) return [];
    if (!this.services)
      throw new Error("Knowledge file relation services are not configured.");
    const files = await this.services.fileStorageFile.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: links.map((link) => link.fileStorageModuleFileId),
            },
          ],
        },
      },
    });
    const safeFiles: typeof files = [];
    for (const file of files) {
      try {
        assertKnowledgeAttachmentBytes({
          bytes: new Uint8Array(),
          name: file.extension ? "file." + file.extension : file.file,
          mimeType: file.mimeType || undefined,
        });
        assertKnowledgeAttachmentBytes({
          bytes: await this.services!.fileStorageFile.readBytes(file),
          name: file.file,
          mimeType: file.mimeType || undefined,
        });
        safeFiles.push(file);
      } catch (error) {
        // A read projection blocks inline use; the stored original is untouched.
        safeFiles.push({
          ...file,
          mimeType:
            error instanceof Error && /SVG/.test(error.message)
              ? "image/svg+xml"
              : "application/x-knowledge-unavailable",
        });
      }
    }
    const byId = new Map(safeFiles.map((file) => [file.id, file]));
    return links.flatMap((relation) => {
      const file = byId.get(relation.fileStorageModuleFileId);
      return file ? [{ relation, file }] : [];
    });
  }
  async append(sourceId: string, fileIds: string[]) {
    const existing = await this.forSource(sourceId);
    const attached = new Set(
      existing.map((link) => link.fileStorageModuleFileId),
    );
    let orderIndex =
      Math.max(-1, ...existing.map((link) => link.orderIndex)) + 1;
    let changed = false;
    for (const id of [...new Set(fileIds)]) {
      if (attached.has(id)) continue;
      await this.create({
        data: {
          sourceId,
          fileStorageModuleFileId: id,
          orderIndex: orderIndex++,
        },
      });
      changed = true;
    }
    return changed;
  }
  async replace(
    sourceId: string,
    fileIds: string[],
    expectedFileIds?: string[],
  ) {
    const existing = await this.forSource(sourceId);
    if (
      expectedFileIds &&
      JSON.stringify(existing.map((link) => link.fileStorageModuleFileId)) !==
        JSON.stringify(expectedFileIds)
    )
      throw new Error(
        "Conflict error. Knowledge attachments changed. Refresh and retry the operation.",
      );
    const ids = [...new Set(fileIds)];
    for (const link of existing)
      if (!ids.includes(link.fileStorageModuleFileId))
        await this.delete({ id: link.id });
    for (const [orderIndex, fileStorageModuleFileId] of ids.entries()) {
      const link = existing.find(
        (item) => item.fileStorageModuleFileId === fileStorageModuleFileId,
      );
      if (link)
        await this.update({ id: link.id, data: { ...link, orderIndex } });
      else
        await this.create({
          data: { sourceId, fileStorageModuleFileId, orderIndex },
        });
    }
  }
}
