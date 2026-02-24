"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { CircleHelp, UserRound } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminV2Component as EcommerceAdminV2Component } from "@sps/ecommerce/frontend/component";
import { Component as ProductComponent } from "@sps/ecommerce/models/product/frontend/component";
import { Component as AttributeComponent } from "@sps/ecommerce/models/attribute/frontend/component";
import { Component as ProductsToAttributesComponent } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import {
  SettingsPageClientComponent,
  settingsOperationConfigs,
  TSettingsOperationKey,
  TSettingsOperationState,
} from "./settings-page";
import { AccountSettingsPageClientComponent } from "./account-settings-page";
import { IAdminPanelDraftProps } from "./interface";

function normalizeAdminPath(url: string): string {
  const value = String(url || "").replace(/^\/admin/, "") || "/";
  return value.startsWith("/") ? value : `/${value}`;
}

function formatLabel(value: string): string {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isSettingsRoute(path: string): boolean {
  return path === "/settings" || path.startsWith("/settings/");
}

function isAccountRoute(path: string): boolean {
  return path === "/account" || path.startsWith("/account/");
}

const initialSettingsOperationState: Record<
  TSettingsOperationKey,
  TSettingsOperationState
> = {
  backendCacheClear: {
    status: "idle",
    message: "",
  },
  frontendRevalidate: {
    status: "idle",
    message: "",
  },
};

export function Component(props: IAdminPanelDraftProps) {
  const router = useRouter();
  const [settingsOperations, setSettingsOperations] = useState(
    initialSettingsOperationState,
  );

  const adminBasePath = "/admin";
  const adminPath = useMemo(() => normalizeAdminPath(props.url), [props.url]);
  const routeMatch = useMemo(
    () => adminPath.match(/^\/modules\/([^/]+)(?:\/models\/([^/]+))?$/),
    [adminPath],
  );
  const selectedModule = routeMatch?.[1] || "ecommerce";
  const selectedModel = routeMatch?.[2] || "";
  const settingsView = isSettingsRoute(adminPath);
  const accountView = isAccountRoute(adminPath);

  const runSettingsOperation = useCallback(
    async (key: TSettingsOperationKey) => {
      const config = settingsOperationConfigs[key];

      setSettingsOperations((previous) => ({
        ...previous,
        [key]: {
          status: "loading",
          message: "Running operation...",
        },
      }));

      try {
        const response = await fetch(config.endpoint, {
          method: config.method,
        });

        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }

        setSettingsOperations((previous) => ({
          ...previous,
          [key]: {
            status: "success",
            message: config.successMessage,
          },
        }));
      } catch (error) {
        setSettingsOperations((previous) => ({
          ...previous,
          [key]: {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Operation failed. Check backend route availability.",
          },
        }));
      }
    },
    [],
  );

  const copyToClipboard = useCallback((value: string) => {
    if (!value) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    void navigator.clipboard.writeText(value);
  }, []);

  const renderProductsToAttributes = useCallback((relationProps: any) => {
    const productId = String(relationProps?.data?.id || "");

    if (!productId) {
      return null;
    }

    return (
      <ProductsToAttributesComponent
        isServer={false}
        variant="admin-v2-table"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "productId",
                  method: "eq",
                  value: productId,
                },
              ],
            },
          },
        }}
      />
    );
  }, []);

  const renderProductForm = useCallback(
    (formProps: any) => {
      return (
        <ProductComponent
          isServer={false}
          variant="admin-v2-form"
          data={formProps?.data}
          productsToAttributes={renderProductsToAttributes}
        />
      );
    },
    [renderProductsToAttributes],
  );

  const renderAttributeForm = useCallback((formProps: any) => {
    return (
      <AttributeComponent
        isServer={false}
        variant="admin-v2-form"
        data={formProps?.data}
      />
    );
  }, []);

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
        isSettingsView={settingsView}
        onOpenSettings={() => {
          router.push(`${adminBasePath}/settings`);
        }}
      >
        {({ moduleName, moduleOverviewCards, getModelHeader }) => {
          const isModuleOverview =
            !settingsView &&
            !accountView &&
            selectedModule === "ecommerce" &&
            !selectedModel;

          const pageTitle = settingsView
            ? "Settings"
            : accountView
              ? "Account"
              : isModuleOverview
                ? moduleName
                : formatLabel(selectedModel || moduleName);

          return (
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
                    type="button"
                    variant="outline"
                    size="icon"
                    className="!w-10 rounded-md p-2 transition hover:bg-muted"
                    aria-label="Account"
                    onClick={() => {
                      router.push(`${adminBasePath}/account`);
                    }}
                  >
                    <UserRound className="h-5 w-5" />
                  </Button>
                </div>
              </header>

              <main className="flex-1 overflow-auto bg-background p-6">
                <div className="mx-auto max-w-7xl space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight capitalize">
                      {pageTitle}
                    </h1>
                  </div>

                  <section className="space-y-3">
                    {settingsView ? (
                      <SettingsPageClientComponent
                        operations={settingsOperations}
                        onRequestOperation={runSettingsOperation}
                      />
                    ) : null}

                    {accountView ? (
                      <AccountSettingsPageClientComponent
                        onCopyId={copyToClipboard}
                        onOpenSocialProfile={(profileId) => {
                          router.push(
                            `${adminBasePath}/modules/social/models/profile/${profileId}`,
                          );
                        }}
                        onIdentityAction={() => {}}
                        onLogout={() => {}}
                      />
                    ) : null}

                    {isModuleOverview ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {moduleOverviewCards}
                      </div>
                    ) : null}

                    {!settingsView &&
                    !accountView &&
                    selectedModel === "product" ? (
                      <ProductComponent
                        isServer={false}
                        variant="admin-v2-table"
                        header={getModelHeader("product")}
                        adminForm={renderProductForm}
                      />
                    ) : null}

                    {!settingsView &&
                    !accountView &&
                    selectedModel === "attribute" ? (
                      <AttributeComponent
                        isServer={false}
                        variant="admin-v2-table"
                        header={getModelHeader("attribute")}
                        adminForm={renderAttributeForm}
                      />
                    ) : null}
                  </section>
                </div>
              </main>
            </div>
          );
        }}
      </EcommerceAdminV2Component>
    </section>
  );
}
