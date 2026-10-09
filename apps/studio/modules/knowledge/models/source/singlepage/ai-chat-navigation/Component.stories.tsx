import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  return (
    <div className="w-64 rounded-xl bg-sps-graphite p-4">
      <Component
        data={{
          id: "brief",
          title: "Brief",
          sources: [
            {
              id: "pottery:brief:customers",
              slug: "pottery:brief:customers-and-value",
              title: "Customers and value",
              content: "",
              variant: "ai-chat-section",
            },
          ],
        }}
        selected
        onSelect={() => {}}
      />
    </div>
  );
}

const meta = {
  id: "modules-knowledge-models-source-singlepage-ai-chat-navigation",
  title: "Modules/Knowledge/Models/Source/Singlepage/ai-chat-navigation",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
