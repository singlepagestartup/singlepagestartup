import { RbacSubjectAdminV2Settings } from "../../../../../rbac/models/subject/singlepage/admin-v2-settings/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminSettings() {
  return (
    <div data-ds-page="host.page.admin-settings">
      <AdminV2PageShell
        activePath="/admin/settings"
        eyebrow="host.page"
        title="Admin settings"
        description="Host-owned page recipe for the runnable /admin/settings route."
      >
        <RbacSubjectAdminV2Settings />
      </AdminV2PageShell>
    </div>
  );
}
