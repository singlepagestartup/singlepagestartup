import { Component as ButtonsArraysToButtons } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <ButtonsArraysToButtons
      variant="find"
      data={[
        {
          id: "header-link",
          buttonsArrayId: "ai-chat-help",
          buttonId: "ai-chat-help",
          orderIndex: 0,
        },
      ]}
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "buttonsArrayId", method: "eq", value: "ai-chat-help" },
            ],
          },
        },
      }}
    >
      {(relations) => (
        <pre className="p-4 text-sm">{JSON.stringify(relations, null, 2)}</pre>
      )}
    </ButtonsArraysToButtons>
  );
}
const meta = {
  id: "modules-website-builder-relations-buttons-arrays-to-buttons-singlepage-ai-chat-find",
  title:
    "Modules/Website-Builder/Relations/Buttons-Arrays-To-Buttons/Singlepage/ai-chat-find",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
