import { RbacSubjectAdminV2Settings } from "../../../../../rbac/models/subject/singlepage/admin-v2-settings/Component";
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
        <RbacSubjectAdminV2Settings />
      </AdminV2PageShell>
    </div>
  );
}
