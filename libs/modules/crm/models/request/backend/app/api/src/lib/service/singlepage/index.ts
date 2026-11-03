import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/models/request/backend/repository/database";
import type { Repository } from "../../repository";
import type { Service as FormsToRequestsService } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/service";

type Request = typeof Table.$inferSelect;
export type TNotificationStatus = "queued" | "sent" | "failed";
export interface ISubmissionProps {
  key: string;
  digest: string;
  formId: string;
  payload: Record<string, unknown>;
}
@injectable()
export class Service extends CRUDService<Request> {
  private submissionRelations?: FormsToRequestsService;
  configureSubmissions(props: { formsToRequests: FormsToRequestsService }) {
    this.submissionRelations = props.formsToRequests;
  }
  private owner() {
    return this.repository as Repository;
  }
  private scoped(db: Repository["db"]): this {
    const repository = Object.assign(
      Object.create(Object.getPrototypeOf(this.repository)),
      this.repository,
      { db },
    );
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, {
      repository,
    });
  }
  async findSubmission(props: {
    key: string;
    digest: string;
  }): Promise<Request | undefined> {
    const rows = await this.find({
      params: {
        filters: {
          and: [
            {
              column: "payload->>submissionKey",
              method: "eq",
              value: props.key,
            },
          ],
        },
      },
    });
    if (rows.length > 1)
      throw new Error(
        "Internal error. Multiple CRM Requests share a submission key",
      );
    const row = rows[0];
    if (row && row.payload?.submissionDigest !== props.digest)
      throw new Error(
        "Validation error. Submission ID was already used with different values",
      );
    return row;
  }
  async submit(
    props: ISubmissionProps,
  ): Promise<{ request: Request; created: boolean }> {
    if (!this.submissionRelations)
      throw new Error(
        "Configuration error. CRM submission relations are not configured",
      );
    const result = await this.owner().transaction(async (db) => {
      const scope = this.scoped(db);
      await scope.owner().lockSubmission(props.key);
      const existing = await scope.findSubmission(props);
      if (existing) return { request: existing, created: false };
      const request = await scope.create({
        data: {
          payload: {
            ...props.payload,
            submissionKey: props.key,
            submissionDigest: props.digest,
            notificationStatus: "queued",
          },
        },
      });
      await this.submissionRelations!.withTransaction(db).create({
        data: { formId: props.formId, requestId: request.id },
      });
      return { request, created: true };
    });
    return result;
  }
  async setSubmissionNotificationStatus(props: {
    id: string;
    key: string;
    status: TNotificationStatus;
  }): Promise<Request> {
    const request = await this.owner().transaction(async (db) => {
      const scope = this.scoped(db);
      await scope.owner().lockSubmission(props.key);
      const current = await scope.findById({ id: props.id });
      if (!current || current.payload?.submissionKey !== props.key)
        throw new Error("Not Found error. CRM submission was not found");
      const saved = await scope.update({
        id: props.id,
        data: {
          ...current,
          payload: { ...current.payload, notificationStatus: props.status },
        },
      });
      if (!saved)
        throw new Error("Not Found error. CRM submission was not found");
      return saved;
    });
    return request;
  }
}
