import { useState } from "react";
import "../../../../styles/singlepage.css";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";

const sections = [
  {
    id: "brief",
    number: "00",
    title: "Brief",
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
        "AI Chat's first release creates written project and product descriptions. Landing-page generation and paid deployment belong to later development.",
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
        "Add material → discuss and edit each file in its own thread → review the texts → attach saved documents to a project topic.",
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
        "Describe the project from existing notes, files and decisions, correct identified shortcomings and use the texts as a first step toward customers.",
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
        "A written description of the intended appearance and constraints, reviewed beside the other project texts.",
      ],
      [
        "Identity",
        "Onest headings and working text, cool gray, white, graphite and lime actions.",
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
    summary: "Separate product texts, each with its own sections",
    details: [
      [
        "Customer and value",
        "Early-stage project owners receive short project and product descriptions, correction, review, export and continued chat.",
      ],
      [
        "Access and relationship",
        "Add material, work with the agent in each document thread and review the text. Export saved documents or attach them to a separate project topic.",
      ],
      [
        "Money and delivery",
        "AI Chat owns its token revenue and service costs. Development and support time is split equally with Code Framework; other owner work is allocated 80% to AI Chat and 20% to Code Framework. One token costs 0.13 roubles; top-ups are 100, 300, 500, 1,000 or 3,000 roubles without a package discount. Purchased tokens do not expire; cash refunds for purchases are decided case by case. Failed or cancelled AI requests restore all token deductions and have a net charge of zero; the service bears any provider expense.",
      ],
      [
        "Promotion",
        "Written descriptions of how each product will be presented publicly, with Website, Creative and Presentation texts where relevant. This section does not build a website or produce media.",
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
    pages: "Idea + goal + supplied facts",
    result: "Describe the project or supply the material already available",
  },
  {
    number: "02",
    title: "Draft project and product texts",
    pages: "Five short stages + separate Products",
    result: "Read the AI agent's proposed descriptions",
  },
  {
    number: "03",
    title: "Each Product: operations and economics",
    pages: "Delivery + revenue + resources + costs",
    result: "Review that Product's decisions and allocated resource shares",
  },
  {
    number: "04",
    title: "Each Product: Sales",
    pages: "Customer process + support + continued use",
    result: "Review the short customer-process description for that Product",
  },
  {
    number: "05",
    title: "AI-identified shortcomings",
    pages: "Inaccuracies + contradictions + critical assumptions",
    result: "See which descriptions need correction or an answer",
  },
  {
    number: "06",
    title: "Analytics and research where needed",
    pages: "Observations + evidence + unanswered questions",
    result:
      "Keep sources and limitations visible; missing evidence stays missing",
  },
  {
    number: "07",
    title: "Correct and review the owning text",
    pages: "Edit + answer + review",
    result: "Correct identified shortcomings or leave an unanswered fact open",
  },
  {
    number: "08",
    title: "Review, export and open a topic",
    pages: "Selected saved documents + separate topic",
    result:
      "Attach selected reviewed documents to a new project topic or freely export them",
  },
];

export default function WorkspaceMap({
  embedded = false,
}: { embedded?: boolean } = {}) {
  const [active, setActive] = useState(4);
  const section = sections[active];

  return (
    <div
      data-workspace-projection="singlepage"
      className={`bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)] ${embedded ? "" : "min-h-[820px] p-3 sm:p-6"}`}
    >
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)]">
        {!embedded && (
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--workspace-brand-line)] bg-white px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-[var(--workspace-brand-foreground)] text-[var(--workspace-brand-accent)]">
                <img
                  src="/workspace-assets/singlepage/intake/operator-logo-square-white.svg"
                  data-asset-id="singlepage-operator-logo-square-white"
                  alt=""
                  width={24}
                  height={24}
                  className="size-6"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">Sample project</p>
                <p className="text-sm text-[var(--workspace-brand-muted)]">
                  Project model · Saved now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--workspace-brand-line)] px-3 py-2 text-sm font-semibold">
                Request terms defined
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--workspace-brand-line)] bg-white px-3 py-2 text-sm font-medium">
                <span className="grid size-5 place-items-center rounded-full bg-[var(--workspace-brand-accent)]">
                  <Icon name="check" className="h-3.5 w-3.5" />
                </span>
                Ready for chat
              </span>
            </div>
          </header>
        )}

        {!embedded && (
          <section
            aria-labelledby="product-cycle-title"
            className="border-b border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-5 py-6 sm:px-7"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                  How you review the project texts
                </p>
                <h2
                  className="mt-1 text-2xl font-semibold [font-family:var(--workspace-brand-font-display)]"
                  id="product-cycle-title"
                >
                  Draft, correct and review
                </h2>
              </div>
              <p className="max-w-xl text-base leading-7 text-[var(--workspace-brand-muted)]">
                Discuss and edit each file in its own thread. Review the texts,
                then attach selected saved documents to a new project topic or
                freely export them.
              </p>
            </div>

            <div
              aria-label="Project text review loop"
              className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              role="list"
            >
              {hypothesisFlow.map((step, index) => (
                <div className="flex min-w-0" key={step.number} role="listitem">
                  <article
                    className={`min-h-48 flex-1 rounded-2xl border p-5 ${index === 0 ? "border-[var(--workspace-brand-foreground)] bg-[var(--workspace-brand-foreground)] text-white" : index === hypothesisFlow.length - 1 ? "border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)]" : "border-[var(--workspace-brand-line)] bg-white"}`}
                  >
                    <p
                      className={`text-sm font-semibold ${index === 0 ? "text-[var(--workspace-brand-accent)]" : "text-[var(--workspace-brand-muted)]"}`}
                    >
                      {step.number}
                    </p>
                    <h3 className="mt-2 text-base font-semibold leading-5">
                      {step.title}
                    </h3>
                    <p
                      className={`mt-2 text-sm font-semibold ${index === 0 ? "text-[var(--workspace-brand-muted-on-primary)]" : "text-[var(--workspace-brand-muted)]"}`}
                    >
                      {step.pages}
                    </p>
                    <p
                      className={`mt-3 text-base leading-7 ${index === 0 ? "text-[var(--workspace-brand-background)]" : "text-[var(--workspace-brand-foreground)]"}`}
                    >
                      {step.result}
                    </p>
                  </article>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-6">
              <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                What happens after review?
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4">
                  <p className="text-sm font-semibold">Reviewed description</p>
                  <p className="mt-2 text-base leading-7">
                    Save the text you reviewed, export it or attach it to a
                    project topic. The saved version stays available while you
                    revise a new draft. Review records the wording, not market
                    demand.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4">
                  <p className="text-sm font-semibold">
                    Unanswered fact or assumption
                  </p>
                  <p className="mt-2 text-base leading-7">
                    Keep missing facts open. A reviewed assumption remains an
                    assumption. Attribute evidence to its source and revise the
                    owning text when an answer or new evidence becomes
                    available.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
          <aside className="border-b border-[var(--workspace-brand-line)] bg-white p-4 lg:border-r lg:border-b-0">
            <div className="rounded-2xl bg-[var(--workspace-brand-foreground)] p-4 text-white">
              <p className="text-sm font-semibold text-[var(--workspace-brand-accent)]">
                Single page
              </p>
              <p className="mt-2 text-xl font-semibold [font-family:var(--workspace-brand-font-display)]">
                Project model
              </p>
              <p className="mt-2 text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                Five compact sections. Add a deeper document when the work needs
                it.
              </p>
            </div>
            <nav aria-label="Project model sections" className="mt-4 space-y-1">
              {sections.map((item, index) => (
                <button
                  aria-current={active === index ? "page" : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${kit.focus} ${active === index ? "bg-[var(--workspace-brand-foreground)] text-white [&_span]:text-white" : "hover:bg-[var(--workspace-brand-background)]"}`}
                  key={item.id}
                  onClick={() => setActive(index)}
                  type="button"
                >
                  <span className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                    {item.number}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-[var(--workspace-brand-muted)]">
                      Accepted
                    </span>
                  </span>
                </button>
              ))}
            </nav>
            <button
              className={`${kit.secondary} mt-5 w-full justify-start`}
              type="button"
            >
              <Icon name="plus" />
              Add deeper document
            </button>
          </aside>

          <main className="min-w-0 p-5 sm:p-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--workspace-brand-line)] pb-6">
                <div>
                  <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                    {section.number} · Accepted
                  </p>
                  <h1 className="mt-2 text-[40px] font-semibold leading-[1.1] [font-family:var(--workspace-brand-font-display)] sm:text-[56px]">
                    {section.title}
                  </h1>
                  <p className="mt-3 max-w-xl text-base leading-7 text-[var(--workspace-brand-muted)]">
                    {section.summary}
                  </p>
                </div>
                <button className={kit.secondary} type="button">
                  Edit section
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {section.details.map(([label, value]) => (
                  <article
                    className="rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5"
                    key={label}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                        {label}
                      </h2>
                      <span className="rounded-full bg-[var(--workspace-brand-background)] px-2 py-1 text-sm font-semibold">
                        Accepted
                      </span>
                    </div>
                    <p className="mt-3 text-base leading-7">{value}</p>
                    <button
                      className={`${kit.plain} mt-3 px-0 underline underline-offset-4`}
                      type="button"
                    >
                      View source
                    </button>
                  </article>
                ))}
              </div>

              {section.id === "products" ? (
                <section className="mt-4 rounded-2xl border border-dashed border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Product economics</p>
                      <p className="mt-1 text-sm text-[var(--workspace-brand-muted)]">
                        Each Product owns its revenue, resources and costs, with
                        a stated share of shared resources.
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--workspace-brand-muted)]">
                      AI Chat and Code Framework each have their own Product,
                      Operations & Economics, Sales, Promotion, and Analytics &
                      Research texts.
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {["AI Chat", "Code Framework"].map((product) => (
                      <article
                        key={product}
                        className="rounded-xl border border-[var(--workspace-brand-line)] bg-white p-4"
                      >
                        <h3 className="text-base font-semibold">{product}</h3>
                        <ul className="mt-3 space-y-2 text-sm text-[var(--workspace-brand-muted)]">
                          {[
                            "Product: customer and offer",
                            "Operations & Economics",
                            "Sales",
                            "Promotion: written public presentation",
                            "Analytics & Research where needed",
                          ].map((text) => (
                            <li key={text}>{text}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </main>

          <aside className="border-t border-[var(--workspace-brand-line)] bg-white p-5 xl:border-t-0 xl:border-l">
            <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
              Project topics
            </p>
            <div className="mt-4 rounded-3xl bg-[var(--workspace-brand-foreground)] p-6 text-white">
              <p className="text-base font-semibold [font-family:var(--workspace-brand-font-display)]">
                Ask in ordinary language
              </p>
              <p className="mt-2 text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                Choose saved documents for each topic. AI Chat uses those
                attachments as context for its answers.
              </p>
              <label className="mt-4 block" htmlFor="project-question">
                <span className="sr-only">Ask about this project</span>
                <textarea
                  className={`${kit.field} min-h-32 resize-y focus-visible:ring-[var(--workspace-brand-accent)]`}
                  defaultValue="Evaluate my idea against the customer and offer I described"
                  id="project-question"
                />
              </label>
              <button className={`${kit.button} mt-4 w-full`} type="button">
                Ask AI Chat
                <Icon name="arrow-right" className="size-5 shrink-0" />
              </button>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                Useful next actions
              </p>
              <div className="mt-3 space-y-2">
                {[
                  "Improve an uploaded document",
                  "Correct the shortcomings identified by the AI agent",
                  "Export the reviewed documents",
                  "Add another product",
                ].map((action) => (
                  <button
                    className={`${kit.secondary} w-full justify-between text-left`}
                    key={action}
                    type="button"
                  >
                    <span>{action}</span>
                    <Icon name="arrow-right" className="size-5 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4">
              <p className="text-sm font-semibold">
                Failed or cancelled requests
              </p>
              <p className="mt-1 text-sm leading-5 text-[var(--workspace-brand-muted)]">
                All deductions are restored, including the initial token and any
                settlement charge. The net charge is zero; the service pays any
                provider cost. Cash refunds for top-up purchases remain
                case-by-case decisions.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
