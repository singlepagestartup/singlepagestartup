import { WebsiteBuilderAdminV2RichEditor } from "../../../../../website-builder/models/widget/singlepage/admin-v2-rich-editor/Component";
import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminPreviewDialog() {
  return (
    <div data-ds-page="host.page.admin-preview-dialog">
      <AdminV2PageShell
        activePath="/admin/website-builder/widget"
        eyebrow="host.page"
        title="Admin preview dialog"
        description="Host page recipe for runnable PreviewDialog and TipTapEditor review states."
      >
        <div className="rounded-3xl border border-slate-300 bg-slate-200 p-5">
          <div className="mx-auto max-w-5xl rounded-2xl bg-white p-4 shadow-xl">
            <WebsiteBuilderAdminV2RichEditor />
          </div>
        </div>
      </AdminV2PageShell>
    </div>
  );
}
