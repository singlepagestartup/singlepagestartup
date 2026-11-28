"use client";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import {
  CustomerOrderSession,
  OrderQueryResult,
} from "../../CustomerOrderSession";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <CustomerOrderSession language={props.language} skeleton={props.skeleton}>
      {(subjectId, authenticated) => (
        <Orders
          key={subjectId}
          {...props}
          subjectId={subjectId}
          authenticated={authenticated}
        />
      )}
    </CustomerOrderSession>
  );
}
function Orders(
  props: IComponentProps & { subjectId: string; authenticated: boolean },
) {
  const orderId = props.ecommerceModuleOrderId;
  const query = subjectApi.ecommerceModuleOrderList({
    id: props.subjectId,
    params: {
      includeCustomerDetails: true,
      limit: 1,
      filters: {
        and: [
          { column: "type", method: "eq", value: "history" },
          { column: "id", method: "eq", value: orderId },
        ],
      },
    },
    reactQueryOptions: { enabled: Boolean(orderId) },
  });
  if (!orderId) return <ChildComponent {...props} />;
  return (
    <OrderQueryResult
      language={props.language}
      authenticated={props.authenticated}
      query={query}
    >
      {(orders) => (
        <ChildComponent
          {...props}
          ecommerceModuleOrder={orders.find((order) => order.id === orderId)}
        />
      )}
    </OrderQueryResult>
  );
}
