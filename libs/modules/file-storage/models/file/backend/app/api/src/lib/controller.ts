import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/file-storage/models/file/backend/repository/database";
import { HTTPException } from "hono/http-exception";
import { Context } from "hono";
import { Service } from "./service";
import { Provider } from "@sps/providers-file-storage";
import { FILE_STORAGE_PROVIDER } from "@sps/shared-utils";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.service = service;
    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "POST",
        path: "/",
        handler: this.create,
      },
      {
        method: "POST",
        path: "/create-from-url",
        handler: this.createFromUrl,
      },
      {
        method: "PATCH",
        path: "/:uuid",
        handler: this.update,
      },
      {
        method: "DELETE",
        path: "/:uuid",
        handler: this.delete,
      },
    ]);
  }

  async create(c: Context, next: any): Promise<Response> {
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
      data[name] = "";
      const createdEntity = await this.service.create({ data });

      const fileStorage = new Provider({
        type: FILE_STORAGE_PROVIDER,
        folder: "file-storage",
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
  }

  async createFromUrl(c: Context, next: any): Promise<Response> {
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
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async update(c: Context, next: any): Promise<Response> {
    const uuid = c.req.param("uuid");

    if (!uuid) {
      return c.json(
        {
          message: "Invalid id",
        },
        {
          status: 400,
        },
      );
    }

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
        throw new HTTPException(400, {
          message: "Multiple files are not allowed",
        });
      }

      if (typeof file === "string") {
        throw new HTTPException(400, {
          message: "Invalid file type",
        });
      }

      const fileStorage = new Provider({
        type: FILE_STORAGE_PROVIDER,
        folder: "file-storage",
      });
      const uploadedFileUrl = await fileStorage.uploadFile({
        file: file,
      });

      const data: any = parsedBody.data ?? {};
      data[name] = uploadedFileUrl;

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

    throw new HTTPException(400, {
      message: "Invalid file",
    });
  }

  async delete(c: Context, next: any): Promise<Response> {
    const uuid = c.req.param("uuid");

    if (!uuid) {
      return c.json(
        {
          message: "Invalid id",
        },
        {
          status: 400,
        },
      );
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

    return await super.delete(c, next);
  }

  catch(error: any) {
    throw new HTTPException(400, {
      message: error.message,
    });
  }
}
