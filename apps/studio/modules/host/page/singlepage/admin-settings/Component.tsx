import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminSettings({
  variant = "admin-settings",
}: IComponentProps = {}) {
  return (
    <div
      data-ds-page="host.page.admin-settings"
      data-module="host"
      data-model="page"
      data-variant={variant}
    >
      <AdminV2PageShell
        activePath="/admin/settings"
        eyebrow="host.page"
        title="Workspace settings"
        description="Manage the account and preferences for this workspace."
      >
        <RbacModuleSubject variant="admin-v2-settings" />
      </AdminV2PageShell>
    </div>
  );
}
