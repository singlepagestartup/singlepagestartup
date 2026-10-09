import { type ReactNode } from "react";
import {
  hostRecordLabel,
  type HostModel,
} from "../../../../../../../workspace/utils/host-studio/index";
import { Component as BlogModuleWidget } from "../../../../../../blog/models/widget/index";
import {
  Button,
  kit,
} from "../../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { useHostStudio } from "./Context";

export interface IHostRecordPreviewProps {
  model: HostModel;
  id: string;
  language?: string;
  children?: ReactNode;
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <p
      className={`rounded-xl border border-dashed border-[var(--workspace-brand-line)] p-5 text-sm ${kit.muted}`}
    >
      {children}
    </p>
  );
}
export function HostRecordPreview({
  model,
  id,
  language = "en",
  children,
}: IHostRecordPreviewProps) {
  const { state } = useHostStudio();
  const record = state.models[model].find((item) => item.id === id);
  if (!record)
    return (
      <Empty>
        Missing {model}: {id}
      </Empty>
    );
  if (model === "page") {
    return (
      <div
        className="grid min-w-0 gap-5"
        data-ds-block="host.page.default"
        data-page-id={id}
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
      <section className={kit.card} data-ds-block="host.metadata.default">
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
  return <Empty>Preview unavailable for {model}.</Empty>;
}
