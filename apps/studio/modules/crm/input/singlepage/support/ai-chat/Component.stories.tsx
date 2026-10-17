import { Component as Input } from "../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
function Component() {
  const [value, setValue] = useState("");
  return (
    <Input
      variant="support-ai-chat"
      name="details"
      label="What happened?"
      placeholder="Describe what you tried."
      value={value}
      onChange={setValue}
    />
  );
}
const meta = {
  id: "modules-crm-models-input-singlepage-support-ai-chat",
  title: "Modules/CRM/Input/Singlepage/support/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
