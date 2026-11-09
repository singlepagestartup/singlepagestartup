import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { fetchOutboundUrl } from "@sps/backend-utils";
import { Table } from "@sps/file-storage/models/file/backend/repository/database";
import path from "path";
import { FILE_STORAGE_FOLDER, FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
import fs from "fs/promises";
import type { Repository } from "../../repository";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async lock(ids: string[], mode: "key share" | "update" = "key share") {
    return (this.repository as Repository).lock(ids, mode);
  }

  async readBytes(
    file: { file: string | null },
    options: { maxBytes?: number; timeoutMs?: number } = {},
  ) {
    const maxBytes = options.maxBytes ?? 100 * 1024 * 1024;
    if (!file.file) {
      throw new Error("Stored file has no location.");
    }
    if (/^https?:\/\//i.test(file.file)) {
      const response = await fetchOutboundUrl(
        file.file,
        { signal: AbortSignal.timeout(options.timeoutMs ?? 30000) },
        { maxResponseBytes: maxBytes, limitName: "stored file" },
      );

      if (!response.ok) {
        throw new Error(`Stored file could not be read: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();

      return Buffer.from(buffer);
    }
    const relative = path.normalize(file.file.replace(/^\/+/, ""));
    if (relative.startsWith("..")) {
      throw new Error("Validation error. Invalid file-storage path.");
    }
    for (const root of [
      path.join(process.cwd(), "public"),
      path.join(process.cwd(), "apps/api/public"),
    ]) {
      try {
        const location = path.join(root, relative);
        if ((await fs.stat(location)).size > maxBytes) {
          throw new Error(
            "Validation error. Stored file exceeds the byte-read limit.",
          );
        }
        return await fs.readFile(location);
      } catch (error: any) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }
    throw new Error(
      "Not Found error. Stored file is missing from file storage.",
    );
  }

  async importPath(props: {
    filePath: string;
    slug: string;
    validate?: (bytes: Uint8Array) => void;
  }) {
    const bytes = await fs.readFile(props.filePath);
    props.validate?.(bytes);
    const name = path.basename(props.filePath);
    const { fileTypeFromBuffer } = await import("file-type");
    const detected = await fileTypeFromBuffer(bytes);
    let dimensions = { width: 0, height: 0 };
    try {
      const { imageSize } = await import("image-size");
      const size = imageSize(bytes);
      dimensions = { width: size.width || 0, height: size.height || 0 };
    } catch {
      /* Text and non-image files have no dimensions. */
    }
    const provider = new Provider({
      type: FILE_STORAGE_PROVIDER,
      folder: FILE_STORAGE_FOLDER,
    });
    const file = Object.assign(bytes, {
      name,
      arrayBuffer: async () => Uint8Array.from(bytes).buffer,
    });
    const location = await provider.uploadFile({ file });
    return this.create({
      data: {
        file: location,
        slug: props.slug,
        adminTitle: name,
        alt: name,
        size: bytes.length,
        extension: detected?.ext || path.extname(name).slice(1),
        mimeType: detected?.mime || "text/plain",
        ...dimensions,
      },
    });
  }

  async delete(props: { id: string }): Promise<typeof Table.$inferSelect> {
    const previous = await this.findById(props);
    const fileName = previous?.file?.split("/").pop();
    if (fileName) {
      const fileStorage = new Provider({
        type: FILE_STORAGE_PROVIDER,
        folder: FILE_STORAGE_FOLDER,
      });
      await fileStorage.deleteFile({ name: fileName });
    }
    return super.delete(props);
  }

  async getUniqueFileName({
    extension,
  }: {
    extension: string;
  }): Promise<string> {
    const fileName = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);

    const root = process.cwd();
    const filePath = path.join(root, "public", fileName + "." + extension);

    try {
      await fs.access(filePath);
      return await this.getUniqueFileName({ extension });
    } catch {
      return fileName;
    }
  }
}
