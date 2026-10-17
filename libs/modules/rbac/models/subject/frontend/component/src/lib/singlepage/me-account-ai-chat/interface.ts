import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import type { ReactNode } from "react";
import type { IResult } from "@sps/rbac/models/subject/sdk/server";
import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/subject-default/interface";

export const variant = "me-account-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  settingsSelected?: boolean;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {
  accountProfile?: IResult["ISocialModuleProfileFindResult"][number];
  accountIdentities?: IResult["IIdentityFindResult"];
  accountAvatar?: IResult["ISocialModuleProfileFindByIdAvatarFindResult"];
  accountBalance?: IResult["IBillingModuleBalanceResult"];
}

export interface IAccountEmailProps {
  identities: IComponentPropsExtended["accountIdentities"];
}

export interface IAccountAvatarProps {
  subjectId: string;
  profile: IProfile;
  language: string;
  fallback: ReactNode;
  avatar?: IComponentPropsExtended["accountAvatar"];
}

export interface IAccountTokenBalanceProps {
  balance?: IComponentPropsExtended["accountBalance"];
  subjectId: string;
  language: string;
}

export interface IAccountMenuProps
  extends Pick<
    IComponentPropsExtended,
    "accountIdentities" | "accountAvatar" | "accountBalance"
  > {
  subjectId: string;
  subjectSlug: string;
  language?: string;
  settingsSelected?: boolean;
  profile?: IProfile;
}
