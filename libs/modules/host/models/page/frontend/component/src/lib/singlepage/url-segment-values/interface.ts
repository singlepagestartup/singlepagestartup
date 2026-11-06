import type { ReactNode } from "react";
import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IResolvedPage } from "@sps/host/models/page/sdk/model";

export const variant = "url-segment-values" as const;

export interface IComponentProps extends Omit<ISpsComponentBase, "children"> {
  variant: typeof variant;
  url: string;
  /** Uses Page.findByUrl; every named value comes from the matched URL mask. */
  children?: (props: {
    data: IResolvedPage["routeParams"] | undefined;
  }) => ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IResolvedPage["routeParams"] | undefined;
}
