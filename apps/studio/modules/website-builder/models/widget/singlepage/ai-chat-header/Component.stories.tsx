import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
function Example() {
  return (
    <div className="@container min-h-56 font-sps">
      <Component
        page="chat"
        profileSelect={({ onNavigate }) => (
          <button type="button" onClick={onNavigate} className="min-h-11 px-3">
            Profile Select slot
          </button>
        )}
        subjectAccount={() => (
          <button type="button" className="min-h-11 px-3">
            Subject Account slot
          </button>
        )}
      />
    </div>
  );
}
const meta = {
  id: "modules-website-builder-models-widget-singlepage-ai-chat-header",
  title: "Modules/Website-Builder/Models/Widget/Singlepage/ai-chat-header",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
