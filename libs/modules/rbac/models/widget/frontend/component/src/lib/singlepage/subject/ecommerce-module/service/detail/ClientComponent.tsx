"use client";

import { useState } from "react";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IBookingProps } from "./interface";

type TBookingAuthenticationMode =
  "authentication" | "registration" | "forgot-password";

export function Component({
  language,
  ecommerceModuleProduct,
  ecommerceModuleStore,
  ecommerceModuleOfferId,
}: IBookingProps) {
  const [mode, setMode] =
    useState<TBookingAuthenticationMode>("authentication");
  const returnPath = `/framework/services/${encodeURIComponent(ecommerceModuleProduct.slug)}?offer=${encodeURIComponent(ecommerceModuleOfferId)}#booking`;
  const signIn = (
    <Subject
      key={mode}
      isServer={false}
      variant="authentication-email-and-password-form-default"
      mode={mode}
      onModeChange={setMode}
      language={language}
      successHref={returnPath}
      className="p-4 sm:p-5"
    />
  );
  return (
    <Subject
      isServer={false}
      variant="authentication-me-default"
      fallback={signIn}
    >
      {({ data, authenticated }) =>
        data && authenticated ? (
          <Subject
            isServer={false}
            variant="me-ecommerce-module-product-cart-default"
            dataSource="props"
            data={data}
            ecommerceModuleProduct={ecommerceModuleProduct}
            ecommerceModuleStore={ecommerceModuleStore}
            ecommerceModuleOfferId={ecommerceModuleOfferId}
            language={language}
            withOneStepCheckout
            openServiceDiscussionOnSubmit
          />
        ) : (
          signIn
        )
      }
    </Subject>
  );
}
