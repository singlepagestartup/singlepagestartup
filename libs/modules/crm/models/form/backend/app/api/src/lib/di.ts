import type { Service as RequestService } from "@sps/crm/models/request/backend/app/api/src/lib/service";
import type { Service as FormsToRequestsService } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/service";

export interface ISubmissionServices {
  request: RequestService;
  formsToRequests: FormsToRequestsService;
}

export interface IReadService {
  find: (props?: any) => Promise<any>;
  findById: (props: { id: string }) => Promise<any>;
}

export interface INotificationModule {
  topic: IReadService;
  template: IReadService;
}

export const FormDI = {
  ISubmissionServices: Symbol.for("crm.form.submission.services"),
  INotificationModule: Symbol.for("crm.form.notification.module"),
};
