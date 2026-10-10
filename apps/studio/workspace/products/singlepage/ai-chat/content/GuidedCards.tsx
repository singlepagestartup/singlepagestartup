import { useEffect, useId, useState } from "react";
import "../../../../styles/singlepage.css";
import {
  Icon,
  kit,
} from "../../../../design/singlepage/interface-kit/primitives";

const stages = [
  {
    id: "brief",
    label: "Brief",
    time: "10 min",
    question:
      "What are you working on, and what should be true when this project is useful?",
    answer:
      "A hosted workspace that drafts short project and product documents from existing material. Each file has its own working thread; saved texts can be attached to project topics.",
    found: [
      "The first product is a hosted AI chat.",
      "Existing notes, files and screenshots should be accepted.",
      "The first result is written descriptions the user can edit, review and export.",
    ],
    result: "Scope, desired result, products and constraints",
  },
  {
    id: "strategy",
    label: "Strategy",
    time: "10 min",
    question:
      "What should the complete project look like when it is working as intended?",
    answer:
      "A person adds material, discusses each file in its own thread and reviews the text. Selected saved documents become context for new project topics. The owner evaluates this flow before adding landing-page creation and paid deployment.",
    found: [
      "The chat is the main hosted product.",
      "The first release creates written project and product documents.",
      "Landing-page generation and paid deployment are future capabilities.",
      "Each product has its own sections, including economics, Sales, Promotion and Analytics.",
    ],
    result: "Final picture, audiences, product roles and customer path",
  },
  {
    id: "brand",
    label: "Brand",
    time: "8 min",
    question:
      "What should people understand and remember after using the product?",
    answer:
      "Describe the project from the notes, files and decisions already available. Correct the shortcomings the AI agent identifies and use the reviewed texts as a first step toward customers.",
    found: [
      "Existing material is the starting point for written project descriptions.",
      "The product should feel practical and direct.",
      "Claims need support from the person's actual material.",
    ],
    result: "Meaning, promise, proof, voice and primary action",
  },
  {
    id: "design",
    label: "Design",
    time: "7 min",
    question: "How should this meaning become visible and easy to use?",
    answer:
      "A written Design description: Onest text, cool neutral surfaces, graphite, lime actions and one description in focus at a time.",
    found: [
      "Graphite, cool gray, white and lime form the current palette.",
      "The first-release Design result is text describing intended appearance.",
      "Uploaded images remain source material, not automatic design decisions.",
    ],
    result: "Visual direction, interface principles and available assets",
  },
  {
    id: "products",
    label: "Products",
    time: "15 min",
    question:
      "Who receives what value, and how is the offer delivered and sustained?",
    answer:
      "Early-stage project owners receive written descriptions and continued chat. Every product has its own Product, Operations & Economics, Sales, Promotion, and Analytics & Research sections. AI Chat owns its token revenue and service costs.",
    found: [
      "The user, buyer and decision-maker may initially be one person.",
      "AI Chat and Code Framework are separate related products.",
      "One internal token costs 0.13 roubles. Top-ups are 100, 300, 500, 1,000 or 3,000 roubles, with no package discount.",
      "Purchased tokens do not expire; cash refunds for top-ups are decided case by case. Failed or cancelled AI requests restore all token deductions and have a net charge of zero; the service bears any provider expense. Customer demand remains unverified.",
    ],
    result:
      "Separate product texts: Product, Operations & Economics, Sales, Promotion, Analytics & Research",
  },
];

interface IGuidedCardsProps {
  embedded?: boolean;
  empty?: boolean;
  onAddMaterials?: () => void;
  onDocumentsChange?: (
    documents: Record<string, string>,
    reviewed: string[],
  ) => void;
}

export default function GuidedCards({
  embedded = false,
  empty = false,
  onAddMaterials,
  onDocumentsChange,
}: IGuidedCardsProps = {}) {
  const id = useId();
  const [active, setActive] = useState(empty ? 0 : 1);
  const [accepted, setAccepted] = useState(
    () => new Set<number>(empty ? [] : [0]),
  );
  const [unknown, setUnknown] = useState(() => new Set<number>());
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(
      stages.map((stage) => [stage.id, empty ? "" : stage.answer]),
    ),
  );
  const stage = stages[active];
  useEffect(() => {
    onDocumentsChange?.(
      answers,
      [...accepted].map((index) => stages[index].id),
    );
  }, [answers, accepted, onDocumentsChange]);

  const advance = (state: "accepted" | "unknown") => {
    if (state === "accepted") {
      setAccepted((previous) => new Set(previous).add(active));
      setUnknown((previous) => {
        const next = new Set(previous);
        next.delete(active);
        return next;
      });
    } else {
      setUnknown((previous) => new Set(previous).add(active));
      setAccepted((previous) => {
        const next = new Set(previous);
        next.delete(active);
        return next;
      });
    }
    if (active < stages.length - 1) setActive(active + 1);
  };

  return (
    <div
      data-workspace-projection="singlepage"
      className={`@container bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] [font-family:var(--workspace-brand-font-body)] ${embedded ? "" : "min-h-[820px] p-3 sm:p-6"}`}
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
                <p className="text-sm font-semibold">SinglePageStartup</p>
                <p className="text-sm text-[var(--workspace-brand-muted)]">
                  New project setup
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-3 py-2 text-sm font-semibold">
                {accepted.size} of 5 reviewed
              </span>
              <span className="rounded-full border border-[var(--workspace-brand-line)] bg-white px-3 py-2 text-sm font-medium">
                About one hour
              </span>
            </div>
          </header>
        )}

        <div className="grid @[700px]:grid-cols-[180px_minmax(0,1fr)] @[1200px]:grid-cols-[200px_minmax(0,1fr)_280px]">
          <aside className="border-b border-[var(--workspace-brand-line)] bg-white p-4 lg:border-r lg:border-b-0">
            <p className="px-2 text-sm font-semibold text-[var(--workspace-brand-muted)]">
              Document threads
            </p>
            <nav
              className="mt-3 grid gap-2 @[500px]:grid-cols-2 @[700px]:grid-cols-1"
              aria-label="Setup stages"
            >
              {stages.map((item, index) => {
                const state = accepted.has(index)
                  ? "accepted"
                  : unknown.has(index)
                    ? "unknown"
                    : active === index
                      ? "current"
                      : "pending";
                return (
                  <button
                    aria-current={active === index ? "step" : undefined}
                    className={`flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-accent)] ${
                      active === index
                        ? "bg-[var(--workspace-brand-foreground)] text-white"
                        : "hover:bg-[var(--workspace-brand-background)]"
                    }`}
                    key={item.id}
                    onClick={() => setActive(index)}
                    type="button"
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full border text-sm font-semibold ${
                        state === "accepted"
                          ? "border-[var(--workspace-brand-accent)] bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)]"
                          : active === index
                            ? "border-[var(--workspace-brand-muted)]"
                            : "border-[var(--workspace-brand-line)] text-[var(--workspace-brand-muted)]"
                      }`}
                    >
                      {state === "accepted" ? (
                        <Icon name="check" className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold sm:text-sm">
                        {item.label}
                      </span>
                      <span
                        className={`block text-sm ${active === index ? "text-[var(--workspace-brand-muted-on-primary)]" : "text-[var(--workspace-brand-muted)]"}`}
                      >
                        {state === "unknown" ? "Unknown saved" : item.time}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-4">
              <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                Material bundle
              </p>
              <p className="mt-2 text-sm font-semibold">Project materials</p>
              <p className="mt-1 text-base leading-7 text-[var(--workspace-brand-muted)]">
                Notes, files and images added in the project chat
              </p>
              <button
                className={`${kit.plain} mt-3 px-0 underline underline-offset-4`}
                onClick={onAddMaterials}
                type="button"
              >
                Add more
              </button>
            </div>
          </aside>

          <main className="min-w-0 p-5 sm:p-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                    Stage {active + 1} · {stage.time} suggested
                  </p>
                  <h1 className="mt-2 text-[40px] font-semibold leading-[1.1] [font-family:var(--workspace-brand-font-display)] sm:text-5xl">
                    {stage.label}
                  </h1>
                </div>
                <span className="rounded-full border border-[var(--workspace-brand-line)] bg-white px-3 py-2 text-sm font-semibold">
                  One decision in focus
                </span>
              </div>

              <section className="mt-7 rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                    Found in your material
                  </p>
                  <button
                    className={`${kit.plain} px-0 underline underline-offset-4`}
                    type="button"
                  >
                    See sources
                  </button>
                </div>
                <ul className="mt-4 space-y-3">
                  {(empty ? [] : stage.found).map((item, index) => (
                    <li className="flex gap-3 text-base leading-7" key={item}>
                      <span
                        className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full text-sm font-bold ${
                          index === stage.found.length - 1 &&
                          item.includes("unknown")
                            ? "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)]"
                            : "bg-[var(--workspace-brand-background)]"
                        }`}
                      >
                        {index === stage.found.length - 1 &&
                        item.includes("unknown") ? (
                          <>
                            <span className="sr-only">Unknown</span>
                            <Icon name="question" className="size-5 shrink-0" />
                          </>
                        ) : (
                          <Icon name="check" className="h-4 w-4" />
                        )}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-6 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-8">
                <p className="text-sm font-semibold">AI Chat</p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight [font-family:var(--workspace-brand-font-display)] sm:text-3xl">
                  {stage.question}
                </h2>
                <label
                  className="mt-5 block"
                  htmlFor={`${id}-answer-${stage.id}`}
                >
                  <span className="sr-only">Your answer</span>
                  <textarea
                    className={`${kit.field} min-h-40 resize-y`}
                    id={`${id}-answer-${stage.id}`}
                    onChange={(event) => {
                      setAccepted((previous) => {
                        const next = new Set(previous);
                        next.delete(active);
                        return next;
                      });
                      setAnswers((previous) => ({
                        ...previous,
                        [stage.id]: event.target.value,
                      }));
                    }}
                    value={answers[stage.id]}
                  />
                </label>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <button
                    className={kit.plain}
                    onClick={() => advance("unknown")}
                    type="button"
                  >
                    I don't know yet
                  </button>
                  <button
                    className={kit.button}
                    disabled={!answers[stage.id].trim()}
                    onClick={() => advance("accepted")}
                    type="button"
                  >
                    {active === stages.length - 1
                      ? "Finish review"
                      : "Accept and continue"}
                    {active < stages.length - 1 ? (
                      <Icon name="arrow-right" className="size-5 shrink-0" />
                    ) : null}
                  </button>
                </div>
              </section>

              <details className="mt-4 rounded-xl border border-[var(--workspace-brand-line)] bg-white px-4 py-3 text-sm">
                <summary className="cursor-pointer font-semibold">
                  Add detail only if it changes the result
                </summary>
                <p className="mt-3 leading-6 text-[var(--workspace-brand-muted)]">
                  Optional prompts stay collapsed. AI Chat opens one only when
                  the answer would change this stage or the material being
                  prepared.
                </p>
              </details>
              {stage.id === "products" && !empty ? (
                <section
                  className="mt-6 space-y-4"
                  aria-label="Separate product documents"
                >
                  {["AI Chat", "Code Framework"].map((product) => (
                    <article
                      key={product}
                      className="rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-5"
                    >
                      <h2 className="text-lg font-semibold">{product}</h2>
                      <dl className="mt-3 divide-y divide-[var(--workspace-brand-line)]">
                        {[
                          [
                            "Product",
                            "This product's customer, problem, offer and conditions.",
                          ],
                          [
                            "Operations & Economics",
                            "This product's delivery, revenue, resources, allocated shares and costs.",
                          ],
                          [
                            "Sales",
                            "This product's customer process, including support and continued use.",
                          ],
                          [
                            "Promotion",
                            "Written public presentation of this product, with Website, Creative and Presentation texts where relevant.",
                          ],
                          [
                            "Analytics & Research",
                            "This product's measures, observations and evidence questions where needed.",
                          ],
                        ].map(([title, text]) => (
                          <div key={title} className="py-3">
                            <dt className="text-sm font-semibold">{title}</dt>
                            <dd className="mt-1 text-sm leading-6 text-[var(--workspace-brand-muted)]">
                              {text}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </section>
              ) : null}
            </div>
          </main>

          <aside className="border-t border-[var(--workspace-brand-line)] bg-white p-5 xl:border-t-0 xl:border-l">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--workspace-brand-muted)]">
                Project texts
              </p>
              <span
                className="size-2 rounded-full bg-[var(--workspace-brand-accent)]"
                aria-label="Saved"
              />
            </div>
            <p className="mt-2 text-base leading-7 text-[var(--workspace-brand-muted)]">
              Updates as each decision is reviewed.
            </p>

            <div className="mt-5 space-y-2">
              {stages.map((item, index) => (
                <button
                  className={`w-full rounded-xl border p-3 text-left ${
                    active === index
                      ? "border-[var(--workspace-brand-foreground)] bg-[var(--workspace-brand-background)]"
                      : "border-[var(--workspace-brand-line)] bg-white"
                  }`}
                  key={item.id}
                  onClick={() => setActive(index)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-sm font-semibold ${
                        accepted.has(index)
                          ? "bg-[var(--workspace-brand-background)]"
                          : unknown.has(index)
                            ? "bg-[var(--workspace-brand-background)] text-[var(--workspace-brand-foreground)] ring-1 ring-inset ring-[var(--workspace-brand-line)]"
                            : "bg-[var(--workspace-brand-background)]"
                      }`}
                    >
                      {accepted.has(index)
                        ? "Accepted"
                        : unknown.has(index)
                          ? "Unknown"
                          : "Draft"}
                    </span>
                  </span>
                  <span className="mt-2 block text-base leading-7 text-[var(--workspace-brand-muted)]">
                    {item.result}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-[var(--workspace-brand-foreground)] p-6 text-white">
              <p className="text-sm font-semibold text-[var(--workspace-brand-accent)]">
                Useful context, then depth
              </p>
              <p className="mt-2 text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                Work on each document in its own thread. Review the text, then
                freely export it or attach its saved version to a new project
                topic. Other files can keep their open questions.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
