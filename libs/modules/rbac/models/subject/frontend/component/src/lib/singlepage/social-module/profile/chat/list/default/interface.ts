export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { type IResult } from "@sps/rbac/models/subject/sdk/server";
import type { ReactNode } from "react";

export const variant = "social-module-profile-chat-list-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  language: string;
  data: IModel;
  socialModuleProfile: ISocialModuleProfile;
  variant: typeof variant;
  className?: string;
  includeSubjectProfiles?: boolean;
  currentSocialModuleChatId?: string;
  compact?: boolean;
  currentChatActions?: ReactNode;
  onSelectCurrentChat?: () => void;
}

export const chatPageSize = 30;

export function chatPageParams(
  includeSubjectProfiles: boolean | undefined,
  page: number,
  search = "",
  language?: string,
) {
  return {
    includeSubjectProfiles,
    includeParticipants: true,
    membershipsOnly: true,
    ...(search.trim() ? { search: search.trim(), language } : {}),
    limit: chatPageSize + 1,
    offset: page * chatPageSize,
    orderBy: {
      and: [
        { column: "createdAt", method: "desc" },
        { column: "id", method: "asc" },
      ],
    },
  };
}

export interface IComponentPropsExtended extends IComponentProps {
  pagination?: ReactNode;
  search: string;
  onSearch: (search: string) => void;
  socialModuleChats: IResult["ISocialModuleProfileFindByIdChatFindResult"];
}
