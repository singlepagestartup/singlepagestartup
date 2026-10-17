export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  variant: string;
  title: string;
  description: string | null;
  keywords: string | null;
  author: string | null;
  viewport: string | null;
  opengraphTitle: string | null;
  opengraphDescription: string | null;
  opengraphUrl: string | null;
  opengraphType: string | null;
  opengraphSiteName: string | null;
  opengraphLocale: string | null;
  twitterCard: string | null;
  twitterSite: string | null;
  twitterCreator: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterUrl: string | null;
  twitterDomain: string | null;
  twitterAppCountry: string | null;
}

export const variant = "admin-v2-table";

export interface IProps {
  variant?: "admin-v2-table";
  empty?: boolean;
}

type IVariantInputs = NonNullable<IProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-table";
}

export interface IComponentPropsExtended extends IComponentProps {}
