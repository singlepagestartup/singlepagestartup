"use client";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentProps } from "./interface";
import { Component as BillingModuleCurrency } from "@sps/billing/models/currency/frontend/component";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <RbacModuleSubject
            isServer={false}
            variant="ecommerce-module-order-list-total-default"
            data={subject}
            language={props.language}
          >
            {({ data: ecommerceModuleOrderTotal }) => {
              return (
                <div className="w-full flex flex-row gap-3">
                  {ecommerceModuleOrderTotal.map((entity, index) => {
                    return (
                      <div key={index} className="flex flex-row gap-1">
                        <p>{entity.total}</p>
                        <BillingModuleCurrency
                          isServer={false}
                          variant="default"
                          data={entity.billingModuleCurrency}
                          language={props.language}
                        ></BillingModuleCurrency>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          </RbacModuleSubject>
        );
      }}
    </RbacModuleSubject>
  );
}
