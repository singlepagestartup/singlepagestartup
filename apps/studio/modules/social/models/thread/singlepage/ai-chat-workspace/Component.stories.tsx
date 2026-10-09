import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../../../../../knowledge/models/source/singlepage/ai-chat-editor/Source";

function Example() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <div className="@container/workspace @container/chat flex h-160 flex-col overflow-hidden bg-sps-white">
          <Component
            data={{
              id: "pottery:thread:document:products",
              slug: "pottery:document:products",
              title: "Products.md",
              variant: "ai-chat-workspace",
            }}
          />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-ai-chat-workspace",
  title: "Modules/Social/Models/Thread/Singlepage/ai-chat-workspace",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
