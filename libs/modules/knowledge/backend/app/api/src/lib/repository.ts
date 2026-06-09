import { getDrizzle } from "@sps/shared-backend-database-config";
import { Table as DocumentTable } from "@sps/knowledge/models/document/backend/repository/database";
import { Table as EditSuggestionTable } from "@sps/knowledge/models/edit-suggestion/backend/repository/database";
import { Table as SourceTable } from "@sps/knowledge/models/source/backend/repository/database";
import { Table as ChunkTable } from "@sps/knowledge/models/chunk/backend/repository/database";
import { Table as FileTable } from "@sps/file-storage/models/file/backend/repository/database";
import { Table as SourcesToChunksTable } from "@sps/knowledge/relations/sources-to-chunks/backend/repository/database";
import { Table as SourcesToFileStorageModuleFilesTable } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/repository/database";
import {
  KnowledgeChunkInput,
  KnowledgeDocumentIndexInput,
  KnowledgeSearchResult,
  KnowledgeSourceInput,
} from "./types";
import { and, eq, inArray, not, sql } from "drizzle-orm";
import { FILE_STORAGE_FOLDER, FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
import fs from "node:fs/promises";
import path from "node:path";

export class KnowledgeRepository {
  private db = getDrizzle({
    DocumentTable,
    EditSuggestionTable,
    SourceTable,
    ChunkTable,
    FileTable,
    SourcesToChunksTable,
    SourcesToFileStorageModuleFilesTable,
  });

  async getStatus() {
    const [documentCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(DocumentTable)
      .execute();
    const [sourceCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(SourceTable)
      .execute();
    const [chunkCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(ChunkTable)
      .execute();

    return {
      documents: Number(documentCount?.count || 0),
      sources: Number(sourceCount?.count || 0),
      chunks: Number(chunkCount?.count || 0),
    };
  }

  async findSourceByOriginalPath(originalPath: string) {
    const [source] = await this.db
      .select()
      .from(SourceTable)
      .where(eq(SourceTable.originalPath, originalPath))
      .limit(1)
      .execute();

    return source;
  }

  async findDocumentById(id: string) {
    const [document] = await this.db
      .select()
      .from(DocumentTable)
      .where(eq(DocumentTable.id, id))
      .limit(1)
      .execute();

    return document;
  }

  async findDocumentsByIds(documentIds: string[]) {
    const ids = Array.from(
      new Set(
        documentIds
          .map((documentId) => this.toStringValue(documentId).trim())
          .filter((documentId) => Boolean(documentId)),
      ),
    );

    if (!ids.length) {
      return [];
    }

    return this.db
      .select()
      .from(DocumentTable)
      .where(inArray(DocumentTable.id, ids))
      .execute();
  }

  async listDocumentsForIndex(props?: {
    limit?: number;
    documentId?: string;
  }): Promise<KnowledgeDocumentIndexInput[]> {
    let query = this.db
      .select({
        id: DocumentTable.id,
        title: DocumentTable.title,
        slug: DocumentTable.slug,
        description: DocumentTable.description,
        status: DocumentTable.status,
        summary: DocumentTable.summary,
        tags: DocumentTable.tags,
        metadata: DocumentTable.metadata,
        contentHash: DocumentTable.contentHash,
        lastIndexedAt: DocumentTable.lastIndexedAt,
      })
      .from(DocumentTable)
      .$dynamic();

    if (props?.documentId) {
      query = query.where(eq(DocumentTable.id, props.documentId));
    }

    if (props?.limit && props.limit > 0) {
      query = query.limit(props.limit);
    }

    const documents = await query.execute();

    return documents.map((document) => {
      return {
        ...document,
        id: String(document.id),
        title: this.toStringValue(document.title),
        slug: this.toStringValue(document.slug),
        description: this.toStringValue(document.description),
        status: this.toStringValue(document.status),
        summary:
          document.summary === null || document.summary === undefined
            ? null
            : this.toStringValue(document.summary),
        tags: Array.isArray(document.tags) ? document.tags : [],
        metadata: this.toRecord(document.metadata),
        contentHash: this.toStringValue(document.contentHash),
        lastIndexedAt:
          document.lastIndexedAt instanceof Date
            ? document.lastIndexedAt
            : null,
      };
    });
  }

  async upsertDocumentFromSourceInput(input: KnowledgeSourceInput) {
    const slug = this.toSlug(input.originalPath);
    const metadata = {
      ...input.metadata,
      importedFilePath: input.metadata.absolutePath || input.originalPath,
      importedOriginalPath: input.originalPath,
      importedSourceType: input.type,
    };

    const [existing] = await this.db
      .select()
      .from(DocumentTable)
      .where(eq(DocumentTable.slug, slug))
      .limit(1)
      .execute();

    const values = {
      title: input.title,
      description: input.content,
      summary: input.description || null,
      status: "imported",
      metadata,
      adminTitle: input.title,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await this.db
        .update(DocumentTable)
        .set(values)
        .where(eq(DocumentTable.id, existing.id))
        .returning()
        .execute();

      return updated;
    }

    const [created] = await this.db
      .insert(DocumentTable)
      .values({
        ...values,
        slug,
      })
      .returning()
      .execute();

    return created;
  }

  async updateDocumentIndexMetadata(props: {
    documentId: string;
    contentHash: string;
  }) {
    const [updated] = await this.db
      .update(DocumentTable)
      .set({
        status: "indexed",
        contentHash: props.contentHash,
        lastIndexedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(DocumentTable.id, props.documentId))
      .returning()
      .execute();

    return updated;
  }

  async updateDocumentDescription(props: {
    documentId: string;
    description: string;
    title?: string;
  }) {
    const values = {
      ...(props.title ? { title: props.title } : {}),
      description: props.description,
      contentHash: "",
      updatedAt: new Date(),
    };
    const [updated] = await this.db
      .update(DocumentTable)
      .set(values)
      .where(eq(DocumentTable.id, props.documentId))
      .returning()
      .execute();

    return updated;
  }

  async createDocumentFromSuggestion(props: {
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  }) {
    const slug = this.toUniqueSlug(props.title || "knowledge-document");
    const [created] = await this.db
      .insert(DocumentTable)
      .values({
        title: props.title,
        adminTitle: props.title,
        slug,
        description: props.description,
        status: "draft",
        metadata: props.metadata || {},
      })
      .returning()
      .execute();

    return created;
  }

  async upsertSourceForDocument(props: {
    document: KnowledgeDocumentIndexInput;
    contentHash: string;
  }) {
    return this.upsertSource({
      title: props.document.title,
      type: "knowledge-document",
      content: props.document.description,
      description: props.document.summary || null,
      originalPath: this.getDocumentOriginalPath(props.document.id),
      contentHash: props.contentHash,
      metadata: {
        ...props.document.metadata,
        documentId: props.document.id,
        documentSlug: props.document.slug,
        documentStatus: props.document.status,
        sourceKind: "knowledge-document",
      },
    });
  }

  getDocumentOriginalPath(documentId: string) {
    return `knowledge-document:${documentId}`;
  }

  async upsertSource(input: KnowledgeSourceInput) {
    const existing = await this.findSourceByOriginalPath(input.originalPath);
    const values = {
      title: input.title,
      type: input.type,
      content: input.content,
      description: input.description,
      originalPath: input.originalPath,
      contentHash: input.contentHash,
      status: "indexed",
      lastIndexedAt: new Date(),
      metadata: input.metadata,
      adminTitle: input.title,
      slug: this.toSlug(input.originalPath),
    };

    if (existing) {
      const [updated] = await this.db
        .update(SourceTable)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(eq(SourceTable.id, existing.id))
        .returning()
        .execute();

      return updated;
    }

    const [created] = await this.db
      .insert(SourceTable)
      .values(values)
      .returning()
      .execute();

    return created;
  }

  async clearDerivedData() {
    await this.db.delete(SourcesToFileStorageModuleFilesTable).execute();
    await this.db.delete(SourcesToChunksTable).execute();
    await this.db.delete(ChunkTable).execute();
    await this.db.delete(SourceTable).execute();
  }

  async deleteChunksBySourceId(sourceId: string) {
    await this.db
      .delete(SourcesToChunksTable)
      .where(eq(SourcesToChunksTable.sourceId, sourceId))
      .execute();

    await this.deleteOrphanChunks();
  }

  async insertChunksForSource(sourceId: string, chunks: KnowledgeChunkInput[]) {
    if (!chunks.length) {
      return [];
    }

    const createdChunks = await this.db
      .insert(ChunkTable)
      .values(chunks)
      .returning()
      .execute();

    await this.db
      .insert(SourcesToChunksTable)
      .values(
        createdChunks.map((chunk) => {
          return {
            sourceId,
            chunkId: chunk.id,
          };
        }),
      )
      .execute();

    return createdChunks;
  }

  async hasSourceChunks(sourceId: string) {
    const [relation] = await this.db
      .select({ id: SourcesToChunksTable.id })
      .from(SourcesToChunksTable)
      .where(eq(SourcesToChunksTable.sourceId, sourceId))
      .limit(1)
      .execute();

    return Boolean(relation);
  }

  async hasIndexedChunks(sourceId: string, contentHash: string) {
    const [chunk] = await this.db
      .select({ id: ChunkTable.id })
      .from(ChunkTable)
      .innerJoin(
        SourcesToChunksTable,
        eq(SourcesToChunksTable.chunkId, ChunkTable.id),
      )
      .where(
        and(
          eq(SourcesToChunksTable.sourceId, sourceId),
          eq(ChunkTable.contentHash, contentHash),
        ),
      )
      .limit(1)
      .execute();

    return Boolean(chunk);
  }

  async ensureFileForSource(props: { sourceId: string; filePath: string }) {
    const existingRelation = await this.findSourceFileRelation(props.sourceId);
    const filePayload = await this.createFilePayload(props.filePath);

    if (existingRelation?.fileStorageModuleFileId) {
      const [previousFile] = await this.db
        .select()
        .from(FileTable)
        .where(eq(FileTable.id, existingRelation.fileStorageModuleFileId))
        .limit(1)
        .execute();

      const [updatedFile] = await this.db
        .update(FileTable)
        .set({
          ...filePayload,
          updatedAt: new Date(),
        })
        .where(eq(FileTable.id, existingRelation.fileStorageModuleFileId))
        .returning()
        .execute();

      await this.deleteStoredFile(previousFile?.file);

      return updatedFile;
    }

    const [createdFile] = await this.db
      .insert(FileTable)
      .values(filePayload)
      .returning()
      .execute();

    await this.db
      .insert(SourcesToFileStorageModuleFilesTable)
      .values({
        sourceId: props.sourceId,
        fileStorageModuleFileId: createdFile.id,
      })
      .execute();

    return createdFile;
  }

  async searchChunks(props: {
    embedding: number[];
    topK: number;
    minSimilarity?: number;
    documentIds?: string[];
  }): Promise<KnowledgeSearchResult[]> {
    const embeddingValue = `[${props.embedding.join(",")}]`;
    const minSimilarity = props.minSimilarity ?? -1;
    const documentFilter = props.documentIds?.length
      ? sql`AND s.metadata->>'documentId' IN (${sql.join(
          props.documentIds.map((id) => sql`${id}`),
          sql`, `,
        )})`
      : sql``;

    const rows = await this.db.execute<Record<string, unknown>>(sql`
      SELECT
        c.id,
        c.text,
        c.chunk_index AS "chunkIndex",
        c.metadata,
        s.title AS "sourceTitle",
        s.original_path AS "sourceOriginalPath",
        s.type AS "sourceType",
        (c.embedding <=> ${embeddingValue}::vector) AS distance,
        (1 - (c.embedding <=> ${embeddingValue}::vector)) AS similarity
      FROM sps_ke_chunk c
      LEFT JOIN sps_ke_ss_to_cs_rae sc ON sc.ck_id = c.id
      LEFT JOIN sps_ke_source s ON s.id = sc.se_id
      WHERE (1 - (c.embedding <=> ${embeddingValue}::vector)) >= ${minSimilarity}
      ${documentFilter}
      ORDER BY c.embedding <=> ${embeddingValue}::vector
      LIMIT ${props.topK}
    `);

    return rows.map((row: any) => {
      return {
        id: row.id,
        text: row.text,
        chunkIndex: Number(row.chunkIndex),
        sourceTitle: row.sourceTitle,
        sourceOriginalPath: row.sourceOriginalPath,
        sourceType: row.sourceType,
        distance: Number(row.distance),
        similarity: Number(row.similarity),
        metadata: row.metadata || {},
      };
    });
  }

  async isChunkIndexed(sourceId: string, contentHash: string) {
    return this.hasIndexedChunks(sourceId, contentHash);
  }

  async findEditSuggestionById(id: string) {
    const [suggestion] = await this.db
      .select()
      .from(EditSuggestionTable)
      .where(eq(EditSuggestionTable.id, id))
      .limit(1)
      .execute();

    return suggestion;
  }

  async createEditSuggestion(props: {
    title: string;
    description?: string;
    operation?: "create" | "update";
    targetDocumentId?: string | null;
    proposedDescription: string;
    rationale?: string;
    metadata?: Record<string, unknown>;
  }) {
    const [created] = await this.db
      .insert(EditSuggestionTable)
      .values({
        title: props.title,
        adminTitle: props.title,
        slug: this.toUniqueSlug(props.title || "edit-suggestion"),
        description: props.description || "",
        operation: props.operation || "update",
        targetDocumentId: props.targetDocumentId || null,
        proposedDescription: props.proposedDescription,
        rationale: props.rationale || "",
        metadata: props.metadata || {},
      })
      .returning()
      .execute();

    return created;
  }

  async updateEditSuggestionStatus(props: {
    id: string;
    status: "approved" | "rejected";
    metadata?: Record<string, unknown>;
  }) {
    const [updated] = await this.db
      .update(EditSuggestionTable)
      .set({
        status: props.status,
        metadata: props.metadata,
        updatedAt: new Date(),
      })
      .where(eq(EditSuggestionTable.id, props.id))
      .returning()
      .execute();

    return updated;
  }

  private toSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180);
  }

  private toUniqueSlug(value: string) {
    return this.toSlug(`${value}-${Date.now().toString(36)}`);
  }

  private toStringValue(value: unknown) {
    if (typeof value === "string") {
      return value;
    }

    if (value === null || value === undefined) {
      return "";
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return String(value);
  }

  private toSerializableRecord(value: unknown): Record<string, unknown> {
    const normalized = this.toSerializableJson(value);

    if (
      normalized &&
      typeof normalized === "object" &&
      !Array.isArray(normalized)
    ) {
      return normalized as Record<string, unknown>;
    }

    return {};
  }

  private toSerializableJson(value: unknown): unknown {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.toSerializableJson(item));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entryValue]) => {
          return [key, this.toSerializableJson(entryValue)];
        }),
      );
    }

    return value;
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return this.toRecord(parsed);
      } catch {
        return {};
      }
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  async upsertDocumentBySlug(props: {
    slug: string;
    title: string;
    description: string;
    summary: string | null;
    status: string;
    metadata: Record<string, unknown>;
  }) {
    const slug = this.toStringValue(props.slug).trim();
    const title = this.toStringValue(props.title);
    const description = this.toStringValue(props.description);
    const summary =
      props.summary === null || props.summary === undefined
        ? null
        : this.toStringValue(props.summary);
    const status = this.toStringValue(props.status) || "imported";
    const metadata = JSON.stringify(this.toSerializableRecord(props.metadata));
    const [document] = await this.db.execute<{
      id: string;
      title: string;
      slug: string;
      description: string;
      status: string;
      summary: string | null;
      tags: string[];
      metadata: Record<string, unknown>;
      contentHash: string;
      lastIndexedAt: Date | null;
      adminTitle: string;
    }>(sql`
      INSERT INTO sps_ke_document (
        title,
        description,
        summary,
        status,
        metadata,
        content_hash,
        admin_title,
        slug,
        updated_at
      )
      VALUES (
        ${title},
        ${description},
        ${summary},
        ${status},
        CAST(${metadata} AS jsonb),
        ${""},
        ${title},
        ${slug},
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        summary = EXCLUDED.summary,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        content_hash = ${""},
        admin_title = EXCLUDED.admin_title,
        updated_at = NOW()
      RETURNING
        id,
        title,
        slug,
        description,
        status,
        summary,
        tags,
        metadata,
        content_hash AS "contentHash",
        last_indexed_at AS "lastIndexedAt",
        admin_title AS "adminTitle"
    `);

    if (!document?.id) {
      throw new Error(`Knowledge document upsert failed for slug ${slug}`);
    }

    return document;
  }

  private async findSourceFileRelation(sourceId: string) {
    const [relation] = await this.db
      .select()
      .from(SourcesToFileStorageModuleFilesTable)
      .where(eq(SourcesToFileStorageModuleFilesTable.sourceId, sourceId))
      .limit(1)
      .execute();

    return relation;
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

  private async deleteStoredFile(file?: string | null) {
    const fileName = file?.split("/").pop();

    if (!fileName) {
      return;
    }

    const fileStorage = new Provider({
      type: FILE_STORAGE_PROVIDER,
      folder: FILE_STORAGE_FOLDER,
    });

    await fileStorage.deleteFile({ name: fileName });
  }

  private async deleteOrphanChunks() {
    const relations = await this.db
      .select({ chunkId: SourcesToChunksTable.chunkId })
      .from(SourcesToChunksTable)
      .execute();
    const linkedChunkIds = relations.map((relation) => relation.chunkId);

    if (!linkedChunkIds.length) {
      await this.db.delete(ChunkTable).execute();
      return;
    }

    await this.db
      .delete(ChunkTable)
      .where(not(inArray(ChunkTable.id, linkedChunkIds)))
      .execute();
  }
}
