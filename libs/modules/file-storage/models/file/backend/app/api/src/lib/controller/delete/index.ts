import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new HTTPException(400, {
          message: "Invalid id. Got: " + uuid,
        });
      }

      const previous = await this.service.findById({ id: uuid });
      if (previous?.file) {
        const fileName = previous.file.split("/").pop();

        if (fileName) {
          const fileStorage = new Provider({
            type: FILE_STORAGE_PROVIDER,
            folder: "file-storage",
          });
          await fileStorage.deleteFile({ name: fileName });
        }
      }

      const data = await this.service.delete({ id: uuid });

      return c.json({
        data,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
