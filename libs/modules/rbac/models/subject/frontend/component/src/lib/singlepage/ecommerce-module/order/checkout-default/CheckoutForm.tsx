"use client";

import type { ICheckoutFormProps } from "./interface";

export function CheckoutForm({ form, children, ...props }: ICheckoutFormProps) {
  return (
    <form
      {...props}
      onSubmitCapture={(event) => {
        // Autofill can update the visible input without notifying React Hook Form.
        const email = new FormData(event.currentTarget).get("email");
        if (typeof email === "string" && email !== form.getValues("email")) {
          form.setValue("email", email, { shouldDirty: true });
        }
      }}
    >
      {children}
    </form>
  );
}
