import { cn } from "@sps/shared-frontend-client-utils";
import {
  AdminV2Overview as EcommerceAdminV2Overview,
  AdminV2SidebarModuleItem as EcommerceAdminV2SidebarModuleItem,
} from "@sps/ecommerce/frontend/component";
// import { SettingsPageClientComponent } from "./settings-page";
// import { AccountSettingsPageClientComponent } from "./account-settings-page";
import { IComponentProps } from "./interface";
import { Button } from "@sps/shared-ui-shadcn";
import { Component as PanelComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/panel/Component";
import { CircleHelp, UserRound } from "lucide-react";
import Link from "next/link";

export function Component(props: IComponentProps) {
  return (
    <section
      data-variant="admin-panel-draft"
      data-testid="admin-prototype-body"
      className={cn(
        "h-screen overflow-hidden bg-background text-foreground antialiased",
        props.className,
      )}
    >
      <div className="flex h-screen" data-testid="admin-prototype-root">
        <PanelComponent settingsHref={"/admin/settings"}>
          <EcommerceAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
        </PanelComponent>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center border-b border-border bg-card px-6">
            <div className="flex min-w-0 flex-1 items-center gap-4" />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="!w-10 rounded-md p-2 transition hover:bg-muted"
                aria-label="Help"
              >
                <CircleHelp className="h-5 w-5" />
              </Button>

              <Button
                asChild
                variant="outline"
                size="icon"
                className="!w-10 rounded-md p-2 transition hover:bg-muted"
              >
                <Link href={"/admin/profile"} aria-label="Account">
                  <UserRound className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </header>
          <EcommerceAdminV2Overview url={props.url} isServer={props.isServer} />
          {/* <SettingsPageClientComponent adminBasePath={adminBasePath} />
      <AccountSettingsPageClientComponent
        adminBasePath={adminBasePath}
        onIdentityAction={() => {}}
        onLogout={() => {}}
      /> */}
        </div>
      </div>
    </section>
  );
}
