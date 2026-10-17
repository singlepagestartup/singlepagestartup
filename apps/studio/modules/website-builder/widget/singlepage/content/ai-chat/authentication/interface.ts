import type { ReactNode } from "react";

import type IconGlyphs from "../../../../../../shared/icon/singlepage/phosphor/icons.json";

export const variant = "content-ai-chat-authentication";

export interface IAuthenticationContent {
  intro: { title: string; paragraphs: string[] };
  images: { src: string; alt: string; assetId: string }[];
  aside: { title: string; paragraphs: string[] };
}

export interface IAuthenticationContentProps {
  variant?: "content-ai-chat-authentication";
  content?: IAuthenticationContent;
  children?: ReactNode;
  media?: "cover" | "stack";
  asideIcon?: keyof typeof IconGlyphs;
}

type IVariantInputs = NonNullable<IAuthenticationContentProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-ai-chat-authentication";
}

export interface IComponentPropsExtended extends IComponentProps {}
