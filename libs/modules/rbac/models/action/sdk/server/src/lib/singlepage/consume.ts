import { serverHost, route, IModel } from "@sps/rbac/models/action/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";

export interface IProps {
  id: string;
  host?: string;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    [key: string]: any;
  };
  /**
   * Evaluated by the write, not before it. The row is updated only while it
   * still matches, so a second caller gets `null` instead of a second claim.
   */
  filters?: {
    and: {
      column: string;
      method: string;
      value?: any;
    }[];
  };
}

export type IResult = IModel | null;

export async function action(props: IProps): Promise<IResult> {
  const { id, data, filters, options, host = serverHost } = props;

  const formData = prepareFormDataToSend({
    data: {
      data,
      filters,
    },
  });

  const requestOptions: NextRequestOptions = {
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(`${host}${route}/${id}/consume`, requestOptions);

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
