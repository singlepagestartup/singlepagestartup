import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IAuthorSummary } from "@sps/social/models/profile/sdk/model";
import type { IProps } from "@sps/social/models/profile/sdk/server";
export const variant = "author-card-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  language: string;
  profileId?: string;
  data?: IAuthorSummary;
  dataSource?: "api" | "props";
  size?: "xs" | "sm";
  inverse?: boolean;
  /** Public allowlisted author SDK operation; never generic Profile.find. */
  apiProps?: Pick<IProps["IAuthorFindProps"], "options">;
}
export interface IComponentPropsExtended extends IComponentProps {
  data: IAuthorSummary;
}
