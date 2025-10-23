import { BLOB_READ_WRITE_TOKEN } from "@sps/shared-utils";
import { IProvider } from "../interface";
import { del, list, put } from "@vercel/blob";

export class Provider implements IProvider {
  folder: string;
  client: {
    put: typeof put;
    delete: typeof del;
    get: typeof list;
  };

  constructor(props: { folder: string }) {
    this.folder = props.folder;
    this.client = {
      put,
      delete: del,
      get: list,
    };
  }

  async connect(): Promise<void> {
    if (!BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "Configuration error. BLOB_READ_WRITE_TOKEN is not defined",
      );
    }

    return;
  }

  async uploadFile(props: {
    file: Buffer | Blob;
    options?: {
      multipart?: boolean;
    };
  }): Promise<string> {
    const extension = (props.file as File).name.split(".").pop();

    if (!extension) {
      throw new Error("Validation error. Invalid file extension");
    }

    const fileName = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);

    const result = await this.client.put(
      `${this.folder}/${fileName}.${extension}`,
      props.file,
      {
        access: "public",
        multipart: props.options?.multipart || false,
      },
    );

    return result.url;
  }

  async getFile(props: { name: string }): Promise<Buffer | Blob | null> {
    const result = await this.client.get({
      prefix: this.folder + "/",
    });

    const blob = result.blobs.find(async (blob) => {
      if (blob.pathname.includes(props.name)) {
        return blob;
      }

      return;
    });

    if (!blob) {
      return null;
    }

    const file = await fetch(blob.downloadUrl).then((res) => {
      return res.blob();
    });

    return file;
  }

  async deleteFile(props: { name: string }): Promise<void> {
    const result = await this.client.get({
      prefix: this.folder + "/",
    });

    const blob = result.blobs.find(async (blob) => {
      if (blob.pathname.includes(props.name)) {
        return blob;
      }

      return;
    });

    if (!blob) {
      return;
    }

    await this.client.delete(blob.url);
  }
}
