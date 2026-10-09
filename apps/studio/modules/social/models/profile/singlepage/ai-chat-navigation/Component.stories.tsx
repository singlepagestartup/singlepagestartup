import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SourceProvider } from "../../../../../knowledge/models/source/singlepage/ai-chat-editor/Source";
function Example() {
  const [settings, setSettings] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  return (
    <SourceProvider profileId="pottery">
      <div className="w-64 bg-sps-graphite p-4 text-white">
        <Component
          name="Pottery workshops"
          settingsSelected={settings}
          creatingThread={creatingThread}
          onSettings={() => {
            setSettings(true);
            setCreatingThread(false);
          }}
          onDocument={() => {
            setSettings(false);
            setCreatingThread(false);
          }}
          onNewThread={() => {
            setSettings(false);
            setCreatingThread(true);
          }}
        />
      </div>
    </SourceProvider>
  );
}

const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-navigation",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-navigation",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
