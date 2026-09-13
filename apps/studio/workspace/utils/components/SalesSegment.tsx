import type { IDocumentConfirmation } from "../../../../../tools/studio/workspace/document";
import type { IProductPageView } from "../products/pages";
import {
  journeyRows,
  salesJourneyMarkdown,
  salesSegmentProfileMarkdown,
  type ISalesProcess,
  type ISalesSegment,
} from "../products/sales";
import { MarkdownDocument } from "./ArtifactBrowser";

export interface ISalesSegmentProps {
  segment: ISalesSegment;
  baseUrl: string;
}

/** One decision profile and journey, authored in the product's Sales source. */
export function SalesSegment({ segment, baseUrl }: ISalesSegmentProps) {
  return (
    <article className="min-w-0 space-y-8 p-6 md:p-10">
      <MarkdownDocument hideTitle baseUrl={baseUrl}>
        {salesSegmentProfileMarkdown(segment)}
      </MarkdownDocument>
      <section aria-labelledby={`cjm-${segment.id}`}>
        <h3
          id={`cjm-${segment.id}`}
          className="mb-4 text-xl font-semibold text-slate-950"
        >
          Customer Journey Map (CJM)
        </h3>
        {segment.journey.length ? (
          <>
            <div className="space-y-3 md:hidden">
              {segment.journey.map((step, index) => (
                <details
                  key={step.id}
                  open={index === 0}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <summary className="cursor-pointer font-semibold text-teal-950">
                    {String(index + 1).padStart(2, "0")} · {step.name}
                  </summary>
                  <dl className="mt-4 space-y-4 text-sm leading-6">
                    {journeyRows.map(({ label, key }) => (
                      <div key={key}>
                        <dt className="font-medium text-slate-900">{label}</dt>
                        <dd className="mt-1 text-slate-700">
                          {String(step[key])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </div>
            <p className="mb-3 hidden text-sm text-slate-500 md:block">
              Scroll horizontally to compare the full journey.
            </p>
            <div
              role="region"
              aria-label={`${segment.name} customer journey map`}
              tabIndex={0}
              className="hidden max-w-full overflow-x-auto rounded-xl border border-slate-200 focus-visible:outline-2 focus-visible:outline-teal-600 md:block"
            >
              <table className="w-full border-separate border-spacing-0 text-left text-sm leading-6">
                <caption className="sr-only">
                  {segment.name}: goals, decisions, touchpoints and
                  relationships
                </caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 z-10 min-w-40 border-b border-r border-slate-200 bg-slate-100 p-4"
                    >
                      Customer perspective
                    </th>
                    {segment.journey.map((step, index) => (
                      <th
                        key={step.id}
                        scope="col"
                        className="min-w-64 border-b border-r border-slate-200 bg-teal-50 p-4 align-top font-semibold text-teal-950"
                      >
                        <span className="mb-2 block text-xs text-teal-700">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {step.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {journeyRows.map(({ label, key }) => (
                    <tr key={key}>
                      <th
                        scope="row"
                        className="sticky left-0 border-b border-r border-slate-200 bg-slate-50 p-4 align-top font-medium text-slate-800"
                      >
                        {label}
                      </th>
                      {segment.journey.map((step) => (
                        <td
                          key={step.id}
                          className="border-b border-r border-slate-200 p-4 align-top text-slate-700"
                        >
                          {String(step[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">
            The customer journey has not been defined.
          </p>
        )}
      </section>
      {segment.journey.length > 0 && (
        <details className="rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer font-semibold text-slate-900">
            Responsibilities and handoffs
          </summary>
          <MarkdownDocument>
            {salesJourneyMarkdown(segment).split(
              "### Responsibilities and handoffs\n",
            )[1] ?? ""}
          </MarkdownDocument>
        </details>
      )}
    </article>
  );
}

export function salesSegmentPages(
  process: ISalesProcess,
  layer: "singlepage" | "startup",
  sourcePath: string,
  confirmation: IDocumentConfirmation,
): IProductPageView[] {
  if (!process.segments.length) return [];
  const baseUrl = `/workspace-products/${sourcePath.split("/products/")[1]}`;
  return [
    {
      id: "sales-customer-segments",
      title: "Customer segments",
      kind: "group",
      layer,
      children: process.segments.map((segment) => ({
        id: `sales-segment-${segment.id}`,
        title: segment.name,
        kind: "react",
        layer,
        sourcePath,
        url: baseUrl,
        confirmation,
        downloadName: `${process.product_id}-${segment.id}-sales.md`,
        markdown: `${salesSegmentProfileMarkdown(segment)}\n${salesJourneyMarkdown(segment)}`,
        Component: () => <SalesSegment segment={segment} baseUrl={baseUrl} />,
        children: [],
      })),
    },
  ];
}
