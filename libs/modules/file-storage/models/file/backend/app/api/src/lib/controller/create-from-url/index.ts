import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
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

      if (typeof body["data"] !== "string") {
        throw new HTTPException(400, {
          message: "Invalid data",
        });
      }

      const data = JSON.parse(body["data"]);

      if (!data.url) {
        throw new HTTPException(400, {
          message: "Invalid url",
        });
      }

      const file = await fetch(data.url)
        .then(async (res) => {
          return await res.blob();
        })
        .then((blob) => {
          const fullFileName = data.url.split("?")[0].split("/").pop();
          const fileName = fullFileName.split(".")[0];
          const extension = fullFileName.split(".").pop();

          return new File([blob], `${fileName}.${extension}`);
        });

      if (!file) {
        throw new HTTPException(400, {
          message: "Invalid file",
        });
      }

      const fileStorage = new Provider({
        type: FILE_STORAGE_PROVIDER,
        folder: "file-storage",
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
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
