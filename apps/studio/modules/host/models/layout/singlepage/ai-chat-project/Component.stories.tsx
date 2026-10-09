import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <Component sidebar={() => <p>Project sidebar slot</p>}>
      {(navigation) => (
        <div className="p-5">{navigation}Project page content slot</div>
      )}
    </Component>
  );
}
const meta = {
  id: "modules-host-models-layout-singlepage-ai-chat-project",
  title: "Modules/Host/Models/Layout/Singlepage/ai-chat-project",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
