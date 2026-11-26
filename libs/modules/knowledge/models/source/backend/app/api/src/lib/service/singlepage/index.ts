import { createModule } from "../module";
import { createModules } from "@sps/knowledge/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { assertKnowledgeAttachmentBytes } from "@sps/backend-utils";
import { Table } from "@sps/knowledge/models/source/backend/repository/database";
import {
  AI_CHAT_ATTACHMENT_FORMATS,
  assertSupportedAiChatAttachments,
} from "@sps/shared-utils";
import type { Repository } from "../../repository";
import type { Service as ChunkService } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/service";
import type { IFileRelationMutation } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/service";
import {
  hashContent,
  readUserContext,
} from "@sps/knowledge/backend/app/api/src/lib/service/utils";
import type {
  KnowledgeChunkInput,
  KnowledgeSourceInput,
  KnowledgeSearchResult,
} from "@sps/knowledge/backend/app/api/src/lib/types";

type Source = typeof Table.$inferSelect;
export interface IUpdateSourceProps {
  sourceId: string;
  content?: string;
  data?: Partial<Source>;
  title?: string;
  description?: string | null;
  expectedContentHash?: string;
  fileIds?: string[];
}
export interface ISourceServices {
  inTransaction: boolean;
  transaction: <T>(operation: (source: Service) => Promise<T>) => Promise<T>;
  readSnapshot: <T>(operation: (source: Service) => Promise<T>) => Promise<T>;
  rebuildStoredFileSource: (sourceId: string) => Promise<void>;
}

@injectable()
@injectFromBase()
export class Service extends CRUDService<Source> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  private services?: ISourceServices;
  configure(services: ISourceServices) {
    this.services = services;
  }
  private dependencies() {
    if (!this.services)
      throw new Error(
        "Configuration error. Knowledge Source services are not configured.",
      );
    return this.services;
  }
  private owner() {
    return this.repository as Repository;
  }
  withTransaction<T>(operation: (source: Service) => Promise<T>) {
    const services = this.dependencies();
    return services.inTransaction
      ? operation(this)
      : services.transaction(operation);
  }
  private async saveRecord(props: { id?: string; data: any }) {
    let source;
    if (props.id) {
      source = await super.update({ id: props.id, data: props.data });
    } else {
      source = await super.create({ data: props.data });
    }
    return source;
  }
  async create(props: { data: any }): Promise<Source> {
    return this.withTransaction(async (scope) => {
      const source = (await scope.saveRecord({
        data: {
          ...props.data,
          contentHash: hashContent(props.data.content || ""),
          indexedContentHash: null,
          lastIndexedAt: null,
        },
      }))!;
      return source;
    });
  }
  async findOrCreate(props: { data: any }) {
    return this.withTransaction(async (scope) => {
      await scope.owner().lockSlug(props.data.slug);
      const [existing] = await scope.find({
        params: {
          filters: {
            and: [{ column: "slug", method: "eq", value: props.data.slug }],
          },
        },
      });
      if (existing) return { entity: existing, statusCode: 200 as const };
      const entity = await scope.create(props);

      return { entity, statusCode: 201 as const };
    });
  }
  async update(props: { id: string; data: any }): Promise<Source | null> {
    return this.updateSource({ sourceId: props.id, data: props.data });
  }
  async delete(props: { id: string }): Promise<Source> {
    const source = await this.deleteSourceWithDerivedData(props.id);
    if (!source)
      throw new Error("Not Found error. Knowledge Source was not found.");
    return source;
  }
  findSourceById(id: string) {
    return this.findById({ id });
  }
  lock(ids: string[]) {
    return this.owner().lock(ids);
  }
  async findSourcesByIds(ids: string[]) {
    if (!ids.length) return [];
    return this.find({
      params: {
        filters: { and: [{ column: "id", method: "inArray", value: ids }] },
      },
    });
  }
  listSourcesForIndex(props?: {
    sourceId?: string;
    limit?: number;
    afterId?: string;
  }) {
    return this.find({
      params: {
        filters: {
          and: [
            { column: "variant", method: "ne", value: "customer-memory" },
            ...(props?.sourceId
              ? [{ column: "id", method: "eq" as const, value: props.sourceId }]
              : []),
            ...(props?.afterId
              ? [{ column: "id", method: "gt" as const, value: props.afterId }]
              : []),
          ],
        },
        limit: props?.limit,
        orderBy: { and: [{ column: "id", method: "asc" }] },
      },
    });
  }
  async getStatus() {
    const sourceCount = await this.count();
    const chunkCount = await this.module.chunk.count();

    return {
      sources: sourceCount,
      chunks: chunkCount,
    };
  }
  async upsertSourceBySlug(
    input: KnowledgeSourceInput,
    preserveExisting = false,
  ): Promise<Source> {
    return this.withTransaction(async (scope) => {
      await scope.owner().lockSlug(input.slug);
      const [existing] = await scope.find({
        params: {
          filters: {
            and: [{ column: "slug", method: "eq", value: input.slug }],
          },
        },
      });
      if (existing && preserveExisting) return existing;
      const source = (await scope.saveRecord({
        id: existing?.id,
        data: {
          ...existing,
          ...input,
          adminTitle: input.title,
          contentHash: hashContent(input.content),
          ...(!existing
            ? { indexedContentHash: null, lastIndexedAt: null }
            : {}),
        },
      }))!;
      return source;
    });
  }
  private async lockFiles(
    fileIds: string[],
    mode: "key share" | "update" = "key share",
    validate = true,
  ) {
    const ids = [...new Set(fileIds)];
    const files = await this.modules.fileStorage.file.lock(ids, mode);
    if (files.length !== ids.length) {
      const found = new Set(files.map((file) => file.id));
      throw Object.assign(new Error("Stored file was not found."), {
        code: "KNOWLEDGE_FILES_NOT_FOUND" as const,
        fileIds: ids.filter((id) => !found.has(id)),
      });
    }
    if (validate)
      for (const file of files) {
        assertKnowledgeAttachmentBytes({
          bytes: new Uint8Array(),
          name: file.extension ? "file." + file.extension : file.adminTitle,
          mimeType: file.mimeType || undefined,
        });
        assertKnowledgeAttachmentBytes({
          bytes: await this.modules.fileStorage.file.readBytes(file),
          name: file.file || file.adminTitle,
          mimeType: file.mimeType || undefined,
        });
      }
    return files;
  }
  async validateAttachments(fileIds: string[]) {
    const ids = [...new Set(fileIds)];
    if (!ids.length) return;
    const files = await this.modules.fileStorage.file.find({
      params: {
        filters: { and: [{ column: "id", method: "inArray", value: ids }] },
      },
    });
    if (files.length !== ids.length) {
      const found = new Set(files.map((file) => file.id));
      throw Object.assign(new Error("Stored file was not found."), {
        code: "KNOWLEDGE_FILES_NOT_FOUND" as const,
        fileIds: ids.filter((id) => !found.has(id)),
      });
    }
    for (const file of files) {
      assertKnowledgeAttachmentBytes({
        bytes: new Uint8Array(),
        name: file.extension ? "file." + file.extension : file.file,
        mimeType: file.mimeType || undefined,
      });
      assertKnowledgeAttachmentBytes({
        bytes: await this.modules.fileStorage.file.readBytes(file),
        name: file.file,
        mimeType: file.mimeType || undefined,
      });
    }
  }
  async updateSource(props: IUpdateSourceProps) {
    const update = await this.updateSourceWithAttachments(props);

    return update?.source || null;
  }
  async updateSourceWithAttachments(
    props: IUpdateSourceProps,
  ): Promise<{ source: Source; attachmentsChanged: boolean } | null> {
    return this.withTransaction(async (scope) => {
      await scope.lockFiles(props.fileIds || []);
      const [source] = await scope.owner().lock([props.sourceId]);
      if (!source)
        throw new Error(
          "Knowledge Source " + props.sourceId + " was not found.",
        );
      if (
        props.expectedContentHash !== undefined &&
        source.contentHash !== props.expectedContentHash
      )
        return null;
      const content = props.content ?? props.data?.content ?? source.content;
      const updated = (await scope.saveRecord({
        id: source.id,
        data: {
          ...source,
          ...props.data,
          id: source.id,
          content,
          contentHash: hashContent(content),
          indexedContentHash: source.indexedContentHash,
          lastIndexedAt: source.lastIndexedAt,
          ...(props.title !== undefined ? { title: props.title } : {}),
          ...(props.description !== undefined
            ? { description: props.description }
            : {}),
        },
      }))!;
      const attachmentsChanged =
        await scope.module.sourcesToFileStorageModuleFiles.append(
          source.id,
          props.fileIds || [],
        );
      if (attachmentsChanged) await scope.invalidateSources([updated]);
      const loadedSource = await scope.findById({ id: source.id });

      return {
        source: loadedSource!,
        attachmentsChanged,
      };
    });
  }
  async deleteSourceWithDerivedData(sourceId: string): Promise<Source | null> {
    return this.withTransaction(async (scope) => {
      const [source] = await scope.owner().lock([sourceId]);
      if (!source) return null;
      await scope.clearSourceChunks([sourceId]);
      for (const link of await scope.module.sourcesToFileStorageModuleFiles.forSource(
        sourceId,
      )) {
        await scope.module.sourcesToFileStorageModuleFiles.delete({
          id: link.id,
        });
        await scope.deleteOwnedMaterial(link);
      }
      const deleted = await scope.deleteRecord(sourceId);
      return deleted;
    });
  }
  private async deleteRecord(id: string) {
    const source = await super.delete({ id });
    return source;
  }
  private async clearSourceChunks(sourceIds: string[]) {
    const ids = await this.module.sourcesToChunks.unlinkSources(sourceIds);
    await this.module.chunk.removeIds(ids);
  }
  async clearDerivedData() {
    return this.withTransaction(async (scope) => {
      const candidates = await scope.find();
      const sources = await scope
        .owner()
        .lock(candidates.map((source) => source.id));
      await scope.clearSourceChunks(sources.map((source) => source.id));
      // Explicit clear also removes orphan chunks left by historical imports.
      for (const chunk of await scope.module.chunk.find())
        await scope.module.chunk.delete({ id: chunk.id });
      for (const source of sources)
        await scope.saveRecord({
          id: source.id,
          data: { ...source, indexedContentHash: null, lastIndexedAt: null },
        });
    });
  }
  async invalidateFileContent(
    sourceId: string,
    userContext: string,
    expectedContentHash: string,
  ): Promise<Source | null> {
    return this.withTransaction(async (scope) => {
      const [source] = await scope.owner().lock([sourceId]);
      if (!source || source.contentHash !== expectedContentHash) return null;
      await scope.clearSourceChunks([sourceId]);
      const saved = await scope.saveRecord({
        id: source.id,
        data: {
          ...source,
          content: userContext,
          contentHash: hashContent(userContext),
          description: null,
          indexedContentHash: null,
          lastIndexedAt: null,
        },
      });
      return saved;
    });
  }
  async publishChunks(
    sourceId: string,
    contentHash: string,
    chunks: KnowledgeChunkInput[],
  ): Promise<boolean> {
    return this.withTransaction(async (scope) => {
      const [source] = await scope.owner().lock([sourceId]);
      if (!source || source.contentHash !== contentHash) return false;
      await scope.clearSourceChunks([sourceId]);
      for (const input of chunks) {
        const chunk = await scope.module.chunk.create({
          data: input,
        });
        await scope.module.sourcesToChunks.create({
          data: { sourceId, chunkId: chunk.id, orderIndex: chunk.chunkIndex },
        });
      }
      await scope.saveRecord({
        id: sourceId,
        data: {
          ...source,
          indexedContentHash: contentHash,
          lastIndexedAt: new Date(),
        },
      });
      return true;
    });
  }
  async saveAnalyzedContent(props: {
    sourceId: string;
    expectedContentHash: string;
    fileSnapshot: string;
    content: string;
  }): Promise<Source | null> {
    return this.withTransaction(async (scope) => {
      const [source] = await scope.owner().lock([props.sourceId]);
      if (!source || source.contentHash !== props.expectedContentHash)
        return null;
      if (
        scope.fileSnapshot(await scope.sourceFiles(source.id)) !==
        props.fileSnapshot
      )
        return null;
      const saved = await scope.saveRecord({
        id: source.id,
        data: {
          ...source,
          content: props.content,
          contentHash: hashContent(props.content),
        },
      });
      return saved;
    });
  }
  readFileBytes(file: { file: string | null }) {
    return this.modules.fileStorage.file.readBytes(file);
  }
  sourceFiles(sourceId: string) {
    return this.module.sourcesToFileStorageModuleFiles.sourceFiles(sourceId);
  }
  private fileSnapshot(files: Awaited<ReturnType<Service["sourceFiles"]>>) {
    return JSON.stringify(
      files.map(({ relation, file }) => [
        relation.id,
        relation.fileStorageModuleFileId,
        relation.orderIndex,
        file.updatedAt,
      ]),
    );
  }
  private async invalidateSources(sources: Source[]) {
    for (const source of sources) {
      const content = readUserContext(source.content);
      await this.clearSourceChunks([source.id]);
      await this.saveRecord({
        id: source.id,
        data: {
          ...source,
          content,
          contentHash: hashContent(content),
          indexedContentHash: null,
          lastIndexedAt: null,
          description: null,
        },
      });
    }
  }
  async mutateFileRelation(props: IFileRelationMutation) {
    if (
      ["private-image", "private-material"].includes(props.data?.variant ?? "")
    ) {
      throw new Error(
        "Validation error. Attach private images from the authorized conversation.",
      );
    }
    return this.withTransaction(async (scope) => {
      const relationService = scope.module.sourcesToFileStorageModuleFiles;
      let previous;
      if (props.id) {
        previous = await relationService.findById({ id: props.id });
      } else {
        previous = null;
      }
      if (props.action !== "create" && !previous)
        throw new Error(
          "Not Found error. Knowledge file relation was not found.",
        );
      const ids = [
        previous?.fileStorageModuleFileId,
        props.data?.fileStorageModuleFileId,
      ].filter(Boolean) as string[];
      await scope.lockFiles(ids, "key share", props.action !== "delete");
      const sourceIds = [
        ...new Set([previous?.sourceId, props.data?.sourceId].filter(Boolean)),
      ] as string[];
      const sources = await scope.owner().lock(sourceIds);
      if (previous) {
        const current = await relationService.lockById(previous.id);
        if (
          !current ||
          current.sourceId !== previous.sourceId ||
          current.fileStorageModuleFileId !== previous.fileStorageModuleFileId
        )
          throw new Error(
            "Conflict error. Knowledge file relation changed. Retry the operation.",
          );
      }
      let relation;
      if (props.action === "create") {
        relation = await relationService.create({ data: props.data });
      } else if (props.action === "delete") {
        relation = await relationService.delete({ id: props.id! });
      } else {
        relation = await relationService.update({
          id: props.id!,
          data: { ...previous!, ...props.data },
        });
      }
      await scope.invalidateSources(sources);
      return { relation, sourceIds };
    });
  }
  async mutateStoredFile(props: {
    action: "update" | "delete";
    id: string;
    data?: any;
  }) {
    return this.withTransaction(async (scope) => {
      await scope.lockFiles([props.id], "update", false);
      const fileLinks = await scope.module.sourcesToFileStorageModuleFiles.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "fileStorageModuleFileId",
                  method: "eq",
                  value: props.id,
                },
              ],
            },
          },
        },
      );
      const sourceIds = [...new Set(fileLinks.map((link) => link.sourceId))];
      const sources = await scope.owner().lock(sourceIds);
      const fileService = scope.modules.fileStorage.file;
      const previous = await fileService.findById({ id: props.id });
      if (!previous)
        throw new Error("Not Found error. Stored file was not found.");
      if (props.action === "update" && sourceIds.length) {
        const next = { ...previous, ...props.data };
        assertKnowledgeAttachmentBytes({
          bytes: new Uint8Array(),
          name: next.extension ? "file." + next.extension : next.file,
          mimeType: next.mimeType || undefined,
        });
        assertKnowledgeAttachmentBytes({
          bytes: await fileService.readBytes(next),
          name: next.file || next.adminTitle,
          mimeType: next.mimeType || undefined,
        });
      }
      await scope.invalidateSources(sources);
      let file;
      if (props.action === "delete") {
        for (const link of fileLinks) {
          await scope.module.sourcesToFileStorageModuleFiles.delete({
            id: link.id,
          });
        }
      } else {
        file = await fileService.update({
          id: props.id,
          data: { ...previous, ...props.data },
        });
      }
      for (const id of sourceIds) {
        await scope.dependencies().rebuildStoredFileSource(id);
      }
      if (props.action === "delete") {
        // Delete stored bytes only after every affected index has been rebuilt.
        file = await fileService.delete({ id: props.id });
      }
      return { file, sourceIds };
    });
  }
  async attachFiles(sourceId: string, fileIds: string[]) {
    if (!fileIds.length) return;
    return this.withTransaction(async (scope) => {
      await scope.lockFiles(fileIds);
      const sources = await scope.owner().lock([sourceId]);
      if (!sources.length)
        throw new Error("Not Found error. Knowledge Source was not found.");
      if (
        await scope.module.sourcesToFileStorageModuleFiles.append(
          sourceId,
          fileIds,
        )
      ) {
        await scope.invalidateSources(sources);
      }
    });
  }
  // Called by the employee conversation after resolving the attachment in its authorized thread.
  async attachPrivateImage(
    sourceId: string,
    image: { id: string; digest: string },
  ) {
    return this.withTransaction(async (scope) => {
      const [source] = await scope.owner().lock([sourceId]);
      if (!source) {
        throw new Error("Not Found error. Knowledge Source was not found.");
      }
      const file =
        await scope.modules.fileStorage.file.privateContent.findById(image);
      if (
        !file ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.mimeType)
      ) {
        throw new Error("Validation error. The training image is unavailable.");
      }
      assertKnowledgeAttachmentBytes({
        name: file.name,
        mimeType: file.mimeType,
        bytes: file.bytes,
      });
      const relations = scope.module.sourcesToFileStorageModuleFiles;
      const links = await relations.forSource(sourceId);
      if (links.some((link) => link.fileStorageModuleFileId === image.id)) {
        return;
      }
      await relations.create({
        data: {
          sourceId,
          fileStorageModuleFileId: image.id,
          variant: "private-image",
          orderIndex: (links.at(-1)?.orderIndex ?? -1) + 1,
        },
      });
      await scope.invalidateSources([source]);
    });
  }

  async editMaterials(
    sourceId: string,
    uploads: File[],
    removeFileIds: string[],
  ) {
    const relations = this.module.sourcesToFileStorageModuleFiles;
    const current = await relations.forSource(sourceId);
    if (
      removeFileIds.some(
        (id) => !current.some((link) => link.fileStorageModuleFileId === id),
      )
    ) {
      throw new Error("Conflict error. The source attachments have changed.");
    }
    for (const link of current) {
      if (removeFileIds.includes(link.fileStorageModuleFileId)) {
        await relations.delete({ id: link.id });
        await this.deleteOwnedMaterial(link);
      }
    }
    assertSupportedAiChatAttachments(uploads);
    let orderIndex =
      Math.max(-1, ...current.map((link) => link.orderIndex)) + 1;
    for (const upload of uploads) {
      const extension = upload.name
        .split(".")
        .pop()!
        .toLowerCase() as keyof typeof AI_CHAT_ATTACHMENT_FORMATS;
      const mimeType = AI_CHAT_ATTACHMENT_FORMATS[extension][0];
      const bytes = new Uint8Array(await upload.arrayBuffer());
      assertKnowledgeAttachmentBytes({ bytes, name: upload.name, mimeType });
      const file =
        await this.modules.fileStorage.file.privateContent.writeKnowledgeMaterial(
          { bytes, name: upload.name, mimeType },
        );
      await relations.create({
        data: {
          sourceId,
          fileStorageModuleFileId: file.id,
          variant: "private-material",
          orderIndex,
        },
      });
      orderIndex++;
    }
  }

  private async deleteOwnedMaterial(link: {
    variant: string;
    fileStorageModuleFileId: string;
  }) {
    if (
      link.variant === "private-material" &&
      !(await this.fileSourceIds(link.fileStorageModuleFileId)).length
    ) {
      await this.modules.fileStorage.file.privateContent.delete({
        id: link.fileStorageModuleFileId,
        variant: "knowledge-material",
      });
    }
  }

  async readPrivateMaterial(sourceId: string, fileId: string) {
    const links =
      await this.module.sourcesToFileStorageModuleFiles.forSource(sourceId);
    const link = links.find((item) => item.fileStorageModuleFileId === fileId);
    if (
      !link ||
      !["private-image", "private-material"].includes(link.variant)
    ) {
      throw new Error("Not Found error. File is not attached to this source.");
    }
    const file = await this.modules.fileStorage.file.privateContent.findById({
      id: fileId,
      ...(link.variant === "private-material" && {
        variant: "knowledge-material",
      }),
    });
    if (
      !file ||
      (link.variant === "private-image" &&
        !["image/jpeg", "image/png", "image/webp"].includes(file.mimeType))
    ) {
      throw new Error("Not Found error. The attached file is unavailable.");
    }
    return file;
  }

  fileSourceIds(fileId: string) {
    return this.module.sourcesToFileStorageModuleFiles.fileSourceIds(fileId);
  }
  async setFiles(
    sourceId: string,
    fileIds: string[],
    expectedFileIds?: string[],
    expectedContentHash?: string,
  ) {
    return this.withTransaction(async (scope) => {
      const previous = await scope.sourceFiles(sourceId);
      // Legacy unsupported files can be detached; only newly attached bytes are validated.
      const existingIds = new Set(previous.map(({ file }) => file.id));
      const retainedPrivateIds = new Set(
        previous
          .filter(({ relation }) =>
            ["private-image", "private-material"].includes(relation.variant),
          )
          .map(({ file }) => file.id),
      );
      await scope.lockFiles(
        fileIds.filter((id) => !retainedPrivateIds.has(id)),
        "key share",
        false,
      );
      await scope.lockFiles(fileIds.filter((id) => !existingIds.has(id)));
      const sources = await scope.owner().lock([sourceId]);
      if (!sources.length)
        throw new Error("Not Found error. Knowledge Source was not found.");
      if (
        expectedContentHash !== undefined &&
        sources[0].contentHash !== expectedContentHash
      )
        throw new Error(
          "Conflict error. Knowledge Source changed. Refresh and retry the operation.",
        );
      await scope.module.sourcesToFileStorageModuleFiles.replace(
        sourceId,
        fileIds,
        expectedFileIds,
      );
      for (const { relation, file } of previous) {
        if (!fileIds.includes(file.id)) {
          await scope.deleteOwnedMaterial(relation);
        }
      }
      await scope.invalidateSources(sources);
    });
  }
  async ensureFileForSource(props: { sourceId: string; filePath: string }) {
    const slug = props.filePath
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180);
    const existing = (await this.sourceFiles(props.sourceId)).find(
      ({ file }) => file.slug === slug,
    );
    if (existing) return existing.file;
    const file = await this.modules.fileStorage.file.importPath({
      filePath: props.filePath,
      slug,
      validate: (bytes) =>
        assertKnowledgeAttachmentBytes({ bytes, name: props.filePath }),
    });
    await this.attachFiles(props.sourceId, [file.id]);
    return file;
  }
  freshHeaders(ids: string[], includeCustomerMemory = false) {
    return this.owner().freshHeaders(ids, includeCustomerMemory);
  }
  async hasEmbeddingIndex(
    sourceIds: string[],
    embeddingIndex?: string,
    includeCustomerMemory = false,
  ) {
    if (!sourceIds.length) {
      return false;
    }
    const headers = await this.freshHeaders(sourceIds, includeCustomerMemory);
    const links = await this.module.sourcesToChunks.forSources(
      headers.map((source) => source.id),
    );
    return this.module.chunk.hasEmbeddingIndex(
      links.map((link) => link.chunkId),
      embeddingIndex,
    );
  }

  async searchChunks(props: {
    embedding: number[];
    topK: number;
    minSimilarity?: number;
    sourceIds?: string[];
    embeddingIndex?: string;
    includeCustomerMemory?: boolean;
  }): Promise<KnowledgeSearchResult[]> {
    if (
      (props.includeCustomerMemory && !props.sourceIds) ||
      (props.embeddingIndex &&
        (props.embedding.length !== 768 ||
          props.embedding.some((value) => !Number.isFinite(value))))
    ) {
      throw new Error(
        "Validation error. A scoped query requires the index dimensions and source IDs",
      );
    }
    if (props.sourceIds && !props.sourceIds.length) {
      return [];
    }
    if (!this.dependencies().inTransaction) {
      return this.dependencies().readSnapshot((source) =>
        source.searchChunks(props),
      );
    }
    const collect = (
      chunks: Awaited<ReturnType<ChunkService["search"]>>,
      links: { sourceId: string; chunkId: string }[],
      sources: Awaited<ReturnType<Service["freshHeaders"]>>,
    ) => {
      const sourceById = new Map(sources.map((source) => [source.id, source]));
      const linkByChunk = new Map(links.map((link) => [link.chunkId, link]));
      return chunks.flatMap((chunk) => {
        const link = linkByChunk.get(chunk.id);
        const source = link && sourceById.get(link.sourceId);
        if (!source) {
          return [];
        }
        return [
          {
            ...chunk,
            sourceId: source.id,
            sourceTitle: source.title,
            sourceVersion: source.contentHash,
            retrievalRole: "seed" as const,
          },
        ];
      });
    };
    if (props.sourceIds) {
      const sources = await this.freshHeaders(
        props.sourceIds,
        props.includeCustomerMemory,
      );
      const links = await this.module.sourcesToChunks.forSources(
        sources.map((source) => source.id),
      );
      const chunks = await this.module.chunk.search({
        ...props,
        materialized: true,
        ids: links.map((link) => link.chunkId),
      });
      return collect(chunks, links, sources);
    }
    const total = await this.module.chunk.count();
    if (!total) {
      return [];
    }
    let limit = Math.min(total, Math.max(64, props.topK * 4));
    let result: KnowledgeSearchResult[];
    let needsMoreCandidates: boolean;
    const privateIds = await this.owner().privateSourceIds();
    const privateLinks = privateIds.length
      ? await this.module.sourcesToChunks.forSources(privateIds)
      : [];
    const excludeIds = privateLinks.map(({ chunkId }) => chunkId);
    do {
      // Keep the global vector scan HNSW-eligible and exclude personal chunks
      // before reading results. Source content is never loaded here.
      const chunks = await this.module.chunk.search({
        embedding: props.embedding,
        minSimilarity: props.minSimilarity,
        topK: limit,
        ...(props.embeddingIndex && { embeddingIndex: props.embeddingIndex }),
        ...(excludeIds.length && { excludeIds }),
      });
      const links = await this.module.sourcesToChunks.forChunkIds(
        chunks.map((chunk) => chunk.id),
      );
      const sources = await this.freshHeaders([
        ...new Set(links.map((link) => link.sourceId)),
      ]);
      result = collect(chunks, links, sources);
      needsMoreCandidates =
        result.length < props.topK && chunks.length >= limit && limit < total;
      if (needsMoreCandidates) {
        limit = Math.min(total, limit * 2);
      }
    } while (needsMoreCandidates);

    return result.slice(0, props.topK);
  }
  async findNeighborChunks(props: {
    seeds: {
      sourceId: string;
      sourceVersion?: string;
      chunkIndex: number;
      distance?: number | null;
      similarity?: number | null;
    }[];
    window: number;
    embeddingIndex?: string;
    includeCustomerMemory?: boolean;
  }): Promise<KnowledgeSearchResult[]> {
    if (!this.dependencies().inTransaction)
      return this.dependencies().readSnapshot((source) =>
        source.findNeighborChunks(props),
      );
    const result: KnowledgeSearchResult[] = [];
    for (const seed of props.seeds) {
      const [source] = await this.freshHeaders(
        [seed.sourceId],
        props.includeCustomerMemory,
      );
      if (
        !source ||
        (seed.sourceVersion && source.contentHash !== seed.sourceVersion)
      ) {
        continue;
      }
      const links = await this.module.sourcesToChunks.forSources([source.id]);
      if (!links.length) continue;
      const chunks = await this.module.chunk.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: links.map((link) => link.chunkId),
              },
              {
                column: "chunkIndex",
                method: "gte",
                value: seed.chunkIndex - props.window,
              },
              {
                column: "chunkIndex",
                method: "lte",
                value: seed.chunkIndex + props.window,
              },
            ],
          },
        },
      });
      for (const chunk of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)) {
        if (
          (chunk.metadata?.embeddingIndex ?? undefined) !== props.embeddingIndex
        ) {
          continue;
        }
        result.push({
          id: chunk.id,
          text: chunk.text,
          chunkIndex: chunk.chunkIndex,
          metadata: chunk.metadata,
          sourceId: source.id,
          sourceTitle: source.title,
          sourceVersion: source.contentHash,
          distance: seed.distance ?? null,
          similarity: seed.similarity ?? null,
          retrievalRole: "neighbor",
        });
      }
    }
    return result;
  }
}
