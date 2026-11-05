export const variant = "admin-v2-navigation";

export interface WebsiteBuilderAdminV2NavigationProps {
  variant?: "admin-v2-navigation";
  activePath: string;
}

type IVariantInputs = NonNullable<
  Partial<WebsiteBuilderAdminV2NavigationProps>
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-navigation";
}

export interface IComponentPropsExtended extends IComponentProps {}
