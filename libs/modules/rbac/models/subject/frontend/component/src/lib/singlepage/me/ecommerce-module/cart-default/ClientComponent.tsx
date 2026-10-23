"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentPropsExtended } from "./interface";
import { ShoppingCart } from "lucide-react";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <Sheet>
      <SheetTrigger
        aria-label={props.language === "ru" ? "Открыть корзину" : "Open cart"}
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
            language={props.language}
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
      <SheetContent className="w-full max-w-full overflow-y-auto px-4 sm:max-w-md">
        <SheetHeader className="min-w-0 space-y-4 text-left">
          <SheetTitle>
            {props.language === "ru" ? "Корзина" : "Cart"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {props.language === "ru"
              ? "Товары, количество и оформление заказа."
              : "Review products, quantities and checkout options."}
          </SheetDescription>
          <Subject
            isServer={false}
            variant="ecommerce-module-order-list-checkout-default"
            data={props.data}
            language={props.language}
            className="w-fit"
          ></Subject>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
