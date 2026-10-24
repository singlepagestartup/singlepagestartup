import { useState } from "react";
import type { IWorkspacePageProps } from "../../../../../utils/pages";
import {
  Icon,
  kit,
} from "../../../../../design/singlepage/interface-kit/primitives";
import { SiteShell, PreviewLink, siteStyles as styles } from "../Site";
import { parseModules, parseModulesPage, readModuleSlug } from "./content";
import sourceText from "./page.md?raw";

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
  const copy = parseModulesPage(text ?? sourceText);
  const labels = copy.labels;
  const modules = parseModules(text ?? sourceText);
  const slug = readModuleSlug(navigationHref) ?? defaultSlug;
  const selected = modules.find((item) => item.id === slug);
  return (
    <SiteShell active="modules" resolveLink={resolveLink}>
      <main className="mx-auto max-w-7xl px-5 py-10 @3xl:px-8 @3xl:py-14">
        <PreviewLink
          href="/framework"
          resolveLink={resolveLink}
          className={`inline-flex min-h-11 items-center gap-2 rounded-md text-sm ${styles.focus}`}
        >
          <Icon name="arrow-left" size={20} />
          {labels["back-framework"]}
        </PreviewLink>
        {slug ? (
          selected ? (
            <article className="mt-8 max-w-4xl">
              <p className={`text-sm ${styles.muted}`}>
                {selected.group} / {selected.name}
              </p>
              <h1 className={`mt-4 text-4xl @3xl:text-5xl ${styles.display}`}>
                {copy.guide.title.replaceAll("{module}", selected.name)}
              </h1>
              <p className={`mt-6 max-w-2xl text-lg leading-8 ${styles.muted}`}>
                {selected.responsibility}
              </p>
              <div className="mt-8 grid gap-6 @3xl:grid-cols-2">
                {copy.guide.items.map((item) => (
                  <section
                    key={item.title}
                    className="rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-6"
                  >
                    <h2 className="text-xl font-semibold">
                      {item.title.replaceAll("{module}", selected.name)}
                    </h2>
                    <p className={`mt-3 text-sm leading-7 ${styles.muted}`}>
                      {item.text.replaceAll("{module}", selected.name)}
                    </p>
                  </section>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={`https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/${selected.id}/README.md`}
                  target="_blank"
                  rel="noreferrer"
                  className={kit.button}
                >
                  {labels["source-guide"].replaceAll("{module}", selected.name)}
                  <Icon name="arrow-up-right" size={20} />
                  <span className="sr-only"> (opens GitHub in a new tab)</span>
                </a>
                <PreviewLink
                  href="/framework/modules"
                  resolveLink={resolveLink}
                  className={kit.secondary}
                >
                  {labels["all-modules"]}
                </PreviewLink>
              </div>
            </article>
          ) : (
            <section className="py-16">
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
            </section>
          )
        ) : (
          <>
            <p className={`mt-8 text-sm ${styles.muted}`}>
              {copy.introduction.paragraphs[0]}
            </p>
            <h1
              className={`mt-4 max-w-3xl text-balance text-4xl leading-tight @3xl:text-5xl ${styles.display}`}
            >
              {copy.introduction.title}
            </h1>
            <p className={`mt-6 max-w-2xl text-lg leading-8 ${styles.muted}`}>
              {copy.introduction.paragraphs[1]}
            </p>
            <div
              role="group"
              aria-label="Module groups"
              className="mt-8 flex flex-wrap gap-2"
            >
              {["", ...new Set(modules.map((item) => item.group))].map(
                (name) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={name === group}
                    onClick={() => setGroup(name)}
                    className={`${name === group ? kit.button : kit.secondary}`}
                  >
                    {name || labels["all-modules"]}
                  </button>
                ),
              )}
            </div>
            <div className="mt-6 grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {modules
                .filter((item) => group === "" || item.group === group)
                .map((item) => (
                  <PreviewLink
                    key={item.id}
                    href={`/framework/modules/${item.id}`}
                    resolveLink={resolveLink}
                    className={`group flex min-w-0 flex-col rounded-2xl border border-[var(--workspace-brand-line)] bg-white p-6 hover:border-[var(--workspace-brand-foreground)] ${styles.focus}`}
                  >
                    <p className={`text-xs ${styles.muted}`}>{item.group}</p>
                    <h2 className={`mt-3 text-xl ${styles.display}`}>
                      {item.name}
                    </h2>
                    <p
                      className={`mt-3 flex-1 text-sm leading-7 ${styles.muted}`}
                    >
                      {item.responsibility}
                    </p>
                    <span className="mt-5 flex min-h-11 items-center gap-2 text-sm font-medium">
                      {labels["explore-module"]}
                      <Icon name="arrow-right" size={20} />
                    </span>
                  </PreviewLink>
                ))}
            </div>
            <section className="mt-10 rounded-3xl bg-[var(--workspace-brand-foreground)] p-6 text-[var(--workspace-brand-on-primary)] @3xl:p-8">
              <p className="text-sm text-[var(--workspace-brand-muted-on-primary)]">
                {labels["composition-eyebrow"]}
              </p>
              <h2 className={`mt-3 text-2xl ${styles.display}`}>
                {copy.composition.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                {copy.composition.paragraphs[0]}
              </p>
              <div className="mt-6 border-t border-white/20 pt-6">
                <h3 className="text-xl font-semibold">
                  {copy.preparation.title}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                  {copy.preparation.paragraphs[0]}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-4">
                <PreviewLink
                  href="/blog"
                  resolveLink={resolveLink}
                  className={kit.button}
                >
                  {labels["articles-action"]}
                  <Icon name="arrow-right" size={20} />
                </PreviewLink>
                <PreviewLink
                  href="/"
                  resolveLink={resolveLink}
                  className={`${kit.secondary} text-[var(--workspace-brand-foreground)]`}
                >
                  {labels["prepare-action"]}
                </PreviewLink>
              </div>
            </section>
          </>
        )}
      </main>
    </SiteShell>
  );
}
