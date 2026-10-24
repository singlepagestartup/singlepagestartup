export type { IRecord as IModel } from "./singlepage/admin-v2-table/interface";

import type { ComponentProps } from "react";
import type { variants } from "./variants";
export type IComponentProps = {
  [Variant in keyof typeof variants]: { variant: Variant } & Omit<
    NonNullable<ComponentProps<(typeof variants)[Variant]>>,
    "variant"
  >;
}[keyof typeof variants];

export interface ISkeletonProps {
  variant?: IComponentProps["variant"];
  className?: string;
  rows?: number;
}

export type { IAuthenticationContent } from "./singlepage/content/ai-chat/authentication/interface";

export type { INavbarAiChatProps } from "./singlepage/navbar/ai-chat/index";

export type { NavbarDefaultProps } from "./singlepage/navbar-default/interface";

export type {
  IContentFeatureItem,
  IContentFeatureMedia,
} from "./singlepage/content-feature-split/interface";
export type { IContentDefinitionItem } from "./singlepage/content-definition-grid/interface";
export type { IContentStep } from "./singlepage/content-steps/interface";
