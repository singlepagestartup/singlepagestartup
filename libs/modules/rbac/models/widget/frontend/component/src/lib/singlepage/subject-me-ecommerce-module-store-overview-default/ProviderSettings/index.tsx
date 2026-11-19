"use client";

import { useState } from "react";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import { Settings } from "./Settings";
import type { IProviderSettingsProps } from "./interface";

function OwnerSettings(props: IProviderSettingsProps & { subjectId: string }) {
  const [open, setOpen] = useState(false);
  const stores = api.crmWorkspace.useStores(props.subjectId);
  const eligible = stores.data?.some(
    ({ id, canReadCosts }) =>
      id === props.ecommerceModuleStoreId && canReadCosts,
  );
  const settings = api.providerConnections({
    id: props.subjectId,
    storeId: eligible ? props.ecommerceModuleStoreId : "",
  });
  const ru = props.language === "ru";
  if (!settings.data || settings.isError) {
    return null;
  }
  return (
    <section className="my-4 max-w-6xl">
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="min-h-11"
      >
        {ru ? "Подключения и бюджет" : "Connections and budget"}
      </Button>
      {open && (
        <Settings
          key={`${props.subjectId}:${props.ecommerceModuleStoreId}`}
          {...props}
        />
      )}
    </section>
  );
}

export function ProviderSettings(props: IProviderSettingsProps) {
  return (
    <Subject
      variant="authentication-me-default"
      isServer={false}
      fallback={null}
    >
      {({ data, authenticated }) =>
        authenticated && data ? (
          <OwnerSettings {...props} subjectId={data.id} />
        ) : null
      }
    </Subject>
  );
}
