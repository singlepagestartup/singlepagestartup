import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/file-storage/models/file/backend/repository/database";
import path from "path";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { KnowledgeRepository } from "@sps/knowledge/backend/app/api/src/lib/repository";
import fs from "fs/promises";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async delete(props: { id: string }): Promise<typeof Table.$inferSelect> {
    return (await this.mutate({ action: "delete", ...props }))!;
  }

  async update(props: {
    id: string;
    data: typeof Table.$inferSelect;
  }): Promise<typeof Table.$inferSelect | null> {
    return this.mutate({ action: "update", ...props });
  }

  private async mutate(
    props: Parameters<KnowledgeRepository["mutateStoredFile"]>[0],
  ) {
    const result = await new KnowledgeRepository().mutateStoredFile(props);
    const results = await Promise.allSettled(
      result.sourceIds.map((sourceId) =>
        new KnowledgeService().rebuildFiles(sourceId),
      ),
    );
    for (const result of results)
      if (result.status === "rejected")
        console.error(
          "Knowledge rebuild after stored file change failed",
          result.reason,
        );
    return result.file;
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
