import { cn } from "@sps/shared-frontend-client-utils";
import {
  AdminV2Overview as EcommerceAdminV2Overview,
  AdminV2SidebarModuleItem as EcommerceAdminV2SidebarModuleItem,
} from "@sps/ecommerce/frontend/component";
import {
  AdminV2Overview as AgentAdminV2Overview,
  AdminV2SidebarModuleItem as AgentAdminV2SidebarModuleItem,
} from "@sps/agent/frontend/component";
import {
  AdminV2Overview as AnalyticAdminV2Overview,
  AdminV2SidebarModuleItem as AnalyticAdminV2SidebarModuleItem,
} from "@sps/analytic/frontend/component";
import {
  AdminV2Overview as BillingAdminV2Overview,
  AdminV2SidebarModuleItem as BillingAdminV2SidebarModuleItem,
} from "@sps/billing/frontend/component";
import {
  AdminV2Overview as BlogAdminV2Overview,
  AdminV2SidebarModuleItem as BlogAdminV2SidebarModuleItem,
} from "@sps/blog/frontend/component";
import {
  AdminV2Overview as BroadcastAdminV2Overview,
  AdminV2SidebarModuleItem as BroadcastAdminV2SidebarModuleItem,
} from "@sps/broadcast/frontend/component";
import {
  AdminV2Overview as CrmAdminV2Overview,
  AdminV2SidebarModuleItem as CrmAdminV2SidebarModuleItem,
} from "@sps/crm/frontend/component";
import {
  AdminV2Overview as FileStorageAdminV2Overview,
  AdminV2SidebarModuleItem as FileStorageAdminV2SidebarModuleItem,
} from "@sps/file-storage/frontend/component";
import {
  AdminV2Overview as HostModuleAdminV2Overview,
  AdminV2SidebarModuleItem as HostModuleAdminV2SidebarModuleItem,
} from "@sps/host/frontend/component";
import {
  AdminV2Overview as NotificationAdminV2Overview,
  AdminV2SidebarModuleItem as NotificationAdminV2SidebarModuleItem,
} from "@sps/notification/frontend/component";
import {
  AdminV2Overview as RbacAdminV2Overview,
  AdminV2SidebarModuleItem as RbacAdminV2SidebarModuleItem,
} from "@sps/rbac/frontend/component";
import {
  AdminV2Overview as SocialAdminV2Overview,
  AdminV2SidebarModuleItem as SocialAdminV2SidebarModuleItem,
} from "@sps/social/frontend/component";
import {
  AdminV2Overview as StartupAdminV2Overview,
  AdminV2SidebarModuleItem as StartupAdminV2SidebarModuleItem,
} from "@sps/startup/frontend/component";
import {
  AdminV2Overview as TelegramAdminV2Overview,
  AdminV2SidebarModuleItem as TelegramAdminV2SidebarModuleItem,
} from "@sps/telegram/frontend/component";
import {
  AdminV2Overview as WebsiteBuilderAdminV2Overview,
  AdminV2SidebarModuleItem as WebsiteBuilderAdminV2SidebarModuleItem,
} from "@sps/website-builder/frontend/component";
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
          <AgentAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <AnalyticAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <BillingAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <BlogAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <BroadcastAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <CrmAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <EcommerceAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <FileStorageAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <HostModuleAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <NotificationAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <RbacAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <SocialAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <StartupAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <TelegramAdminV2SidebarModuleItem
            isServer={props.isServer}
            url={props.url}
          />
          <WebsiteBuilderAdminV2SidebarModuleItem
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
          <AgentAdminV2Overview url={props.url} isServer={props.isServer} />
          <AnalyticAdminV2Overview url={props.url} isServer={props.isServer} />
          <BillingAdminV2Overview url={props.url} isServer={props.isServer} />
          <BlogAdminV2Overview url={props.url} isServer={props.isServer} />
          <BroadcastAdminV2Overview url={props.url} isServer={props.isServer} />
          <CrmAdminV2Overview url={props.url} isServer={props.isServer} />
          <FileStorageAdminV2Overview
            url={props.url}
            isServer={props.isServer}
          />
          <HostModuleAdminV2Overview
            url={props.url}
            isServer={props.isServer}
          />
          <NotificationAdminV2Overview
            url={props.url}
            isServer={props.isServer}
          />
          <RbacAdminV2Overview url={props.url} isServer={props.isServer} />
          <SocialAdminV2Overview url={props.url} isServer={props.isServer} />
          <StartupAdminV2Overview url={props.url} isServer={props.isServer} />
          <TelegramAdminV2Overview url={props.url} isServer={props.isServer} />
          <WebsiteBuilderAdminV2Overview
            url={props.url}
            isServer={props.isServer}
          />
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
