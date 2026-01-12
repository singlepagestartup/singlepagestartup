import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as INotificationServiceNotification } from "@sps/notification/models/notification/sdk/model";

export interface IProps {
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    [key: string]: any;
  };
}

export type IResult = {
  notificationService: {
    notifications: INotificationServiceNotification[];
  };
} | null;

export async function action(props: IProps): Promise<IResult> {
  const { data, options, host = serverHost } = props;

  const formData = prepareFormDataToSend({ data });

  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "POST",
    body: formData,
    ...options,
    next: {
      ...options?.next,
    },
  };

  const res = await fetch(`${host}${route}/check`, requestOptions);

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
