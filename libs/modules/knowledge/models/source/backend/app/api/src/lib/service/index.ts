import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { assertKnowledgeAttachmentBytes } from "@sps/backend-utils";
import { Table } from "@sps/knowledge/models/source/backend/repository/database";
import type { Repository } from "../repository";
import type { Service as ChunkService } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/service";
import type { Service as SourcesToChunksService } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api/src/lib/service";
import type {
  Service as SourcesToFilesService,
  IFileRelationMutation,
} from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/service";
import type { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
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
  chunk: ChunkService;
  sourcesToChunks: SourcesToChunksService;
  sourcesToFileStorageModuleFiles: SourcesToFilesService;
  fileStorageFile: FileStorageFileService;
  inTransaction: boolean;
  transaction: <T>(operation: (source: Service) => Promise<T>) => Promise<T>;
  readSnapshot: <T>(operation: (source: Service) => Promise<T>) => Promise<T>;
  afterCommit: (operation: () => Promise<unknown>) => void;
  process: (sourceId: string, material: boolean) => Promise<unknown>;
}

@injectable()
export class Service extends CRUDService<Source> {
  private services?: ISourceServices;
  configure(services: ISourceServices) {
    this.services = services;
  }
  private dependencies() {
    if (!this.services)
      throw new Error("Knowledge Source services are not configured.");
    return this.services;
  }
  private owner() {
    return this.repository as Repository;
  }
  private run<T>(operation: (source: Service) => Promise<T>) {
    const services = this.dependencies();
    return services.inTransaction
      ? operation(this)
      : services.transaction(operation);
  }
  private async saveRecord(props: { id?: string; data: any }) {
    const source = props.id
      ? await super.update({ id: props.id, data: props.data })
      : await super.create({ data: props.data });
    return source;
  }
  async create(props: { data: any }): Promise<Source> {
    const source = await this.run(async (scope) => {
      const source = (await scope.saveRecord({
        data: {
          ...props.data,
          contentHash: hashContent(props.data.content || ""),
          indexedContentHash: null,
          lastIndexedAt: null,
        },
      }))!;
      scope
        .dependencies()
        .afterCommit(() => scope.dependencies().process(source.id, false));
      return source;
    });
    return (await this.findById({ id: source.id }))!;
  }
  async findOrCreate(props: { data: any }) {
    return this.run(async (scope) => {
      await scope.owner().lockSlug(props.data.slug);
      const [existing] = await scope.find({
        params: {
          filters: {
            and: [{ column: "slug", method: "eq", value: props.data.slug }],
          },
        },
      });
      if (existing) return { entity: existing, statusCode: 200 as const };
      return { entity: await scope.create(props), statusCode: 201 as const };
    });
  }
  async update(props: { id: string; data: any }): Promise<Source | null> {
    const source = await this.updateSource({
      sourceId: props.id,
      data: props.data,
    });
    if (source) await this.dependencies().process(source.id, false);
    return this.findById({ id: props.id });
  }
  async delete(props: { id: string }): Promise<Source> {
    const source = await this.deleteSourceWithDerivedData(props.id);
    if (!source) throw new Error("Knowledge Source was not found.");
    return source;
  }
  findSourceById(id: string) {
    return this.findById({ id });
  }
  async findSourcesByIds(ids: string[]) {
    if (!ids.length) return [];
    return this.find({
      params: {
        filters: { and: [{ column: "id", method: "inArray", value: ids }] },
      },
    });
  }
  listSourcesForIndex(props?: { sourceId?: string; limit?: number }) {
    return this.find({
      params: {
        ...(props?.sourceId
          ? {
              filters: {
                and: [{ column: "id", method: "eq", value: props.sourceId }],
              },
            }
          : { limit: props?.limit }),
      },
    });
  }
  async getStatus() {
    return {
      sources: await this.count(),
      chunks: await this.dependencies().chunk.count(),
    };
  }
  async upsertSourceBySlug(
    input: KnowledgeSourceInput,
    preserveExisting = false,
  ): Promise<Source> {
    return this.run(async (scope) => {
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
    const files = await this.dependencies().fileStorageFile.lock(ids, mode);
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
          bytes: await this.dependencies().fileStorageFile.readBytes(file),
          name: file.file || file.adminTitle,
          mimeType: file.mimeType || undefined,
        });
      }
    return files;
  }
  async validateAttachments(fileIds: string[]) {
    const ids = [...new Set(fileIds)];
    if (!ids.length) return;
    const files = await this.dependencies().fileStorageFile.find({
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
        bytes: await this.dependencies().fileStorageFile.readBytes(file),
        name: file.file,
        mimeType: file.mimeType || undefined,
      });
    }
  }
  async updateSource(props: IUpdateSourceProps) {
    return (await this.updateSourceWithAttachments(props))?.source || null;
  }
  async updateSourceWithAttachments(
    props: IUpdateSourceProps,
  ): Promise<{ source: Source; attachmentsChanged: boolean } | null> {
    return this.run(async (scope) => {
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
      const attachmentsChanged = await scope
        .dependencies()
        .sourcesToFileStorageModuleFiles.append(source.id, props.fileIds || []);
      if (attachmentsChanged) await scope.invalidateSources([updated]);
      return {
        source: (await scope.findById({ id: source.id }))!,
        attachmentsChanged,
      };
    });
  }
  async deleteSourceWithDerivedData(sourceId: string): Promise<Source | null> {
    return this.run(async (scope) => {
      const [source] = await scope.owner().lock([sourceId]);
      if (!source) return null;
      await scope.clearSourceChunks([sourceId]);
      for (const link of await scope
        .dependencies()
        .sourcesToFileStorageModuleFiles.forSource(sourceId))
        await scope
          .dependencies()
          .sourcesToFileStorageModuleFiles.delete({ id: link.id });
      const deleted = await scope.deleteRecord(sourceId);
      return deleted;
    });
  }
  private async deleteRecord(id: string) {
    const source = await super.delete({ id });
    return source;
  }
  private async clearSourceChunks(sourceIds: string[]) {
    const services = this.dependencies();
    const ids = await services.sourcesToChunks.unlinkSources(sourceIds);
    await services.chunk.removeIds(ids);
  }
  async clearDerivedData() {
    return this.run(async (scope) => {
      const candidates = await scope.find();
      const sources = await scope
        .owner()
        .lock(candidates.map((source) => source.id));
      await scope.clearSourceChunks(sources.map((source) => source.id));
      // Explicit clear also removes orphan chunks left by historical imports.
      for (const chunk of await scope.dependencies().chunk.find())
        await scope.dependencies().chunk.delete({ id: chunk.id });
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
    return this.run(async (scope) => {
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
    return this.run(async (scope) => {
      const [source] = await scope.owner().lock([sourceId]);
      if (!source || source.contentHash !== contentHash) return false;
      await scope.clearSourceChunks([sourceId]);
      for (const input of chunks) {
        const chunk = await scope.dependencies().chunk.create({ data: input });
        await scope.dependencies().sourcesToChunks.create({
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
    return this.run(async (scope) => {
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
    return this.dependencies().fileStorageFile.readBytes(file);
  }
  sourceFiles(sourceId: string) {
    return this.dependencies().sourcesToFileStorageModuleFiles.sourceFiles(
      sourceId,
    );
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
    return this.run(async (scope) => {
      const relationService =
        scope.dependencies().sourcesToFileStorageModuleFiles;
      const previous = props.id
        ? await relationService.findById({ id: props.id })
        : null;
      if (props.action !== "create" && !previous)
        throw new Error("Knowledge file relation was not found.");
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
            "Knowledge file relation changed. Retry the operation.",
          );
      }
      const relation =
        props.action === "create"
          ? await relationService.create({ data: props.data })
          : props.action === "delete"
            ? await relationService.delete({ id: props.id! })
            : await relationService.update({
                id: props.id!,
                data: { ...previous!, ...props.data },
              });
      await scope.invalidateSources(sources);
      for (const id of sourceIds)
        scope
          .dependencies()
          .afterCommit(() => scope.dependencies().process(id, true));
      return { relation, sourceIds };
    });
  }
  async mutateStoredFile(props: {
    action: "update" | "delete";
    id: string;
    data?: any;
  }) {
    return this.run(async (scope) => {
      await scope.lockFiles([props.id], "update", false);
      const fileLinks = await scope
        .dependencies()
        .sourcesToFileStorageModuleFiles.find({
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
        });
      const sourceIds = [...new Set(fileLinks.map((link) => link.sourceId))];
      const sources = await scope.owner().lock(sourceIds);
      const fileService = scope.dependencies().fileStorageFile;
      const previous = await fileService.findById({ id: props.id });
      if (!previous) throw new Error("Stored file was not found.");
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
      const file =
        props.action === "delete"
          ? await fileService.delete({ id: props.id })
          : await fileService.update({
              id: props.id,
              data: { ...previous, ...props.data },
            });
      return { file, sourceIds };
    });
  }
  async attachFiles(sourceId: string, fileIds: string[]) {
    if (!fileIds.length) return;
    return this.run(async (scope) => {
      await scope.lockFiles(fileIds);
      const sources = await scope.owner().lock([sourceId]);
      if (!sources.length) throw new Error("Knowledge Source was not found.");
      if (
        await scope
          .dependencies()
          .sourcesToFileStorageModuleFiles.append(sourceId, fileIds)
      ) {
        await scope.invalidateSources(sources);
      }
    });
  }
  fileSourceIds(fileId: string) {
    return this.dependencies().sourcesToFileStorageModuleFiles.fileSourceIds(
      fileId,
    );
  }
  async setFiles(
    sourceId: string,
    fileIds: string[],
    expectedFileIds?: string[],
    expectedContentHash?: string,
  ) {
    return this.run(async (scope) => {
      const previous = await scope.sourceFiles(sourceId);
      // Legacy unsupported files can be detached; only newly attached bytes are validated.
      const existingIds = new Set(previous.map(({ file }) => file.id));
      await scope.lockFiles(fileIds, "key share", false);
      await scope.lockFiles(fileIds.filter((id) => !existingIds.has(id)));
      const sources = await scope.owner().lock([sourceId]);
      if (!sources.length) throw new Error("Knowledge Source was not found.");
      if (
        expectedContentHash !== undefined &&
        sources[0].contentHash !== expectedContentHash
      )
        throw new Error(
          "Conflict error. Knowledge Source changed. Refresh and retry the operation.",
        );
      await scope
        .dependencies()
        .sourcesToFileStorageModuleFiles.replace(
          sourceId,
          fileIds,
          expectedFileIds,
        );
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
    const file = await this.dependencies().fileStorageFile.importPath({
      filePath: props.filePath,
      slug,
      validate: (bytes) =>
        assertKnowledgeAttachmentBytes({ bytes, name: props.filePath }),
    });
    await this.attachFiles(props.sourceId, [file.id]);
    return file;
  }
  freshHeaders(ids: string[]) {
    return this.owner().freshHeaders(ids);
  }
  async searchChunks(props: {
    embedding: number[];
    topK: number;
    minSimilarity?: number;
    sourceIds?: string[];
  }): Promise<KnowledgeSearchResult[]> {
    if (props.sourceIds && !props.sourceIds.length) return [];
    if (!this.dependencies().inTransaction)
      return this.dependencies().readSnapshot((source) =>
        source.searchChunks(props),
      );
    const services = this.dependencies();
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
        return source
          ? [
              {
                ...chunk,
                sourceId: source.id,
                sourceTitle: source.title,
                retrievalRole: "seed" as const,
              },
            ]
          : [];
      });
    };
    if (props.sourceIds) {
      const sources = await this.freshHeaders(props.sourceIds);
      const links = await services.sourcesToChunks.forSources(
        sources.map((source) => source.id),
      );
      const chunks = await services.chunk.search({
        ...props,
        materialized: true,
        ids: links.map((link) => link.chunkId),
      });
      return collect(chunks, links, sources);
    }
    const total = await services.chunk.count();
    if (!total) return [];
    let limit = Math.min(total, Math.max(64, props.topK * 4));
    for (;;) {
      // Keep the unfiltered global vector scan eligible for HNSW. Only ranked
      // candidates cross service boundaries; Source content is never loaded.
      const chunks = await services.chunk.search({
        embedding: props.embedding,
        minSimilarity: props.minSimilarity,
        topK: limit,
      });
      const links = await services.sourcesToChunks.forChunkIds(
        chunks.map((chunk) => chunk.id),
      );
      const sources = await this.freshHeaders([
        ...new Set(links.map((link) => link.sourceId)),
      ]);
      const result = collect(chunks, links, sources);
      if (
        result.length >= props.topK ||
        chunks.length < limit ||
        limit >= total
      )
        return result.slice(0, props.topK);
      limit = Math.min(total, limit * 2);
    }
  }
  async findNeighborChunks(props: {
    seeds: {
      sourceId: string;
      chunkIndex: number;
      distance?: number | null;
      similarity?: number | null;
    }[];
    window: number;
  }): Promise<KnowledgeSearchResult[]> {
    if (!this.dependencies().inTransaction)
      return this.dependencies().readSnapshot((source) =>
        source.findNeighborChunks(props),
      );
    const result: KnowledgeSearchResult[] = [];
    for (const seed of props.seeds) {
      const [source] = await this.freshHeaders([seed.sourceId]);
      if (!source) continue;
      const links = await this.dependencies().sourcesToChunks.forSources([
        source.id,
      ]);
      if (!links.length) continue;
      const chunks = await this.dependencies().chunk.find({
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
      for (const chunk of chunks.sort((a, b) => a.chunkIndex - b.chunkIndex))
        result.push({
          id: chunk.id,
          text: chunk.text,
          chunkIndex: chunk.chunkIndex,
          metadata: chunk.metadata,
          sourceId: source.id,
          sourceTitle: source.title,
          distance: seed.distance ?? null,
          similarity: seed.similarity ?? null,
          retrievalRole: "neighbor",
        });
    }
    return result;
  }
}
