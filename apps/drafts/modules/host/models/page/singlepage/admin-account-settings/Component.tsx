import { SubjectMeAccountSettings } from "../../../../../rbac/models/widget/singlepage/subject-me-account-settings/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminAccountSettings() {
  return (
    <div data-ds-page="host.page.admin-account-settings">
      <AdminV2PageShell
        activePath="/admin/settings"
        eyebrow="host.page"
        title="Admin account settings"
        description="Host-owned page recipe for the runnable /admin/settings/account route."
      >
        <SubjectMeAccountSettings />
      </AdminV2PageShell>
    </div>
  );
}
