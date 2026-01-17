import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as INotificationModuleTemplate } from "@sps/notification/models/template/sdk/model";
import { IModel as INotificationModuleNotification } from "@sps/notification/models/notification/sdk/model";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";

export interface IProps {
  id: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    notification: {
      topic: {
        slug: string;
      };
      template: INotificationModuleTemplate;
      notification: Partial<INotificationModuleNotification>;
    };
    fileStorage?: {
      files?: IFileStorageModuleFile[];
    };
  };
}

export type IResult = {
  notificationService: {
    notifications: INotificationModuleNotification[];
  };
} | null;

export async function action(props: IProps): Promise<IResult> {
  const { id, data, options, host = serverHost } = props;

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

  const res = await fetch(`${host}${route}/${id}/notify`, requestOptions);

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
