import { IComponentProps as IOpengraphImageComponentProps } from "./generate-template-opengraph-image-default/interface";
import { IComponentProps as IOrderReceiptComponentProps } from "./generate-template-ecommerce-order-receipt-default/interface";
import { IComponentProps as IGenerateTemplateDefaultComponentProps } from "./generate-template-ecommerce-product-attachment-default/interface";

export type IComponentProps =
  | IOpengraphImageComponentProps
  | IOrderReceiptComponentProps
  | IGenerateTemplateDefaultComponentProps;
