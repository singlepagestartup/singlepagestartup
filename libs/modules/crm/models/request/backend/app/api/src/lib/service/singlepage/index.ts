import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/models/request/backend/repository/database";
import type { Repository } from "../../repository";

type Request = typeof Table.$inferSelect;
export type TNotificationStatus = "queued" | "sent" | "failed";
@injectable()
@injectFromBase()
export class Service extends CRUDService<Request> {
  private owner() {
    return this.repository as Repository;
  }
  withTransaction(db: Repository["db"]): this {
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
    if (rows.length > 1) {
      throw new Error(
        "Internal error. Multiple CRM Requests share a submission key",
      );
    }
    const row = rows[0];
    if (row && row.payload?.submissionDigest !== props.digest) {
      throw new Error(
        "Validation error. Submission ID was already used with different values",
      );
    }
    return row;
  }
  async setSubmissionNotificationStatus(props: {
    id: string;
    key: string;
    status: TNotificationStatus;
  }): Promise<Request> {
    const request = await this.owner().transaction(async (db) => {
      const scope = this.withTransaction(db);
      await scope.owner().lockSubmission(props.key);
      const current = await scope.findById({ id: props.id });
      if (!current || current.payload?.submissionKey !== props.key) {
        throw new Error("Not Found error. CRM submission was not found");
      }
      const saved = await scope.update({
        id: props.id,
        data: {
          ...current,
          payload: { ...current.payload, notificationStatus: props.status },
        },
      });
      if (!saved) {
        throw new Error("Not Found error. CRM submission was not found");
      }
      return saved;
    });
    return request;
  }
}
