import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
import type { ISpsComponentBase, IconName } from "@sps/ui-adapter";
import type { ReactNode } from "react";

export interface IAuthenticationContent {
  intro: { title: string; paragraphs: string[] };
  images: { src: string; alt: string; assetId: string }[];
  aside: { title: string; paragraphs: string[] };
}
export interface IAuthenticationContentProps {
  language?: string;
  content?: IAuthenticationContent;
  children?: ReactNode;
  media?: "cover" | "stack";
  asideIcon?: IconName;
}
export const variant = "content-ai-chat-authentication" as const;
export interface IComponentProps
  extends IParent<IModel, typeof variant>,
    IAuthenticationContentProps {}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IParagraphsProps {
  paragraphs: string[];
  language: string;
}
export type IAuthenticationLinkProps = import("react").ComponentProps<"a">;
