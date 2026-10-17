import { Component as Layout } from "../../index";
import { Component as RbacModuleSubject } from "../../../../rbac/subject/index";

import type { Meta, StoryObj } from "@storybook/react";
function Component() {
  return (
    <Layout
      variant="ai-chat-landing"
      subjectAccount={<RbacModuleSubject variant="me-account" showTokens />}
    >
      <main className="p-5">AI Chat page content slot</main>
    </Layout>
  );
}
const meta = {
  id: "modules-host-models-layout-singlepage-ai-chat-landing",
  title: "Modules/Host/Layout/Singlepage/ai-chat-landing",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
