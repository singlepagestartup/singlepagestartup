"use client";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentProps } from "./interface";
import { ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@sps/shared-ui-shadcn";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <Sheet>
            <SheetTrigger>
              <div className="w-10 h-10 flex flex-row items-center justify-center rounded-full border border-primary relative">
                <ShoppingCart className="w-4 h-4 text-primary" />

                <RbacModuleSubject
                  isServer={false}
                  variant="ecommerce-module-order-list-quantity-default"
                  data={subject}
                  language={props.language}
                  className=""
                >
                  {({ data: ecommerceModuleOrderQuantity }) => {
                    if (ecommerceModuleOrderQuantity) {
                      return (
                        <div className="absolute -top-1 -left-1 w-fit min-w-5 h-5 px-1 rounded-xl bg-primary flex items-center justify-center text-[10px] font-medium text-white">
                          <p className="text-white">
                            {ecommerceModuleOrderQuantity}
                          </p>
                        </div>
                      );
                    }

                    return <></>;
                  }}
                </RbacModuleSubject>
              </div>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Cart</SheetTitle>
                <RbacModuleSubject
                  isServer={false}
                  variant="ecommerce-module-order-list-checkout-default"
                  data={subject}
                  language={props.language}
                  className="w-fit"
                ></RbacModuleSubject>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        );
      }}
    </RbacModuleSubject>
  );
}
