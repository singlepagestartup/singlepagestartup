import { serverHost, route, IModel } from "@sps/crm/models/form/sdk/model";
import { IModel as IRequest } from "@sps/crm/models/request/sdk/model";
import { IModel as IFormToRequest } from "@sps/crm/relations/forms-to-requests/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  id: string;
  host?: string;
  catchErrors?: boolean;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    [key: string]: any;
  };
}

export type IResult = IModel & {
  formsToRequests: IFormToRequest & {
    request: IRequest;
  };
};

export async function action(props: IProps): Promise<IResult> {
  const { id, params, data, options, host = serverHost } = props;

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
    `${host}${route}/${id}/requests?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
