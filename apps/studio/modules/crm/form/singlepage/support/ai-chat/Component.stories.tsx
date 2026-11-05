import { Component as Form } from "../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import copy from "./content.json";
function Component() {
  const [values, setValues] = useState({ topic: "", details: "", result: "" });
  return (
    <Form
      variant="support-ai-chat"
      id="support-story"
      values={values}
      onChange={(field, value) =>
        setValues((current) => ({ ...current, [field]: value }))
      }
      copy={copy}
    />
  );
}
const meta = {
  id: "modules-crm-models-form-singlepage-support-ai-chat",
  title: "Modules/CRM/Form/Singlepage/support/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
