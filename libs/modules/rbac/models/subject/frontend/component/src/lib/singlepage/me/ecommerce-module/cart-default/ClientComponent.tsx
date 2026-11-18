"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentPropsExtended } from "./interface";
import { ShoppingCart } from "lucide-react";
import { Icon } from "@sps/ui-adapter";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
  SheetDescription,
} from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { internationalization } from "@sps/shared-configuration";
import { useCallback, useEffect, useRef, useState } from "react";

export function Component(props: IComponentPropsExtended) {
  return (
    <Cart
      key={props.data.id}
      isServer={false}
      data={props.data}
      className={props.className}
      language={props.language}
      variant={props.variant}
    />
  );
}

function Cart(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const [open, setOpen] = useState(false);
  const [waitingToClose, setWaitingToClose] = useState(false);
  const pending = useRef(false);
  const closeRequested = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const onOpenChange = useCallback((next: boolean) => {
    if (!next && pending.current) {
      closeRequested.current = true;
      setWaitingToClose(true);
      return;
    }
    closeRequested.current = false;
    setWaitingToClose(false);
    setOpen(next);
  }, []);
  const onSelectionPendingChange = useCallback((next: boolean) => {
    if (!mounted.current) return;
    pending.current = next;
    if (!next && closeRequested.current) {
      closeRequested.current = false;
      setWaitingToClose(false);
      setOpen(false);
    }
  }, []);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
        showCloseButton={false}
        className="flex h-dvh w-full min-w-0 flex-col gap-0 rounded-l-3xl bg-card p-0 font-default text-foreground sm:max-w-lg"
      >
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-border px-6">
          <SheetTitle className="text-2xl font-semibold">
            {ru ? "Корзина" : "Cart"}
          </SheetTitle>
          {waitingToClose && (
            <p role="status" className="text-xs text-muted-foreground">
              {ru ? "Сохраняем изменения…" : "Saving changes…"}
            </p>
          )}
          <SheetClose
            aria-label={ru ? "Закрыть корзину" : "Close cart"}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Icon name="x" size={24} />
          </SheetClose>
        </header>
        <SheetDescription className="sr-only">
          {ru
            ? "Товары, количество и оформление заказа."
            : "Products, quantities and checkout."}
        </SheetDescription>
        <Subject
          isServer={false}
          variant="ecommerce-module-order-list-checkout-default"
          dataSource="props"
          data={props.data}
          language={language}
          className="min-h-0 flex-1"
          onSelectionPendingChange={onSelectionPendingChange}
        />
      </SheetContent>
    </Sheet>
  );
}
