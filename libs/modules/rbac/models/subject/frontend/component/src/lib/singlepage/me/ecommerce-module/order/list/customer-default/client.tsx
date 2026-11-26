"use client";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import {
  CustomerOrderSession,
  OrderQueryResult,
} from "../../CustomerOrderSession";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
import { useState } from "react";
import { Button } from "@sps/shared-ui-shadcn";
const pageSize = 20;
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
  const [page, setPage] = useState(0);
  const query = subjectApi.ecommerceModuleOrderList({
    id: props.subjectId,
    params: {
      includeCustomerDetails: true,
      filters: { and: [{ column: "type", method: "eq", value: "history" }] },
      orderBy: {
        and: [
          { column: "createdAt", method: "desc" },
          { column: "id", method: "asc" },
        ],
      },
      offset: page * pageSize,
      limit: pageSize + 1,
    },
  });
  return (
    <OrderQueryResult
      language={props.language}
      authenticated={props.authenticated}
      query={query}
    >
      {(orders) => {
        const more = orders.length > pageSize;
        const ru = props.language === "ru";
        const pagination = (page > 0 || more) && (
          <nav
            aria-label={ru ? "Страницы заказов" : "Order pages"}
            className="flex flex-wrap gap-2"
          >
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              {ru ? "Назад" : "Previous"}
            </Button>
            <Button
              variant="outline"
              disabled={!more}
              onClick={() => setPage(page + 1)}
            >
              {ru ? "Далее" : "Next"}
            </Button>
          </nav>
        );
        return (
          <ChildComponent
            {...props}
            ecommerceModuleOrders={orders.slice(0, pageSize)}
            pagination={pagination}
          />
        );
      }}
    </OrderQueryResult>
  );
}
