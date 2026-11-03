import type { IComponentProps } from "./interface";
import { Component as Profile } from "../../../profile";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
export function Component(props: IComponentProps) {
  return (
    <WebsiteBuilderModuleWidget
      variant="content-collection"
      className="grid-cols-1"
    >
      {props.error ? (
        <p role="alert">Authors could not be loaded. Try again.</p>
      ) : props.loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : props.empty ? (
        <p>No authors yet. Authors appear after their first publication.</p>
      ) : (
        <Profile
          variant="author-overview-default"
          productCount={props.noProducts ? 0 : 1}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Articles</h2>
            {props.children || (
              <p className="text-sm text-muted-foreground">
                Framework guides and implementation notes.
              </p>
            )}
            <h2 className="text-xl font-semibold">Projects</h2>
            <p className="text-sm text-muted-foreground">
              {props.noProducts
                ? "No public projects yet."
                : "Linked public SPS products appear here."}
            </p>
          </div>
        </Profile>
      )}
    </WebsiteBuilderModuleWidget>
  );
}
