import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { FILE_STORAGE_FOLDER, FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
import { fileTypeFromBuffer } from "file-type";
import { imageSize } from "image-size";
import { getHttpErrorType, parseSingleFileUpload } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. Invalid id. Got: " + uuid);
      }

      const body = await c.req.parseBody({ all: true });

      const { upload, metadata } = parseSingleFileUpload(body);
      const data: any = metadata ?? {};
      if (!upload) {
        if (!metadata) {
          throw new Error("Validation error. File metadata is required");
        }

        const entity = await this.service.update({ id: uuid, data });
        return c.json({ data: entity }, 200);
      }

      const { name, file } = upload;

      const fileStorage = new Provider({
        type: FILE_STORAGE_PROVIDER,
        folder: FILE_STORAGE_FOLDER,
      });
      const uploadedFileUrl = await fileStorage.uploadFile({
        file,
      });

      data[name] = uploadedFileUrl;

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
      data["mimeType"] = file.type.startsWith("audio/")
        ? file.type
        : (fileType?.mime ?? "");

      try {
        const dimensions = imageSize(Buffer.from(fileBuffer));
        const { width, height } = dimensions;
        data["width"] = width;
        data["height"] = height;
      } catch (error: any) {
        data["width"] = 0;
        data["height"] = 0;
      }

      const previous = await this.service.findById({ id: uuid });

      const entity = await this.service.update({ id: uuid, data });

      if (previous?.file) {
        const fileName = previous.file.split("/").pop();

        if (fileName) {
          await fileStorage.deleteFile({ name: fileName });
        }
      }

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
