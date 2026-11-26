import { route, serverHost } from "@sps/rbac/models/subject/sdk/model";
import { responsePipe, type NextRequestOptions } from "@sps/shared-utils";

interface IRequest {
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export async function socialModuleProfileChatCoverContent({
  id,
  socialModuleProfileId,
  socialModuleChatId,
  host = serverHost,
  options,
}: IRequest) {
  const path = `${route}/${id}/social-module/profiles/${socialModuleProfileId}/chats/${socialModuleChatId}/cover`;
  const res = await fetch(host + path, {
    ...options,
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    await responsePipe({ res });
    throw new Error("Chat cover could not be read");
  }
  return res.blob();
}
