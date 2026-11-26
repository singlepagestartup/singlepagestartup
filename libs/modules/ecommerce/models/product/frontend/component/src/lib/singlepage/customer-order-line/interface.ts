import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/ecommerce/models/product/sdk/model";

export const variant = "customer-order-line" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  dataSource: "props";
  data: { id: string; title: IModel["title"] | null; slug?: string | null };
  language: string;
  quantity: number;
  /** Formatted total for the purchased line, in its recorded currency. */
  priceLabel?: string;
  coverUrl?: string;
}
export interface IComponentPropsExtended extends IComponentProps {}
