"use client";

import { cn, useAdminRoute } from "@sps/shared-frontend-client-utils";
import { AdminV2Component as EcommerceAdminV2Component } from "@sps/ecommerce/frontend/component";
import { SettingsPageClientComponent } from "./settings-page";
import { AccountSettingsPageClientComponent } from "./account-settings-page";
import { usePathname } from "next/navigation";

interface IComponentProps {
  className?: string;
}

export function Component(props: IComponentProps) {
  const adminBasePath = "/admin";
  const pathname = usePathname();
  const { currentPath } = useAdminRoute(pathname);

  const isMainView =
    !currentPath.startsWith("/settings") &&
    !currentPath.startsWith("/profile") &&
    !currentPath.startsWith("/account");

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
      >
        {/* Settings page - rendered as child when on settings route */}
        {currentPath === "/settings" && (
          <SettingsPageClientComponent adminBasePath={adminBasePath} />
        )}

        {/* Account settings page - rendered as child when on profile/account route */}
        {(currentPath === "/profile" || currentPath.startsWith("/account")) && (
          <AccountSettingsPageClientComponent
            adminBasePath={adminBasePath}
            onIdentityAction={() => {}}
            onLogout={() => {}}
          />
        )}
      </EcommerceAdminV2Component>
    </section>
  );
}
