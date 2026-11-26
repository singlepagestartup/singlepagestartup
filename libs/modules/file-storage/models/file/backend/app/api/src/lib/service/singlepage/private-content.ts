import { createHash, randomUUID } from "node:crypto";
import { and, count, eq, inArray, isNotNull, lte } from "drizzle-orm";
import { PrivateDirectory } from "@sps/providers-file-storage";
import { FILE_STORAGE_MAX_UPLOAD_BYTES } from "@sps/shared-utils";
import { Table } from "@sps/file-storage/models/file/backend/repository/database";
import {
  consistencyContext,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import type { Repository } from "../../repository";

interface IPrivateUpload {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  legacyOriginId?: string;
  ownerId?: string;
  variant?: string;
}

export class PrivateContent {
  private readonly directory = new PrivateDirectory();
  constructor(private readonly repository: Repository) {}

  async write(input: IPrivateUpload) {
    if (
      ![
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
        "audio/wav",
        "text/plain",
      ].includes(input.mimeType)
    ) {
      throw new Error("Validation error. Unsupported private file type");
    }
    return this.store(input);
  }

  writeKnowledgeMaterial(
    input: Pick<IPrivateUpload, "name" | "bytes" | "mimeType">,
  ) {
    return this.store({ ...input, variant: "knowledge-material" });
  }

  writeOpaque(input: Pick<IPrivateUpload, "name" | "bytes" | "ownerId">) {
    return this.store({ ...input, mimeType: "application/octet-stream" }, true);
  }

  private async store(input: IPrivateUpload, allowEmpty = false) {
    const name = input.name.trim();
    const bytes = Buffer.from(input.bytes);
    if (!name || name.length > 180 || /[\x00-\x1f\x7f/\\]/.test(name)) {
      throw new Error("Validation error. Invalid private file name");
    }
    if (
      (!bytes.length && !allowEmpty) ||
      bytes.length > FILE_STORAGE_MAX_UPLOAD_BYTES
    ) {
      throw new Error("Validation error. Private file size is out of range");
    }
    const digest = createHash("sha256").update(bytes).digest("hex");
    const id = randomUUID();
    await this.directory.write(id, bytes, digest);
    try {
      const [file] = await this.repository.db
        .insert(Table)
        .values({
          id,
          file: `private:${id}`,
          slug: `private-${id}`,
          adminTitle: name,
          size: bytes.length,
          mimeType: input.mimeType,
          privateDigest: digest,
          legacyOriginId: input.legacyOriginId,
          privateOwnerId: input.ownerId,
          variant: input.variant,
        })
        .returning({ createdAt: Table.createdAt });
      consistencyContext
        .getStore()
        ?.rollbackEffects?.push(() => this.directory.remove(id));
      return {
        id,
        name,
        size: bytes.length,
        mimeType: input.mimeType,
        digest,
        legacyOriginId: input.legacyOriginId ?? null,
        createdAt: file.createdAt,
      };
    } catch (error) {
      await this.directory.remove(id);
      throw error;
    }
  }

  async ownedBy(id: string, subjectId: string) {
    await trackRepositoryRead(Table, this.repository.db, {
      and: [{ column: "id", method: "eq", value: id }],
    });
    const [file] = await this.repository.db
      .select({ id: Table.id })
      .from(Table)
      .where(
        and(
          eq(Table.id, id),
          eq(Table.privateOwnerId, subjectId),
          isNotNull(Table.privateDigest),
        ),
      );
    return Boolean(file);
  }

  async metadataByIds(ids: string[]) {
    if (!ids.length) {
      return [];
    }
    await trackRepositoryRead(Table, this.repository.db, {
      and: [{ column: "id", method: "inArray", value: ids }],
    });
    return this.repository.db
      .select()
      .from(Table)
      .where(and(inArray(Table.id, ids), isNotNull(Table.privateDigest)));
  }

  async count() {
    await trackRepositoryRead(Table, this.repository.db);
    const [result] = await this.repository.db
      .select({ count: count() })
      .from(Table)
      .where(isNotNull(Table.privateDigest));
    return result.count;
  }

  async findById(input: {
    id: string;
    digest?: string;
    mimeType?: string;
    maxBytes?: number;
    variant?: string;
  }) {
    await trackRepositoryRead(Table, this.repository.db, {
      and: [{ column: "id", method: "eq", value: input.id }],
    });
    const [file] = await this.repository.db
      .select()
      .from(Table)
      .where(
        and(
          eq(Table.id, input.id),
          isNotNull(Table.privateDigest),
          input.digest ? eq(Table.privateDigest, input.digest) : undefined,
          input.mimeType ? eq(Table.mimeType, input.mimeType) : undefined,
          input.variant ? eq(Table.variant, input.variant) : undefined,
          input.maxBytes !== undefined
            ? lte(Table.size, input.maxBytes)
            : undefined,
        ),
      );
    if (!file || !file.privateDigest || file.size === null || !file.mimeType) {
      return null;
    }
    const bytes = await this.directory.read(
      file.id,
      file.privateDigest,
      file.size,
    );
    return {
      id: file.id,
      name: file.adminTitle,
      mimeType: file.mimeType,
      size: file.size,
      digest: file.privateDigest,
      bytes,
      createdAt: file.createdAt,
      legacyOriginId: file.legacyOriginId,
    };
  }

  async findByLegacyOrigin(origin: string) {
    await trackRepositoryRead(Table, this.repository.db, {
      and: [{ column: "legacyOriginId", method: "eq", value: origin }],
    });
    const [file] = await this.repository.db
      .select({ id: Table.id })
      .from(Table)
      .where(
        and(eq(Table.legacyOriginId, origin), isNotNull(Table.privateDigest)),
      );
    return file ? this.findById(file) : null;
  }

  async delete(input: { id: string; variant?: string }) {
    const effects = consistencyContext.getStore()?.rollbackEffects;
    let backup;
    if (effects) {
      backup = await this.findById(input);
    }
    const [row] = await this.repository.db
      .delete(Table)
      .where(
        and(
          eq(Table.id, input.id),
          isNotNull(Table.privateDigest),
          input.variant ? eq(Table.variant, input.variant) : undefined,
        ),
      )
      .returning({ id: Table.id });
    if (row) {
      await this.directory.remove(row.id);
      if (backup) {
        const { bytes, digest } = backup;
        effects?.push(() => this.directory.write(row.id, bytes, digest));
      }
    }
  }
}
