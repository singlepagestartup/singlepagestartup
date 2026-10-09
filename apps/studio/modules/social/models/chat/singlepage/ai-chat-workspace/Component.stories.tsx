import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../../../../../knowledge/models/source/singlepage/ai-chat-editor/Source";

function Example() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <div className="@container/workspace flex h-160 flex-col overflow-hidden">
          <Component profileId="pottery" />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-social-models-chat-singlepage-ai-chat-workspace",
  title: "Modules/Social/Models/Chat/Singlepage/ai-chat-workspace",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
