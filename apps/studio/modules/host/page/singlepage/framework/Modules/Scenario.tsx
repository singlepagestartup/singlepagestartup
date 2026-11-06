import { Icon, type IconName } from "../primitives";
import type { IModuleScene } from "./content";

interface IScenarioProps {
  moduleId: string;
  scene: IModuleScene;
  compact?: boolean;
}

/** Authored Product specimens. No runtime account, payment or data operations. */
export default function Scenario({
  moduleId,
  scene,
  compact = false,
}: IScenarioProps) {
  const icon: IconName =
    moduleId === "file-storage"
      ? "file-text"
      : moduleId === "notification"
        ? "envelope"
        : moduleId === "broadcast"
          ? "chat-circle"
          : moduleId === "agent"
            ? "clock"
            : moduleId === "billing"
              ? "credit-card"
              : moduleId === "ecommerce"
                ? "package"
                : moduleId === "rbac"
                  ? "user-circle"
                  : "check";
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] ${compact ? "p-3" : "p-5 @3xl:p-7"}`}
    >
      <div
        className="mb-5 flex items-center gap-1.5 border-b border-[hsl(var(--border))] pb-3"
        aria-hidden="true"
      >
        <span className="size-1.5 rounded-full bg-[hsl(var(--primary))]" />
        <span className="size-1.5 rounded-full bg-[#ccd3d7]" />
        <span className="size-1.5 rounded-full bg-[#ccd3d7]" />
        <span className="ml-auto h-1.5 w-12 rounded-full bg-[#e9edf0]" />
      </div>
      <div
        className={
          moduleId === "website-builder" || moduleId === "startup"
            ? "rounded-xl bg-[hsl(var(--primary))] p-5"
            : ""
        }
      >
        <p
          className={`${compact ? "text-xs" : "text-xl @3xl:text-2xl"} font-semibold leading-snug`}
        >
          {scene.title}
        </p>
        {!compact && (
          <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {scene.description}
          </p>
        )}
      </div>
      {moduleId === "analytic" ? (
        <div className={`${compact ? "mt-3 space-y-3" : "mt-7 space-y-6"}`}>
          {scene.rows.map((row) => {
            const value = Number(row.split(":").at(-1)?.trim()) || 0;
            return (
              <div key={row}>
                <p
                  className={`${compact ? "text-[10px]" : "text-sm"} mb-2 font-medium`}
                >
                  {row}
                </p>
                <progress
                  value={value}
                  max={Math.max(
                    1,
                    ...scene.rows.map(
                      (entry) => Number(entry.split(":").at(-1)?.trim()) || 0,
                    ),
                  )}
                  aria-label={row}
                  className="block h-5 w-full overflow-hidden rounded-md border-0 bg-[#edf1f3] [&::-webkit-progress-bar]:bg-[#edf1f3] [&::-webkit-progress-value]:rounded-md [&::-webkit-progress-value]:bg-[hsl(var(--primary))] [&::-moz-progress-bar]:bg-[hsl(var(--primary))]"
                />
              </div>
            );
          })}
        </div>
      ) : moduleId === "knowledge" ? (
        <ul className="mt-6 space-y-4 rounded-2xl bg-[#eef2e6] p-5">
          {scene.rows.map((row) => (
            <li key={row} className="flex items-start gap-3 text-sm leading-6">
              <span className="mt-0.5 shrink-0">
                <Icon name="file-text" size={20} />
              </span>
              {row}
            </li>
          ))}
        </ul>
      ) : moduleId === "file-storage" ? (
        <div
          className={`mt-4 grid gap-2 ${compact ? "grid-cols-1" : "@2xl:grid-cols-2"}`}
        >
          {scene.rows.map((row, i) => (
            <div
              key={row}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-[hsl(var(--border))] p-3"
            >
              <span className="rounded-lg bg-[#eef2e6] p-2">
                <Icon name={i === 2 ? "file-text" : "image"} size={24} />
              </span>
              <span
                className={`${compact ? "text-[10px]" : "text-xs"} break-words font-medium`}
              >
                {row}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${compact ? "mt-3 space-y-2" : "mt-6 space-y-3"}`}>
          {scene.rows.map((row, i) => (
            <div
              key={row}
              className={`flex min-w-0 items-start gap-3 rounded-xl ${compact ? "p-2 text-[10px]" : "p-4 text-sm leading-6"} ${(moduleId === "rbac" && i === 0) || (moduleId === "billing" && i === scene.rows.length - 1) ? "bg-[#eef2e6]" : "bg-[#f4f6f8]"}`}
            >
              <span className="shrink-0 text-[hsl(var(--foreground))]">
                <Icon
                  name={
                    moduleId === "host"
                      ? "globe"
                      : moduleId === "blog"
                        ? "file-text"
                        : icon
                  }
                  size={20}
                />
              </span>
              <span className="min-w-0 break-words">{row}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
