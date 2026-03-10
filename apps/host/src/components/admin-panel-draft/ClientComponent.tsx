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

  // URL-based visibility guards
  const isAdminRoot = pathname === adminBasePath;
  const isAdminEcommerce =
    pathname === `${adminBasePath}/ecommerce` ||
    pathname?.startsWith(`${adminBasePath}/ecommerce/`);
  const isAdminSettings = pathname === `${adminBasePath}/settings`;
  const isAdminAccountSettings =
    pathname === `${adminBasePath}/settings/account`;

  const showEcommercePanel = isAdminRoot || isAdminEcommerce;
  const showSettingsPage = isAdminSettings && !isAdminAccountSettings;
  const showAccountPage = isAdminAccountSettings;

  return (
    <section
      data-variant="admin-panel-draft"
      data-testid="admin-prototype-body"
      className={cn(
        "h-screen overflow-hidden bg-background text-foreground antialiased",
        props.className,
      )}
    >
      {showEcommercePanel && (
        <EcommerceAdminV2Component
          adminBasePath={adminBasePath}
          settingsHref={`${adminBasePath}/settings`}
        />
      )}
      {showSettingsPage && (
        <SettingsPageClientComponent adminBasePath={adminBasePath} />
      )}
      {showAccountPage && (
        <AccountSettingsPageClientComponent
          adminBasePath={adminBasePath}
          onIdentityAction={() => {}}
          onLogout={() => {}}
        />
      )}
    </section>
  );
}
