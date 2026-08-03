import { Image, Save } from "lucide-react";

export function EcommerceProductAdminV2Form() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      data-ds-block="ecommerce.product.admin-v2-form"
      data-ds-layer="singlepage"
    >
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            ecommerce.product
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Edit product
          </h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
          type="button"
        >
          <Save className="h-4 w-4" />
          Save changes
        </button>
      </header>
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-4">
          {[
            ["Title", "Website development"],
            ["Slug", "website-development"],
            ["Variant", "service"],
            ["Price", "$4,800"],
          ].map(([label, value]) => (
            <label className="grid gap-1.5 text-sm" key={label}>
              <span className="font-medium text-slate-700">{label}</span>
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900">
                {value}
              </span>
            </label>
          ))}
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-700">
              Short description
            </span>
            <span className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 leading-6 text-slate-700">
              A product form state with localized copy, price metadata, media
              relation slots, and publish controls.
            </span>
          </label>
        </div>
        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
            <Image className="h-8 w-8" />
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <span>products-to-file-storage-module-files</span>
            <span>products-to-attributes</span>
            <span>products-to-website-builder-module-widgets</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
