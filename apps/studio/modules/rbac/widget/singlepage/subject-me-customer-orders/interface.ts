import type { IComponentProps as ISubjectProps } from "../../../subject/singlepage/me/ecommerce-module/order/list/customer-default/interface";
export const variant = "subject-me-customer-orders" as const;
export interface IComponentProps extends Omit<ISubjectProps, "variant"> {
  variant?: typeof variant;
}
export interface IComponentPropsExtended extends IComponentProps {}
