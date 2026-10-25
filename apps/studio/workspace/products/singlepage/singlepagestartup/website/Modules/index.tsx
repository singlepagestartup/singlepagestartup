import { useState } from "react";
import type { IWorkspacePageProps } from "../../../../../utils/pages";
import {
  Icon,
  kit,
} from "../../../../../design/singlepage/interface-kit/primitives";
import { SiteShell, PreviewLink, siteStyles as styles } from "../Site";
import {
  filterModules,
  parseModules,
  parseModulesPage,
  readModuleSlug,
} from "./content";
import sourceText from "./page.md?raw";
import SocialGuide from "./SocialGuide";
import BusinessGuide from "./BusinessGuide";
import ModuleVisual from "./ModuleVisual";

interface IModulesPageProps extends IWorkspacePageProps {
  defaultSlug?: string;
}

export default function ModulesPage({
  text,
  navigationHref,
  resolveLink,
  defaultSlug,
}: IModulesPageProps = {}) {
  const [group, setGroup] = useState("");
  const [query, setQuery] = useState("");
  const copy = parseModulesPage(text ?? sourceText);
  const labels = copy.labels;
  const modules = parseModules(text ?? sourceText);
  const slug = readModuleSlug(navigationHref) ?? defaultSlug;
  const selected = modules.find((item) => item.id === slug);
  const visible = filterModules(modules, group, query);
  if (selected?.id === "social")
    return <SocialGuide copy={copy.social} resolveLink={resolveLink} />;
  return (
    <SiteShell active="modules" resolveLink={resolveLink} lang="ru" acquisition>
      {slug ? (
        selected ? (
          <BusinessGuide
            key={selected.id}
            module={selected}
            guide={copy.guides[selected.id]}
            modules={modules}
            labels={labels}
            resolveLink={resolveLink}
          />
        ) : (
          <main className="mx-auto max-w-7xl px-5 py-16 @3xl:px-8">
            <h1 className={`text-3xl ${styles.display}`}>
              {labels["missing-title"]}
            </h1>
            <p className={`mt-4 ${styles.muted}`}>
              {labels["missing-description"]}
            </p>
            <PreviewLink
              href="/framework/modules"
              resolveLink={resolveLink}
              className={`${kit.button} mt-6`}
            >
              {labels["all-modules"]}
            </PreviewLink>
          </main>
        )
      ) : (
        <main id="framework-modules">
          <section className="border-b border-[var(--workspace-brand-line)] bg-white">
            <div className="mx-auto max-w-7xl px-5 py-12 @3xl:px-8 @3xl:py-16">
              <p
                className={`text-xs font-medium uppercase tracking-widest ${styles.muted}`}
              >
                {copy.introduction.paragraphs[0]}
              </p>
              <h1
                className={`mt-4 max-w-4xl text-balance text-4xl leading-tight @3xl:text-5xl ${styles.display}`}
              >
                {copy.introduction.title}
              </h1>
              <p
                className={`mt-5 max-w-3xl text-base leading-8 ${styles.muted}`}
              >
                {copy.introduction.paragraphs[1]}
              </p>
              <div className="mt-8 max-w-2xl">
                <label
                  htmlFor="module-search"
                  className="mb-3 block text-sm font-semibold"
                >
                  {labels.search}
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-4 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--workspace-brand-foreground)]">
                  <Icon name="magnifying-glass" size={20} />
                  <input
                    id="module-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={labels["search-placeholder"]}
                    className="min-h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[var(--workspace-brand-muted)]"
                  />
                </div>
              </div>
              <div
                role="group"
                aria-label={labels.groups}
                className="mt-5 flex flex-wrap gap-2"
              >
                {["", ...new Set(modules.map((item) => item.group))].map(
                  (name) => (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={name === group}
                      onClick={() => setGroup(name)}
                      className={name === group ? kit.button : kit.secondary}
                    >
                      {name || labels["all-modules"]}
                    </button>
                  ),
                )}
              </div>
            </div>
          </section>
          <section
            className="mx-auto max-w-7xl px-5 py-8 @3xl:px-8 @3xl:py-10"
            aria-label={labels["all-modules"]}
          >
            <p
              role="status"
              aria-live="polite"
              className={`mb-5 text-sm ${styles.muted}`}
            >
              {labels.results} {visible.length}
            </p>
            <div className="grid gap-5 @5xl:grid-cols-2">
              {visible.map((item) => (
                <PreviewLink
                  key={item.id}
                  href={`/framework/modules/${item.id}`}
                  resolveLink={resolveLink}
                  className={`group grid min-w-0 overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-white transition-colors hover:border-[var(--workspace-brand-foreground)] @xl:grid-cols-[0.75fr_1.25fr] ${styles.focus}`}
                >
                  <div className="min-h-40 border-b border-[var(--workspace-brand-line)] @xl:border-b-0 @xl:border-r">
                    <ModuleVisual
                      moduleId={item.id}
                      scene={copy.guides[item.id]?.scenes[0]}
                      compact
                    />
                  </div>
                  <div className="flex min-w-0 flex-col p-5 @3xl:p-6">
                    <p className={`text-xs ${styles.muted}`}>{item.name}</p>
                    <h2
                      className={`mt-2 text-xl leading-snug ${styles.display}`}
                    >
                      {item.responsibility}
                    </h2>
                    <p
                      className={`mt-3 flex-1 text-sm leading-7 ${styles.muted}`}
                    >
                      {item.description}
                    </p>
                    <span className="mt-5 flex items-center justify-between gap-3 text-sm font-semibold">
                      {labels["explore-module"]}
                      <span className="rounded-full bg-[var(--workspace-brand-accent)] p-2 transition-colors group-hover:bg-[var(--workspace-brand-foreground)] group-hover:text-white">
                        <Icon name="arrow-right" size={20} />
                      </span>
                    </span>
                  </div>
                </PreviewLink>
              ))}
            </div>
            {!visible.length && (
              <div className="rounded-3xl border border-[var(--workspace-brand-line)] bg-white p-8">
                <h2 className="text-xl font-semibold">{labels.empty}</h2>
                <p
                  className={`mt-3 max-w-xl text-sm leading-7 ${styles.muted}`}
                >
                  {labels["empty-help"]}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setGroup("");
                  }}
                  className={`${kit.button} mt-5`}
                >
                  {labels.reset}
                </button>
              </div>
            )}
          </section>
          <section className="bg-[var(--workspace-brand-foreground)] text-white">
            <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 @3xl:px-8 @3xl:py-16 @4xl:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-[var(--workspace-brand-accent)]">
                  {labels["composition-eyebrow"]}
                </p>
                <h2 className={`mt-4 text-3xl leading-tight ${styles.display}`}>
                  {copy.composition.title}
                </h2>
                <p className="mt-5 text-base leading-8 text-[var(--workspace-brand-muted-on-primary)]">
                  {copy.composition.paragraphs[0]}
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 p-6">
                <h3 className="text-xl font-semibold leading-snug">
                  {copy.preparation.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                  {copy.preparation.paragraphs[0]}
                </p>
                <PreviewLink
                  href={labels["register-href"]}
                  resolveLink={resolveLink}
                  className={`${kit.button} mt-6`}
                >
                  {labels["prepare-action"]}
                  <Icon name="arrow-right" size={20} />
                </PreviewLink>
              </div>
            </div>
          </section>
        </main>
      )}
    </SiteShell>
  );
}
