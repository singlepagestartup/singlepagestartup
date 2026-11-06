import { Component as Subject } from "../../../subject";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps = {}) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant="subject-me-authentication-select-method-ai-chat"
    >
      <WebsiteBuilderModuleWidget
        variant="content-ai-chat-authentication"
        content={props.copy?.content}
      >
        <Subject
          variant="me-authentication-email-and-password-authentication-form-ai-chat"
          copy={props.copy?.form}
          onSuccess={props.onSuccess}
        />
      </WebsiteBuilderModuleWidget>
    </div>
  );
}
