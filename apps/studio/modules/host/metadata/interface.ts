import type { IHostRecord } from "../page/singlepage/composition/HostRecords/state/interface";
export interface IModel extends IHostRecord {
  title: string;
  description: string | null;
  keywords: string | null;
  author: string | null;
  viewport: string | null;
  opengraphTitle: string | null;
  opengraphDescription: string | null;
  opengraphUrl: string | null;
  opengraphType: string | null;
  opengraphSiteName: string | null;
  opengraphLocale: string | null;
  twitterCard: string | null;
  twitterSite: string | null;
  twitterCreator: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterUrl: string | null;
  twitterDomain: string | null;
  twitterAppCountry: string | null;
}

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
