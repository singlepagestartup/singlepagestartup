import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel as IEcommerceStore } from "@sps/ecommerce/models/store/sdk/model";

export type IComponentProps = ISpsComponentBase & {
  store?: IEcommerceStore;
  language: string;
  variant: "me-ecommerce-order-list-default";
};
