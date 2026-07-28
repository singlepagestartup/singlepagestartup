import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";

const products = [
  {
    id: "product_website",
    title: "Website development",
    slug: "website-development",
    price: "$4,800",
    variant: "service",
    status: "published",
  },
  {
    id: "product_design",
    title: "Design system sprint",
    slug: "design-system-sprint",
    price: "$2,400",
    variant: "package",
    status: "draft",
  },
  {
    id: "product_support",
    title: "Support retainer",
    slug: "support-retainer",
    price: "$900/mo",
    variant: "subscription",
    status: "published",
  },
];

export function EcommerceProductAdminV2List() {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      data-ds-block="ecommerce.product.admin-v2-list"
      data-ds-layer="singlepage"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            ecommerce.product
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Products
          </h2>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
          type="button"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </header>
      <div className="border-b border-slate-200 p-4">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          Search products, slugs, variants
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Variant</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map((product) => (
              <tr className="text-slate-700" key={product.id}>
                <td className="px-5 py-4 font-medium text-slate-950">
                  {product.title}
                </td>
                <td className="px-5 py-4 font-mono text-xs">{product.slug}</td>
                <td className="px-5 py-4">{product.variant}</td>
                <td className="px-5 py-4">{product.price}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {product.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    {[Eye, Edit, Trash2].map((Icon) => (
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                        key={Icon.displayName ?? Icon.name}
                        type="button"
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
