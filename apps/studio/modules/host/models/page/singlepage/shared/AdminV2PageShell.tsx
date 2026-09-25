import type { ReactNode } from "react";

import { WebsiteBuilderAdminV2Navigation } from "../../../../../website-builder/models/widget/singlepage/admin-v2-navigation/Component";

export interface AdminV2PageShellProps {
  activePath: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AdminV2PageShell({
  activePath,
  eyebrow,
  title,
  description,
  children,
}: AdminV2PageShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <WebsiteBuilderAdminV2Navigation activePath={activePath} />
        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              Storybook static state
            </div>
          </header>
          <div className="grid gap-5">{children}</div>
        </section>
      </div>
    </main>
  );
}
