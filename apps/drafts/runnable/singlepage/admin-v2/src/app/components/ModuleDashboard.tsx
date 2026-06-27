import React from "react";
import { useParams, useNavigate } from "react-router";
import { api } from "../data";

export function ModuleDashboard() {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();
  const modules = api.getModules();
  const currentModule = modules.find((m) => m.slug === moduleSlug);

  if (!currentModule)
    return <div className="p-8 text-sm text-slate-400">Module not found</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl tracking-tight">{currentModule.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {currentModule.models.map((model) => {
          const total = api.getRecords(model.slug).length;
          return (
            <article
              key={model.id}
              className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg capitalize">{model.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{model.slug}</p>
                </div>
                <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {total}
                </span>
              </div>

              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Route</p>
                <p className="mt-0.5 truncate font-mono text-xs text-slate-900">
                  /api/{moduleSlug}/{model.slug}
                </p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/${moduleSlug}/${model.slug}`)}
                  className="inline-flex w-full items-center justify-center rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm text-white shadow-sm transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Open model
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
