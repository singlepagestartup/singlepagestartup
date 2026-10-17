export const variant = "knowledge-module-source-list-sidebar-ai-chat";

export interface IProfileSourceSidebarListProps {
  variant?: "knowledge-module-source-list-sidebar-ai-chat";
  href: string;
  selected?: boolean;
}

type IVariantInputs = NonNullable<IProfileSourceSidebarListProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "knowledge-module-source-list-sidebar-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
