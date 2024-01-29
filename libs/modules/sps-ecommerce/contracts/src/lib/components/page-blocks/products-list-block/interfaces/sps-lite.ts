import { IComponent as IButton } from "@sps/sps-website-builder-contracts/lib/components/elements/button/interfaces";

export interface IComponent {
  id: number;
  __component: "page-blocks.products-list-block";
  variant: "simple";
  title: string | null;
  subtitle: string | null;
  description: string | null;
  className: string | null;
  anchor: string | null;
  usePageUrlFilters: boolean;
  query: string | null;
  buttons?: IButton[] | null;
}