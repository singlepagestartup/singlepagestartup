import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { FILE_STORAGE_FOLDER, FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
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
      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Invalid id. Got: " + uuid);
      }

      const body = await c.req.parseBody();

      if (!body) {
        throw new Error("Invalid body");
      }

      const parsedBody: {
        data?: {
          [key: string]: any;
        };
        files?: {
          [key: string]: File;
        };
      } = {};

      Object.keys(body).forEach((key) => {
        if (body[key] instanceof File) {
          const file = body[key] as File;

          if (!parsedBody.files) {
            parsedBody.files = {};
          }

          parsedBody.files = {
            ...parsedBody.files,
            [key]: file,
          };
        }
      });

      if (body?.["data"]) {
        if (typeof body["data"] === "string") {
          parsedBody.data = JSON.parse(body["data"]);
        }
      }

      if (!parsedBody.files) {
        const entity = await this.service.create({
          data: parsedBody.data,
        });

        return c.json(
          {
            data: entity,
          },
          201,
        );
      }

      for (const [name, file] of Object.entries(parsedBody.files)) {
        if (Array.isArray(file)) {
          throw new Error("Multiple files are not allowed");
        }

        if (typeof file === "string") {
          throw new Error("Invalid file type");
        }

        const fileStorage = new Provider({
          type: FILE_STORAGE_PROVIDER,
          folder: FILE_STORAGE_FOLDER,
        });
        const uploadedFileUrl = await fileStorage.uploadFile({
          file: file,
        });

        const data: any = parsedBody.data ?? {};
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
      }

      throw new Error("Invalid file");
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
