import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import {
  FILE_STORAGE_FOLDER,
  FILE_STORAGE_MAX_UPLOAD_BYTES,
  FILE_STORAGE_PROVIDER,
  HOST_SERVICE_URL,
} from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
import { fileTypeFromBuffer } from "file-type";
import { imageSize } from "image-size";
import { fetchOutboundUrl, getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const body = await c.req.parseBody();

      if (!body) {
        throw new Error("Validation error. Invalid body");
      }

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid data");
      }

      let data: Record<string, unknown>;

      try {
        data = JSON.parse(body["data"]);
      } catch {
        throw new Error("Validation error. Invalid data");
      }

      if (
        !data ||
        typeof data !== "object" ||
        typeof data.url !== "string" ||
        !data.url
      ) {
        throw new Error("Validation error. Invalid url");
      }

      let url: URL;

      try {
        url = new URL(data.url);
      } catch {
        throw new Error("Validation error. Invalid url");
      }

      // The generate action uses this one internal endpoint. A caller's URL
      // must not grant access to other API or Host routes on the same origin.
      const imageGeneratorUrl = new URL(
        "/api/image-generator/image.png",
        HOST_SERVICE_URL,
      );
      imageGeneratorUrl.search = url.search;

      const response = await fetchOutboundUrl(
        url,
        { signal: c.req.raw.signal },
        {
          maxResponseBytes: FILE_STORAGE_MAX_UPLOAD_BYTES,
          limitName: "upload",
          allowedUrl: imageGeneratorUrl.href,
        },
      );

      if (!response.ok) {
        throw new Error(
          "Validation error. Download URL did not return a successful response",
        );
      }

      const blob = await response.blob();
      const fileName = url.pathname.split("/").pop() || "download";
      const file = new File([blob], fileName);

      const fileStorage = new Provider({
        type: FILE_STORAGE_PROVIDER,
        folder: FILE_STORAGE_FOLDER,
      });

      const uploadedFileUrl = await fileStorage.uploadFile({
        file: file,
      });

      const fileBuffer = await file.arrayBuffer();
      let fileType = await fileTypeFromBuffer(Buffer.from(fileBuffer));

      if (!fileType && file.name.toLowerCase().endsWith(".svg")) {
        fileType = {
          ext: "svg",
          mime: "image/svg+xml",
        };
      }

      const fileSize = file.size;
      data["size"] = fileSize;

      data["extension"] = fileType?.ext ?? "";
      data["mimeType"] = fileType?.mime ?? "";

      try {
        const dimensions = imageSize(Buffer.from(fileBuffer));
        const { width, height } = dimensions;
        data["width"] = width;
        data["height"] = height;
      } catch (error: any) {
        data["width"] = 0;
        data["height"] = 0;
      }

      const entity = await this.service.create({
        data: {
          ...data,
          file: uploadedFileUrl,
        },
      });

      return c.json(
        {
          data: entity,
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
