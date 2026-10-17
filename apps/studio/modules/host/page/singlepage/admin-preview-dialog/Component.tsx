import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";

import { AdminV2PageShell } from "../shared/AdminV2PageShell";

export function AdminPreviewDialog({
  variant = "admin-preview-dialog",
}: IComponentProps = {}) {
  return (
    <div
      data-ds-page="host.page.admin-preview-dialog"
      data-module="host"
      data-model="page"
      data-variant={variant}
    >
      <AdminV2PageShell
        activePath="/admin/website-builder/widget"
        eyebrow="host.page"
        title="Content preview"
        description="Edit page content and review it at desktop or mobile width."
      >
        <div className="rounded-3xl border border-border bg-muted p-5">
          <div className="mx-auto max-w-5xl rounded-2xl bg-card p-4 ">
            <WebsiteBuilderModuleWidget variant="admin-v2-rich-editor" />
          </div>
        </div>
      </AdminV2PageShell>
    </div>
  );
}
