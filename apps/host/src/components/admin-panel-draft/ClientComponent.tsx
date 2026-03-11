"use client";

import { cn, useAdminBasePath } from "@sps/shared-frontend-client-utils";
import { AdminV2Component as EcommerceAdminV2Component } from "@sps/ecommerce/frontend/component";
import { SettingsPageClientComponent } from "./settings-page";
import { AccountSettingsPageClientComponent } from "./account-settings-page";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const adminBasePath = useAdminBasePath(props.url);

  // URL-based visibility guards using props.url (passed from server component)
  const isAdminRoot = props.url === adminBasePath;
  const isAdminEcommerce =
    props.url === `${adminBasePath}/ecommerce` ||
    props.url.startsWith(`${adminBasePath}/ecommerce/`);
  const isAdminSettings = props.url === `${adminBasePath}/settings`;
  const isAdminAccountSettings =
    props.url === `${adminBasePath}/settings/account`;

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
        <EcommerceAdminV2Component adminBasePath={adminBasePath} />
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
