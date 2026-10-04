import { WebsiteBuilderAdminV2RichEditor } from "../../../../../website-builder/models/widget/singlepage/admin-v2-rich-editor/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminPreviewDialog() {
  return (
    <div data-ds-page="host.page.admin-preview-dialog">
      <AdminV2PageShell
        activePath="/admin/website-builder/widget"
        eyebrow="host.page"
        title="Content preview"
        description="Edit page content and review it at desktop or mobile width."
      >
        <div className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
          <div className="mx-auto max-w-5xl rounded-2xl bg-[var(--workspace-brand-surface)] p-4 ">
            <WebsiteBuilderAdminV2RichEditor />
          </div>
        </div>
      </AdminV2PageShell>
    </div>
  );
}
