"use client";
import { Component as Subject } from "../../../subject";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import { useAIChatProjectHref } from "../../../subject/singlepage/me/account/Account";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps = {}) {
  const selectedProject = useAIChatProjectHref();
  const projectHref = props.projectHref ?? selectedProject;
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant="subject-me-crm-module-form-support-ai-chat"
    >
      <WebsiteBuilderModuleWidget
        variant="content-ai-chat-help"
        projectHref={projectHref}
      >
        <Subject
          variant="me-crm-module-form-support-ai-chat"
          projectHref={projectHref}
        />
      </WebsiteBuilderModuleWidget>
    </div>
  );
}
