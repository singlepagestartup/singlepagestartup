"use client";

import { memo, useCallback, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as CartRow } from "../../../../ecommerce-module/order/list/checkout-default/Row";
import type { IComponentPropsExtended, ISavedOrderProps } from "./interface";

const SavedOrder = memo(function SavedOrder(props: ISavedOrderProps) {
  const { ecommerceModuleOrder: order, subject, language } = props;
  const details = order.cartDetails;
  const [blockedLines, setBlockedLines] = useState<Set<string>>(new Set());
  const onSelectionStateChange = useCallback(
    (_orderId: string, lineId: string, blocked: boolean) => {
      setBlockedLines((previous) => {
        if (previous.has(lineId) === blocked) return previous;
        const next = new Set(previous);
        if (blocked) next.add(lineId);
        else next.delete(lineId);
        return next;
      });
    },
    [],
  );
  const updating = useIsMutating({
    predicate: (mutation) => {
      const input = mutation.state.variables as
        { id?: string; orderId?: string } | undefined;
      return input?.id === subject.id && input.orderId === order.id;
    },
  });
  const refreshing = useIsFetching({
    queryKey: [`${route}/${subject.id}/ecommerce-module/orders`],
  });
  const canPay =
    !blockedLines.size &&
    !updating &&
    !refreshing &&
    !details?.unpriced?.length &&
    Boolean(
      details?.availableCurrencyIds?.includes(
        details.billingModuleCurrencyId ?? "",
      ),
    );
  return (
    <li className="grid min-w-0 gap-2">
      <ul>
        <CartRow
          subject={subject}
          ecommerceModuleOrder={order}
          language={language}
          onOrderSelectionStateChange={onSelectionStateChange}
        />
      </ul>
      <Subject
        isServer={false}
        variant="ecommerce-module-order-checkout-default"
        dataSource="props"
        data={subject}
        ecommerceModuleProduct={props.ecommerceModuleProduct}
        ecommerceModuleOrder={order}
        language={language}
        disabled={!canPay}
      />
    </li>
  );
});

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("grid w-full min-w-0 gap-4", props.className)}
    >
      <Subject
        isServer={false}
        variant="ecommerce-module-order-list-default"
        data={props.data}
        language={props.language}
        apiProps={{ params: { includeCartDetails: true } }}
      >
        {({ data }) => {
          const orders = data.filter((order) =>
            order.cartDetails?.lines.some(
              (line) =>
                !line.parentLineId &&
                line.productId === props.ecommerceModuleProduct.id,
            ),
          );
          return (
            <>
              {orders.length > 0 && (
                <section className="grid min-w-0 gap-2">
                  <h3 className="text-base font-semibold">
                    {props.language === "ru" ? "В корзине" : "In your cart"}
                  </h3>
                  <ul className="grid min-w-0 gap-4">
                    {orders.map((order) => (
                      <SavedOrder
                        key={order.id}
                        subject={props.data}
                        ecommerceModuleOrder={order}
                        ecommerceModuleProduct={props.ecommerceModuleProduct}
                        language={props.language}
                      />
                    ))}
                  </ul>
                </section>
              )}
              <Subject
                isServer={false}
                variant="ecommerce-module-order-create-default"
                dataSource="props"
                data={props.data}
                ecommerceModuleProduct={props.ecommerceModuleProduct}
                ecommerceModuleStore={props.ecommerceModuleStore}
                language={props.language}
                hideConfiguration={orders.length > 0}
                checkoutSlot={
                  props.withOneStepCheckout
                    ? (configuration, actions) => (
                        <Subject
                          isServer={false}
                          variant="me-ecommerce-module-product-checkout-default"
                          dataSource="props"
                          data={props.data}
                          ecommerceModuleProduct={props.ecommerceModuleProduct}
                          ecommerceModuleStore={props.ecommerceModuleStore}
                          language={props.language}
                          purchaseConfiguration={configuration ?? null}
                          onQuoteStale={actions.refreshQuote}
                          hideWhenIdle={actions.hideWhenIdle}
                        />
                      )
                    : undefined
                }
              />
            </>
          );
        }}
      </Subject>
    </div>
  );
}
