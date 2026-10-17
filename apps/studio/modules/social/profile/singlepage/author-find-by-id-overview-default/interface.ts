import type { ReactNode } from "react";

import type { ProfileAuthorProps } from "../author/interface";

export const variant = "author-find-by-id-overview-default";

export interface OtherAuthor {
  slug: string;
  name: string;
  role: string;
  avatar: string;
  articleCount: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  widthClassName: string;
}

export type ProfileAuthorFindByIdOverviewDefaultProps = Omit<
  {
    profile: {
      variant?: string;
      name: string;
      role: string;
      avatar: string;
      location: string;
      joinedYear: number;
      website: string;
      socials: { twitter: string; linkedin: string; github: string };
      slug: string;
    };
    bio: string;
    skills: string[];
    statArticles: number;
    statComments: number;
    statLikes: number;
    statReadTime: string;
    categoryBreakdown: CategoryBreakdown[];
    otherAuthors: OtherAuthor[];
  },
  "profile"
> & {
  profile: ProfileAuthorProps;
  articles?: ReactNode;
};

type IVariantInputs = NonNullable<
  Partial<ProfileAuthorFindByIdOverviewDefaultProps> & {
    variant?: "author-find-by-id-overview-default";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "author-find-by-id-overview-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
