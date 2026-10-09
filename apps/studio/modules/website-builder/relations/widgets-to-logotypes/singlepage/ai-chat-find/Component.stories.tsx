import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <Component
      variant="find"
      data={[
        {
          id: "header-link",
          widgetId: "ai-chat-header",
          logotypeId: "ai-chat-logotype",
          orderIndex: 0,
        },
      ]}
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "widgetId", method: "eq", value: "ai-chat-header" },
            ],
          },
        },
      }}
    >
      {(relations) => (
        <pre className="p-4 text-sm">{JSON.stringify(relations, null, 2)}</pre>
      )}
    </Component>
  );
}
const meta = {
  id: "modules-website-builder-relations-widgets-to-logotypes-singlepage-ai-chat-find",
  title:
    "Modules/Website-Builder/Relations/Widgets-To-Logotypes/Singlepage/ai-chat-find",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
