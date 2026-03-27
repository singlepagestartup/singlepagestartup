"use client";

import { Component as ParentComponent } from "@sps/rbac/models/subject/frontend/component";
import { Component as SubjectsToActions } from "@sps/rbac/relations/subjects-to-actions/frontend/component";
import { Component as SubjectsToBillingModuleCurrencies } from "@sps/rbac/relations/subjects-to-billing-module-currencies/frontend/component";
import { Component as SubjectsToBillingModulePaymentIntents } from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/frontend/component";
import { Component as SubjectsToBlogModuleArticles } from "@sps/rbac/relations/subjects-to-blog-module-articles/frontend/component";
import { Component as SubjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component";
import { Component as SubjectsToEcommerceModuleProducts } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/frontend/component";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Component as SubjectsToNotificationModuleTopics } from "@sps/rbac/relations/subjects-to-notification-module-topics/frontend/component";
import { Component as SubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/frontend/component";
import { Component as SubjectsToSocialModuleProfiles } from "@sps/rbac/relations/subjects-to-social-module-profiles/frontend/component";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";
import { Component as BillingPaymentIntent } from "@sps/billing/models/payment-intent/frontend/component";
import { Component as BlogArticle } from "@sps/blog/models/article/frontend/component";
import { Component as EcommerceOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as EcommerceProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as NotificationTopic } from "@sps/notification/models/topic/frontend/component";
import { Component as SocialProfile } from "@sps/social/models/profile/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Action } from "../../action";
import { Component as Identity } from "../../identity";
import { Component as Role } from "../../role";
import { Component as Subject } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      subjectsToIdentities={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToIdentities
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Identity"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Identity
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.identityId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      subjectsToRoles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToRoles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Role"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Role
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.roleId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      subjectsToEcommerceModuleProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToEcommerceModuleProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Product"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <EcommerceProduct
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.ecommerceModuleProductId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      subjectsToEcommerceModuleOrders={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToEcommerceModuleOrders
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Order"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <EcommerceOrder
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.ecommerceModuleOrderId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      subjectsToNotificationModuleTopics={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToNotificationModuleTopics
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Topic"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <NotificationTopic
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.notificationModuleTopicId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      subjectsToBillingModulePaymentIntents={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToBillingModulePaymentIntents
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Payment intent"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <BillingPaymentIntent
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.billingModulePaymentIntentId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      subjectsToSocialModuleProfiles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToSocialModuleProfiles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Profile"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <SocialProfile
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.socialModuleProfileId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      subjectsToBlogModuleArticles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToBlogModuleArticles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Article"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <BlogArticle
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.blogModuleArticleId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      subjectsToActions={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToActions
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Action"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Action
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.actionId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      subjectsToBillingModuleCurrencies={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToBillingModuleCurrencies
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Currency"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <BillingCurrency
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.billingModuleCurrencyId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
    />
  );
}
