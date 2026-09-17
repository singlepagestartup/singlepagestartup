import type { ReactNode } from "react";
import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";

export function WorkspaceDocument({
  eyebrow,
  text,
  children,
}: {
  eyebrow: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-[760px] bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--workspace-brand-line)] bg-white px-6 py-5">
        <img
          alt="SinglePageStartup"
          className="w-52"
          src="/workspace-assets/singlepage/generated/measured-space/singlepagestartup-primary-lockup.svg"
        />
        <span className="rounded-full bg-[var(--workspace-brand-accent)] px-4 py-2 text-xs font-semibold uppercase tracking-widest">
          {eyebrow}
        </span>
      </header>
      <div className="grid min-h-[680px] md:grid-cols-[240px_1fr]">
        <aside className="border-r border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--workspace-brand-muted)]">
            Workspace
          </p>
          <nav
            className="mt-5 space-y-2 text-sm"
            aria-label="Project workspace"
          >
            {[
              { label: "Add materials", href: "/projects/new" },
              { label: "Business workspace", href: "/projects/example" },
              {
                label: "Landing page",
                href: "/projects/example/landing-page",
              },
              { label: "Tokens", href: "/tokens" },
              { label: "Settings", href: "/settings" },
              { label: "Help", href: "/help" },
              {
                label: "Code Framework",
                href: "https://github.com/singlepagestartup/singlepagestartup",
              },
            ].map((item) => (
              <a
                className={`block rounded-lg px-3 py-2 ${item.label === eyebrow ? "bg-white font-semibold shadow-sm" : "text-[var(--workspace-brand-muted)]"}`}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 p-6 sm:p-10">
          <article className="mx-auto max-w-4xl rounded-3xl border border-[var(--workspace-brand-line)] bg-white p-6 shadow-sm sm:p-10 [&_h1]:text-5xl [&_h1]:font-semibold [&_h1]:leading-none [&_h1]:[font-family:var(--workspace-brand-font-display)] [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:[font-family:var(--workspace-brand-font-display)] [&_table]:text-sm">
            <MarkdownDocument>{text}</MarkdownDocument>
            {children}
          </article>
        </main>
      </div>
    </div>
  );
}
