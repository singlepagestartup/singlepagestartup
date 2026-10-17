import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/thread/backend/repository/database";
import { Repository } from "../../repository";
import type { IThreadMetadataNamespaceUpdate } from "@sps/social/models/thread/sdk/model";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async updateMetadataNamespace(
    props: IThreadMetadataNamespaceUpdate & { id: string },
  ) {
    return (this.repository as Repository).updateMetadataNamespace(props);
  }

  async update(props: { id: string; data: any }) {
    if (
      Object.prototype.hasOwnProperty.call(
        props.data,
        "metadataNamespaceUpdate",
      )
    ) {
      if (Object.keys(props.data).length !== 1)
        throw new Error(
          "Validation error. A metadata namespace update cannot include other fields",
        );
      const input = props.data.metadataNamespaceUpdate;
      if (
        !input ||
        typeof input.namespace !== "string" ||
        !Object.prototype.hasOwnProperty.call(input, "expectedValue") ||
        !Object.prototype.hasOwnProperty.call(input, "value")
      )
        throw new Error("Validation error. Invalid metadata namespace update");
      return this.updateMetadataNamespace({ ...input, id: props.id });
    }
    return super.update(props);
  }
}
