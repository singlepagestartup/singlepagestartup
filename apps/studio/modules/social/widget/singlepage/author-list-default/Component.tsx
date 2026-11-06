import type { IComponentProps } from "./interface";
import { Component as Profile } from "../../../profile";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
export function Component(props: IComponentProps) {
  return (
    <WebsiteBuilderModuleWidget
      variant="content-collection"
      title="Authors"
      description="Public articles and projects from the SPS community."
      className="sm:grid-cols-2 lg:grid-cols-3"
    >
      {props.error ? (
        <p role="alert" className="col-span-full">
          Authors could not be loaded. Try again.
        </p>
      ) : props.loading ? (
        [0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
        ))
      ) : props.empty ? (
        <p className="col-span-full">
          No authors yet. Authors appear after their first publication.
        </p>
      ) : (
        [0, 1, 2].map((i) => (
          <Profile
            key={i}
            variant="author-card-default"
            name={["SPS editorial team", "Frontend team", "DevOps team"][i]}
            articleCount={i + 1}
            productCount={props.noProducts ? 0 : i}
          />
        ))
      )}
    </WebsiteBuilderModuleWidget>
  );
}
