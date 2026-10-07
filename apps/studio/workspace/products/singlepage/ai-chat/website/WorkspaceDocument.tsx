import type { ReactNode } from "react";
import "../../../../styles/singlepage.css";
import { MarkdownDocument } from "../../../../utils/components/ArtifactBrowser";
import { kit } from "../../../../design/singlepage/interface-kit/primitives";

interface IWorkspaceDocumentProps {
  eyebrow: string;
  text: string;
  children?: ReactNode;
}

export function WorkspaceDocument({
  eyebrow,
  text,
  children,
}: IWorkspaceDocumentProps) {
  return (
    <div
      data-workspace-projection="singlepage"
      className="min-h-[760px] bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--workspace-brand-line)] bg-white px-6 py-5">
        <img
          alt="SinglePageStartup"
          className="h-auto w-52 max-w-full"
          src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg"
        />
        <span className="rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-3 py-1.5 text-sm font-medium">
          {eyebrow}
        </span>
      </header>
      <div className="grid min-h-[680px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 lg:border-r lg:border-b-0">
          <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
            Workspace
          </p>
          <nav
            className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm lg:flex-col lg:overflow-visible"
            aria-label="Project workspace"
          >
            {[
              { label: "Add materials", href: "/projects/new" },
              { label: "Project documents", href: "/projects/example" },
              { label: "Tokens", href: "/tokens" },
              { label: "Settings", href: "/settings" },
              { label: "Help", href: "/help" },
              {
                label: "Code Framework",
                href: "https://github.com/singlepagestartup/singlepagestartup",
              },
            ].map((item) => (
              <a
                aria-current={item.label === eyebrow ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-xl px-4 py-2 ${kit.focus} ${item.label === eyebrow ? "bg-[var(--workspace-brand-foreground)] font-semibold text-white focus-visible:outline-[var(--workspace-brand-accent)]" : "text-[var(--workspace-brand-muted)] hover:bg-[var(--workspace-brand-background)]"}`}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 p-4 sm:p-8 lg:p-10">
          <article className="mx-auto max-w-4xl min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8 lg:p-10 [&>div]:text-base [&>div]:text-[var(--workspace-brand-foreground)] [&>div_h1]:text-[40px] [&>div_h1]:font-semibold [&>div_h1]:leading-[1.1] [&>div_h1]:tracking-normal [&>div_h1]:text-[var(--workspace-brand-foreground)] [&>div_h1]:[font-family:var(--workspace-brand-font-display)] sm:[&>div_h1]:text-[56px] [&>div_h2]:mt-10 [&>div_h2]:text-[28px] [&>div_h2]:leading-tight [&>div_h2]:text-[var(--workspace-brand-foreground)] [&>div_h2]:[font-family:var(--workspace-brand-font-display)] [&>div_h3]:text-lg [&>div_h3]:text-[var(--workspace-brand-foreground)] [&>div_a]:text-[var(--workspace-brand-foreground)] [&>div_a]:decoration-[var(--workspace-brand-line)] [&>div_blockquote]:border-[var(--workspace-brand-line)] [&>div_code]:bg-[var(--workspace-brand-background)] [&>div_td]:border-[var(--workspace-brand-line)] [&>div_td]:p-3 [&>div_th]:border-[var(--workspace-brand-line)] [&>div_th]:bg-[var(--workspace-brand-background)] [&>div_th]:p-3 [&>div_table]:text-sm">
            <MarkdownDocument>{text}</MarkdownDocument>
            {children}
          </article>
        </main>
      </div>
    </div>
  );
}
