import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { FILE_STORAGE_FOLDER, FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
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

      const previous = await this.service.findById({ id: uuid });
      if (previous?.file) {
        const fileName = previous.file.split("/").pop();

        if (fileName) {
          const fileStorage = new Provider({
            type: FILE_STORAGE_PROVIDER,
            folder: FILE_STORAGE_FOLDER,
          });
          await fileStorage.deleteFile({ name: fileName });
        }
      }

      const data = await this.service.delete({ id: uuid });

      return c.json({
        data,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
