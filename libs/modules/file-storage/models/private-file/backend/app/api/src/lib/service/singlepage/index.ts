import "reflect-metadata";
import { createHash } from "node:crypto";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { FILE_STORAGE_MAX_UPLOAD_BYTES } from "@sps/shared-utils";
import { Table } from "@sps/file-storage/models/private-file/backend/repository/database";

interface IWritePrivateFile {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  legacyOriginId?: string;
}

type TOpaquePrivateFile = Pick<IWritePrivateFile, "name" | "bytes">;

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  async write(props: IWritePrivateFile) {
    const supported = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "audio/wav",
    ];
    if (!supported.includes(props.mimeType)) {
      throw new Error("Validation error. Unsupported private file type");
    }
    return this.store(props);
  }

  async writeOpaque(props: TOpaquePrivateFile) {
    return this.store({ ...props, mimeType: "application/octet-stream" }, true);
  }

  private async store(props: IWritePrivateFile, allowEmpty = false) {
    const name = props.name.trim();
    const bytes = Buffer.from(props.bytes);
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
    const { bytes: storedBytes, ...description } = await this.insert({
      name,
      mimeType: props.mimeType,
      size: bytes.length,
      digest,
      legacyOriginId: props.legacyOriginId,
      bytes,
    });
    return description;
  }

  override async create(): Promise<never> {
    throw new Error("Forbidden error. Use the protected file writer");
  }

  override async findOrCreate(): Promise<never> {
    throw new Error("Forbidden error. Use the protected file writer");
  }

  override async update(): Promise<never> {
    throw new Error("Forbidden error. Private file bytes are immutable");
  }
}
