"use client";

import { Component as RbacModuleSubjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: ISpsComponentBase) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <RbacModuleSubjectsToEcommerceModuleOrders
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: subject.id,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((entity, index) => {
                return (
                  <RbacModuleSubjectsToEcommerceModuleOrders
                    key={index}
                    isServer={false}
                    variant="default"
                    data={entity}
                  />
                );
              });
            }}
          </RbacModuleSubjectsToEcommerceModuleOrders>
        );
      }}
    </RbacModuleSubject>
  );
}
