import { Component as RbacModuleSubject } from "../../../../rbac/subject";

import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminSettings() {
  return (
    <div data-ds-page="host.page.admin-settings">
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
