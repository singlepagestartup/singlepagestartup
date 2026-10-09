import { useState } from "react";
import type { HostModel } from "../../../../../../../workspace/utils/host-studio/index";
import { HOST_STUDIO_MODELS } from "../../../../../../../workspace/utils/host-studio/constants";
import {
  Button,
  kit,
} from "../../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { useHostStudio } from "./Context";
import { HostModelList } from "./Model";
import { HostRecordPreview } from "./Preview";

export function HostWorkbench() {
  const { state } = useHostStudio();
  const [view, setView] = useState<HostModel | "preview">("page");
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
