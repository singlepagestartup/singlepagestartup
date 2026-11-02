import { Component as WebsiteBuilderModuleButton } from "../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  type ReactNode,
} from "react";
import { hostRecordLabel, type HostModel } from "./state/index";
import { Component as BlogModuleWidget } from "../../../../../blog/widget/index";
import { useHostStudio } from "./Context";
export interface IHostRecordPreviewProps {
  variant?: string;
  model: HostModel;
  id: string;
  language?: string;
  children?: ReactNode;
}
function Empty({
  model,
  variant,
  children,
}: {
  model: HostModel;
  variant?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={`rounded-xl border border-dashed border-border p-5 text-sm ${kit.muted}`}
      data-module="host"
      data-model={model}
      data-variant={variant}
    >
      {children}
    </p>
  );
}
export function HostRecordPreview({
  variant = "default",
  model,
  id,
  language = "en",
  children,
}: IHostRecordPreviewProps) {
  const { state } = useHostStudio();
  const record = state.models[model].find((item) => item.id === id);
  if (!record)
    return (
      <Empty model={model} variant={variant}>
        Missing {model}: {id}
      </Empty>
    );
  if (model === "page") {
    return (
      <div
        className="grid min-w-0 gap-5"
        data-ds-block="host.page.default"
        data-page-id={id}
        data-module="host"
        data-model={model}
        data-variant={variant}
      >
        <header className={kit.card}>
          <h2 className="text-xl font-semibold">{hostRecordLabel(record)}</h2>
          {"url" in record && (
            <p className={`mt-2 text-sm ${kit.muted}`}>
              {record.url} · {record.language}
            </p>
          )}
        </header>
        {state.models.metadata.map((metadata) => (
          <HostRecordPreview
            key={metadata.id}
            model="metadata"
            id={metadata.id}
          />
        ))}
        {state.models.layout.map((layout) => (
          <HostRecordPreview
            key={layout.id}
            model="layout"
            id={layout.id}
            language={language}
          />
        ))}
      </div>
    );
  }
  if (model === "metadata" && "opengraphTitle" in record)
    return (
      <section
        className={kit.card}
        data-ds-block="host.metadata.default"
        data-module="host"
        data-model={model}
        data-variant={variant}
      >
        <h3 className="font-semibold">Metadata preview</h3>
        <p className={`mt-1 text-xs ${kit.muted}`}>
          SEO and social fields stay inside this canvas.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className={`text-xs ${kit.muted}`}>Search result</p>
            <p className="mt-2 text-lg font-semibold">{record.title}</p>
            <p className="mt-1 text-sm">
              {record.description || "No description"}
            </p>
          </div>
          <div>
            <p className={`text-xs ${kit.muted}`}>Open Graph</p>
            <p className="mt-2 font-semibold">
              {record.opengraphTitle || "No Open Graph title"}
            </p>
            <p className="mt-1 text-sm">
              {record.opengraphDescription || "No Open Graph description"}
            </p>
            <p className={`mt-1 break-all text-xs ${kit.muted}`}>
              {record.opengraphUrl}
            </p>
          </div>
          <div>
            <p className={`text-xs ${kit.muted}`}>Twitter</p>
            <p className="mt-2 font-semibold">
              {record.twitterTitle || "No Twitter title"}
            </p>
            <p className="mt-1 text-sm">
              {record.twitterDescription || "No Twitter description"}
            </p>
          </div>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm">
            All metadata fields
          </summary>
          <dl className="mt-3 grid gap-2">
            {Object.entries(record)
              .filter(([key]) => !["createdAt", "updatedAt"].includes(key))
              .map(([key, value]) => (
                <div
                  key={key}
                  className="grid min-w-0 grid-cols-1 gap-1 text-xs sm:grid-cols-2"
                >
                  <dt className={kit.muted}>{key}</dt>
                  <dd className="break-all">{String(value ?? "—")}</dd>
                </div>
              ))}
          </dl>
        </details>
      </section>
    );
  if (model === "layout") {
    return (
      <section
        className={`${kit.card} grid gap-5`}
        data-ds-block="host.layout.default"
        data-module="host"
        data-model={model}
        data-variant={variant}
      >
        <h3 className="font-semibold">{hostRecordLabel(record)}</h3>
        {children ??
          state.models.widget.map((widget) => (
            <HostRecordPreview
              key={widget.id}
              model="widget"
              id={widget.id}
              language={language}
            />
          ))}
      </section>
    );
  }
  if (model === "widget" && "subtitle" in record) {
    return (
      <section
        className={`${kit.card} grid min-w-0 gap-4`}
        data-ds-block="host.widget.default"
        data-widget-id={id}
        data-module="host"
        data-model={model}
        data-variant={variant}
      >
        <h3 className="text-lg font-semibold">
          {record.title?.[language] || record.adminTitle}
        </h3>
        {record.description?.[language] && (
          <p className={`text-sm ${kit.muted}`}>
            {record.description[language]}
          </p>
        )}
        <BlogModuleWidget variant="article-overview-default" />
      </section>
    );
  }
  return (
    <Empty model={model} variant={variant}>
      Preview unavailable for {model}.
    </Empty>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  card: "min-w-0 rounded-2xl border border-border bg-card p-5",
  muted: "text-muted-foreground",
};
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
