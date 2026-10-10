import { createContext, useContext, type ReactNode } from "react";
import type { IProjectDesignInterface } from "./ProjectDesign";

const InterfaceGuidanceContext = createContext<IProjectDesignInterface | null>(
  null,
);

export interface IInterfaceGuidanceProviderProps {
  guidance: IProjectDesignInterface;
  children: ReactNode;
}

export function InterfaceGuidanceProvider({
  guidance,
  children,
}: IInterfaceGuidanceProviderProps) {
  return (
    <InterfaceGuidanceContext.Provider value={guidance}>
      {children}
    </InterfaceGuidanceContext.Provider>
  );
}

export function InterfaceRules() {
  const guidance = useContext(InterfaceGuidanceContext);
  if (!guidance) return null;
  return (
    <section className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 sm:p-6 md:p-8">
      <h3 className="text-base font-semibold">Interface rules</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--workspace-brand-muted)]">
        {guidance.intro}
      </p>
      <details className="mt-4 border-t border-[var(--workspace-brand-line)] pt-4 text-sm leading-6">
        <summary className="w-fit cursor-pointer rounded-md font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]">
          Shape, spacing and interaction states
        </summary>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Surface, density, and shape",
              rules: guidance.shapeRules,
            },
            {
              title: "Controls, states, and actions",
              rules: guidance.stateRules,
            },
          ].map(({ title, rules }) => (
            <div key={title}>
              <h4 className="font-semibold">{title}</h4>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-[var(--workspace-brand-muted)]">
                {rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

export interface ISurfacePatternGuidanceProps {
  title: string;
  context?: string;
}

export function SurfacePatternGuidance({
  title,
  context,
}: ISurfacePatternGuidanceProps) {
  const guidance = useContext(InterfaceGuidanceContext);
  const pattern = guidance?.patterns.find((item) => item.title === title);
  if (!pattern) return null;
  return (
    <aside
      className="mt-4 border-l-2 border-[var(--workspace-brand-accent)] pl-4 text-sm leading-6"
      data-pattern-guidance={title}
    >
      <p className="font-semibold">{pattern.title}</p>
      {context ? (
        <p className="mt-1 text-[var(--workspace-brand-muted)]">{context}</p>
      ) : null}
      <p className="mt-1 text-[var(--workspace-brand-muted)]">
        {pattern.decision}
      </p>
      <p className="mt-2 text-[var(--workspace-brand-muted)]">
        <span className="font-medium text-[var(--workspace-brand-foreground)]">
          Avoid:{" "}
        </span>
        {pattern.avoid}
      </p>
      {pattern.references.length ? (
        <details className="mt-2 text-xs leading-5 text-[var(--workspace-brand-muted)]">
          <summary className="w-fit cursor-pointer rounded-md font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]">
            Reference sources
          </summary>
          <ul className="mt-2 space-y-1 break-words">
            {pattern.references.map((reference) => (
              <li key={reference}>{reference}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </aside>
  );
}
