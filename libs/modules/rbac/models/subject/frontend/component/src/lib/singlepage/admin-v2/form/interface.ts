export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/admin-v2/form/interface";
import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "admin-v2-form" as const;

export type IComponentProps = IParentComponentProps<IModel, typeof variant> & {
  subjectsToEcommerceModuleProducts?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  subjectsToSocialModuleProfiles?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  subjectsToIdentities?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  subjectsToRoles?: (props: ISpsComponentBase & { data?: IModel }) => ReactNode;
  subjectsToActions?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  subjectsToEcommerceModuleOrders?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  subjectsToNotificationModuleTopics?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  subjectsToBillingModulePaymentIntents?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  subjectsToBlogModuleArticles?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
  subjectsToBillingModuleCurrencies?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
};

export type IComponentPropsExtended = IParentComponentPropsExtended<
  IModel,
  typeof variant,
  IComponentProps
>;
