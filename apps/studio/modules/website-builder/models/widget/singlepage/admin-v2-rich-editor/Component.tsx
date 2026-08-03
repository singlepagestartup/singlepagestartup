import { Bold, Image, Italic, Link, List, Monitor, Save } from "lucide-react";

export function WebsiteBuilderAdminV2RichEditor() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      data-ds-block="website-builder.widget.admin-v2-rich-editor"
      data-ds-layer="singlepage"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            website-builder.widget
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            Content editor
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {[Bold, Italic, Link, List, Image].map((Icon) => (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              key={Icon.displayName ?? Icon.name}
              type="button"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
            type="button"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </header>
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_320px]">
        <div className="min-h-[360px] rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            Reusable Storybook block content
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This editor surface represents the runnable TipTap editor as a
            static admin-v2 state. Concrete article or widget editing remains
            owned by the model being edited.
          </p>
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">
            Content blocks, rich text, file references, and localized fields are
            previewed here without importing the runnable editor runtime.
          </div>
        </div>
        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <Monitor className="h-4 w-4" />
            Preview states
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <span className="rounded-lg bg-white px-3 py-2">Desktop</span>
            <span className="rounded-lg bg-white px-3 py-2">Mobile</span>
            <span className="rounded-lg bg-white px-3 py-2">
              Localized text
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
