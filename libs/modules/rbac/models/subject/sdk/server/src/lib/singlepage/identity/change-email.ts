import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IIdentity } from "@sps/rbac/models/identity/sdk/model";
import {
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
  type NextRequestOptions,
} from "@sps/shared-utils";

interface IBaseProps {
  id: string;
  identityId: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}
export interface IRequestProps extends IBaseProps {
  data: { email?: string; verificationId?: string };
}
export interface IVerifyProps extends IBaseProps {
  data: { challengeId: string; code: string };
}
export interface IRequestResult {
  challengeId: string;
  email: string;
  expiresInSeconds: number;
}
export type IVerifyResult =
  | { stage: "current-verified"; verificationId: string }
  | { stage: "complete"; identity: IIdentity };
async function post<T>(
  props: IBaseProps & { data: unknown },
  action: "code" | "verify",
): Promise<T> {
  const res = await fetch(
    `${props.host || serverHost}${route}/${props.id}/identities/${props.identityId}/email-change/${action}`,
    {
      ...props.options,
      credentials: "include",
      method: "POST",
      body: prepareFormDataToSend({ data: props.data }),
    },
  );
  return transformResponseItem<T>(await responsePipe<{ data: T }>({ res }));
}
export const request = (props: IRequestProps) =>
  post<IRequestResult>(props, "code");
export const verify = (props: IVerifyProps) =>
  post<IVerifyResult>(props, "verify");
