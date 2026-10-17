export const variant = "admin-entity-drawer";

export interface IComponentVariantProps {
  variant?: "admin-entity-drawer";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-entity-drawer";
}

export interface IComponentPropsExtended extends IComponentProps {}
