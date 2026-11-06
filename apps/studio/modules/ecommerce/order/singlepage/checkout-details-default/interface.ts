export const variant = "checkout-details-default";

export interface OrderCheckoutDetailsField {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

export interface OrderCheckoutDetailsDefaultProps {
  variant?: "checkout-details-default";
  contactFields: OrderCheckoutDetailsField[];
  billingFields: OrderCheckoutDetailsField[];
  notesLabel: string;
  notesPlaceholder: string;
  actionLabel: string;
  actionDisabled?: boolean;
}

type IVariantInputs = NonNullable<Partial<OrderCheckoutDetailsDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "checkout-details-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
