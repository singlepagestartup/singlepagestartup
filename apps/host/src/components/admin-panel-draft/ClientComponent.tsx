"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { AdminV2Component as EcommerceAdminV2Component } from "@sps/ecommerce/frontend/component";
import { SettingsPageClientComponent } from "./settings-page";
import { AccountSettingsPageClientComponent } from "./account-settings-page";
import { IAdminPanelDraftProps } from "./interface";

export function Component(props: IAdminPanelDraftProps) {
  const adminBasePath = "/admin";

  return (
    <section
      data-variant="admin-panel-draft"
      data-testid="admin-prototype-body"
      className={cn(
        "h-screen overflow-hidden bg-background text-foreground antialiased",
        props.className,
      )}
    >
      <EcommerceAdminV2Component
        adminBasePath={adminBasePath}
        isSettingsView={false}
      />

      <SettingsPageClientComponent adminBasePath={adminBasePath} />
      <AccountSettingsPageClientComponent
        adminBasePath={adminBasePath}
        onIdentityAction={() => {}}
        onLogout={() => {}}
      />
    </section>
  );
}
