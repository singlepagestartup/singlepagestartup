import "reflect-metadata";
import { inject, injectable } from "inversify";
import {
  CRUDService,
  DI,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/crm/models/form/backend/repository/database";
import { Repository } from "../../repository";
import {
  FormDI,
  type INotificationModule,
  type ISubmissionServices,
} from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;
  notificationModule: INotificationModule;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(FormDI.INotificationModule) notificationModule: INotificationModule,
    @inject(FormDI.ISubmissionServices)
    private readonly submissions: ISubmissionServices,
  ) {
    super(repository);
    this.notificationModule = notificationModule;
  }
  async submit(props: {
    key: string;
    digest: string;
    formId: string;
    payload: Record<string, unknown>;
  }) {
    return this.repository.transaction(async (db) => {
      return withConsistencyDatabase(db, async () => {
        await this.repository.lockSubmission(props.key);
        const requestService = this.submissions.request.withTransaction(db);
        const relations = this.submissions.formsToRequests.withTransaction(db);
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
        return { request, created: true };
      });
    });
  }
}
