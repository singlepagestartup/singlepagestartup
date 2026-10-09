import { Component as HostModuleLayout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../../website-builder/models/widget/index";

export function Component() {
  return (
    <HostModuleLayout variant="ai-chat">
      <WebsiteBuilderModuleWidget variant="ai-chat-landing" />
    </HostModuleLayout>
  );
}
