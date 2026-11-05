import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { Component as Subject } from "../../../subject";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant="subject-me-blog-module-article-create"
    >
      <WebsiteBuilderModuleWidget
        variant="content-form"
        title="Create article"
        description="Share implementation notes and projects with the SPS community."
      >
        <Subject
          variant="me-blog-module-article-create-default"
          signedIn={props.signedIn}
          pending={props.pending}
          error={props.error}
        />
      </WebsiteBuilderModuleWidget>
    </div>
  );
}
