import {
  serverHost,
  route,
  IModel as IRbacSubject,
} from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";

export interface IProps {
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    telegram: {
      fromId: string | number;
      chatId: string | number;
      messageText?: string;
    };
  };
}

export interface IResult {
  rbacModuleSubject: IRbacSubject;
  socialModuleProfile: ISocialModuleProfile;
  socialModuleChat: ISocialModuleChat;
  registration: boolean;
  isStartCommand: boolean;
  shouldCheckoutFreeSubscription: boolean;
}

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

  const res = await fetch(`${host}${route}/telegram/bootstrap`, requestOptions);

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
