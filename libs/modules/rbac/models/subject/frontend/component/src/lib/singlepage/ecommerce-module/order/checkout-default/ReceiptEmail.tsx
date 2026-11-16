"use client";

import { useState, type FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { FormField } from "@sps/ui-adapter";

interface IReceiptEmailProps {
  subject: { id: string; authenticated?: boolean };
  form: UseFormReturn<any>;
  label?: string;
  placeholder: string;
  inputClassName?: string;
}

export function ReceiptEmail({ subject, form, ...field }: IReceiptEmailProps) {
  const identities = api.identityFind({
    id: subject.id,
    reactQueryOptions: {
      enabled: subject.authenticated !== false,
      retry: false,
    },
  });
  const emails = identities.data?.filter((identity) => identity.email?.trim());
  const preferred =
    emails?.find((identity) => identity.provider === "email_and_password") ??
    emails?.find((identity) => identity.provider !== "email") ??
    emails?.[0];
  const email = preferred?.email?.trim();
  const [edited, setEdited] = useState(false);

  return (
    <div onChangeCapture={() => setEdited(true)}>
      <FormField
        ui="shadcn"
        type="email"
        name="email"
        form={form}
        suggestedEmail={edited ? undefined : email}
        {...field}
      />
    </div>
  );
}

// A browser can fill the visible input without notifying React Hook Form.
export function syncReceiptEmail(
  event: FormEvent<HTMLFormElement>,
  form: UseFormReturn<any>,
) {
  const email = new FormData(event.currentTarget).get("email");
  if (typeof email === "string" && email !== form.getValues("email")) {
    form.setValue("email", email, { shouldDirty: true });
  }
}
