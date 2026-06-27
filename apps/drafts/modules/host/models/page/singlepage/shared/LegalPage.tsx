import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ChevronRight } from "lucide-react";

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

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalPageProps = {
  breadcrumbLabel: string;
  description: string;
  icon: LucideIcon;
  sections: LegalSection[];
  title: string;
  updatedAt: string;
};

function renderLegalBlock(block: LegalBlock, index: number) {
  if (block.type === "paragraph") {
    return (
      <p className="text-sm leading-6 text-slate-700" key={index}>
        {block.text}
      </p>
    );
  }

  if (block.type === "subheading") {
    return (
      <h3 className="pt-2 text-sm font-semibold text-slate-800" key={index}>
        {block.text}
      </h3>
    );
  }

  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";

    return (
      <List
        className={`ml-5 space-y-1 text-sm leading-6 text-slate-700 ${
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
        className="overflow-hidden rounded-xl border border-slate-200"
        key={index}
      >
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600">
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
              <tr className="border-t border-slate-100" key={row.join(":")}>
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
      className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800"
      key={index}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{block.text}</p>
    </div>
  );
}

export function LegalPage(props: LegalPageProps) {
  const Icon = props.icon;

  return (
    <section className="w-full bg-[#eaf0f7] py-12">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-1.5 text-xs text-slate-400"
        >
          <a className="transition hover:text-slate-600" href="/">
            Home
          </a>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600">{props.breadcrumbLabel}</span>
        </nav>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <header className="mb-10 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {props.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Last updated: {props.updatedAt}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {props.description}
              </p>
            </div>
          </header>

          <div className="space-y-8">
            {props.sections.map((section) => (
              <section className="space-y-3" key={section.title}>
                <h2 className="text-base font-semibold text-slate-900">
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
