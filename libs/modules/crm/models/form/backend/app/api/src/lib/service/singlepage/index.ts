import { createModule } from "../module";
import { createModules } from "@sps/crm/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService, withConsistencyDatabase } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/models/form/backend/repository/database";
import { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  declare repository: Repository;
  async submit(
    props: {
      key: string;
      digest: string;
      formId: string;
      payload: Record<string, unknown>;
    },
    onSaved?: (requestId: string) => Promise<unknown>,
  ) {
    return this.repository.transaction(async (db) => {
      return withConsistencyDatabase(db, async () => {
        await this.repository.lockSubmission(props.key);
        const requestService = this.module.request.withTransaction(db);
        const relations = this.module.formsToRequests.withTransaction(db);
        const existing = await requestService.findSubmission(props);
        if (existing) {
          return { request: existing, created: false };
        }
        const request = await requestService.create({
          data: {
            payload: {
              ...props.payload,
              submissionKey: props.key,
              submissionDigest: props.digest,
              notificationStatus: "queued",
            },
          },
        });
        await relations.create({
          data: { formId: props.formId, requestId: request.id },
        });
        if (onSaved) {
          await onSaved(request.id);
        }
        return { request, created: true };
      });
    });
  }
}
