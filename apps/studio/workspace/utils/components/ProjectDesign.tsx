import { localizedHeading } from "../../../../../tools/studio/workspace/headings";
import {
  defaultDesignSections,
  type DesignBuiltinSection,
} from "../design/layout";
import { MarkdownDocument } from "./ArtifactBrowser";
import type { IDesignDocumentNotes } from "../design/document";
import type { CSSProperties, ReactNode } from "react";

export interface IProjectDesignAsset {
  designKey?: string;
  designRole?: string;
  id: string;
  lifecycle?: "approved" | "proposed" | string;
  path: string;
  previewUrl?: string;
  purpose: string;
  sourceType: "client" | "generated" | "public-reference" | "stock" | string;
}

export interface IProjectDesignPrompt {
  assetId?: string;
  avoid: string;
  prompt: string;
  title: string;
  use: string;
}

export interface IProjectDesignMedia {
  examples: IProjectDesignPrompt[];
  intro: string;
  masterPrompt: string;
  productionRules: string[];
}

export interface IProjectDesignSurfacePattern {
  avoid: string;
  decision: string;
  /** Provenance only. Reference screenshots are never rendered or reproduced. */
  references: string[];
  title: string;
}

export interface IProjectDesignInterface {
  intro: string;
  patterns: IProjectDesignSurfacePattern[];
  shapeRules: string[];
  stateRules: string[];
}

export interface IProjectDesignColorRole {
  dark: string;
  light: string;
  role: string;
  usage: string;
}

export interface IProjectDesignTypographyRole {
  assetId?: string;
  family: string;
  fontStack: string;
  role: string;
  usage: string;
  weights: string;
}

export interface IProjectDesignData {
  notes?: IDesignDocumentNotes;
  assets: IProjectDesignAsset[];
  bodyType: string;
  bodyTypeLabel: string;
  colorRoles: IProjectDesignColorRole[];
  conceptName: string;
  conceptSummary: string;
  displayType: string;
  displayTypeLabel: string;
  doDont: Array<{ do: string; dont: string }>;
  graphicRules: string[];
  illustration: IProjectDesignMedia;
  interface: IProjectDesignInterface;
  logoRules: string[];
  palette: {
    accent: string;
    background: string;
    foreground: string;
    line: string;
    muted: string;
    primary: string;
    surface: string;
  };
  photography: IProjectDesignMedia;
  preferenceProfile: string;
  projection: "singlepage" | "startup";
  typographyRoles: IProjectDesignTypographyRole[];
  typographyRules: string[];
}

export interface IProjectDesignProps {
  data: IProjectDesignData;
  children?: ReactNode;
}

export function DesignNotes({
  markdown,
  section,
}: {
  markdown?: string;
  section: string;
}) {
  if (!markdown?.trim()) return null;
  return (
    <div className="mt-6" data-design-rules={section}>
      <MarkdownDocument>{markdown}</MarkdownDocument>
    </div>
  );
}

type ProjectPaletteRole = keyof IProjectDesignData["palette"];

function paletteValue(
  data: IProjectDesignData,
  role: ProjectPaletteRole,
): string {
  return `var(--workspace-brand-${role}, ${data.palette[role]})`;
}

function pageStyle(data: IProjectDesignData): CSSProperties {
  return {
    backgroundColor: paletteValue(data, "background"),
    color: paletteValue(data, "foreground"),
    fontFamily: `var(--workspace-brand-font-body, ${data.bodyType})`,
  };
}

function displayStyle(data: IProjectDesignData): CSSProperties {
  return {
    fontFamily: `var(--workspace-brand-font-display, ${data.displayType})`,
  };
}

function slug(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function assetFor(
  data: IProjectDesignData,
  role: string,
  item: IProjectDesignPrompt,
): IProjectDesignAsset | undefined {
  if (item.assetId) {
    const exact = data.assets.find((asset) => asset.id === item.assetId);
    if (exact) return exact;
  }

  const normalizedKey = slug(item.title);
  return data.assets.find(
    (asset) => asset.designRole === role && asset.designKey === normalizedKey,
  );
}

function Shell({
  children,
  data,
}: {
  children: ReactNode;
  data: IProjectDesignData;
}) {
  return (
    <main
      className="min-h-screen"
      data-workspace-projection={data.projection}
      style={pageStyle(data)}
    >
      {children}
    </main>
  );
}

function Eyebrow({
  children,
  data,
}: {
  children: ReactNode;
  data: IProjectDesignData;
}) {
  return (
    <p
      className="text-xs font-semibold tracking-normal"
      style={{ color: paletteValue(data, "muted") }}
    >
      {children}
    </p>
  );
}

function PageTitle({
  children,
  copy,
  data,
  eyebrow,
}: {
  children: ReactNode;
  copy: string;
  data: IProjectDesignData;
  eyebrow: string;
}) {
  return (
    <header className="max-w-5xl">
      <Eyebrow data={data}>{eyebrow}</Eyebrow>
      <h2
        className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
        style={displayStyle(data)}
      >
        {children}
      </h2>
      {copy ? (
        <p
          className="mt-6 max-w-4xl text-sm leading-7 md:text-base"
          style={{ color: paletteValue(data, "muted") }}
        >
          {copy}
        </p>
      ) : null}
    </header>
  );
}

function RuleList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 text-sm leading-6">
      {items.map((item) => (
        <li className="border-l-2 border-current/20 pl-4" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Overview({ data }: IProjectDesignProps) {
  return (
    <section
      className="mx-auto max-w-7xl scroll-mt-6 px-5 py-12 md:px-10 md:py-20"
      id="overview"
    >
      <PageTitle
        copy={data.conceptSummary}
        data={data}
        eyebrow="Направление айдентики"
      >
        {data.conceptName}
      </PageTitle>

      <div className="mt-10">
        <h2 className="text-3xl font-semibold" style={displayStyle(data)}>
          Общие правила дизайна
        </h2>
        {data.notes?.overview ? (
          <DesignNotes markdown={data.notes.overview} section="overview" />
        ) : (
          <RuleList items={data.graphicRules} />
        )}
      </div>
    </section>
  );
}

function Logos({ data }: { data: IProjectDesignData }) {
  const logos = data.assets.filter(
    (asset) => asset.designRole === "logo" && asset.previewUrl,
  );

  return (
    <section
      className="mx-auto max-w-7xl scroll-mt-6 border-t px-5 py-12 md:px-10 md:py-16"
      id="logos"
      style={{ borderColor: paletteValue(data, "line") }}
    >
      <PageTitle
        copy={data.notes?.logos ? "" : data.logoRules.join(" ")}
        data={data}
        eyebrow="Файлы айдентики"
      >
        Логотипы
      </PageTitle>
      <DesignNotes markdown={data.notes?.logos} section="logos" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {logos.map((asset) => {
          const darkSurface = asset.designKey?.includes("-dark") ?? false;

          return (
            <figure
              className={`grid min-h-72 overflow-hidden rounded-3xl border ${
                asset.designKey === "primary" ? "md:col-span-2" : ""
              }`}
              key={asset.id}
              style={{
                backgroundColor: paletteValue(data, "surface"),
                borderColor: paletteValue(data, "line"),
              }}
            >
              <div
                className="grid min-h-52 place-items-center p-8 md:p-12"
                style={
                  darkSurface
                    ? { backgroundColor: paletteValue(data, "primary") }
                    : undefined
                }
              >
                <img
                  alt={asset.purpose}
                  className={
                    asset.designKey === "primary"
                      ? "h-28 w-full object-contain"
                      : "h-32 w-full max-w-lg object-contain"
                  }
                  src={asset.previewUrl}
                />
              </div>
              <figcaption
                className="border-t p-5 text-xs leading-5"
                style={{ borderColor: paletteValue(data, "line") }}
              >
                {asset.purpose}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function colorValue(value: string): string {
  return value.match(/#[0-9a-f]{6}\b/i)?.[0] ?? "transparent";
}

function Colors({ data }: { data: IProjectDesignData }) {
  return (
    <section
      className="mx-auto max-w-7xl scroll-mt-6 border-t px-5 py-12 md:px-10 md:py-16"
      id="colors"
      style={{ borderColor: paletteValue(data, "line") }}
    >
      <PageTitle copy="" data={data} eyebrow="Семантическая система">
        Цвета
      </PageTitle>
      <DesignNotes markdown={data.notes?.colors} section="colors" />
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.colorRoles.map((color) => (
          <article
            className="overflow-hidden rounded-2xl border"
            key={color.role}
            style={{
              backgroundColor: paletteValue(data, "surface"),
              borderColor: paletteValue(data, "line"),
            }}
          >
            <div className="grid h-32 grid-cols-2">
              <div style={{ backgroundColor: colorValue(color.light) }} />
              <div style={{ backgroundColor: colorValue(color.dark) }} />
            </div>
            <div className="p-5">
              <h3 className="font-semibold">{localizedHeading(color.role)}</h3>
              <p className="mt-3 text-xs leading-6">{color.usage}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <code>{color.light}</code>
                <code>{color.dark}</code>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Typography({ data }: { data: IProjectDesignData }) {
  const specimens = [...data.typographyRoles].sort((left, right) =>
    /primary|display/.test(left.role.toLocaleLowerCase())
      ? -1
      : /primary|display/.test(right.role.toLocaleLowerCase())
        ? 1
        : 0,
  );

  return (
    <section
      className="mx-auto max-w-7xl scroll-mt-6 border-t px-5 py-12 md:px-10 md:py-16"
      id="typography"
      style={{ borderColor: paletteValue(data, "line") }}
    >
      <PageTitle
        copy={data.notes?.typography ? "" : data.typographyRules.join(" ")}
        data={data}
        eyebrow="Типографическая система"
      >
        Типографика
      </PageTitle>
      <DesignNotes markdown={data.notes?.typography} section="typography" />
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {specimens.map((specimen, index) => (
          <article
            className="rounded-3xl border p-7 md:p-10"
            data-font-asset-id={specimen.assetId}
            data-font-family={specimen.family}
            key={specimen.role}
            style={{
              backgroundColor:
                index === 0
                  ? paletteValue(data, "surface")
                  : paletteValue(data, "primary"),
              borderColor: paletteValue(data, "line"),
              color:
                index === 0
                  ? paletteValue(data, "foreground")
                  : paletteValue(data, "surface"),
            }}
          >
            <p className="text-xs tracking-normal opacity-65">
              {specimen.role} · {specimen.family} · {specimen.weights}
            </p>
            <p
              className="mt-8 text-5xl leading-tight md:text-7xl"
              style={{ fontFamily: specimen.fontStack }}
            >
              Aa Бб 123
            </p>
            {/primary|display/.test(specimen.role.toLocaleLowerCase()) ? (
              <p
                className="mt-4 text-3xl leading-tight md:text-5xl"
                style={{ fontFamily: specimen.fontStack }}
              >
                Build with clarity · Создавайте яснее
              </p>
            ) : null}
            <p className="mt-6 text-xs leading-6 opacity-65">
              {specimen.usage}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MasterPrompt({
  data,
  prompt,
}: {
  data: IProjectDesignData;
  prompt: string;
}) {
  return (
    <article
      className="mt-10 rounded-3xl p-7 md:p-10"
      style={{
        backgroundColor: paletteValue(data, "primary"),
        color: paletteValue(data, "surface"),
      }}
    >
      <p className="text-xs font-semibold tracking-normal opacity-65">
        Основной стилевой промпт
      </p>
      <blockquote className="mt-6 max-w-5xl select-text whitespace-pre-wrap border-l pl-5 text-sm leading-7 opacity-85">
        {prompt}
      </blockquote>
    </article>
  );
}

function RulePanel({
  data,
  items,
  title,
}: {
  data: IProjectDesignData;
  items: string[];
  title: string;
}) {
  return (
    <article
      className="rounded-3xl border p-7"
      style={{
        backgroundColor: paletteValue(data, "surface"),
        borderColor: paletteValue(data, "line"),
      }}
    >
      <h3 className="text-xl font-semibold" style={displayStyle(data)}>
        {title}
      </h3>
      <div className="mt-6">
        <RuleList items={items} />
      </div>
    </article>
  );
}

function PromptCard({
  asset,
  data,
  item,
}: {
  asset?: IProjectDesignAsset;
  data: IProjectDesignData;
  item: IProjectDesignPrompt;
}) {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-3xl border"
      style={{
        backgroundColor: paletteValue(data, "surface"),
        borderColor: paletteValue(data, "line"),
      }}
    >
      {asset?.previewUrl ? (
        <figure
          className="w-full overflow-hidden"
          style={{ backgroundColor: paletteValue(data, "background") }}
        >
          <img
            alt={asset.purpose}
            className="block h-auto w-full"
            loading="lazy"
            src={asset.previewUrl}
          />
        </figure>
      ) : null}
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <h3
          className="text-xl font-semibold leading-tight [overflow-wrap:anywhere]"
          style={displayStyle(data)}
        >
          {item.title}
        </h3>
        <p
          className="mt-4 text-xs font-semibold leading-5 tracking-normal"
          style={{ color: paletteValue(data, "muted") }}
        >
          {item.use}
        </p>
        <p className="mt-5 text-sm leading-7">{item.prompt}</p>
        <p
          className="mt-6 border-t pt-5 text-xs leading-6"
          style={{
            borderColor: paletteValue(data, "line"),
            color: paletteValue(data, "muted"),
          }}
        >
          {item.avoid}
        </p>
      </div>
    </article>
  );
}

/**
 * Reference screenshots stay provenance-only: their registry entries prohibit
 * reproducing a layout, so this block cites asset IDs instead of showing them.
 */
function SurfacePatternCard({
  data,
  pattern,
}: {
  data: IProjectDesignData;
  pattern: IProjectDesignSurfacePattern;
}) {
  return (
    <article
      className="flex flex-col rounded-3xl border p-6 md:p-8"
      style={{
        backgroundColor: paletteValue(data, "surface"),
        borderColor: paletteValue(data, "line"),
      }}
    >
      <h3
        className="text-xl font-semibold leading-tight [overflow-wrap:anywhere]"
        style={displayStyle(data)}
      >
        {localizedHeading(pattern.title)}
      </h3>
      <p className="mt-5 flex-1 text-sm leading-7">{pattern.decision}</p>
      <p
        className="mt-6 border-t pt-5 text-xs leading-6"
        style={{
          borderColor: paletteValue(data, "line"),
          color: paletteValue(data, "muted"),
        }}
      >
        {pattern.avoid}
      </p>
      {pattern.references.length ? (
        <p
          className="mt-4 text-[11px] leading-5 [overflow-wrap:anywhere]"
          style={{ color: paletteValue(data, "muted") }}
        >
          <span className="font-semibold tracking-normal">
            Источник наблюдения
          </span>{" "}
          {pattern.references.join(", ")}
        </p>
      ) : null}
    </article>
  );
}

function InterfaceSurfaces({ data }: { data: IProjectDesignData }) {
  const { intro, patterns, shapeRules, stateRules } = data.interface;

  return (
    <section
      className="mx-auto max-w-7xl scroll-mt-6 border-t px-5 py-12 md:px-10 md:py-16"
      id="interface"
      style={{ borderColor: paletteValue(data, "line") }}
    >
      <PageTitle
        copy={data.notes?.interface ? "" : intro}
        data={data}
        eyebrow="Интерфейсы продукта"
      >
        Интерфейс
      </PageTitle>
      {data.notes?.interface ? (
        <DesignNotes markdown={data.notes.interface} section="interface" />
      ) : (
        <div className="mt-10 grid items-start gap-4 lg:grid-cols-2">
          {shapeRules.length ? (
            <RulePanel
              data={data}
              items={shapeRules}
              title="Поверхности, плотность и форма"
            />
          ) : null}
          {stateRules.length ? (
            <RulePanel
              data={data}
              items={stateRules}
              title="Элементы управления, состояния и действия"
            />
          ) : null}
        </div>
      )}
      {data.notes?.icons ? (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold">Иконки</h3>
          <DesignNotes markdown={data.notes.icons} section="icons" />
        </div>
      ) : null}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {patterns.map((pattern) => (
          <SurfacePatternCard
            data={data}
            key={localizedHeading(pattern.title)}
            pattern={pattern}
          />
        ))}
      </div>
    </section>
  );
}

function MediaSection({
  assetRole,
  data,
  eyebrow,
  id,
  media,
  title,
}: {
  assetRole: string;
  data: IProjectDesignData;
  eyebrow: string;
  id: string;
  media: IProjectDesignMedia;
  title: string;
}) {
  return (
    <section
      className="mx-auto max-w-7xl scroll-mt-6 border-t px-5 py-12 md:px-10 md:py-16"
      id={id}
      style={{ borderColor: paletteValue(data, "line") }}
    >
      <PageTitle copy={media.intro} data={data} eyebrow={eyebrow}>
        {title}
      </PageTitle>
      <MasterPrompt data={data} prompt={media.masterPrompt} />
      <div className="mt-8">
        <h3 className="text-2xl font-semibold">Требования к производству</h3>
        {data.notes?.[id as "photography" | "illustration"] ? (
          <DesignNotes
            markdown={data.notes[id as "photography" | "illustration"]}
            section={id}
          />
        ) : (
          <RuleList items={media.productionRules} />
        )}
      </div>
      <div className="mt-10 grid items-start gap-4 lg:grid-cols-2">
        {media.examples.map((item) => (
          <PromptCard
            asset={assetFor(data, assetRole, item)}
            data={data}
            item={item}
            key={item.assetId ?? item.title}
          />
        ))}
      </div>
    </section>
  );
}

/** Optional reusable blocks. A project chooses their order and which to include. */
export function ProjectDesignSection({
  section,
  ...props
}: IProjectDesignProps & { section: DesignBuiltinSection }) {
  const { data } = props;
  switch (section) {
    case "overview":
      return <Overview {...props} />;
    case "logos":
      return <Logos data={data} />;
    case "colors":
      return <Colors data={data} />;
    case "typography":
      return <Typography data={data} />;
    case "interface":
      return <InterfaceSurfaces data={data} />;
    case "photography":
      return (
        <MediaSection
          assetRole="photography"
          data={data}
          eyebrow="Система изображений"
          id="photography"
          media={data.photography}
          title="Фотография"
        />
      );
    case "illustration":
      return (
        <MediaSection
          assetRole="motif"
          data={data}
          eyebrow="Система изображений"
          id="illustration"
          media={data.illustration}
          title="Иллюстрации и схемы"
        />
      );
  }
}

export default function ProjectDesign({
  children,
  ...props
}: IProjectDesignProps) {
  return (
    <Shell data={props.data}>
      {children ??
        defaultDesignSections.map((section) => (
          <ProjectDesignSection key={section} section={section} {...props} />
        ))}
    </Shell>
  );
}
