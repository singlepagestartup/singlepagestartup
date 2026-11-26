import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/ecommerce/models/product/sdk/model";

export const variant = "order-line-title" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  dataSource: "props";
  data: { id: string; title: IModel["title"] | null; name: string };
  language: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
