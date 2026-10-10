import { getDrizzle } from "@sps/shared-backend-database-config";
import { CRUDService } from "@sps/shared-backend-api";
import { Repository as SourceRepository } from "@sps/knowledge/models/source/backend/app/api/src/lib/repository";
import { Configuration as SourceConfiguration } from "@sps/knowledge/models/source/backend/app/api/src/lib/configuration";
import { Table as SourceTable } from "@sps/knowledge/models/source/backend/repository/database";
import { Table as ChunkTable } from "@sps/knowledge/models/chunk/backend/repository/database";
import { Table as FileTable } from "@sps/file-storage/models/file/backend/repository/database";
import { Table as SourcesToChunksTable } from "@sps/knowledge/relations/sources-to-chunks/backend/repository/database";
import { Table as SourcesToFileStorageModuleFilesTable } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/repository/database";
import {
  KnowledgeChunkInput,
  KnowledgeSearchResult,
  KnowledgeSourceInput,
} from "./types";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { FILE_STORAGE_FOLDER, FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
import { Repository as FileRelationRepository } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/repository";
import { Configuration as FileRelationConfiguration } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/configuration";
import { Repository as FileRepository } from "@sps/file-storage/models/file/backend/app/api/src/lib/repository";
import { Configuration as FileConfiguration } from "@sps/file-storage/models/file/backend/app/api/src/lib/configuration";
import { Service as FileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import { readUserContext, hashContent } from "./service/utils";
import fs from "node:fs/promises";
import path from "node:path";

export class KnowledgeRepository {
  private db = getDrizzle({
    SourceTable,
    ChunkTable,
    FileTable,
    SourcesToChunksTable,
    SourcesToFileStorageModuleFilesTable,
  });

  private sourceCrud(db = this.db) {
    const repository = new SourceRepository(new SourceConfiguration());
    repository.db = db;
    return new CRUDService<typeof SourceTable.$inferSelect>(repository);
  }

  async getStatus() {
    const [row] = await this.db.execute(sql`SELECT
      (SELECT count(*)::int FROM sps_ke_source) AS sources,
      (SELECT count(*)::int FROM sps_ke_chunk) AS chunks`);
    return row;
  }

  async findSourceById(id: string) {
    return this.sourceCrud().findById({ id });
  }

  async findSourcesByIds(sourceIds: string[]) {
    if (!sourceIds.length) return [];
    return this.db
      .select()
      .from(SourceTable)
      .where(inArray(SourceTable.id, sourceIds));
  }

  async listSourcesForIndex(props?: { limit?: number; sourceId?: string }) {
    const query = this.db.select().from(SourceTable).$dynamic();
    if (props?.sourceId) query.where(eq(SourceTable.id, props.sourceId));
    if (props?.limit && !props.sourceId) query.limit(props.limit);
    return query.execute();
  }

  async upsertSourceBySlug(
    input: KnowledgeSourceInput,
    preserveExisting = false,
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${input.slug}))`,
      );
      const [existing] = await tx
        .select()
        .from(SourceTable)
        .where(eq(SourceTable.slug, input.slug));
      if (existing && preserveExisting) return existing;
      const data = {
        ...input,
        adminTitle: input.title,
        contentHash: hashContent(input.content),
      };
      if (existing)
        return this.sourceCrud(tx).update({
          id: existing.id,
          data: { ...existing, ...data },
        });
      return this.sourceCrud(tx).create({ data });
    });
  }

  async updateSource(props: {
    sourceId: string;
    content?: string;
    data?: Partial<typeof SourceTable.$inferSelect>;
    title?: string;
    description?: string | null;
    expectedContentHash?: string;
  }) {
    return this.db.transaction(async (tx) => {
      const [source] = await tx
        .select()
        .from(SourceTable)
        .where(eq(SourceTable.id, props.sourceId))
        .for("update");
      if (!source)
        throw new Error(`Knowledge Source ${props.sourceId} was not found.`);
      if (
        props.expectedContentHash !== undefined &&
        source.contentHash !== props.expectedContentHash
      )
        return null;
      return this.sourceCrud(tx).update({
        id: source.id,
        data: {
          ...source,
          ...props.data,
          id: source.id,
          content: props.content ?? props.data?.content ?? source.content,
          contentHash: hashContent(
            props.content ?? props.data?.content ?? source.content,
          ),
          indexedContentHash: source.indexedContentHash,
          lastIndexedAt: source.lastIndexedAt,
          ...(props.title !== undefined ? { title: props.title } : {}),
          ...(props.description !== undefined
            ? { description: props.description }
            : {}),
        },
      });
    });
  }

  async deleteSourceWithDerivedData(sourceId: string) {
    return this.db.transaction(async (tx) => {
      const [source] = await tx
        .select()
        .from(SourceTable)
        .where(eq(SourceTable.id, sourceId))
        .for("update");
      if (!source) return null;
      await this.clearSourceChunks(tx, sourceId);
      // Raw files can also belong to chats and other Sources; keep them.
      return this.sourceCrud(tx).delete({ id: sourceId });
    });
  }

  private async clearSourceChunks(tx: typeof this.db, sourceId: string) {
    const relations = await tx
      .select()
      .from(SourcesToChunksTable)
      .where(eq(SourcesToChunksTable.sourceId, sourceId));
    await tx
      .delete(SourcesToChunksTable)
      .where(eq(SourcesToChunksTable.sourceId, sourceId));
    if (relations.length)
      await tx.delete(ChunkTable).where(
        inArray(
          ChunkTable.id,
          relations.map((r) => r.chunkId),
        ),
      );
  }

  async clearDerivedData() {
    return this.db.transaction(async (tx) => {
      await tx.delete(SourcesToChunksTable);
      await tx.delete(ChunkTable);
      for (const source of await tx.select().from(SourceTable).for("update")) {
        await this.sourceCrud(tx).update({
          id: source.id,
          data: { ...source, indexedContentHash: null, lastIndexedAt: null },
        });
      }
    });
  }

  async invalidateFileContent(
    sourceId: string,
    userContext: string,
    expectedContentHash: string,
  ) {
    return this.db.transaction(async (tx) => {
      const [source] = await tx
        .select()
        .from(SourceTable)
        .where(eq(SourceTable.id, sourceId))
        .for("update");
      if (!source || source.contentHash !== expectedContentHash) return null;
      await this.clearSourceChunks(tx, sourceId);
      return this.sourceCrud(tx).update({
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
    });
  }

  async publishChunks(
    sourceId: string,
    contentHash: string,
    chunks: KnowledgeChunkInput[],
  ) {
    return this.db.transaction(async (tx) => {
      const [source] = await tx
        .select()
        .from(SourceTable)
        .where(eq(SourceTable.id, sourceId))
        .for("update");
      if (!source || source.contentHash !== contentHash) return false;
      await this.clearSourceChunks(tx, sourceId);
      if (chunks.length) {
        const created = await tx.insert(ChunkTable).values(chunks).returning();
        await tx.insert(SourcesToChunksTable).values(
          created.map((chunk) => ({
            sourceId,
            chunkId: chunk.id,
            orderIndex: chunk.chunkIndex,
          })),
        );
      }
      await this.sourceCrud(tx).update({
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
  }) {
    return this.db.transaction(async (tx) => {
      const [source] = await tx
        .select()
        .from(SourceTable)
        .where(eq(SourceTable.id, props.sourceId))
        .for("update");
      if (!source || source.contentHash !== props.expectedContentHash)
        return null;
      const files = await tx
        .select({
          relation: SourcesToFileStorageModuleFilesTable,
          file: FileTable,
        })
        .from(SourcesToFileStorageModuleFilesTable)
        .innerJoin(
          FileTable,
          eq(
            FileTable.id,
            SourcesToFileStorageModuleFilesTable.fileStorageModuleFileId,
          ),
        )
        .where(eq(SourcesToFileStorageModuleFilesTable.sourceId, source.id))
        .orderBy(
          asc(SourcesToFileStorageModuleFilesTable.orderIndex),
          asc(SourcesToFileStorageModuleFilesTable.id),
        );
      const snapshot = JSON.stringify(
        files.map(({ relation, file }) => [
          relation.id,
          relation.fileStorageModuleFileId,
          relation.orderIndex,
          file.updatedAt,
        ]),
      );
      if (snapshot !== props.fileSnapshot) return null;
      return this.sourceCrud(tx).update({
        id: source.id,
        data: {
          ...source,
          content: props.content,
          contentHash: hashContent(props.content),
        },
      });
    });
  }

  async sourceFiles(sourceId: string) {
    return this.db
      .select({
        relation: SourcesToFileStorageModuleFilesTable,
        file: FileTable,
      })
      .from(SourcesToFileStorageModuleFilesTable)
      .innerJoin(
        FileTable,
        eq(
          FileTable.id,
          SourcesToFileStorageModuleFilesTable.fileStorageModuleFileId,
        ),
      )
      .where(eq(SourcesToFileStorageModuleFilesTable.sourceId, sourceId))
      .orderBy(
        asc(SourcesToFileStorageModuleFilesTable.orderIndex),
        asc(SourcesToFileStorageModuleFilesTable.id),
      );
  }

  private relationCrud(db = this.db) {
    const repository = new FileRelationRepository(
      new FileRelationConfiguration(),
    );
    repository.db = db;
    return new CRUDService<
      typeof SourcesToFileStorageModuleFilesTable.$inferSelect
    >(repository);
  }

  private async lockFiles(
    tx: typeof this.db,
    fileIds: string[],
    mode: "key share" | "update" = "key share",
  ) {
    const ids = [...new Set(fileIds)];
    if (!ids.length) return;
    const files = await tx
      .select()
      .from(FileTable)
      .where(inArray(FileTable.id, ids))
      .orderBy(asc(FileTable.id))
      .for(mode);
    if (files.length !== ids.length)
      throw new Error("Stored file was not found.");
  }

  private async lockSources(tx: typeof this.db, sourceIds: string[]) {
    if (!sourceIds.length) return [];
    return tx
      .select()
      .from(SourceTable)
      .where(inArray(SourceTable.id, [...new Set(sourceIds)]))
      .orderBy(asc(SourceTable.id))
      .for("update");
  }

  private async invalidateSources(
    tx: typeof this.db,
    sources: (typeof SourceTable.$inferSelect)[],
  ) {
    for (const source of sources) {
      const content = readUserContext(source.content);
      await this.clearSourceChunks(tx, source.id);
      await this.sourceCrud(tx).update({
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

  async mutateFileRelation(props: {
    action: "create" | "update" | "delete";
    id?: string;
    data?: any;
  }) {
    return this.db.transaction(async (tx) => {
      const previous = props.id
        ? await this.relationCrud(tx).findById({ id: props.id })
        : null;
      if (props.action !== "create" && !previous)
        throw new Error("Knowledge file relation was not found.");
      await this.lockFiles(
        tx,
        [
          previous?.fileStorageModuleFileId,
          props.data?.fileStorageModuleFileId,
        ].filter(Boolean),
      );
      const sourceIds: string[] = [
        ...new Set([previous?.sourceId, props.data?.sourceId].filter(Boolean)),
      ] as string[];
      const sources = await this.lockSources(tx, sourceIds);
      if (previous) {
        const [current] = await tx
          .select()
          .from(SourcesToFileStorageModuleFilesTable)
          .where(eq(SourcesToFileStorageModuleFilesTable.id, previous.id))
          .for("update");
        if (
          !current ||
          current.sourceId !== previous.sourceId ||
          current.fileStorageModuleFileId !== previous.fileStorageModuleFileId
        )
          throw new Error(
            "Knowledge file relation changed. Retry the operation.",
          );
      }
      let relation;
      if (props.action === "create")
        relation = await this.relationCrud(tx).create({ data: props.data });
      else if (props.action === "delete")
        relation = await this.relationCrud(tx).delete({ id: props.id! });
      else
        relation = await this.relationCrud(tx).update({
          id: props.id!,
          data: { ...previous!, ...props.data },
        });
      await this.invalidateSources(tx, sources);
      return { relation, sourceIds };
    });
  }

  async mutateStoredFile(props: {
    action: "update" | "delete";
    id: string;
    data?: Partial<typeof FileTable.$inferSelect>;
  }) {
    return this.db.transaction(async (tx) => {
      await this.lockFiles(tx, [props.id], "update");
      const relations = await tx
        .select()
        .from(SourcesToFileStorageModuleFilesTable)
        .where(
          eq(
            SourcesToFileStorageModuleFilesTable.fileStorageModuleFileId,
            props.id,
          ),
        );
      const sourceIds = [
        ...new Set(relations.map((relation) => relation.sourceId)),
      ];
      const sources = await this.lockSources(tx, sourceIds);
      const repository = new FileRepository(new FileConfiguration());
      repository.db = tx;
      const crud = new FileService(repository);
      const previous = await crud.findById({ id: props.id });
      if (!previous) throw new Error("Stored file was not found.");
      const file =
        props.action === "delete"
          ? await crud.delete({ id: props.id })
          : await crud.update({
              id: props.id,
              data: { ...previous, ...props.data },
            });
      await this.invalidateSources(tx, sources);
      return { file, sourceIds };
    });
  }

  async attachFiles(sourceId: string, fileIds: string[]) {
    if (!fileIds.length) return;
    await this.db.transaction(async (tx) => {
      await this.lockFiles(tx, fileIds);
      const sources = await this.lockSources(tx, [sourceId]);
      const existing = await tx
        .select()
        .from(SourcesToFileStorageModuleFilesTable)
        .where(eq(SourcesToFileStorageModuleFilesTable.sourceId, sourceId));
      const attached = new Set(
        existing.map((relation) => relation.fileStorageModuleFileId),
      );
      let orderIndex =
        Math.max(-1, ...existing.map((relation) => relation.orderIndex)) + 1;
      let changed = false;
      for (const fileStorageModuleFileId of [...new Set(fileIds)]) {
        if (attached.has(fileStorageModuleFileId)) continue;
        await this.relationCrud(tx).create({
          data: { sourceId, fileStorageModuleFileId, orderIndex: orderIndex++ },
        });
        changed = true;
      }
      if (changed) await this.invalidateSources(tx, sources);
    });
  }

  async fileSourceIds(fileId: string) {
    const rows = await this.db
      .select({ sourceId: SourcesToFileStorageModuleFilesTable.sourceId })
      .from(SourcesToFileStorageModuleFilesTable)
      .where(
        eq(
          SourcesToFileStorageModuleFilesTable.fileStorageModuleFileId,
          fileId,
        ),
      );
    return [...new Set(rows.map((r) => r.sourceId))];
  }

  async setFiles(
    sourceId: string,
    fileIds: string[],
    expectedFileIds?: string[],
  ) {
    return this.db.transaction(async (tx) => {
      await this.lockFiles(tx, fileIds);
      const sources = await this.lockSources(tx, [sourceId]);
      if (!sources.length) throw new Error("Knowledge Source was not found.");
      const existing = await tx
        .select()
        .from(SourcesToFileStorageModuleFilesTable)
        .where(eq(SourcesToFileStorageModuleFilesTable.sourceId, sourceId))
        .orderBy(
          asc(SourcesToFileStorageModuleFilesTable.orderIndex),
          asc(SourcesToFileStorageModuleFilesTable.id),
        );
      if (
        expectedFileIds &&
        JSON.stringify(existing.map((item) => item.fileStorageModuleFileId)) !==
          JSON.stringify(expectedFileIds)
      )
        throw new Error(
          "Knowledge attachments changed. Refresh and retry the operation.",
        );
      const ids = [...new Set(fileIds)];
      for (const relation of existing) {
        if (!ids.includes(relation.fileStorageModuleFileId))
          await this.relationCrud(tx).delete({ id: relation.id });
      }
      for (const [orderIndex, fileStorageModuleFileId] of ids.entries()) {
        const relation = existing.find(
          (item) => item.fileStorageModuleFileId === fileStorageModuleFileId,
        );
        if (relation)
          await this.relationCrud(tx).update({
            id: relation.id,
            data: { ...relation, orderIndex },
          });
        else
          await this.relationCrud(tx).create({
            data: { sourceId, fileStorageModuleFileId, orderIndex },
          });
      }
      await this.invalidateSources(tx, sources);
    });
  }

  async ensureFileForSource(props: { sourceId: string; filePath: string }) {
    const existing = await this.sourceFiles(props.sourceId);
    const linked = existing.find(
      ({ file }) => file.slug === this.toSlug(props.filePath),
    );
    if (linked) return linked.file;
    const filePayload = await this.createFilePayload(props.filePath);
    const [file] = await this.db
      .insert(FileTable)
      .values(filePayload)
      .returning();
    await this.attachFiles(props.sourceId, [file.id]);
    return file;
  }

  async searchChunks(props: {
    embedding: number[];
    topK: number;
    minSimilarity?: number;
    sourceIds?: string[];
  }): Promise<KnowledgeSearchResult[]> {
    if (props.sourceIds && !props.sourceIds.length) return [];
    const vector = `[${props.embedding.join(",")}]`;
    const scope = props.sourceIds
      ? sql`AND s.id IN (${sql.join(
          props.sourceIds.map((id) => sql`${id}::uuid`),
          sql`, `,
        )})`
      : sql``;
    if (!props.sourceIds) {
      const rows = await this.db.execute(sql`WITH ranked AS MATERIALIZED (
        SELECT c.id, c.text, c.chunk_index AS "chunkIndex", c.metadata,
          (c.embedding <=> ${vector}::vector) AS distance
        FROM sps_ke_chunk c
        WHERE (SELECT s.indexed_content_hash = s.content_hash
          FROM sps_ke_ss_to_cs_rae sc INNER JOIN sps_ke_source s ON s.id = sc.se_id
          WHERE sc.ck_id = c.id) IS TRUE
          AND (1 - (c.embedding <=> ${vector}::vector)) >= ${props.minSimilarity ?? -1}
        ORDER BY c.embedding <=> ${vector}::vector LIMIT ${props.topK}
      ) SELECT ranked.*, s.id AS "sourceId", s.title AS "sourceTitle", (1 - ranked.distance) AS similarity
        FROM ranked INNER JOIN sps_ke_ss_to_cs_rae sc ON sc.ck_id = ranked.id
        INNER JOIN sps_ke_source s ON s.id = sc.se_id ORDER BY ranked.distance`);
      return rows.map((row) => ({
        ...row,
        distance: Number(row.distance),
        similarity: Number(row.similarity),
        retrievalRole: "seed",
      })) as KnowledgeSearchResult[];
    }
    const candidates = sql`SELECT c.id, c.text, c.chunk_index AS "chunkIndex", c.metadata, c.embedding,
      s.id AS "sourceId", s.title AS "sourceTitle"
      FROM sps_ke_chunk c INNER JOIN sps_ke_ss_to_cs_rae sc ON sc.ck_id = c.id INNER JOIN sps_ke_source s ON s.id = sc.se_id
      WHERE s.indexed_content_hash = s.content_hash ${scope}`;
    const materialization = sql`MATERIALIZED`;
    const rows = await this.db
      .execute(sql`WITH candidates AS ${materialization} (${candidates})
      SELECT id, text, "chunkIndex", metadata, "sourceId", "sourceTitle",
      (embedding <=> ${vector}::vector) AS distance, (1 - (embedding <=> ${vector}::vector)) AS similarity
      FROM candidates WHERE (1 - (embedding <=> ${vector}::vector)) >= ${props.minSimilarity ?? -1}
      ORDER BY embedding <=> ${vector}::vector LIMIT ${props.topK}`);
    return rows.map((row) => ({
      ...row,
      distance: Number(row.distance),
      similarity: Number(row.similarity),
      retrievalRole: "seed",
    })) as KnowledgeSearchResult[];
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
    const results: KnowledgeSearchResult[] = [];
    for (const seed of props.seeds) {
      const rows = await this.db
        .execute(sql`SELECT c.id, c.text, c.chunk_index AS "chunkIndex", c.metadata, s.id AS "sourceId", s.title AS "sourceTitle"
        FROM sps_ke_chunk c INNER JOIN sps_ke_ss_to_cs_rae sc ON sc.ck_id = c.id INNER JOIN sps_ke_source s ON s.id = sc.se_id
        WHERE s.id = ${seed.sourceId}::uuid AND s.indexed_content_hash = s.content_hash AND c.chunk_index BETWEEN ${seed.chunkIndex - props.window} AND ${seed.chunkIndex + props.window}
        ORDER BY c.chunk_index`);
      results.push(
        ...(rows.map((row) => ({
          ...row,
          distance: seed.distance ?? null,
          similarity: seed.similarity ?? null,
          retrievalRole: "neighbor",
        })) as KnowledgeSearchResult[]),
      );
    }
    return results;
  }

  private toSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180);
  }
  private async createFilePayload(filePath: string) {
    const buffer = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    const file = Object.assign(buffer, {
      name: fileName,
      arrayBuffer: async () => {
        const arrayBuffer = new ArrayBuffer(buffer.length);
        new Uint8Array(arrayBuffer).set(buffer);
        return arrayBuffer;
      },
    });
    const fileType = await this.detectFileType(buffer, fileName);
    const dimensions = await this.detectImageDimensions(buffer);
    const fileStorage = new Provider({
      type: FILE_STORAGE_PROVIDER,
      folder: FILE_STORAGE_FOLDER,
    });
    const uploadedFileUrl = await fileStorage.uploadFile({ file });

    return {
      file: uploadedFileUrl,
      adminTitle: fileName,
      slug: this.toSlug(filePath),
      alt: fileName,
      size: buffer.length,
      extension: fileType?.ext ?? path.extname(fileName).replace(".", ""),
      mimeType: fileType?.mime ?? "text/plain",
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  private async detectFileType(buffer: Buffer, fileName: string) {
    const { fileTypeFromBuffer } = await import("file-type");
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType && fileName.toLowerCase().endsWith(".svg")) {
      return {
        ext: "svg",
        mime: "image/svg+xml",
      };
    }

    return fileType;
  }

  private async detectImageDimensions(buffer: Buffer) {
    try {
      const { imageSize } = await import("image-size");
      const dimensions = imageSize(buffer);
      return {
        width: dimensions.width || 0,
        height: dimensions.height || 0,
      };
    } catch {
      return {
        width: 0,
        height: 0,
      };
    }
  }
}
