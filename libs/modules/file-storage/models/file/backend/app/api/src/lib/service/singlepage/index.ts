import { createModules } from "@sps/file-storage/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService, type FindServiceProps } from "@sps/shared-backend-api";
import { fetchOutboundUrl } from "@sps/backend-utils";
import { createHash } from "node:crypto";
import { deflate } from "pako";
import QueryString from "qs";
import { Table } from "@sps/file-storage/models/file/backend/repository/database";
import path from "path";
import {
  AWS_S3_BUCKET_NAME,
  FILE_STORAGE_FOLDER,
  FILE_STORAGE_MAX_UPLOAD_BYTES,
  FILE_STORAGE_PROVIDER,
  HOST_SERVICE_URL,
} from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
import fs from "fs/promises";
import type { Repository, TCommerceReceiptGuard } from "../../repository";
import { isLegacyOrderReceipt } from "@sps/file-storage/models/file/sdk/model";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;

  configureCommerceReceiptGuard(guard: TCommerceReceiptGuard) {
    this.repository.commerceReceiptGuard = guard;
  }

  async isProtectedPublicReceipt(
    file: Pick<typeof Table.$inferSelect, "id" | "file" | "adminTitle">,
  ) {
    return (
      isLegacyOrderReceipt(file) ||
      (await this.repository.commerceReceiptGuard?.([file]))?.has(file.id) ===
        true
    );
  }

  async publicMetadata(props: FindServiceProps) {
    const files = (await this.find(props)).filter(
      (file) => !isLegacyOrderReceipt(file),
    );
    return this.repository.withoutCommerceReceipts(files);
  }

  storedObjectKey(location: string) {
    if (/^https?:\/\//i.test(location)) {
      return location;
    }
    return path.normalize(
      location.replace(/^\/+/, "").replace(/^public\//, ""),
    );
  }

  findStoredObjectMetadata(locations: string[]) {
    const candidates = [
      ...new Set(
        locations.flatMap((location) => {
          const key = this.storedObjectKey(location);
          if (/^https?:\/\//i.test(key)) {
            return [key];
          }
          return [location, key, `/${key}`, `public/${key}`, `/public/${key}`];
        }),
      ),
    ];
    if (!candidates.length) {
      return Promise.resolve([]);
    }
    return this.find({
      params: {
        filters: {
          and: [{ column: "file", method: "inArray", value: candidates }],
        },
      },
    });
  }

  imageGeneratorUrl(data: {
    variant: string;
    width?: number;
    height?: number;
  }) {
    const compressed = deflate(JSON.stringify(data));
    const query = QueryString.stringify({
      variant: data.variant,
      width: data.width ?? 500,
      height: data.height ?? 500,
      data: Buffer.from(compressed).toString("base64"),
    });
    return `${HOST_SERVICE_URL}/api/image-generator/image.png?${query}`;
  }

  async renderOrderReceipt(data: {
    variant: string;
    width?: number;
    height?: number;
  }) {
    const url = this.imageGeneratorUrl(data);
    const response = await fetchOutboundUrl(
      url,
      { signal: AbortSignal.timeout(30000) },
      {
        allowedUrl: url,
        maxResponseBytes: FILE_STORAGE_MAX_UPLOAD_BYTES,
        limitName: "order receipt",
      },
    );
    if (
      !response.ok ||
      response.headers.get("content-type")?.split(";")[0] !== "image/png"
    ) {
      throw new Error("Conflict error. Order receipt could not be rendered");
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  async lock(ids: string[], mode: "key share" | "update" = "key share") {
    return (this.repository as Repository).lock(ids, mode);
  }

  withFileLock<T>(id: string, operation: () => Promise<T>) {
    return (this.repository as Repository).withFileLock(id, operation);
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
    const relative = this.storedObjectKey(file.file);
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

  async withdrawPublicReceipt(location: string, expectedDigest: string) {
    if (/^https?:\/\//i.test(location)) {
      const url = new URL(location);
      const visible = await this.isPublicReceiptVisible(url);
      if (!visible) {
        return;
      }
      const prefix = `/${FILE_STORAGE_FOLDER.replace(/^\/+|\/+$/g, "")}/`;
      const name = url.pathname.slice(prefix.length);
      if (
        FILE_STORAGE_PROVIDER !== "aws-s3" ||
        url.hostname !== `${AWS_S3_BUCKET_NAME}.s3.amazonaws.com` ||
        !url.pathname.startsWith(prefix) ||
        !/^[a-z0-9_.-]+$/i.test(name)
      ) {
        throw new Error(
          "Conflict error. Retire the legacy object at its storage provider and purge its CDN URL",
        );
      }
      const bytes = await this.readBytes({ file: location });
      this.verifyPublicReceipt(bytes, expectedDigest);
      const provider = new Provider({
        type: FILE_STORAGE_PROVIDER,
        folder: FILE_STORAGE_FOLDER,
      });
      await provider.deleteFile({ name });
      if (await this.isPublicReceiptVisible(url)) {
        throw new Error(
          "Conflict error. The old receipt URL still serves content",
        );
      }
      return;
    }

    const relative = this.storedObjectKey(location);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Validation error. Invalid legacy receipt path");
    }
    const candidates: string[] = [];
    for (const root of [
      path.join(process.cwd(), "public"),
      path.join(process.cwd(), "apps/api/public"),
    ]) {
      const source = path.join(root, relative);
      try {
        const realRoot = await fs.realpath(root);
        const realSource = await fs.realpath(source);
        if (
          !realSource.startsWith(`${realRoot}${path.sep}`) ||
          (await fs.lstat(source)).isSymbolicLink()
        ) {
          throw new Error(
            "Conflict error. Legacy receipt must be a stored public file",
          );
        }
        this.verifyPublicReceipt(await fs.readFile(source), expectedDigest);
        candidates.push(source);
      } catch (error) {
        if ((error as NodeJS.ErrnoException | null)?.code !== "ENOENT") {
          throw error;
        }
      }
    }
    for (const source of candidates) {
      await fs.unlink(source);
    }
    for (const source of candidates) {
      const exists = await fs.access(source).then(
        () => true,
        () => false,
      );
      if (exists) {
        throw new Error(
          "Conflict error. The old receipt path still serves content",
        );
      }
    }
  }

  private verifyPublicReceipt(bytes: Uint8Array, expectedDigest: string) {
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (digest !== expectedDigest) {
      throw new Error(
        "Conflict error. The public receipt changed after its protected copy was checked",
      );
    }
  }

  private async isPublicReceiptVisible(url: URL) {
    const audit = new URL(url);
    audit.searchParams.set("receipt-audit", String(Date.now()));
    for (const current of [url, audit]) {
      const response = await fetchOutboundUrl(current.toString(), {
        method: "HEAD",
        headers: { "Cache-Control": "no-cache" },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        return true;
      }
      if (![403, 404, 410].includes(response.status)) {
        throw new Error(
          "Conflict error. The old receipt URL could not be verified",
        );
      }
    }
    return false;
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
