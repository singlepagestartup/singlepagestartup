import type { IRequestSubmission as ICrmRequestSubmission } from "@sps/crm/models/request/sdk/model";
import { serverHost, route, IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  id: string;
  crmModuleFormId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: ICrmRequestSubmission;
}

export type IResult = IModel & {
  submissionResult: {
    saved: true;
    requestId: string;
    formId: string;
    notificationStatus: "queued" | "sent" | "failed";
    replayed: boolean;
  };
};

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    crmModuleFormId,
    params,
    data,
    options,
    host = serverHost,
  } = props;

  const formData = prepareFormDataToSend({ data });

  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(
    `${host}${route}/${id}/crm-module/form/${crmModuleFormId}/request?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
