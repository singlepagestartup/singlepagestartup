import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import {
  FILE_STORAGE_FOLDER,
  FILE_STORAGE_MAX_UPLOAD_BYTES,
  FILE_STORAGE_PROVIDER,
} from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
import { fileTypeFromBuffer } from "file-type";
import { imageSize } from "image-size";
import { getHttpErrorType } from "@sps/backend-utils";

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

      const data = JSON.parse(body["data"]);

      if (!data.url) {
        throw new Error("Validation error. Invalid url");
      }

      const file = await fetch(data.url)
        .then(async (res) => {
          return await this.readBody(res);
        })
        .then((blob) => {
          const fullFileName = data.url.split("?")[0].split("/").pop();
          const fileName = fullFileName.split(".")[0];
          const extension = fullFileName.split(".").pop();

          return new File([blob], `${fileName}.${extension}`);
        });

      if (!file) {
        throw new Error("Validation error. Invalid file");
      }

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

  /**
   * Reads a fetched body of at most `FILE_STORAGE_MAX_UPLOAD_BYTES` (issue
   * #304). A declared `Content-Length` above the limit is refused before the
   * body is read; any other body is counted while it streams, and the stream
   * is cancelled as soon as it passes the limit.
   */
  protected async readBody(response: Response) {
    if (
      Number(response.headers.get("content-length")) >
      FILE_STORAGE_MAX_UPLOAD_BYTES
    ) {
      await response.body?.cancel();

      throw new Error(
        `Validation error. Payload Too Large. The upload limit is ${FILE_STORAGE_MAX_UPLOAD_BYTES} bytes`,
      );
    }

    if (!response.body) {
      return await response.blob();
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;

    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      size += value.byteLength;

      if (size > FILE_STORAGE_MAX_UPLOAD_BYTES) {
        await reader.cancel();

        throw new Error(
          `Validation error. Payload Too Large. The upload limit is ${FILE_STORAGE_MAX_UPLOAD_BYTES} bytes`,
        );
      }

      chunks.push(value);
    }

    return new Blob(chunks);
  }
}
