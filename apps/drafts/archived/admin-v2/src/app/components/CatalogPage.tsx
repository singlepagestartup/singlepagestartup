import { useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Search, ShoppingCart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  catalogProducts,
  catalogCategories,
  getProductsByCategory,
} from "../catalogData";

export function CatalogPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = getProductsByCategory(activeCategory).filter((p) =>
    search
      ? p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.shortDescription.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <main className="flex-1">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
            Services
          </p>
          <h1 className="text-3xl tracking-tight text-slate-900 lg:text-4xl">
            What We Build
          </h1>
          <p className="mt-3 max-w-xl text-slate-600">
            End-to-end digital services — from website development and SaaS
            products to consulting, audits, and team training.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {catalogCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition ${
                  activeCategory === cat.slug
                    ? "border-slate-300 bg-white text-slate-900"
                    : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
            <p className="text-sm text-slate-500">
              No services found for this filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <Link
                key={product.id}
                to={`/services/${product.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  {product.badge && (
                    <span className="absolute right-3 top-3 rounded-md border border-slate-300 bg-slate-900 px-2 py-0.5 text-[10px] text-white">
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
                      {product.category}
                    </span>
                    <span className="text-sm text-slate-900">
                      {product.priceLabel}
                    </span>
                  </div>
                  <h3 className="text-sm text-slate-900 group-hover:text-slate-700">
                    {product.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.subtitle}
                  </p>
                  <p className="mt-3 flex-1 text-sm text-slate-500">
                    {product.shortDescription.length > 110
                      ? product.shortDescription.slice(0, 110) + "..."
                      : product.shortDescription}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap gap-1">
                      {product.techStack.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 transition group-hover:text-slate-900">
                      Details
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
