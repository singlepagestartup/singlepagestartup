import {
  protectedFileContentPath,
  serverHost,
} from "@sps/rbac/models/subject/sdk/model";
import { responsePipe, type NextRequestOptions } from "@sps/shared-utils";

interface IRequest {
  id: string;
  fileId: string;
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export async function protectedFileContent({
  id,
  fileId,
  host = serverHost,
  options,
}: IRequest) {
  const response = await fetch(host + protectedFileContentPath(id, fileId), {
    ...options,
    cache: "no-store",
    credentials: "include",
    method: "GET",
  });
  if (!response.ok) {
    await responsePipe({ res: response });
    throw new Error("File could not be read");
  }
  return response.blob();
}
