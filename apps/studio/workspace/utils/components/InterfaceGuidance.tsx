import { localizedHeading } from "../../../../../tools/studio/workspace/headings";
import { createContext, useContext, type ReactNode } from "react";
import { DesignNotes, type IProjectDesignInterface } from "./ProjectDesign";

const InterfaceGuidanceContext = createContext<
  (IProjectDesignInterface & { iconRules?: string }) | null
>(null);

export interface IInterfaceGuidanceProviderProps {
  guidance: IProjectDesignInterface;
  iconRules?: string;
  children: ReactNode;
}

export function InterfaceGuidanceProvider({
  guidance,
  iconRules,
  children,
}: IInterfaceGuidanceProviderProps) {
  return (
    <InterfaceGuidanceContext.Provider value={{ ...guidance, iconRules }}>
      {children}
    </InterfaceGuidanceContext.Provider>
  );
}

export function IconRules() {
  const guidance = useContext(InterfaceGuidanceContext);
  return <DesignNotes markdown={guidance?.iconRules} section="icons" />;
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
      <p className="font-semibold">{localizedHeading(pattern.title)}</p>
      {context ? (
        <p className="mt-1 text-[var(--workspace-brand-muted)]">{context}</p>
      ) : null}
      <p className="mt-1 text-[var(--workspace-brand-muted)]">
        {pattern.decision}
      </p>
      <p className="mt-2 text-[var(--workspace-brand-muted)]">
        <span className="font-medium text-[var(--workspace-brand-foreground)]">
          Избегать:{" "}
        </span>
        {pattern.avoid}
      </p>
      {pattern.references.length ? (
        <details className="mt-2 text-xs leading-5 text-[var(--workspace-brand-muted)]">
          <summary className="w-fit cursor-pointer rounded-md font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]">
            Источники референсов
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
