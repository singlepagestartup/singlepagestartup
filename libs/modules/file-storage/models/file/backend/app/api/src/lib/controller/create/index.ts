import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { FILE_STORAGE_FOLDER, FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
import { fileTypeFromBuffer } from "file-type";
import { imageSize } from "image-size";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const body = await c.req.parseBody();

      if (!body) {
        throw new HTTPException(400, {
          message: "Invalid body",
        });
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

      if (body?.["data"]) {
        if (typeof body["data"] === "string") {
          parsedBody.data = JSON.parse(body["data"]);
        }
      }

      for (const [name, file] of Object.entries(parsedBody.files)) {
        if (Array.isArray(file)) {
          throw new HTTPException(400, {
            message: "Multiple files are not allowed",
          });
        }

        if (typeof file === "string") {
          throw new HTTPException(400, {
            message: "Invalid file type",
          });
        }

        const data: any = parsedBody.data ?? {};

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

        data[name] = "";
        const createdEntity = await this.service.create({ data });

        const fileStorage = new Provider({
          type: FILE_STORAGE_PROVIDER,
          folder: FILE_STORAGE_FOLDER,
        });
        const uploadedFileUrl = await fileStorage.uploadFile({
          file: file,
        });

        data[name] = uploadedFileUrl;

        const entity = await this.service.update({
          id: createdEntity.id,
          data,
        });

        return c.json(
          {
            data: entity,
          },
          201,
        );
      }

      throw new HTTPException(400, {
        message: "Invalid file",
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
