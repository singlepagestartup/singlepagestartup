"use client";

import { useState } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { FormField } from "@sps/ui-adapter";
import type { IReceiptEmailProps } from "./interface";

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
