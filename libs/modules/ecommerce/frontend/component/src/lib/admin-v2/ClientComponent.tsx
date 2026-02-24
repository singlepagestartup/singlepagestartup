"use client";

import { Component as PanelComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/panel/Component";
import { Component as SidebarModuleItemComponent } from "./sidebar-module-item";
import { Component as ProductComponent } from "@sps/ecommerce/models/product/frontend/component";
import { Component as AttributeComponent } from "@sps/ecommerce/models/attribute/frontend/component";
import { IComponentProps } from "./interface";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const MODULE = {
  id: "ecommerce",
  name: "Ecommerce",
  icon: "🛍️",
};

const MODELS = ["product", "attribute"] as const;

function formatModelLabel(modelName: string) {
  return modelName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Component(props: IComponentProps) {
  const getModelHeader = (modelName: string) => {
    const moduleHref = `${props.adminBasePath}/modules/${MODULE.id}`;
    const modelHref = `${moduleHref}/models/${modelName}`;

    return (
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={moduleHref} className="transition hover:text-foreground">
          {MODULE.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={modelHref}
          className="font-medium text-foreground transition hover:underline"
        >
          {formatModelLabel(modelName)}
        </Link>
      </div>
    );
  };

  const moduleOverviewCards = MODELS.map((modelName) => {
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
  });

  return (
    <div className="flex h-screen" data-testid="admin-prototype-root">
      <PanelComponent
        showSettingsButton={false}
        isSettingsView={props.isSettingsView}
        onOpenSettings={props.onOpenSettings}
      >
        <SidebarModuleItemComponent moduleItem={MODULE} models={[...MODELS]} />
      </PanelComponent>

      {props.children({
        moduleName: MODULE.name,
        moduleOverviewCards,
        getModelHeader,
      })}
    </div>
  );
}
