import type { ReactNode } from "react";

export interface IProjectDesignData {
  assetIds: string[];
  bodyType: string;
  brandReady: boolean;
  cta: string;
  displayType: string;
  headline: string;
  name: string;
  palette: {
    accent: string;
    background: string;
    foreground: string;
    line: string;
    muted: string;
    primary: string;
  };
  projection: "current" | "singlepage" | "startup";
  projectionLabel: string;
  sections: {
    communication: string[];
    identity: string[];
    page: string[];
  };
  subheadline: string;
  successCopy: string;
  successTitle: string;
  websiteReady: boolean;
}

export type ProjectDesignView =
  | "overview"
  | "brand"
  | "tokens"
  | "imagery"
  | "components"
  | "landing"
  | "mobile"
  | "form"
  | "success"
  | "acquisition";

function Readiness({ data }: { data: IProjectDesignData }) {
  if (data.brandReady && data.websiteReady) return null;
  const missing = [
    data.brandReady ? undefined : "brand.md",
    data.websiteReady ? undefined : "website.md",
  ].filter((value): value is string => Boolean(value));
  const missingLabel =
    missing.length === 2 ? `${missing[0]} and ${missing[1]}` : missing[0];
  const message =
    data.projection === "current"
      ? `Complete the resolved ${missingLabel} to replace the neutral preview with approved project decisions.`
      : data.projection === "startup"
        ? `startup does not currently contribute decisions from ${missingLabel}; current continues to reuse the corresponding singlepage content.`
        : `Add the framework decisions to ${missingLabel} to replace the neutral singlepage preview.`;
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-950 md:px-10">
      This is the {data.projectionLabel} design projection. {message}
    </div>
  );
}

function Shell({
  children,
  data,
  label,
}: {
  children: ReactNode;
  data: IProjectDesignData;
  label: string;
}) {
  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: data.palette.background,
        color: data.palette.foreground,
        fontFamily: data.bodyType,
      }}
    >
      <Readiness data={data} />
      <header
        className="flex items-center justify-between border-b px-5 py-5 md:px-10"
        style={{ borderColor: data.palette.line }}
      >
        <span
          className="text-xl font-semibold"
          style={{ fontFamily: data.displayType }}
        >
          {data.name}
        </span>
        <span
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: data.palette.muted }}
        >
          Project · Design · {data.projectionLabel} · {label}
        </span>
      </header>
      {children}
    </main>
  );
}

function StatusCard({
  description,
  projection,
  ready,
  title,
}: {
  description: string;
  projection: IProjectDesignData["projection"];
  ready: boolean;
  title: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            ready
              ? "bg-emerald-100 text-emerald-900"
              : "bg-amber-100 text-amber-950"
          }`}
        >
          {ready
            ? projection === "current"
              ? "Resolved"
              : "Defined in layer"
            : "Waiting for content"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function SummaryList({
  empty,
  inverted = false,
  items,
}: {
  empty: string;
  inverted?: boolean;
  items: string[];
}) {
  if (!items.length) {
    return (
      <p
        className={`text-sm leading-6 ${inverted ? "text-white/65" : "text-slate-500"}`}
      >
        {empty}
      </p>
    );
  }
  return (
    <ul
      className={`grid gap-3 text-sm leading-6 ${inverted ? "text-white/75" : "text-slate-700"}`}
    >
      {items.map((item) => (
        <li
          className={`border-l-2 pl-3 ${inverted ? "border-white/20" : "border-slate-200"}`}
          key={item}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Overview({ data }: { data: IProjectDesignData }) {
  return (
    <Shell data={data} label="Overview">
      <section className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-16">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: data.palette.accent }}
        >
          {data.projectionLabel} design output
        </p>
        <h1
          className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl"
          style={{ fontFamily: data.displayType }}
        >
          {data.projection === "current"
            ? "Design follows the resolved project documents."
            : "Design follows this source layer only."}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
          {data.projection === "current"
            ? "This projection combines singlepage sources with startup overrides."
            : `This projection isolates the ${data.projectionLabel} source for comparison.`}{" "}
          The stories are not a separate editable design source.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StatusCard
            title="Brand system"
            ready={data.brandReady}
            projection={data.projection}
            description="Communication, identity, semantic tokens, typography, imagery, and usage rules from brand.md."
          />
          <StatusCard
            title="Website solution"
            ready={data.websiteReady}
            projection={data.projection}
            description="Visitor path, final copy, conversion states, accessibility, and metadata from website.md."
          />
          <StatusCard
            title="Indexed assets"
            ready={data.assetIds.length > 0}
            projection={data.projection}
            description={`${data.assetIds.length} ${data.projection === "current" ? "resolved" : "source-layer"} asset${data.assetIds.length === 1 ? "" : "s"} with provenance and usage limits.`}
          />
        </div>
      </section>
    </Shell>
  );
}

function Brand({ data }: { data: IProjectDesignData }) {
  return (
    <Shell data={data} label="Brand overview">
      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-12 md:grid-cols-2 md:px-10 md:py-16">
        <article
          className="rounded-3xl p-7 text-white md:p-10"
          style={{ backgroundColor: data.palette.primary }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: data.palette.accent }}
          >
            Identity
          </p>
          <h1
            className="mt-6 text-5xl font-semibold"
            style={{ fontFamily: data.displayType }}
          >
            {data.name}
          </h1>
          <div className="mt-8 text-white/75">
            <SummaryList
              items={data.sections.identity}
              empty="Identity direction has not been defined in brand.md yet."
              inverted
            />
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-7 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Communication
          </p>
          <div className="mt-6">
            <SummaryList
              items={data.sections.communication}
              empty="Message hierarchy, voice, proof, and CTA have not been defined in brand.md yet."
            />
          </div>
        </article>
      </section>
    </Shell>
  );
}

function Tokens({ data }: { data: IProjectDesignData }) {
  const colors = Object.entries(data.palette);
  return (
    <Shell data={data} label="Color & typography">
      <section className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-16">
        <h1 className="text-4xl font-semibold">Semantic color system</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colors.map(([name, value]) => (
            <article
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              key={name}
            >
              <div className="h-28" style={{ backgroundColor: value }} />
              <div className="flex items-center justify-between p-4 text-sm text-slate-950">
                <span className="font-semibold capitalize">{name}</span>
                <code>{value}</code>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Display
            </p>
            <p
              className="mt-5 text-4xl"
              style={{ fontFamily: data.displayType }}
            >
              Aa Бб 123
            </p>
            <code className="mt-5 block text-sm text-slate-600">
              {data.displayType}
            </code>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-950">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Body
            </p>
            <p className="mt-5 text-lg" style={{ fontFamily: data.bodyType }}>
              Clear content supports decisions and action.
            </p>
            <code className="mt-5 block text-sm text-slate-600">
              {data.bodyType}
            </code>
          </article>
        </div>
      </section>
    </Shell>
  );
}

function Imagery({ data }: { data: IProjectDesignData }) {
  return (
    <Shell data={data} label="Imagery">
      <section className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-16">
        <h1 className="text-4xl font-semibold">Indexed visual assets</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Only assets declared in the {data.projectionLabel} asset index appear
          in this projection. Generated, stock, reference, and client-evidence
          imagery retain their distinct provenance.
        </p>
        {data.assetIds.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.assetIds.map((id) => (
              <article
                className="grid min-h-48 place-items-center rounded-2xl border border-slate-200 bg-white p-6"
                key={id}
              >
                <code className="break-all text-center text-sm text-slate-700">
                  {id}
                </code>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No project assets are indexed yet.
          </div>
        )}
      </section>
    </Shell>
  );
}

function PrimaryButton({ data }: { data: IProjectDesignData }) {
  return (
    <button
      className="min-h-11 rounded-xl px-5 py-3 text-sm font-semibold text-white"
      style={{ backgroundColor: data.palette.accent }}
      type="button"
    >
      {data.cta}
    </button>
  );
}

function Components({ data }: { data: IProjectDesignData }) {
  return (
    <Shell data={data} label="Key components">
      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-12 md:grid-cols-2 md:px-10 md:py-16">
        <article className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-950">
          <h1 className="text-2xl font-semibold">Actions</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton data={data} />
            <button
              className="min-h-11 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold"
              type="button"
            >
              Secondary action
            </button>
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-950">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Content card
          </p>
          <h2
            className="mt-5 text-2xl font-semibold"
            style={{ fontFamily: data.displayType }}
          >
            One clear decision per block
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Final component hierarchy must come from the selected website
            specification.
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-950 md:col-span-2">
          <label className="block max-w-xl">
            <span className="mb-2 block text-sm font-semibold">
              Labeled field
            </span>
            <input
              className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-offset-4"
              placeholder="Project-specific input"
              readOnly
            />
          </label>
        </article>
      </section>
    </Shell>
  );
}

function Landing({
  data,
  mobile = false,
}: {
  data: IProjectDesignData;
  mobile?: boolean;
}) {
  const content = (
    <div
      className="overflow-hidden rounded-3xl border bg-white text-slate-950 shadow-xl"
      style={{ borderColor: data.palette.line }}
    >
      <header
        className="flex items-center justify-between border-b px-5 py-4"
        style={{ borderColor: data.palette.line }}
      >
        <span
          className="font-semibold"
          style={{ fontFamily: data.displayType }}
        >
          {data.name}
        </span>
        <span className="text-xs text-slate-500">
          {data.projectionLabel} project preview
        </span>
      </header>
      <section
        className={`grid gap-8 px-6 py-12 ${mobile ? "" : "md:grid-cols-[1.3fr_.7fr] md:px-10 md:py-20"}`}
      >
        <div>
          <h1
            className={`${mobile ? "text-4xl" : "text-5xl md:text-7xl"} font-semibold tracking-tight`}
            style={{ fontFamily: data.displayType }}
          >
            {data.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            {data.subheadline}
          </p>
          <div className="mt-7">
            <PrimaryButton data={data} />
          </div>
        </div>
        <aside
          className="rounded-2xl p-6 text-white"
          style={{ backgroundColor: data.palette.primary }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
            Visitor path
          </p>
          <SummaryList
            items={data.sections.page}
            empty="Page structure and proof sequence have not been defined in website.md yet."
            inverted
          />
        </aside>
      </section>
    </div>
  );
  return (
    <Shell data={data} label={mobile ? "Mobile page" : "Primary landing page"}>
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-10">
        {mobile ? (
          <div className="mx-auto w-[390px] max-w-full rounded-[38px] border-[10px] border-slate-950 bg-slate-950">
            {content}
          </div>
        ) : (
          content
        )}
      </section>
    </Shell>
  );
}

function Form({ data }: { data: IProjectDesignData }) {
  return (
    <Shell data={data} label="Form">
      <section className="mx-auto max-w-3xl px-5 py-12 md:px-10 md:py-16">
        <div
          className="rounded-3xl p-7 text-white md:p-10"
          style={{ backgroundColor: data.palette.primary }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
            Conversion state
          </p>
          <h1
            className="mt-4 text-3xl font-semibold"
            style={{ fontFamily: data.displayType }}
          >
            Project form
          </h1>
          <p className="mt-3 text-sm leading-6 opacity-75">
            Labels, consent, validation, and delivery behavior must be specified
            in website.md before implementation.
          </p>
          <div className="mt-7 grid gap-4">
            {["Name", "Contact", "Request"].map((label) => (
              <label key={label}>
                <span className="mb-2 block text-sm font-semibold">
                  {label}
                </span>
                <input
                  className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-white outline-offset-4"
                  readOnly
                />
              </label>
            ))}
          </div>
          <div className="mt-6">
            <PrimaryButton data={data} />
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Success({ data }: { data: IProjectDesignData }) {
  return (
    <Shell data={data} label="Success state">
      <section className="grid min-h-[70vh] place-items-center px-5 py-12">
        <article className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-950 shadow-xl md:p-12">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl text-white"
            style={{ backgroundColor: data.palette.accent }}
          >
            ✓
          </span>
          <h1
            className="mt-6 text-3xl font-semibold"
            style={{ fontFamily: data.displayType }}
          >
            {data.successTitle}
          </h1>
          <p className="mt-4 leading-7 text-slate-600">{data.successCopy}</p>
        </article>
      </section>
    </Shell>
  );
}

function Acquisition({ data }: { data: IProjectDesignData }) {
  return (
    <Shell data={data} label="Acquisition creative">
      <section className="grid min-h-[75vh] place-items-center px-5 py-12">
        <article
          className="aspect-square w-full max-w-2xl overflow-hidden rounded-3xl p-8 text-white shadow-2xl md:p-12"
          style={{ backgroundColor: data.palette.primary }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: data.palette.accent }}
          >
            {data.name}
          </p>
          <h1
            className="mt-12 text-5xl font-semibold leading-tight md:text-7xl"
            style={{ fontFamily: data.displayType }}
          >
            {data.headline}
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-8 text-white/70">
            {data.subheadline}
          </p>
          <div className="mt-10 inline-flex rounded-full border border-white/25 px-5 py-3 text-sm font-semibold">
            {data.cta}
          </div>
        </article>
      </section>
    </Shell>
  );
}

export function ProjectDesign({
  data,
  view,
}: {
  data: IProjectDesignData;
  view: ProjectDesignView;
}) {
  if (view === "overview") return <Overview data={data} />;
  if (view === "brand") return <Brand data={data} />;
  if (view === "tokens") return <Tokens data={data} />;
  if (view === "imagery") return <Imagery data={data} />;
  if (view === "components") return <Components data={data} />;
  if (view === "landing") return <Landing data={data} />;
  if (view === "mobile") return <Landing data={data} mobile />;
  if (view === "form") return <Form data={data} />;
  if (view === "success") return <Success data={data} />;
  return <Acquisition data={data} />;
}
