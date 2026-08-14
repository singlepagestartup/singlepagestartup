import type { CSSProperties, ReactNode } from "react";

import type { IProjectPresentationData } from "../products/presentation-data";

export const PROJECT_PRESENTATION_SLIDES = [
  { id: "cover", label: "SinglePageStartup" },
  { id: "product", label: "The product" },
  { id: "audience", label: "Audience and trigger" },
  { id: "evaluation", label: "Positioning and evaluation" },
  { id: "inventory", label: "Documented foundations" },
  { id: "showcase", label: "Demonstration service" },
  { id: "acquisition", label: "Acquisition path" },
  { id: "signals", label: "Signal ladder" },
  { id: "experiment", label: "First experiment" },
  { id: "evidence", label: "Evidence and readiness" },
  { id: "identity", label: "Brand identity" },
  { id: "visual-system", label: "Visual system" },
  { id: "launch", label: "Launch sequence" },
] as const;

type ProjectPresentationSlideId =
  (typeof PROJECT_PRESENTATION_SLIDES)[number]["id"];

function requestedSlide(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const value = new URLSearchParams(window.location.search).get("slide");
  if (value == null) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) &&
    parsed >= 0 &&
    parsed < PROJECT_PRESENTATION_SLIDES.length
    ? parsed
    : undefined;
}

function paletteValue(
  data: IProjectPresentationData,
  role: keyof IProjectPresentationData["visual"]["palette"],
): string {
  return `var(--workspace-brand-${role}, ${data.visual.palette[role]})`;
}

function displayType(data: IProjectPresentationData): string {
  return `var(--workspace-brand-font-display, ${data.visual.displayType})`;
}

function bodyType(data: IProjectPresentationData): string {
  return `var(--workspace-brand-font-body, ${data.visual.bodyType})`;
}

function slideStyle(data: IProjectPresentationData): CSSProperties {
  return {
    backgroundColor: paletteValue(data, "surface"),
    color: paletteValue(data, "foreground"),
    fontFamily: bodyType(data),
  };
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15px] font-semibold uppercase tracking-[0.2em]">
      {children}
    </p>
  );
}

function SlideFrame({
  children,
  data,
  index,
  source,
}: {
  children: ReactNode;
  data: IProjectPresentationData;
  index: number;
  source: string;
}) {
  return (
    <main
      className="flex h-full flex-col overflow-hidden px-16 py-12"
      data-workspace-projection={data.projection}
      style={slideStyle(data)}
    >
      <header className="flex items-center justify-between border-b border-black/15 pb-5">
        <span
          className="text-[22px] font-semibold"
          style={{ fontFamily: displayType(data) }}
        >
          {data.name}
        </span>
        <span className="text-[14px] font-semibold tracking-[0.18em] text-black/55">
          {String(index + 1).padStart(2, "0")} /{" "}
          {PROJECT_PRESENTATION_SLIDES.length}
        </span>
      </header>
      <div className="min-h-0 flex-1" data-slide-content="true">
        {children}
      </div>
      <footer
        className="flex items-center justify-between border-t border-black/15 pt-4 text-[13px] text-black/55"
        data-slide-footer="true"
      >
        <span>{source}</span>
        <span>Marketing strategy · Brand system</span>
      </footer>
    </main>
  );
}

function SlideTitle({
  children,
  data,
  eyebrow,
}: {
  children: ReactNode;
  data: IProjectPresentationData;
  eyebrow: string;
}) {
  return (
    <div>
      <div style={{ color: paletteValue(data, "accent") }}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h1
        className="mt-4 max-w-[1250px] text-[58px] font-semibold leading-[1.06] tracking-[-0.04em]"
        style={{ fontFamily: displayType(data) }}
      >
        {children}
      </h1>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-[22px] border border-black/15 bg-[var(--workspace-brand-background,#F7F6F2)] p-7 ${className}`}
    >
      {children}
    </article>
  );
}

function Cover({ data }: { data: IProjectPresentationData }) {
  return (
    <div className="grid h-full grid-cols-[0.9fr_1.1fr] items-center gap-20 py-12">
      <div>
        <div className="inline-flex rounded-full bg-[var(--workspace-brand-accent,#BFEF61)] px-4 py-2 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#111111]">
          Free developer framework
        </div>
        <h1
          className="mt-8 text-[78px] font-semibold leading-[1.03] tracking-[-0.055em]"
          style={{ fontFamily: displayType(data) }}
        >
          Build the product-specific work. Start from the recurring foundations.
        </h1>
        <p className="mt-8 max-w-[720px] text-[22px] leading-[1.55] text-black/70">
          {data.promise}
        </p>
      </div>
      <div className="relative flex h-[610px] items-center justify-center overflow-hidden rounded-[44px] border border-black/15 bg-[var(--workspace-brand-background,#F7F6F2)] p-16">
        <div className="absolute inset-x-0 top-0 h-3 bg-[var(--workspace-brand-accent,#BFEF61)]" />
        {data.brand.primaryLogoUrl ? (
          <img
            alt={data.name}
            className="w-full object-contain"
            src={data.brand.primaryLogoUrl}
          />
        ) : (
          <span
            className="text-[56px] font-semibold"
            style={{ fontFamily: displayType(data) }}
          >
            {data.name}
          </span>
        )}
      </div>
    </div>
  );
}

function Product({ data }: { data: IProjectPresentationData }) {
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Product">
        One inspectable foundation for a genuinely multi-feature web product.
      </SlideTitle>
      <div className="mt-12 grid grid-cols-[1.25fr_0.75fr] gap-7">
        <Panel className="min-h-[300px]">
          <Eyebrow>Positioning</Eyebrow>
          <p className="mt-7 text-[27px] leading-[1.5]">
            SinglePageStartup is an inspectable, reusable codebase for products
            that need several recurring web foundations to work together.
          </p>
          <p className="mt-5 text-[17px] leading-[1.5] text-black/60">
            Evaluate coherent fit against a pinned version before committing to
            the architecture.
          </p>
        </Panel>
        <div className="grid gap-5">
          {[
            ["Price", "Free framework"],
            ["Funding", "Founder-funded"],
            ["Primary response", "Adoption and successful use"],
          ].map(([label, value]) => (
            <Panel className="flex items-center justify-between" key={label}>
              <span className="text-[15px] uppercase tracking-[0.14em] text-black/55">
                {label}
              </span>
              <strong className="text-right text-[21px]">{value}</strong>
            </Panel>
          ))}
        </div>
      </div>
      <p className="mt-6 border-l-4 border-[var(--workspace-brand-accent,#BFEF61)] pl-6 text-[17px] leading-[1.5] text-black/65">
        Free and founder-funded. Adoption and successful use are primary; GitHub
        stars and awareness remain secondary attention signals.
      </p>
    </div>
  );
}

function Audience({ data }: { data: IProjectPresentationData }) {
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Primary audience">
        The accountable developer choosing architecture before it becomes
        expensive to change.
      </SlideTitle>
      <div className="mt-8 grid grid-cols-2 gap-6">
        <Panel className="p-6">
          <Eyebrow>Who</Eyebrow>
          <p className="mt-4 text-[20px] leading-[1.45]">{data.audience}</p>
        </Panel>
        <Panel className="p-6">
          <Eyebrow>Trigger</Eyebrow>
          <p className="mt-4 text-[20px] leading-[1.45]">{data.trigger}</p>
        </Panel>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-5">
        {[
          "New product",
          "3+ recurring foundations",
          "Human-accountable AI assistance",
        ].map((item, index) => (
          <div
            className="flex items-center gap-4 border-t-2 border-black pt-3 text-[16px] font-semibold"
            key={item}
          >
            <span className="text-[#8A8882]">0{index + 1}</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function Evaluation({ data }: { data: IProjectPresentationData }) {
  const steps = [
    "Compare the named need",
    "Inspect rights and prerequisites",
    "Run the setup check",
    "Exercise one capability",
  ];
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Evaluation offer">
        Coherent fit is the comparison—not unproven speed or superiority.
      </SlideTitle>
      <div className="mt-10 grid grid-cols-[0.9fr_1.1fr] gap-8">
        <Panel>
          <Eyebrow>Offer</Eyebrow>
          <p className="mt-6 text-[22px] leading-[1.55]">{data.offer}</p>
        </Panel>
        <div className="grid grid-cols-2 gap-5">
          {steps.map((step, index) => (
            <div
              className="relative min-h-[145px] rounded-[22px] border border-black/15 bg-[#111111] p-6 text-white"
              key={step}
            >
              <span className="text-[14px] text-white/45">0{index + 1}</span>
              <p className="mt-7 text-[20px] font-semibold leading-[1.35]">
                {step}
              </p>
              {index === 3 ? (
                <span className="absolute bottom-5 right-5 h-3 w-3 rounded-full border border-[#111111] bg-[var(--workspace-brand-accent,#BFEF61)]" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Inventory({ data }: { data: IProjectPresentationData }) {
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Repository inventory">
        Sixteen documented module areas. Inventory is not runtime proof.
      </SlideTitle>
      <div className="mt-10 grid grid-cols-4 gap-4">
        {data.modules.map((module, index) => (
          <div
            className="flex min-h-[78px] items-center gap-4 rounded-[16px] border border-black/15 bg-[var(--workspace-brand-background,#F7F6F2)] px-5"
            key={module}
          >
            <span className="text-[13px] text-black/40">
              {String(index + 1).padStart(2, "0")}
            </span>
            <code className="text-[18px] font-semibold">{module}</code>
          </div>
        ))}
      </div>
      <div className="mt-7 grid grid-cols-[1fr_auto] items-center gap-8 border-t border-black/20 pt-5">
        <p className="text-[16px] leading-[1.5] text-black/65">
          The documented inventory proves that these areas exist. It does not
          prove setup, runtime behavior, adoption, time savings, or product
          value.
        </p>
        <span className="rounded-full border border-black px-5 py-3 text-[14px] font-semibold">
          Pin a version before evaluation
        </span>
      </div>
    </div>
  );
}

function Showcase({ data }: { data: IProjectPresentationData }) {
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Main showcase">
        A service for AI-agent access and token use demonstrates the framework
        in context.
      </SlideTitle>
      <div className="mt-10 grid grid-cols-7 gap-3">
        {data.showcase.steps.map((step, index) => (
          <div
            className={`relative min-h-[185px] rounded-[18px] border p-5 ${
              index === 5
                ? "border-[#111111] bg-[var(--workspace-brand-accent,#BFEF61)]"
                : "border-black/15 bg-[var(--workspace-brand-background,#F7F6F2)]"
            }`}
            key={step}
          >
            <span className="text-[13px] font-semibold text-black/45">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-8 text-[16px] font-semibold leading-[1.4]">
              {step}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-7 grid grid-cols-2 gap-7">
        <p className="text-[17px] leading-[1.55] text-black/65">
          Discover the service through product pages, a related article, or an
          agent profile. Register, receive a bounded promotional grant or paid
          access, ask one question, and receive one answer.
        </p>
        <div className="border-l border-black/20 pl-7">
          <Eyebrow>User outcome</Eyebrow>
          <p className="mt-4 text-[18px] leading-[1.5]">
            One accepted user question becomes one agent answer. The user does
            not receive a finished project, code change, or implementation
            decision.
          </p>
        </div>
      </div>
    </div>
  );
}

function Acquisition({ data }: { data: IProjectPresentationData }) {
  const stages = [
    ["YouTube", "Show one evidenced service behavior"],
    [
      "Demonstration service",
      "Let the visitor inspect the behavior and limits",
    ],
    ["GitHub", "Begin the pinned framework evaluation"],
  ];
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Acquisition focus">
        One founder-led route from credible demonstration to intentional
        evaluation.
      </SlideTitle>
      <div className="mt-12 grid grid-cols-3 gap-8">
        {stages.map(([title, detail], index) => (
          <Panel className="relative min-h-[250px]" key={title}>
            <span className="absolute right-6 top-5 text-[14px] text-black/40">
              0{index + 1}
            </span>
            <h2
              className="mt-8 text-[29px] font-semibold"
              style={{ fontFamily: displayType(data) }}
            >
              {title}
            </h2>
            <p className="mt-6 text-[18px] leading-[1.5] text-black/65">
              {detail}
            </p>
            {index < stages.length - 1 ? (
              <span className="absolute -right-6 top-1/2 h-[2px] w-12 bg-[var(--workspace-brand-accent,#BFEF61)]" />
            ) : null}
          </Panel>
        ))}
      </div>
      <p className="mt-8 text-[18px] leading-[1.55] text-black/65">
        {data.acquisition}
      </p>
    </div>
  );
}

function Signals({ data }: { data: IProjectPresentationData }) {
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Measurement">
        Activity, attention, evaluation, successful use, and adoption stay
        separate.
      </SlideTitle>
      <div className="mt-12 grid grid-cols-5 gap-4">
        {data.signals.map((signal, index) => (
          <div
            className="relative min-h-[310px] rounded-[20px] border border-black/15 bg-[var(--workspace-brand-background,#F7F6F2)] p-6"
            key={signal.title}
          >
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold ${
                index === data.signals.length - 1
                  ? "bg-[var(--workspace-brand-accent,#BFEF61)] text-black"
                  : "bg-black text-white"
              }`}
            >
              {index + 1}
            </span>
            <h2 className="mt-8 text-[22px] font-semibold capitalize leading-[1.25]">
              {signal.title}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.55] text-black/60">
              {signal.detail}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-7 border-l-4 border-black pl-5 text-[18px] font-semibold">
        A GitHub star remains an attention signal. It never becomes adoption by
        interpretation.
      </p>
    </div>
  );
}

function Experiment({ data }: { data: IProjectPresentationData }) {
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="First experiment">
        A bounded test of the showcase-to-evaluation route.
      </SlideTitle>
      <div className="mt-8 flex flex-wrap gap-3">
        {data.experiment.facts.map((fact) => (
          <span
            className="rounded-full border border-black/20 bg-[var(--workspace-brand-background,#F7F6F2)] px-5 py-3 text-[16px] font-semibold"
            key={fact}
          >
            {fact}
          </span>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-[1fr_1fr] gap-4">
        <Panel className="p-6">
          <Eyebrow>Minimum useful signal</Eyebrow>
          <p className="mt-4 text-[18px] leading-[1.45]">
            {data.experiment.minimumSignal}
          </p>
        </Panel>
        <Panel className="p-6">
          <Eyebrow>Positive decision</Eyebrow>
          <p className="mt-4 text-[18px] leading-[1.45]">
            {data.experiment.positiveDecision}
          </p>
        </Panel>
        <div className="border-l-4 border-black py-1 pl-5">
          <Eyebrow>Change direction</Eyebrow>
          <p className="mt-2 text-[14px] leading-[1.4] text-black/70">
            If fewer than two evaluations start, change the audience, message,
            or bridge. If setup fails twice on the same readiness blocker, fix
            the product before further acquisition.
          </p>
        </div>
        <div className="border-l-4 border-[var(--workspace-brand-accent,#BFEF61)] py-1 pl-5">
          <Eyebrow>Stop</Eyebrow>
          <p className="mt-2 text-[14px] leading-[1.4] text-black/70">
            Stop at the USD 200 token cap, an unpassed readiness gate, an
            unbounded cost or rights risk, or founder effort beyond six hours
            per week.
          </p>
        </div>
      </div>
    </div>
  );
}

function Evidence({ data }: { data: IProjectPresentationData }) {
  const riskBoundaries: Record<string, string> = {
    "Audience and channel fit":
      "External demand and channel conversion are not evidenced.",
    "License and setup readiness":
      "MIT publication and one authoritative setup path remain incomplete.",
    "Measurement integrity":
      "The service-to-framework bridge is not yet instrumented.",
    "Operating safety and capacity":
      "Cost, access, privacy, authority, and support limits must be enforceable.",
    "Showcase readiness":
      "The selected service is not assembled or externally usable.",
  };
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Evidence boundary">
        Current proof supports evaluation—not readiness, superiority, or
        adoption claims.
      </SlideTitle>
      <div className="mt-9 grid grid-cols-3 gap-4">
        <Panel className="!bg-[#111111] text-white">
          <Eyebrow>Proven</Eyebrow>
          <p className="mt-5 text-[18px] leading-[1.5] text-white/75">
            A public repository snapshot, sixteen documented module areas, and
            guidance for developers and AI assistance.
          </p>
        </Panel>
        <Panel>
          <Eyebrow>Not proven</Eyebrow>
          <p className="mt-5 text-[18px] leading-[1.5] text-black/65">
            External setup, runtime capability use, repeat use, adoption, time
            savings, or product value.
          </p>
        </Panel>
        <Panel className="!bg-[var(--workspace-brand-accent,#BFEF61)]">
          <Eyebrow>Claim rule</Eyebrow>
          <p className="mt-5 text-[18px] font-semibold leading-[1.5]">
            Show evidence and limitations. Invite evaluation. Do not imply
            readiness or superiority.
          </p>
        </Panel>
      </div>
      <div className="mt-5 grid grid-cols-5 gap-3">
        {data.risks.map((risk, index) => (
          <div
            className="rounded-[16px] border border-black/15 bg-[var(--workspace-brand-background,#F7F6F2)] p-4"
            key={risk.title}
          >
            <span className="text-[12px] text-black/40">0{index + 1}</span>
            <h2 className="mt-3 text-[16px] font-semibold leading-[1.3]">
              {risk.title}
            </h2>
            <p className="mt-3 text-[13px] leading-[1.4] text-black/60">
              {riskBoundaries[risk.title] ?? risk.boundary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Identity({ data }: { data: IProjectPresentationData }) {
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Approved identity · Measured Space">
        Precise, calm, accountable, modular, and candid.
      </SlideTitle>
      <div className="mt-10 grid grid-cols-[1.05fr_0.95fr] gap-8">
        <Panel className="flex min-h-[330px] items-center justify-center p-12">
          {data.brand.primaryLogoUrl ? (
            <img
              alt={data.name}
              className="w-full object-contain"
              src={data.brand.primaryLogoUrl}
            />
          ) : (
            <span
              className="text-[50px] font-semibold"
              style={{ fontFamily: displayType(data) }}
            >
              {data.name}
            </span>
          )}
        </Panel>
        <div>
          <p className="text-[22px] leading-[1.55]">{data.brand.idea}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {data.brand.character.map((trait) => (
              <span
                className="rounded-full border border-black/20 px-4 py-2 text-[15px] font-semibold capitalize"
                key={trait}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualSystem({ data }: { data: IProjectPresentationData }) {
  const colors = [
    ["Paper", data.visual.palette.background],
    ["Surface", data.visual.palette.surface],
    ["Ink", data.visual.palette.foreground],
    ["Lime", data.visual.palette.accent],
    ["Line", data.visual.palette.line],
  ];
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Visual system">
        Limited color, exact typography, thin rules, and structural whitespace.
      </SlideTitle>
      <div className="mt-7 grid grid-cols-[0.8fr_1.2fr] gap-8">
        <div className="grid grid-cols-3 gap-3">
          {colors.map(([label, value]) => (
            <div
              className="overflow-hidden rounded-[18px] border border-black/15 bg-[var(--workspace-brand-background,#F7F6F2)]"
              key={label}
            >
              <div className="h-[80px]" style={{ backgroundColor: value }} />
              <div className="flex items-center justify-between px-5 py-3">
                <strong>{label}</strong>
                <code>{value}</code>
              </div>
            </div>
          ))}
          <Panel className="col-span-3 p-4">
            <p
              className="text-[26px] font-semibold"
              style={{ fontFamily: displayType(data) }}
            >
              {data.visual.displayTypeLabel} · primary
            </p>
            <p className="mt-3 text-[16px]">
              {data.visual.bodyTypeLabel} · default
            </p>
          </Panel>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {data.brand.doDont.map((rule) => (
            <div
              className="grid min-h-[165px] grid-rows-2 overflow-hidden rounded-[18px] border border-black/15 bg-[var(--workspace-brand-background,#F7F6F2)]"
              key={rule.do}
            >
              <div className="p-4">
                <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-black/55">
                  Do
                </span>
                <p className="mt-2 text-[13px] leading-[1.35]">{rule.do}</p>
              </div>
              <div className="border-t border-black/15 bg-black/[0.025] p-4">
                <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-black/55">
                  Do not
                </span>
                <p className="mt-2 text-[13px] leading-[1.35]">{rule.dont}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Launch({ data }: { data: IProjectPresentationData }) {
  const gates = data.risks.map((risk) => ({
    consequence: risk.consequence,
    title: risk.title,
  }));
  return (
    <div className="pt-6">
      <SlideTitle data={data} eyebrow="Before acquisition starts">
        Make the evaluation path truthful, attributable, and runnable.
      </SlideTitle>
      <div className="mt-10 grid grid-cols-5 gap-4">
        {gates.map((gate, index) => (
          <div
            className="min-h-[275px] rounded-[20px] border border-black/15 bg-[var(--workspace-brand-background,#F7F6F2)] p-5"
            key={gate.title}
          >
            <span className="text-[14px] text-black/40">0{index + 1}</span>
            <h2 className="mt-7 text-[19px] font-semibold leading-[1.3]">
              {gate.title}
            </h2>
            <p className="mt-5 text-[14px] leading-[1.5] text-black/60">
              {gate.consequence}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-9 flex items-center justify-between rounded-[22px] bg-[#111111] px-8 py-6 text-white">
        <p
          className="max-w-[1050px] text-[25px] font-semibold leading-[1.4]"
          style={{ fontFamily: displayType(data) }}
        >
          Assemble the showcase. Publish the selected license. Verify setup.
          Instrument the bridge. Then run the bounded experiment.
        </p>
        <span className="h-16 w-16 shrink-0 rounded-full border border-[#111111] bg-[var(--workspace-brand-accent,#BFEF61)]" />
      </div>
    </div>
  );
}

function slideContent(
  id: ProjectPresentationSlideId,
  data: IProjectPresentationData,
) {
  switch (id) {
    case "cover":
      return <Cover data={data} />;
    case "product":
      return <Product data={data} />;
    case "audience":
      return <Audience data={data} />;
    case "evaluation":
      return <Evaluation data={data} />;
    case "inventory":
      return <Inventory data={data} />;
    case "showcase":
      return <Showcase data={data} />;
    case "acquisition":
      return <Acquisition data={data} />;
    case "signals":
      return <Signals data={data} />;
    case "experiment":
      return <Experiment data={data} />;
    case "evidence":
      return <Evidence data={data} />;
    case "identity":
      return <Identity data={data} />;
    case "visual-system":
      return <VisualSystem data={data} />;
    case "launch":
      return <Launch data={data} />;
  }
}

export function ProjectPresentation({
  data,
}: {
  data: IProjectPresentationData;
}) {
  const selected = requestedSlide();
  const slides =
    selected == null
      ? PROJECT_PRESENTATION_SLIDES
      : [PROJECT_PRESENTATION_SLIDES[selected]];

  return (
    <div
      className="m-0 grid justify-start bg-black print:block print:bg-white"
      data-presentation-ready="true"
      data-slide-count={PROJECT_PRESENTATION_SLIDES.length}
    >
      <style>{"@page { size: 1600px 900px; margin: 0; }"}</style>
      {slides.map((slide, index) => {
        const absoluteIndex = selected == null ? index : selected;
        return (
          <section
            aria-label={`Slide ${absoluteIndex + 1}: ${slide.label}`}
            className="h-[900px] w-[1600px] overflow-hidden break-after-page bg-[var(--workspace-brand-surface,#FFFFFF)] last:break-after-auto"
            data-slide-id={slide.id}
            key={slide.id}
          >
            {slide.id === "cover" ? (
              <main
                className="h-full overflow-hidden px-16 py-12"
                data-workspace-projection={data.projection}
                style={slideStyle(data)}
              >
                <Cover data={data} />
              </main>
            ) : (
              <SlideFrame
                data={data}
                index={absoluteIndex}
                source={
                  slide.id === "identity" || slide.id === "visual-system"
                    ? "Source: design.md · assets"
                    : slide.id === "showcase"
                      ? "Source: business.md · evidence.md"
                      : "Source: strategy.md · evidence.md"
                }
              >
                {slideContent(slide.id, data)}
              </SlideFrame>
            )}
          </section>
        );
      })}
    </div>
  );
}
