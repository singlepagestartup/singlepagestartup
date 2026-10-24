import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Icon } from "../../../../../design/singlepage/interface-kit/primitives";

interface IActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "primary" | "secondary" | "quiet";
}
interface IAppHeaderProps {
  title: string;
  brand: "start" | "community" | "courses" | "journal";
  children?: ReactNode;
}
interface ITabsProps {
  items: string[];
  active: number;
  onChange: (index: number) => void;
  label: string;
}

interface IScreenProps {
  screenKey: string;
  children: ReactNode;
}

export function Screen({ screenKey, children }: IScreenProps) {
  const element = useRef<HTMLDivElement>(null);
  const previous = useRef(screenKey);
  useEffect(() => {
    if (previous.current === screenKey) return;
    previous.current = screenKey;
    element.current?.focus({ preventScroll: true });
    element.current?.closest("[data-example-scroll]")?.scrollTo({ top: 0 });
  }, [screenKey]);
  return (
    <div ref={element} tabIndex={-1} className="space-y-4 p-4 outline-none">
      {children}
    </div>
  );
}

export const ui = {
  focus:
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18232a]",
  input:
    "min-h-10 w-full min-w-0 rounded-xl border border-[#dce3e6] bg-white px-3 py-2 text-xs text-[#18232a] placeholder:text-[#71808a] focus:outline focus:outline-2 focus:outline-[#789d32]",
  muted: "text-[#61717c]",
  card: "rounded-2xl border border-[#e3e8eb] bg-white p-4",
};

export function Action({
  tone = "primary",
  className = "",
  type = "button",
  ...props
}: IActionProps) {
  const colors =
    tone === "primary"
      ? "bg-[#bfef61] text-[#18232a] hover:bg-[#b2e352]"
      : tone === "secondary"
        ? "border border-[#dce3e6] bg-white text-[#18232a] hover:bg-[#f1f4f5]"
        : "text-[#42555e] hover:bg-[#edf1f3]";
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${colors} ${ui.focus} ${className}`}
    />
  );
}

/** Generated wordmarks are independent fictional example identities. */
export function BrandMark({
  brand,
  title,
}: {
  brand: IAppHeaderProps["brand"];
  title: string;
}) {
  const asset = {
    start: "firstship",
    community: "buildfolk",
    courses: "lessonloop",
    journal: "signalnote",
  }[brand];
  return (
    <img
      src={`/workspace-assets/singlepage/generated/framework-example-brands-v1/${asset}.png`}
      alt={title}
      data-asset-id={`singlepage-generated-framework-example-${asset}`}
      className="h-auto w-36 max-w-full object-contain"
    />
  );
}

export function AppHeader({ title, brand, children }: IAppHeaderProps) {
  return (
    <header className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-[#e3e8eb] bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <BrandMark brand={brand} title={title} />
      </div>
      {children}
    </header>
  );
}

export function Tabs({ items, active, onChange, label }: ITabsProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap gap-1 rounded-xl bg-[#edf1f3] p-1"
    >
      {items.map((item, index) => (
        <button
          key={item}
          type="button"
          aria-pressed={active === index}
          onClick={() => onChange(index)}
          className={`min-h-10 min-w-0 flex-1 rounded-lg px-2 py-2 text-[11px] font-medium ${ui.focus} ${active === index ? "bg-white text-[#18232a] shadow-sm" : "text-[#61717c] hover:bg-white/60"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2db] text-[10px] font-semibold text-[#365526]"
    >
      {name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}

export function Back({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Action tone="quiet" onClick={onClick}>
      <Icon name="arrow-left" size={20} />
      {children}
    </Action>
  );
}

export function CourseArt({
  title,
  compact = false,
  brand = "courses",
}: {
  title: string;
  compact?: boolean;
  brand?: "start" | "courses";
}) {
  return (
    <div
      className={`relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl ${brand === "start" ? "bg-[#e9e2ff] text-[#39216b]" : "bg-[#ffeadb] text-[#723516]"} ${compact ? "min-h-24 p-4" : "min-h-36 p-5"}`}
    >
      <div className="max-w-28">
        <BrandMark
          brand={brand}
          title={brand === "start" ? "Firstship" : "Lessonloop"}
        />
      </div>
      <p
        className={`mt-6 max-w-52 font-semibold leading-tight ${compact ? "text-base" : "text-2xl"}`}
      >
        {title}
      </p>
    </div>
  );
}
