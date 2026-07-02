import { Link2, Plus, Unlink } from "lucide-react";

const attributes = [
  ["delivery", "2-4 weeks", "delivery window"],
  ["support", "30 days", "included support"],
  ["team-size", "2 specialists", "delivery team"],
];

export function EcommerceProductsToAttributesAdminV2Manager() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      data-ds-block="ecommerce.relation.products-to-attributes.admin-v2-manager"
      data-ds-layer="singlepage"
    >
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            ecommerce.products-to-attributes
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Product attributes
          </h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
          type="button"
        >
          <Plus className="h-4 w-4" />
          Link attribute
        </button>
      </header>
      <div className="grid gap-3 p-5">
        {attributes.map(([key, value, description]) => (
          <article
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
            key={key}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700">
                <Link2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-slate-950">{key}</p>
                <p className="text-sm text-slate-500">
                  {value} - {description}
                </p>
              </div>
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
              type="button"
            >
              <Unlink className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
