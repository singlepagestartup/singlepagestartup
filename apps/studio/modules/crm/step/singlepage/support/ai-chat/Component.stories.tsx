import { Component as Step } from "../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import copy from "../../../../form/singlepage/support/ai-chat/content.json";
function Component() {
  const [values, setValues] = useState({ topic: "", details: "", result: "" });
  return (
    <Step
      variant="support-ai-chat"
      id="support-story"
      values={values}
      onChange={(field, value) =>
        setValues((current) => ({ ...current, [field]: value }))
      }
      fields={copy.fields}
      topics={copy.topics}
    />
  );
}
const meta = {
  id: "modules-crm-models-step-singlepage-support-ai-chat",
  title: "Modules/CRM/Step/Singlepage/support/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
