import { Component as WebsiteBuilderModuleButton } from "../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useState,
} from "react";
import type { HostModel } from "./state/index";
import { HOST_STUDIO_MODELS } from "./state/constants";
import { useHostStudio } from "./Context";
import { HostModelList } from "./Model";
import { HostRecordPreview } from "./Preview";
export interface IHostWorkbenchProps {
  variant?: string;
}
export function HostWorkbench({
  variant = "composition",
}: IHostWorkbenchProps = {}) {
  const { state } = useHostStudio();
  const [view, setView] = useState<HostModel | "preview">("page");
  const [pageId, setPageId] = useState(state.models.page[0]?.id ?? "");
  return (
    <div
      className="grid min-w-0 gap-5"
      data-ds-block="host.page.composition"
      data-ds-layer="singlepage"
      data-module="host"
      data-model="page"
      data-variant={variant}
    >
      <header className={kit.card}>
        <h1 className="text-2xl font-semibold">Host composition</h1>
        <p className={`mt-2 text-sm ${kit.muted}`}>
          Models and page preview use local examples. Changes reset on reload.
        </p>
        <nav
          aria-label="Host views"
          className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap [&>button]:shrink-0"
        >
          {[...HOST_STUDIO_MODELS, "preview" as const].map((item) => (
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
            <p className={`text-sm ${kit.muted}`}>
              Create or select a page to preview its composition.
            </p>
          )}
        </div>
      ) : (
        <HostModelList key={view} model={view} />
      )}
    </div>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
  card: "min-w-0 rounded-2xl border border-border bg-card p-5",
  muted: "text-muted-foreground",
  label: "text-sm font-semibold text-foreground",
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
