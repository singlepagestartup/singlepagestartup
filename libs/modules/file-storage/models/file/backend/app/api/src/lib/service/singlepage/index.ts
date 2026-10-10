import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/file-storage/models/file/backend/repository/database";
import path from "path";
import { FILE_STORAGE_FOLDER, FILE_STORAGE_PROVIDER } from "@sps/shared-utils";
import { Provider } from "@sps/providers-file-storage";
import fs from "fs/promises";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async delete(props: { id: string }): Promise<typeof Table.$inferSelect> {
    const previous = await this.findById(props);
    const fileName = previous?.file?.split("/").pop();
    if (fileName) {
      const fileStorage = new Provider({
        type: FILE_STORAGE_PROVIDER,
        folder: FILE_STORAGE_FOLDER,
      });
      await fileStorage.deleteFile({ name: fileName });
    }
    return super.delete(props);
  }

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
