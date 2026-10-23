import type { IComponentProps } from "./interface";
import { Component as Article } from "../../../article";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
export function Component(props: IComponentProps) {
  return (
    <WebsiteBuilderModuleWidget
      variant="content-collection"
      title="Latest articles"
      description="New publications from the SPS community."
      className="sm:grid-cols-2 lg:grid-cols-3"
      footer={
        <nav
          aria-label="Article pages"
          className="flex items-center justify-between gap-3"
        >
          <p className="text-sm text-muted-foreground">Page 1 of 2</p>
          <button className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm font-medium">
            Next
          </button>
        </nav>
      }
    >
      {props.loading ? (
        <div className="col-span-full h-80 animate-pulse rounded-2xl bg-muted" />
      ) : props.empty ? (
        <p className="col-span-full">No articles yet.</p>
      ) : (
        [0, 1, 2].map((i) => <Article key={i} variant="card" />)
      )}
    </WebsiteBuilderModuleWidget>
  );
}
