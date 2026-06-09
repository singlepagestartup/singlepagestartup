import { serverHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  NextRequestOptions,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";

export type ProviderSkillProvider = "openai" | "anthropic";

export interface IProviderSkillReference {
  provider: ProviderSkillProvider;
  providerSkillId: string;
  version?: string | null;
  name: string;
  sourceSkillId: string;
  sourceSkillSlug: string;
  contentHash: string;
  syncedAt: string;
}

export interface IProps {
  id: string;
  socialModuleProfileId: string;
  host?: string;
  tag?: string;
  revalidate?: number;
  params?: {
    [key: string]: any;
  };
  options?: Partial<NextRequestOptions>;
  data?: {
    providers?: ProviderSkillProvider[];
    skillIds?: string[];
    force?: boolean;
  };
}

export interface IResult {
  profileId: string;
  providers: ProviderSkillProvider[];
  synced: {
    skillId: string;
    skillSlug: string;
    provider: ProviderSkillProvider;
    status: "synced" | "unchanged";
    reference: IProviderSkillReference;
  }[];
  skipped: {
    skillId: string;
    skillSlug: string;
    reason: string;
  }[];
}

export async function action(props: IProps): Promise<IResult> {
  const {
    id,
    socialModuleProfileId,
    params,
    options,
    host = serverHost,
    data,
  } = props;
  const stringifiedQuery = QueryString.stringify(params, {
    encodeValuesOnly: true,
  });
  const requestOptions: NextRequestOptions = {
    ...options,
    credentials: "include",
    method: "POST",
    headers: {
      ...options?.headers,
      "content-type": "application/json",
    },
    body: JSON.stringify(data || {}),
    next: {
      ...options?.next,
    },
  };
  const res = await fetch(
    `${host}${route}/${id}/social-module/profiles/${socialModuleProfileId}/skills/provider-sync?${stringifiedQuery}`,
    requestOptions,
  );
  const json = await responsePipe<{ data: IResult }>({
    res,
  });

  return transformResponseItem<IResult>(json);
}
