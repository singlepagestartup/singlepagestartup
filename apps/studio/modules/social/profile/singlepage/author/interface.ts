import type { IProfileOverviewProps as ProfileOverviewProps } from "../overview/default/index";

export const variant = "author";

export type ProfileAuthorProps = ProfileOverviewProps & {
  slug: string;
};

type IVariantInputs = NonNullable<
  Partial<ProfileAuthorProps> & { variant?: "author" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "author";
}

export interface IComponentPropsExtended extends IComponentProps {}
