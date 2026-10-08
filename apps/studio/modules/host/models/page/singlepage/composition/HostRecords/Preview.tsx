import { useState, type ReactNode } from "react";
import {
  composeHostPage,
  hostRecordLabel,
  sortHostLinks,
  type HostModel,
  type HostRelation,
} from "../../../../../../../workspace/utils/host-studio/index";
import {
  HOST_STUDIO_MODELS,
  HOST_STUDIO_RELATIONS,
} from "../../../../../../../workspace/utils/host-studio/constants";
import { HostWidgetsToExternalWidgets } from "../../../../../relations/widgets-to-external-widgets/singlepage/default/Component";
import {
  Button,
  kit,
} from "../../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { useHostStudio } from "./Context";
import { HostModelList } from "./Model";
import { HostRelationManager } from "./Relations";

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
    const composition = composeHostPage(state, id);
    if (!composition) return null;
    return (
      <div
        className="grid min-w-0 gap-5"
        data-ds-block="host.page.default"
        data-page-id={id}
      >
        <header className={kit.card}>
          <p className={`text-sm ${kit.muted}`}>
            {composition.page.url} · {composition.page.language}
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {composition.page.title}
          </h2>
          <p className={`mt-2 text-sm ${kit.muted}`}>
            {composition.page.description}
          </p>
        </header>
        {composition.metadata.map(({ link, metadata }) => (
          <div key={link.id} data-relation-id={link.id}>
            <HostRecordPreview model="metadata" id={metadata.id} />
          </div>
        ))}
        {!composition.metadata.length && (
          <Empty>No metadata linked to this page.</Empty>
        )}
        {composition.layouts.map(({ link, layout, before, after }) => (
          <section
            key={link.id}
            className={`${kit.card} grid gap-5`}
            data-relation-id={link.id}
            data-layout-id={layout.id}
          >
            <p className={`text-xs ${kit.muted}`}>
              Layout: {hostRecordLabel(layout)}
            </p>
            {before.map((item) => (
              <div key={item.id} data-slot="default" data-relation-id={item.id}>
                <HostRecordPreview
                  model="widget"
                  id={item.widgetId}
                  language={composition.page.language}
                />
              </div>
            ))}
            <div className="grid gap-5" data-slot="page">
              {composition.widgets.map((item) => (
                <div key={item.id} data-relation-id={item.id}>
                  <HostRecordPreview
                    model="widget"
                    id={item.widgetId}
                    language={composition.page.language}
                  />
                </div>
              ))}
              {!composition.widgets.length && (
                <Empty>No page widgets linked.</Empty>
              )}
            </div>
            {after.map((item) => (
              <div
                key={item.id}
                data-slot="additional"
                data-relation-id={item.id}
              >
                <HostRecordPreview
                  model="widget"
                  id={item.widgetId}
                  language={composition.page.language}
                />
              </div>
            ))}
          </section>
        ))}
        {!composition.layouts.length && (
          <Empty>
            No default layout linked. The runtime Page renders its widgets
            inside a linked Layout.
          </Empty>
        )}
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
    const links = sortHostLinks(
      state.relations["layouts-to-widgets"].filter(
        (item) => item.layoutId === id,
      ),
    );
    return (
      <section
        className={`${kit.card} grid gap-5`}
        data-ds-block="host.layout.default"
      >
        <h3 className="font-semibold">{hostRecordLabel(record)}</h3>
        {links
          .filter((item) => item.variant === "default")
          .map((item) => (
            <HostRecordPreview
              key={item.id}
              model="widget"
              id={item.widgetId}
              language={language}
            />
          ))}
        {children ?? <Empty>Page content slot</Empty>}
        {links
          .filter((item) => item.variant === "additional")
          .map((item) => (
            <HostRecordPreview
              key={item.id}
              model="widget"
              id={item.widgetId}
              language={language}
            />
          ))}
      </section>
    );
  }
  if (model === "widget" && "subtitle" in record) {
    const links = sortHostLinks(
      state.relations["widgets-to-external-widgets"].filter(
        (item) => item.widgetId === id && item.variant === "default",
      ),
    );
    return (
      <section
        className={`${kit.card} grid min-w-0 gap-4`}
        data-ds-block="host.widget.default"
        data-widget-id={id}
      >
        <div>
          <p className={`text-xs ${kit.muted}`}>
            {record.adminTitle} · {record.slug}
          </p>
          <h3 className="mt-2 text-lg font-semibold">
            {record.title?.[language] || record.adminTitle}
          </h3>
          {record.subtitle?.[language] && (
            <p className="mt-1 text-sm">{record.subtitle[language]}</p>
          )}
          {record.description?.[language] && (
            <p className={`mt-2 whitespace-pre-wrap text-sm ${kit.muted}`}>
              {record.description[language]}
            </p>
          )}
        </div>
        {links.map((link) => (
          <div key={link.id} data-relation-id={link.id}>
            {link.externalModule === "blog" &&
            link.externalWidgetId === "preview-blog-overview-widget" ? (
              <HostWidgetsToExternalWidgets
                link={{
                  ...link,
                  className: link.className ?? undefined,
                  externalModule: "blog",
                  variant: "article-overview-default",
                }}
              />
            ) : link.externalModule === "ecommerce" &&
              link.externalWidgetId === "preview-ecommerce-overview-widget" ? (
              <HostWidgetsToExternalWidgets
                link={{
                  ...link,
                  className: link.className ?? undefined,
                  externalModule: "ecommerce",
                  variant: "product-overview-default",
                }}
              />
            ) : (
              <Empty>
                Studio renderer unavailable: {link.externalModule} /{" "}
                {link.externalWidgetId}. The link is retained.
              </Empty>
            )}
          </div>
        ))}
        {!links.length && <Empty>No external widgets linked.</Empty>}
      </section>
    );
  }
  return <Empty>Preview unavailable for {model}.</Empty>;
}
export function HostWorkbench() {
  const { state } = useHostStudio();
  const [view, setView] = useState<HostModel | HostRelation | "preview">(
    "page",
  );
  const [pageId, setPageId] = useState(state.models.page[0]?.id ?? "");
  return (
    <div
      className="grid min-w-0 gap-5"
      data-ds-block="host.page.composition"
      data-ds-layer="singlepage"
    >
      <header className={kit.card}>
        <h1 className="text-2xl font-semibold">Host composition</h1>
        <p className={`mt-2 text-sm ${kit.muted}`}>
          Models, links and page preview share local data. Changes reset on
          reload.
        </p>
        <nav
          aria-label="Host views"
          className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap [&>button]:shrink-0"
        >
          {[
            ...HOST_STUDIO_MODELS,
            ...(Object.keys(HOST_STUDIO_RELATIONS) as HostRelation[]),
            "preview" as const,
          ].map((item) => (
            <Button
              key={item}
              variant={view === item ? "primary" : "secondary"}
              aria-pressed={view === item}
              onClick={() => setView(item)}
            >
              {item}
            </Button>
          ))}
        </nav>
      </header>
      {view === "preview" ? (
        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className={kit.label}>Preview page</span>
            <select
              className={kit.field}
              value={
                state.models.page.some((item) => item.id === pageId)
                  ? pageId
                  : ""
              }
              onChange={(event) => setPageId(event.target.value)}
            >
              <option value="">Select page</option>
              {state.models.page.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.adminTitle}
                </option>
              ))}
            </select>
          </label>
          {pageId && state.models.page.some((item) => item.id === pageId) ? (
            <HostRecordPreview model="page" id={pageId} />
          ) : (
            <Empty>Create or select a page to preview its composition.</Empty>
          )}
        </div>
      ) : HOST_STUDIO_MODELS.includes(view as HostModel) ? (
        <HostModelList key={view} model={view as HostModel} />
      ) : (
        <HostRelationManager key={view} relation={view as HostRelation} />
      )}
    </div>
  );
}
