export const variant = "overview-default";

export interface IProfileOverviewProps {
  variant?: "overview-default";
  name: string;
  role: string;
  avatar: string;
  location: string;
  joinedYear: number;
  website: string;
  socials: {
    twitter: string;
    linkedin: string;
    github: string;
  };
}

type IVariantInputs = NonNullable<Partial<IProfileOverviewProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "overview-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
