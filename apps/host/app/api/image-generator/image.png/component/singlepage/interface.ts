import { IComponentProps as IOpengraphImageComponentProps } from "./generate-template-opengraph-image-default";
import { IComponentProps as IOrderReceiptComponentProps } from "./generate-template-ecommerce-order-receipt-default";
import { IComponentProps as IGenerateTemplateDefaultComponentProps } from "./generate-template-ecommerce-product-attachment-default";

export type IComponentProps =
  | IOpengraphImageComponentProps
  | IOrderReceiptComponentProps
  | IGenerateTemplateDefaultComponentProps;
