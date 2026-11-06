import {
  type IComponentPropsExtended as IParentExtended,
  type IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type {
  IModel,
  IPurchaseDetails,
} from "@sps/ecommerce/models/order/sdk/model";

import type { IResult } from "@sps/ecommerce/models/order/sdk/server";

export const variant = "purchase-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  purchaseDetails?: IPurchaseDetails;
}

export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {
  totals?: IResult["ITotalResult"];
  totalsPending?: boolean;
  totalsError?: boolean;
}

export interface IReceiptProps {
  language: string;
  file?: IPurchaseDetails["receipts"][number];
}
