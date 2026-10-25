import { useState } from "react";
import type { IWorkspacePageProps } from "../../../../../utils/pages";
import {
  Icon,
  kit,
} from "../../../../../design/singlepage/interface-kit/primitives";
import { PreviewLink, siteStyles as styles } from "../Site";
import type { IFrameworkModule, IBusinessModuleGuide } from "./content";
import ModuleVisual from "./ModuleVisual";
import Scenario from "./Scenario";

interface IBusinessGuideProps {
  module: IFrameworkModule;
  guide: IBusinessModuleGuide;
  modules: IFrameworkModule[];
  labels: Record<string, string>;
  resolveLink?: IWorkspacePageProps["resolveLink"];
}

const section = "mx-auto max-w-7xl px-5 py-12 @3xl:px-8 @3xl:py-16";
const heading = `text-balance text-3xl leading-tight @3xl:text-4xl ${styles.display}`;
const eyebrow = "text-xs font-medium uppercase tracking-widest";

export default function BusinessGuide({
  module,
  guide,
  modules,
  labels,
  resolveLink,
}: IBusinessGuideProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const scene = guide.scenes[sceneIndex] ?? guide.scenes[0];
  const copyTask = async () => {
    try {
      await navigator.clipboard.writeText(guide.task.paragraphs[0]);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };
  return (
    <main id={`module-guide-${module.id}`}>
      <section className="bg-white" aria-labelledby="module-title">
        <div
          className={`${section} grid items-center gap-8 @4xl:grid-cols-[1.2fr_1fr]`}
        >
          <div className="min-w-0">
            <p className={`${eyebrow} ${styles.muted}`}>{module.group}</p>
            <h1
              id="module-title"
              className={`mt-4 text-balance text-4xl leading-[1.12] @3xl:text-5xl ${styles.display}`}
            >
              {guide.article.title}
            </h1>
            <p className={`mt-6 max-w-2xl text-base leading-8 ${styles.muted}`}>
              {guide.article.paragraphs[0]}
            </p>
            <p className={`mt-5 text-xs ${styles.muted}`}>
              {labels["technical-name"]} {module.name}
            </p>
            <PreviewLink
              href={labels["register-href"]}
              resolveLink={resolveLink}
              className={`${kit.button} mt-7`}
            >
              {labels["prepare-action"]}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          </div>
          <div className="min-w-0 overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)]">
            <ModuleVisual moduleId={module.id} scene={guide.scenes[0]} />
          </div>
        </div>
      </section>
      <section
        className={`${section} grid gap-5 @4xl:grid-cols-[0.65fr_1.35fr]`}
        aria-labelledby="module-need"
      >
        <h2 id="module-need" className={heading}>
          {labels.need}
        </h2>
        <p className={`max-w-3xl text-base leading-8 ${styles.muted}`}>
          {guide.article.paragraphs[1]}
        </p>
      </section>
      <section
        className="bg-[var(--workspace-brand-foreground)] text-[var(--workspace-brand-on-primary)]"
        aria-labelledby="module-example"
      >
        <div className={section}>
          <p className={`${eyebrow} text-[var(--workspace-brand-accent)]`}>
            {labels.example}
          </p>
          <h2 id="module-example" className={`${heading} mt-4 max-w-3xl`}>
            {guide.example.title}
          </h2>
          <div className="mt-8 grid items-start gap-8 @4xl:grid-cols-[0.9fr_1.1fr]">
            <div className="min-w-0">
              <p className="text-base leading-8 text-[var(--workspace-brand-muted-on-primary)]">
                {guide.example.paragraphs[0]}
              </p>
              <div
                role="group"
                aria-label={labels["scene-label"]}
                className="mt-7 flex flex-wrap gap-2"
              >
                {guide.scenes.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    aria-pressed={index === sceneIndex}
                    aria-controls="module-scene"
                    onClick={() => setSceneIndex(index)}
                    className={`min-h-11 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--workspace-brand-accent)] ${index === sceneIndex ? "border-[var(--workspace-brand-accent)] bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]" : "border-white/25 hover:bg-white/10"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-6 text-xs leading-6 text-[var(--workspace-brand-muted-on-primary)]">
                {labels["example-note"]}
              </p>
            </div>
            <div
              id="module-scene"
              aria-live="polite"
              aria-atomic="true"
              className="min-w-0"
            >
              {scene && <Scenario moduleId={module.id} scene={scene} />}
            </div>
          </div>
        </div>
      </section>
      <section className={section} aria-labelledby="module-possibilities">
        <h2 id="module-possibilities" className={`${heading} max-w-3xl`}>
          {labels.possibilities}
        </h2>
        <div className="mt-8 grid gap-7 @3xl:grid-cols-2 @5xl:grid-cols-3">
          {guide.article.items.map((item, index) => (
            <div
              key={item.title}
              className="border-t border-[var(--workspace-brand-line)] pt-5"
            >
              <span className={`text-sm ${styles.muted}`}>0{index + 1}</span>
              <h3 className="mt-3 text-xl font-semibold leading-snug">
                {item.title}
              </h3>
              <p className={`mt-3 text-sm leading-7 ${styles.muted}`}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
        <p
          className={`mt-9 max-w-4xl border-l-2 border-[var(--workspace-brand-accent)] pl-5 text-sm leading-7 ${styles.muted}`}
        >
          {guide.example.paragraphs[1]}
        </p>
      </section>
      <section
        className="border-y border-[var(--workspace-brand-line)] bg-white"
        aria-labelledby="module-related"
      >
        <div className={section}>
          <h2 id="module-related" className={`${heading} max-w-3xl`}>
            {labels.related}
          </h2>
          <div className="mt-8 grid gap-4 @3xl:grid-cols-2 @5xl:grid-cols-3">
            {guide.related.items.map((item) => {
              const related = modules.find((entry) => entry.id === item.title);
              if (!related) return null;
              return (
                <PreviewLink
                  key={related.id}
                  href={`/framework/modules/${related.id}`}
                  resolveLink={resolveLink}
                  className={`group flex min-w-0 flex-col rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] p-5 transition-colors hover:border-[var(--workspace-brand-foreground)] ${styles.focus}`}
                >
                  <p className={`text-xs ${styles.muted}`}>{related.name}</p>
                  <h3 className="mt-3 text-lg font-semibold">
                    {related.responsibility}
                  </h3>
                  <p
                    className={`mt-3 flex-1 text-sm leading-7 ${styles.muted}`}
                  >
                    {item.text}
                  </p>
                  <span className="mt-5 flex items-center justify-between text-sm font-medium">
                    {labels["explore-module"]}
                    <Icon name="arrow-right" size={20} />
                  </span>
                </PreviewLink>
              );
            })}
          </div>
          <details className="group mt-8 rounded-2xl border border-[var(--workspace-brand-line)] open:bg-[var(--workspace-brand-background)]">
            <summary
              className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 text-sm font-semibold [&::-webkit-details-marker]:hidden ${styles.focus}`}
            >
              {labels.technical}
              <span className="rounded-full bg-[var(--workspace-brand-accent)] p-2 group-open:rotate-45">
                <Icon name="plus" size={20} />
              </span>
            </summary>
            <div className="space-y-4 px-5 pb-6 text-sm leading-7">
              <p>
                {labels["technical-intro"].replaceAll("{module}", module.name)}
              </p>
              <p className={styles.muted}>{guide.technical.paragraphs[0]}</p>
              <a
                href={`https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/${module.id}/README.md`}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex min-h-11 items-center gap-2 rounded-md underline underline-offset-4 ${styles.focus}`}
              >
                {labels["source-guide"].replaceAll("{module}", module.name)}
                <span className="sr-only"> (откроется в новой вкладке)</span>
              </a>
            </div>
          </details>
        </div>
      </section>
      <section
        className="bg-[var(--workspace-brand-accent)]"
        aria-labelledby="module-start"
      >
        <div className={`${section} grid items-start gap-8 @4xl:grid-cols-2`}>
          <div>
            <h2 id="module-start" className={heading}>
              {labels["start-title"]}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7">
              {labels["start-text"]}
            </p>
            <PreviewLink
              href={labels["register-href"]}
              resolveLink={resolveLink}
              className={`mt-6 inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-[var(--workspace-brand-foreground)] px-5 py-3 text-sm font-semibold text-white ${styles.focus}`}
            >
              {labels["prepare-action"]}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          </div>
          <div className="rounded-2xl bg-white p-6">
            <p className="text-base leading-8">{guide.task.paragraphs[0]}</p>
            <button
              type="button"
              onClick={copyTask}
              className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm underline underline-offset-4 ${styles.focus}`}
            >
              {labels.copy}
            </button>
            <p role="status" className="text-xs leading-6">
              {copyState === "copied"
                ? labels.copied
                : copyState === "error"
                  ? labels["copy-error"]
                  : ""}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
