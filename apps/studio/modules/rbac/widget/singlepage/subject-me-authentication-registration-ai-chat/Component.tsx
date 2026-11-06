import { Component as Subject } from "../../../subject";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps = {}) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant="subject-me-authentication-registration-ai-chat"
    >
      <WebsiteBuilderModuleWidget variant="content-ai-chat-registration">
        <Subject variant="me-authentication-email-and-password-registration-form-ai-chat" />
      </WebsiteBuilderModuleWidget>
    </div>
  );
}
