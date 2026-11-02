import type { ReactNode } from "react";
import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IProps, IResult } from "@sps/rbac/models/subject/sdk/server";
export const variant = "social-module-profile-find" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: IModel;
  language: string;
  apiProps?: Pick<
    IProps["ISocialModuleProfileFindProps"],
    "params" | "options"
  >;
  children: (props: {
    data: IResult["ISocialModuleProfileFindResult"];
  }) => ReactNode;
}
