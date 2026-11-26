import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IResult as ISubjectSdkResult } from "@sps/rbac/models/subject/sdk/server";
import type { ICartDetails } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IOfferServiceOption } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { ReactNode } from "react";
import type {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";

export type { IModel };

export const variant = "ecommerce-module-order-list-checkout-default" as const;

export interface IComponentProps extends IParentComponentProps<
  IModel,
  typeof variant
> {
  language: string;
  onDiscussionOpen?: () => void;
  onSelectionPendingChange?: (pending: boolean) => void;
}

export interface IComponentPropsExtended extends IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

export interface IRowProps {
  subject: IModel;
  ecommerceModuleOrder: ISubjectSdkResult["IEcommerceModuleOrderListResult"][number];
  ecommerceModuleProduct?: IEcommerceModuleProduct;
  language: string;
  selected?: boolean;
  selectionDisabled?: boolean;
  headerSlot?: ReactNode;
  onCartItemSelectionChange?: (orderId: string, selected: boolean) => void;
  children?: ReactNode;
  onOrderSelectionStateChange?: (
    orderId: string,
    lineId: string,
    blocked: boolean,
  ) => void;
  onOrderSelectionPendingChange?: (
    orderId: string,
    lineId: string,
    pending: boolean,
  ) => void;
}

export interface IDiscussionActionProps {
  subjectId: string;
  ecommerceModuleOrder: IRowProps["ecommerceModuleOrder"];
  ecommerceModuleProduct?: IEcommerceModuleProduct;
  language: string;
  canOpenDiscussion: () => boolean;
  buttonVariant?: "primary" | "outline";
  onDiscussionOpen?: () => void;
}

export interface IQuantityProps {
  subjectId: string;
  orderId: string;
  maxLineQuantity: number;
  line: ICartDetails["lines"][number];
  language: string;
  singleUnitPerOrder?: boolean;
  attachedLines?: ICartDetails["lines"];
  requiresNewResult?: boolean;
  repairUnavailable?: boolean;
  onPendingChange?: (lineId: string, pending: boolean) => void;
}

export interface ICurrencyProps extends Pick<
  IRowProps,
  "subject" | "ecommerceModuleOrder" | "language"
> {}

export interface IDeliveryProps {
  language: string;
  currencySlug?: string;
}

export interface ISelectionProps extends IRowProps {
  line: ICartDetails["lines"][number];
  details: ICartDetails;
  onSelectionStateChange?: (lineId: string, blocked: boolean) => void;
  onSelectionPendingChange?: (lineId: string, pending: boolean) => void;
}

export interface IDeliveryAddressProps {
  id: string;
  label: string;
  offerId: string;
  language: string;
  value: string;
  className: string;
  onChange: (address: string, selected?: boolean) => void;
}

export interface IServiceCardProps {
  id: string;
  language: string;
  option: IOfferServiceOption;
  checked: boolean;
  amount?: string;
  from?: boolean;
  currencySymbol: string;
  pending: boolean;
  tariff?: IOfferServiceOption["deliveryTariff"];
  distanceKm?: string;
  onCheckedChange: (offerId: string, checked: boolean) => void;
  children?: ReactNode;
}

export interface IServiceOptionsProps {
  id: string;
  labelId: string;
  selectionName: string;
  multiple: boolean;
  required: boolean;
  value: string;
  onValueChange: (offerId: string) => void;
  children?: ReactNode;
}

export interface IQuantityInputProps {
  id: string;
  label: string;
  contextLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  value: string;
  min: number;
  max: number;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}
