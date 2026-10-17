import type { IAIChatProject } from "@sps/rbac/models/subject/sdk/model";
import { clientHost } from "@sps/rbac/models/subject/sdk/model";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import type { NextRequestOptions } from "@sps/shared-utils";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export interface IFindProjectsProps {
  subjectId: string;
  profiles: IProfile[];
  host?: string;
  options?: Partial<NextRequestOptions>;
}

export async function findProjects(
  props: IFindProjectsProps,
): Promise<IAIChatProject[]> {
  if (!props.profiles.length) return [];
  const projects = await subjectApi.socialModuleProfileProjects({
    id: props.subjectId,
    host: props.host || clientHost,
    options: props.options || {
      headers: saturateHeaders({ "Cache-Control": "no-store" }),
    },
  });
  const profileIds = new Set(props.profiles.map((profile) => profile.id));
  return projects.filter((project) => profileIds.has(project.profile.id));
}
export function getProjectsQueryKey(subjectId: string) {
  return ["ai-chat-projects", subjectId];
}
