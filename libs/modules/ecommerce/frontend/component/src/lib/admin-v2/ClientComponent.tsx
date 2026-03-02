"use client";

import { Button } from "@sps/shared-ui-shadcn";
import { Component as PanelComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/panel/Component";
import { Component as SidebarModuleItemComponent } from "./sidebar-module-item";
import { Component as ProductComponent } from "@sps/ecommerce/models/product/frontend/component";
import { Component as AttributeComponent } from "@sps/ecommerce/models/attribute/frontend/component";
import { CircleHelp, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { IComponentProps } from "./interface";
import { useAdminRoute } from "@sps/shared-frontend-client-utils";

const MODULE = {
  id: "ecommerce",
  name: "Ecommerce",
  icon: "🛍️",
};

const MODELS = ["product", "attribute"] as const;

function formatLabel(value: string): string {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Component(props: IComponentProps) {
  const pathname = usePathname();
  const {
    currentPath,
    module: selectedModule,
    model: selectedModel,
  } = useAdminRoute(pathname);
  const isModuleOverview =
    (!selectedModule || selectedModule === MODULE.id) && !selectedModel;
  const hasRenderableChildren = Boolean(props.children);

  if (!props.children && selectedModule && selectedModule !== MODULE.id) {
    return null;
  }

  const defaultContent = (
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
            <Link href={`${props.adminBasePath}/profile`} aria-label="Account">
              <UserRound className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">
              {isModuleOverview
                ? MODULE.name
                : selectedModel
                  ? formatLabel(selectedModel)
                  : MODULE.name}
            </h1>
          </div>

          <section className="space-y-3">
            {isModuleOverview ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {MODELS.map((modelName) => {
                  const href = `${props.adminBasePath}/modules/${MODULE.id}/models/${modelName}`;

                  if (modelName === "product") {
                    return (
                      <ProductComponent
                        key={modelName}
                        isServer={false}
                        variant="admin-v2-module-overview-card"
                        href={href}
                      />
                    );
                  }

                  return (
                    <AttributeComponent
                      key={modelName}
                      isServer={false}
                      variant="admin-v2-module-overview-card"
                      href={href}
                    />
                  );
                })}
              </div>
            ) : null}

            {selectedModel === "product" ? (
              <ProductComponent
                isServer={false}
                variant="admin-v2-table"
                header={
                  <ProductComponent
                    isServer={false}
                    variant="admin-v2-model-header"
                    adminBasePath={props.adminBasePath}
                  />
                }
              />
            ) : null}

            {selectedModel === "attribute" ? (
              <AttributeComponent
                isServer={false}
                variant="admin-v2-table"
                header={
                  <AttributeComponent
                    isServer={false}
                    variant="admin-v2-model-header"
                    adminBasePath={props.adminBasePath}
                  />
                }
              />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex h-screen" data-testid="admin-prototype-root">
      <PanelComponent
        isSettingsView={props.isSettingsView}
        settingsHref={`${props.adminBasePath}/settings`}
      >
        <SidebarModuleItemComponent moduleItem={MODULE} models={[...MODELS]} />
      </PanelComponent>

      {hasRenderableChildren ? props.children : defaultContent}
    </div>
  );
}
