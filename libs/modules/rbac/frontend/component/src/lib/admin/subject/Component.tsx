"use client";

import { Component as ParentComponent } from "@sps/rbac/models/subject/frontend/component";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Component as SubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/frontend/component";
import { Component as SubjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component";
import { Component as SubjectsToNotificationModuleTopics } from "@sps/rbac/relations/subjects-to-notification-module-topics/frontend/component";
import { Component as SubjectsToBillingModulePaymentIntents } from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/frontend/component";
import { Component as SubjectsToSocialModuleProfiles } from "@sps/rbac/relations/subjects-to-social-module-profiles/frontend/component";
import { Component as SubjectsToEcommerceModuleProducts } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/frontend/component";
import { Component as SubjectsToBlogModuleArticles } from "@sps/rbac/relations/subjects-to-blog-module-articles/frontend/component";
import { Component as SubjectsToActs } from "@sps/rbac/relations/subjects-to-acts/frontend/component";

export function Component() {
  return (
    <ParentComponent
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            data={props.data}
            variant="admin-form"
            subjectsToEcommerceModuleProducts={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToEcommerceModuleProducts
                  isServer={isServer}
                  variant="admin-table"
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
            subjectsToSocialModuleProfiles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToSocialModuleProfiles
                  isServer={isServer}
                  variant="admin-table"
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
            subjectsToIdentities={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToIdentities
                  isServer={isServer}
                  variant="admin-table"
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
            subjectsToEcommerceModuleOrders={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToEcommerceModuleOrders
                  isServer={isServer}
                  variant="admin-table"
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
            subjectsToBillingModulePaymentIntents={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToBillingModulePaymentIntents
                  isServer={isServer}
                  variant="admin-table"
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
            subjectsToNotificationModuleTopics={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToNotificationModuleTopics
                  isServer={isServer}
                  variant="admin-table"
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
            subjectsToRoles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToRoles
                  isServer={isServer}
                  variant="admin-table"
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
            subjectsToBlogModuleArticles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToBlogModuleArticles
                  isServer={isServer}
                  variant="admin-table"
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
            subjectsToActs={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToActs
                  isServer={isServer}
                  variant="admin-table"
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
      }}
    />
  );
}
