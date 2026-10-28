import type { IComponentProps } from "./interface";
import { Component as Feature } from "../../../feature";

export function Component({
  id,
  appearance = "contained",
  eyebrow,
  title,
  steps,
  prompt,
  children,
}: IComponentProps) {
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={
        appearance === "full"
          ? "bg-default text-default-foreground outline-none"
          : "mx-auto w-full min-w-0 max-w-7xl px-5 py-12 outline-none @3xl:px-8 @3xl:py-16"
      }
      data-ds-block="website-builder.widget.content-steps"
      data-module="website-builder"
      data-model="widget"
      data-variant="content-steps"
    >
      <div
        className={
          appearance === "full"
            ? "mx-auto max-w-7xl px-5 py-14 @3xl:px-8 @3xl:py-20"
            : "rounded-3xl bg-default p-6 text-default-foreground @3xl:p-8 @5xl:p-10"
        }
      >
        {eyebrow ? (
          <p
            className={
              appearance === "full"
                ? "text-xs font-medium uppercase tracking-widest text-default-muted-foreground"
                : "text-sm font-medium text-default-muted-foreground"
            }
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={id ? `${id}-title` : undefined}
          className="mt-3 max-w-2xl text-balance font-default text-3xl font-semibold leading-[1.15] tracking-normal @4xl:text-4xl"
        >
          {title}
        </h2>
        <ol
          className={
            appearance === "full"
              ? "mt-10 grid gap-8 @3xl:grid-cols-3"
              : "mt-8 grid gap-6 @3xl:grid-cols-3"
          }
        >
          {children ??
            steps?.map((step, index) => (
              <Feature
                key={step.id}
                variant="step"
                title={step.title}
                subtitle={String(index + 1).padStart(2, "0")}
                description={step.description}
              />
            ))}
        </ol>
        {prompt ? <div className="mt-8">{prompt}</div> : null}
      </div>
    </section>
  );
}
