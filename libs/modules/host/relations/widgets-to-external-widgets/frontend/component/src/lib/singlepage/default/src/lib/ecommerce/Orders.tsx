"use client";

import { IComponentPropsExtended } from "../interface";
import { Component as SubjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <RbacSubject isServer={false} hostUrl={props.hostUrl} variant="me">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <SubjectsToEcommerceModuleOrders
            isServer={false}
            hostUrl={props.hostUrl}
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
                  <SubjectsToEcommerceModuleOrders
                    key={index}
                    isServer={false}
                    hostUrl={props.hostUrl}
                    variant="default"
                    data={entity}
                  />
                );
              });
            }}
          </SubjectsToEcommerceModuleOrders>
        );
      }}
    </RbacSubject>
  );
}
