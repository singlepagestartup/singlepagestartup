import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import type { IMcpServerDescriptor } from "@sps/social/models/profile/sdk/model";

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  options?: Partial<NextRequestOptions>;
}

export interface IMcpToolDefinition {
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface IResult {
  supported: IMcpServerDescriptor[];
  connected: Array<
    IMcpServerDescriptor & {
      tools: IMcpToolDefinition[];
    }
  >;
  stale: string[];
}

export async function action(props: IProps): Promise<IResult> {
  const { id, socialModuleProfileId, options, host = serverHost } = props;
  const requestOptions: NextRequestOptions = {
    credentials: "include",
    method: "GET",
    ...options,
    next: {
      ...options?.next,
    },
  };
  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/mcp/servers`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({ res });

  return transformResponseItem<IResult>(json);
}
