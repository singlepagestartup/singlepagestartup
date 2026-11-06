"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentPropsExtended } from "./interface";
import { ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  return (
    <Sheet>
      <SheetTrigger
        aria-label={ru ? "Открыть корзину" : "Open cart"}
        className={cn(
          "relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
          props.className,
        )}
      >
        <div className="relative flex size-full items-center justify-center">
          <ShoppingCart className="size-5" />

          <Subject
            isServer={false}
            variant="ecommerce-module-order-list-quantity-default"
            data={props.data}
            language={language}
            className=""
          >
            {({ data: ecommerceModuleOrderQuantity }) => {
              if (ecommerceModuleOrderQuantity) {
                return (
                  <div className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                    <p>{ecommerceModuleOrderQuantity}</p>
                  </div>
                );
              }

              return <></>;
            }}
          </Subject>
        </div>
      </SheetTrigger>
      <SheetContent
        side="right"
        closeLabel={ru ? "Закрыть корзину" : "Close cart"}
        className="flex h-dvh w-full min-w-0 flex-col gap-0 rounded-l-3xl bg-card p-0 font-default text-foreground sm:max-w-lg"
      >
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-border px-6">
          <SheetTitle className="text-2xl font-semibold">
            {ru ? "Корзина" : "Cart"}
          </SheetTitle>
        </header>
        <SheetDescription className="sr-only">
          {ru
            ? "Товары, количество и оформление заказа."
            : "Products, quantities and checkout."}
        </SheetDescription>
        <Subject
          isServer={false}
          variant="ecommerce-module-order-list-checkout-default"
          data={props.data}
          language={language}
          className="min-h-0 flex-1"
        />
      </SheetContent>
    </Sheet>
  );
}
