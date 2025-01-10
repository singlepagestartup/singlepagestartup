import { host, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export interface IProps {
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data: {
    password: string;
    passwordConfirmation: string;
    code: string;
  };
}

export type IResult = {
  ok: boolean;
};

export async function action(props: IProps): Promise<IResult> {
  const { params, data, options } = props;

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
    `${host}${route}/authentication/email-and-password/reset-password?${stringifiedQuery}`,
    requestOptions,
  );

  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  const transformedData = transformResponseItem<IResult>(json);

  return transformedData;
}
