import * as path from "path";
import * as fs from "fs";
import type { IProvider } from "../interface";
import { logger } from "@sps/backend-utils";

export class Provider implements IProvider {
  folder: string;
  filesPath: string;
  baseUrl: string;

  constructor(props: { folder: string }) {
    const root = process.cwd();
    const storagePath = "public";

    this.folder = props.folder;
    const filesPath = path.join(root, storagePath, this.folder);
    this.filesPath = filesPath;
    this.baseUrl = this.folder;
  }

  async connect(): Promise<void> {
    return;
  }

  async uploadFile(props: {
    file: Buffer | Blob;
    options?: any;
  }): Promise<string> {
    const extension = (props.file as File).name.split(".").pop();

    if (!extension) {
      throw new Error("Invalid file extension");
    }

    const fileName = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);

    await fs.promises
      .stat(path.join(this.filesPath))
      .then(() => true)
      .catch(async () => {
        await fs.promises.mkdir(path.join(this.filesPath));
      });

    const filePath = path.join(this.filesPath, fileName + "." + extension);

    const buffer = await (props.file as File).arrayBuffer();

    await fs.promises.writeFile(filePath, Buffer.from(buffer) as any);

    const createdFileUrl = path.join(
      "/",
      this.baseUrl,
      fileName + "." + extension,
    );

    return createdFileUrl;
  }

  async getFile(props: { name: string }): Promise<Buffer | Blob | null> {
    const filePath = path.join(this.filesPath, this.folder + props.name);

    if (fs.existsSync(filePath)) {
      return await fs.promises.readFile(filePath);
    }

    return null;
  }

  async deleteFile(props: { name: string }): Promise<void> {
    const filePath = path.join(this.filesPath, props.name);

    const fileExists = await fs.promises
      .stat(filePath)
      .then(async () => {
        await fs.promises.unlink(filePath);
      })
      .catch((error) => {
        logger.error("providers ~ file-storage ~ deleteFile ~ error:", error);

        return false;
      });
  }
}
