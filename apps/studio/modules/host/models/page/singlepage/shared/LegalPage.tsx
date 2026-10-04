import {
  AlertTriangle,
  ChevronRight,
  type ModuleIcon,
} from "../../../../../../workspace/utils/components/ModuleIcons";

type LegalTable = {
  headers: [string, string];
  rows: Array<[string, string]>;
};

type LegalBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "subheading";
      text: string;
    }
  | {
      type: "list";
      ordered?: boolean;
      items: string[];
    }
  | {
      type: "table";
      table: LegalTable;
    }
  | {
      type: "callout";
      text: string;
    };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalPageProps {
  breadcrumbLabel: string;
  description: string;
  icon: ModuleIcon;
  sections: LegalSection[];
  title: string;
  updatedAt: string;
}

function renderLegalBlock(block: LegalBlock, index: number) {
  if (block.type === "paragraph") {
    return (
      <p
        className="text-base leading-7 text-[var(--workspace-brand-foreground)]"
        key={index}
      >
        {block.text}
      </p>
    );
  }

  if (block.type === "subheading") {
    return (
      <h3
        className="pt-2 text-lg font-semibold text-[var(--workspace-brand-foreground)]"
        key={index}
      >
        {block.text}
      </h3>
    );
  }

  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";

    return (
      <List
        className={`ml-5 space-y-1 text-base leading-7 text-[var(--workspace-brand-foreground)] ${
          block.ordered ? "list-decimal" : "list-disc"
        }`}
        key={index}
      >
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
    );
  }

  if (block.type === "table") {
    return (
      <div
        className="overflow-hidden rounded-xl border border-[var(--workspace-brand-line)]"
        key={index}
      >
        <table className="w-full text-left text-sm text-[var(--workspace-brand-foreground)]">
          <thead className="bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-muted)]">
            <tr>
              {block.table.headers.map((header) => (
                <th className="px-3 py-2 font-semibold" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.table.rows.map((row) => (
              <tr
                className="border-t border-[var(--workspace-brand-line)]"
                key={row.join(":")}
              >
                {row.map((cell) => (
                  <td className="px-3 py-2 align-top" key={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div
      className="flex gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-4 py-3 text-xs leading-5 text-[var(--workspace-brand-foreground)]"
      key={index}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{block.text}</p>
    </div>
  );
}

export function LegalPage(props: LegalPageProps) {
  const Icon = props.icon;

  return (
    <section className="w-full bg-[var(--workspace-brand-background)] py-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-1.5 text-xs text-[var(--workspace-brand-muted)]"
        >
          <a
            className="transition hover:text-[var(--workspace-brand-muted)]"
            href="/"
          >
            Home
          </a>
          <ChevronRight className="h-5 w-5" />
          <span className="text-[var(--workspace-brand-muted)]">
            {props.breadcrumbLabel}
          </span>
        </nav>

        <article className="rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6  sm:p-8 lg:p-10">
          <header className="mx-auto mb-6 max-w-3xl border-b border-[var(--workspace-brand-line)] pb-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--workspace-brand-primary)] text-white">
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-sm text-[var(--workspace-brand-muted)]">
                Last updated: {props.updatedAt}
              </p>
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl text-[var(--workspace-brand-foreground)]">
                {props.title}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--workspace-brand-muted)]">
                {props.description}
              </p>
            </div>
          </header>

          <div className="mx-auto max-w-3xl space-y-10">
            {props.sections.map((section) => (
              <section className="space-y-3" key={section.title}>
                <h2 className="text-xl font-semibold text-[var(--workspace-brand-foreground)]">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.blocks.map(renderLegalBlock)}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
