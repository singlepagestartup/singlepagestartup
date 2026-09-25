import { useState } from "react";
import "../../../../styles/singlepage.css";

const sections = [
  {
    id: "request",
    number: "00",
    title: "Request",
    summary: "Current situation, intended result and boundaries",
    details: [
      [
        "Working on",
        "A hosted workspace that turns existing project material into a usable business model.",
      ],
      [
        "Intended result",
        "A person can start useful project-aware chat after one focused setup session.",
      ],
      [
        "Known boundary",
        "AI Chat guides repository and server publication; Code Framework supplies the deployable foundation and runtime.",
      ],
    ],
  },
  {
    id: "strategy",
    number: "10",
    title: "Strategy",
    summary: "The final picture of how the project should work",
    details: [
      [
        "Priority audience",
        "People with an idea or early project and a mixture of notes, files and partial decisions.",
      ],
      [
        "Customer path",
        "Supply material → review the model → use chat → prepare a page sandbox → connect GitHub and a server when ready to publish.",
      ],
      [
        "Success",
        "The context supports decisions and real materials without repeated explanation.",
      ],
    ],
  },
  {
    id: "brand",
    number: "20",
    title: "Brand",
    summary: "Meaning, promise, proof and communication",
    details: [
      [
        "Meaning",
        "Begin with one clear page and add depth when the project needs it.",
      ],
      [
        "Voice",
        "Direct, calm and specific; no technical explanation unless it helps a decision.",
      ],
      [
        "Primary action",
        "Add the material you already have and review the resulting model.",
      ],
    ],
  },
  {
    id: "design",
    number: "30",
    title: "Design",
    summary: "Visual identity, interface principles and assets",
    details: [
      [
        "Interface",
        "A document workspace with one decision in focus and the project page visible beside it.",
      ],
      [
        "Identity",
        "Editorial serif headings, monospace working text, warm white, black and acid green.",
      ],
      [
        "Principle",
        "Show progress through reviewed decisions rather than artificial scores or long forms.",
      ],
    ],
  },
  {
    id: "products",
    number: "40",
    title: "Products",
    summary: "Customer, value, access, money, delivery and learning",
    details: [
      [
        "Customer and value",
        "Early-stage project owners receive one maintained project model and relevant chat.",
      ],
      [
        "Access and relationship",
        "Upload material, review decisions, work in chat, create a page and return to the saved project.",
      ],
      [
        "Money and delivery",
        "Hosted AI work uses token purchases; the owner provides the service and initial support.",
      ],
      [
        "Sales and learning",
        "The customer path and current observations stay connected to the product without being copied here.",
      ],
    ],
  },
];

const hypothesisFlow = [
  {
    number: "01",
    title: "Brief",
    pages: "Idea + goal + known facts",
    result: "The starting point for the first model",
  },
  {
    number: "02",
    title: "Draft Product",
    pages: "Customer + value + offer",
    result: "A product definition ready to inspect",
  },
  {
    number: "03",
    title: "Draft Operations & Economics",
    pages: "Delivery + revenue + costs",
    result: "The operating model behind the offer",
  },
  {
    number: "04",
    title: "Draft Sales",
    pages: "Segments + customer paths",
    result: "The complete intended sales process",
  },
  {
    number: "05",
    title: "Critical assumptions",
    pages: "Questions that can change a decision",
    result: "A focused agenda for validation",
  },
  {
    number: "06",
    title: "Research & experiments",
    pages: "Evidence + limitations",
    result: "Data for keeping or changing the model",
  },
];

export default function WorkspaceMap() {
  const [active, setActive] = useState(4);
  const section = sections[active];

  return (
    <div className="min-h-[820px] bg-[#111111] p-3 text-[#111111] [font-family:var(--workspace-brand-font-body)] sm:p-6">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-[#343434] bg-[#f7f6f2] shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#cbc9c3] bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[#111111] text-sm font-bold text-[#bfef61]">
              S
            </div>
            <div>
              <p className="text-sm font-semibold">Sample project</p>
              <p className="text-xs text-[#6b6b66]">
                Project model · Saved now
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#cbc9c3] px-3 py-2 text-xs font-semibold">
              2 unknowns
            </span>
            <span className="rounded-full bg-[#dff5b5] px-3 py-2 text-xs font-semibold">
              Ready for chat
            </span>
          </div>
        </header>

        <section
          aria-labelledby="product-cycle-title"
          className="border-b border-[#cbc9c3] bg-[#efeee9] px-5 py-6 sm:px-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b6b66]">
                How the business work moves
              </p>
              <h2
                className="mt-1 text-2xl font-semibold [font-family:var(--workspace-brand-font-display)]"
                id="product-cycle-title"
              >
                Draft, test and decide
              </h2>
            </div>
            <p className="max-w-xl text-xs leading-5 text-[#5f5f5a]">
              Draft the complete model first. Test the assumptions that can
              change it before committing to materials and implementation.
            </p>
          </div>

          <div
            aria-label="Product development loop"
            className="mt-5 flex flex-col gap-2 md:flex-row md:items-stretch md:overflow-x-auto md:pb-2"
            role="list"
          >
            {hypothesisFlow.map((step, index) => (
              <div
                className="flex min-w-0 flex-col md:shrink-0 md:flex-row md:items-center"
                key={step.number}
                role="listitem"
              >
                <article
                  className={`min-h-40 flex-1 rounded-2xl border p-4 md:w-48 md:flex-none ${index === 0 ? "border-[#111111] bg-[#111111] text-white" : index === hypothesisFlow.length - 1 ? "border-[#9fc94f] bg-[#e7f7c8]" : "border-[#cbc9c3] bg-white"}`}
                >
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${index === 0 ? "text-[#bfef61]" : "text-[#6b6b66]"}`}
                  >
                    {step.number}
                  </p>
                  <h3 className="mt-2 text-base font-semibold leading-5">
                    {step.title}
                  </h3>
                  <p
                    className={`mt-2 text-[10px] font-semibold ${index === 0 ? "text-[#d9d9d3]" : "text-[#666661]"}`}
                  >
                    {step.pages}
                  </p>
                  <p
                    className={`mt-3 text-xs leading-5 ${index === 0 ? "text-[#f2f2ed]" : "text-[#33332f]"}`}
                  >
                    {step.result}
                  </p>
                </article>
                {index < hypothesisFlow.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="py-1 text-center text-xl font-semibold text-[#777772] md:px-2 md:py-0"
                  >
                    <span className="md:hidden">↓</span>
                    <span className="hidden md:inline">→</span>
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-2xl border border-[#111111] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b6b66]">
              What did the evidence show?
            </p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-[#9fc94f] bg-[#dff5b5] p-4">
                <p className="text-xs font-semibold">Supports the decisions</p>
                <p className="mt-2 text-xs leading-5">
                  Refine and confirm the decisions, then develop Product
                  Content, Website, Marketing Creative, Presentation and the
                  product itself.
                </p>
              </div>
              <div className="rounded-xl border border-[#cbc9c3] bg-[#efeee9] p-4">
                <p className="text-xs font-semibold">Disproves an assumption</p>
                <p className="mt-2 text-xs leading-5">
                  Change Product, Operations &amp; Economics or Sales, identify
                  the next critical assumption and test again.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
          <aside className="border-b border-[#cbc9c3] bg-white p-4 lg:border-r lg:border-b-0">
            <div className="rounded-2xl bg-[#111111] p-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#bfef61]">
                Single page
              </p>
              <p className="mt-2 text-xl font-semibold [font-family:var(--workspace-brand-font-display)]">
                Project model
              </p>
              <p className="mt-2 text-xs leading-5 text-[#c7c7c2]">
                Five compact sections. Add a deeper document when the work needs
                it.
              </p>
            </div>
            <nav aria-label="Project model sections" className="mt-4 space-y-1">
              {sections.map((item, index) => (
                <button
                  aria-current={active === index ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active === index ? "bg-[#bfef61]" : "hover:bg-[#f2f1ec]"}`}
                  key={item.id}
                  onClick={() => setActive(index)}
                  type="button"
                >
                  <span className="text-[10px] font-semibold text-[#777772]">
                    {item.number}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#666661]">
                      Accepted
                    </span>
                  </span>
                </button>
              ))}
            </nav>
            <button
              className="mt-5 w-full rounded-xl border border-[#cbc9c3] px-4 py-3 text-left text-xs font-semibold hover:bg-[#f2f1ec]"
              type="button"
            >
              + Add deeper document
            </button>
          </aside>

          <main className="min-w-0 p-5 sm:p-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#cbc9c3] pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6b66]">
                    {section.number} · Accepted
                  </p>
                  <h1 className="mt-2 text-5xl font-semibold leading-none [font-family:var(--workspace-brand-font-display)] sm:text-6xl">
                    {section.title}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#5f5f5a]">
                    {section.summary}
                  </p>
                </div>
                <button
                  className="rounded-xl border border-[#111111] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f2f1ec]"
                  type="button"
                >
                  Edit section
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {section.details.map(([label, value]) => (
                  <article
                    className="rounded-2xl border border-[#cbc9c3] bg-white p-5 shadow-sm"
                    key={label}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b6b66]">
                        {label}
                      </h2>
                      <span className="rounded-full bg-[#dff5b5] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide">
                        Accepted
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7">{value}</p>
                    <button
                      className="mt-3 text-[10px] font-semibold text-[#666661] underline underline-offset-4"
                      type="button"
                    >
                      View source
                    </button>
                  </article>
                ))}
              </div>

              {section.id === "products" ? (
                <section className="mt-4 rounded-2xl border border-dashed border-[#a9a7a0] bg-[#efeee9] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Shared model · framework-service
                      </p>
                      <p className="mt-1 text-xs text-[#666661]">
                        Used by AI Chat and Code Framework; common costs are
                        recorded once.
                      </p>
                    </div>
                    <button
                      className="rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow-sm"
                      type="button"
                    >
                      Open model
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          </main>

          <aside className="border-t border-[#cbc9c3] bg-white p-5 xl:border-t-0 xl:border-l">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6b66]">
              Work with this project
            </p>
            <div className="mt-4 rounded-2xl bg-[#111111] p-4 text-white">
              <p className="text-base font-semibold [font-family:var(--workspace-brand-font-display)]">
                Ask in ordinary language
              </p>
              <p className="mt-2 text-xs leading-5 text-[#c9c9c3]">
                AI Chat adds the relevant accepted decisions to each request.
              </p>
              <label className="mt-4 block" htmlFor="project-question">
                <span className="sr-only">Ask about this project</span>
                <textarea
                  className="min-h-24 w-full resize-none rounded-xl border border-[#454545] bg-[#242424] p-3 text-xs leading-5 text-white outline-none placeholder:text-[#999] focus:border-[#bfef61]"
                  defaultValue="Improve the offer on my landing page"
                  id="project-question"
                />
              </label>
              <button
                className="mt-3 w-full rounded-xl bg-[#bfef61] px-4 py-3 text-sm font-semibold text-[#111111]"
                type="button"
              >
                Ask AI Chat →
              </button>
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b6b66]">
                Useful next actions
              </p>
              <div className="mt-3 space-y-2">
                {[
                  "Improve an uploaded document",
                  "Create the first landing page",
                  "Show decisions that still matter",
                  "Add another product",
                ].map((action) => (
                  <button
                    className="w-full rounded-xl border border-[#deddd8] px-3 py-3 text-left text-xs font-semibold hover:border-[#111111]"
                    key={action}
                    type="button"
                  >
                    {action} <span aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#e0c763] bg-[#fff5ca] p-4">
              <p className="text-xs font-semibold">Two unknowns remain</p>
              <p className="mt-1 text-[11px] leading-5 text-[#655b36]">
                Token package price and the initial acquisition budget are not
                supplied. They affect only related decisions.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
