import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin-table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin-table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin-select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin-form";
import { IComponentProps as IDefaultComponentProps } from "./default";
import { IComponentProps as IInitComponentProps } from "./init";
import { IComponentProps as ILoginAndPasswordComponentProps } from "./login-and-password";
import { IComponentProps as ILogoutActionComponentProps } from "./logout-action";
import { IComponentProps as ILogoutButtonComponentProps } from "./logout-button";
import { IComponentProps as IIsAllowedWrapperComponentProps } from "./is-authorized-wrapper";
import { IComponentProps as ISelectMethodComponentProps } from "./select-method";
import { IComponentProps as IEthereumVirtualMachineComponentProps } from "./ethereum-virtual-machine";
import { IComponentProps as IMeComponentProps } from "./me";
import { IComponentProps as IGetEmailsComponentProps } from "./get-emails";
import { IComponentProps as IEcommerceProductOneStepCheckoutComponentProps } from "./ecommerce-product-one-step-checkout";
import { IComponentProps as IEcommerceProductsCartComponentProps } from "./ecommerce-products-cart";
import { IComponentProps as IProfileButtonDefaultComponentProps } from "./profile-button-default";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview-default";
import { IComponentProps as IIdentitiesUpdateDefaultComponentProps } from "./identities-update-default";
import { IComponentProps as IIdentitiesCreateDefaultComponentProps } from "./identities-create-default";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IInitComponentProps
  | ILoginAndPasswordComponentProps
  | ILogoutActionComponentProps
  | ILogoutButtonComponentProps
  | IIsAllowedWrapperComponentProps
  | ISelectMethodComponentProps
  | IEthereumVirtualMachineComponentProps
  | IMeComponentProps
  | IGetEmailsComponentProps
  | IEcommerceProductOneStepCheckoutComponentProps
  | IProfileButtonDefaultComponentProps
  | IOverviewDefaultComponentProps
  | IIdentitiesUpdateDefaultComponentProps
  | IIdentitiesCreateDefaultComponentProps
  | IEcommerceProductsCartComponentProps
  | never;
