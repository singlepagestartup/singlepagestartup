import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/file-storage/models/file/backend/repository/database";
import path from "path";
import fs from "fs/promises";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async getUniqueFileName({
    extension,
  }: {
    extension: string;
  }): Promise<string> {
    const fileName = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);

    const root = process.cwd();
    const filePath = path.join(root, "public", fileName + "." + extension);

    try {
      await fs.access(filePath);
      return await this.getUniqueFileName({ extension });
    } catch {
      return fileName;
    }
  }
}
