"use client";

import { cn, useAdminBasePath } from "@sps/shared-frontend-client-utils";
import { AdminV2Component as EcommerceAdminV2Component } from "@sps/ecommerce/frontend/component";
import { SettingsPageClientComponent } from "./settings-page";
import { AccountSettingsPageClientComponent } from "./account-settings-page";
import { usePathname } from "next/navigation";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const pathname = usePathname();
  const adminBasePath = useAdminBasePath(pathname || "");

  return (
    <section
      data-variant="admin-panel-draft"
      data-testid="admin-prototype-body"
      className={cn(
        "h-screen overflow-hidden bg-background text-foreground antialiased",
        props.className,
      )}
    >
      <EcommerceAdminV2Component adminBasePath={adminBasePath} />
      <SettingsPageClientComponent adminBasePath={adminBasePath} />
      <AccountSettingsPageClientComponent
        adminBasePath={adminBasePath}
        onIdentityAction={() => {}}
        onLogout={() => {}}
      />
    </section>
  );
}
