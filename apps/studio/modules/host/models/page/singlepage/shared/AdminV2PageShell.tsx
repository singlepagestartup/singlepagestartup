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
    <main className="min-h-screen bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] antialiased">
      <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-[280px_1fr] lg:grid-rows-1">
        <WebsiteBuilderAdminV2Navigation activePath={activePath} />
        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium tracking-normal text-[var(--workspace-brand-muted)]">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl text-[var(--workspace-brand-foreground)]">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--workspace-brand-muted)]">
                {description}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2 text-sm text-[var(--workspace-brand-muted)] ">
              Local preview
            </div>
          </header>
          <div className="grid gap-5">{children}</div>
        </section>
      </div>
    </main>
  );
}
