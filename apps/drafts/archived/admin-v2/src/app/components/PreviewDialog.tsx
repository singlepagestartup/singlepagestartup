import React, { useState } from "react";
import { Record as DataRecord } from "../data";
import { Monitor, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useEscapeStack } from "../hooks/useEscapeStack";

const viewportPresets = {
  "2xl": { label: "2XL", width: 1536 },
  lg: { label: "LG", width: 1024 },
  xs: { label: "XS", width: 375 },
} as const;

type ViewportKey = keyof typeof viewportPresets;

interface PreviewDialogProps {
  record: DataRecord;
}

export function PreviewDialog({ record }: PreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [viewport, setViewport] = useState<ViewportKey>("lg");

  useEscapeStack(open, () => setOpen(false));

  const currentViewport = viewportPresets[viewport];

  const title =
    record.adminTitle ||
    (typeof record.title === "object" ? record.title?.en : record.title) ||
    "Untitled";

  const shortDescription =
    (typeof record.shortDescription === "object"
      ? record.shortDescription?.en
      : record.shortDescription) ||
    "This is a placeholder preview for frontend component rendering.";

  return (
    <>
      {/* Trigger button — visually identical to the original */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100"
      >
        <Monitor className="mr-2 h-4 w-4" />
        Preview
      </button>

      {/* Modal overlay + dialog */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200] bg-slate-900/30 transition"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-[96vw] rounded-xl border border-slate-300 bg-white shadow-[0_12px_42px_rgba(15,23,42,0.24)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-4">
                <div className="min-w-0">
                  <h3 className="text-xl">Frontend Preview</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Placeholder mode. The real component render will be
                    connected later.
                  </p>
                  {/* Viewport switcher */}
                  <div className="mt-3 inline-flex rounded-md border border-slate-300 bg-slate-100 p-1">
                    {(
                      Object.entries(viewportPresets) as [
                        ViewportKey,
                        (typeof viewportPresets)[ViewportKey],
                      ][]
                    ).map(([key, config]) => {
                      const isActive = key === viewport;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setViewport(key)}
                          className={cn(
                            "rounded px-3 py-1.5 text-sm transition",
                            isActive
                              ? "border border-slate-300 bg-white text-slate-900"
                              : "border border-transparent text-muted-foreground hover:bg-slate-100",
                          )}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-2 transition hover:bg-muted"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              {/* Preview content */}
              <div className="p-6">
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">
                    Component Placeholder
                  </p>
                  <p className="mb-3 text-xs text-slate-500">
                    Viewport: {currentViewport.label} ({currentViewport.width}
                    px)
                  </p>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-100/70 p-4">
                    <div
                      className="mx-auto min-w-max transition-all duration-300"
                      style={{ width: currentViewport.width }}
                    >
                      <article className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                        <h4 className="text-lg text-slate-900">{title}</h4>
                        <p className="mt-2 text-sm text-slate-700">
                          {shortDescription}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">Slug</span>
                            <p className="mt-0.5 text-slate-900">
                              {record.slug || "\u2014"}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Variant</span>
                            <p className="mt-0.5 text-slate-900">
                              {record.variant || "default"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="mt-4 rounded-md border border-slate-400 bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800"
                        >
                          Primary Action
                        </button>
                      </article>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
