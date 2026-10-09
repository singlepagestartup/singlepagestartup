import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../ai-chat-editor/Source";
import { aiChatProductsSourceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
function Example() {
  const { source, files, links } = aiChatProductsSourceFixture();
  return (
    <FilesProvider initialFiles={files}>
      <SourceProvider
        profileId="pottery"
        initialSource={source}
        initialFileLinks={links}
      >
        <div className="mx-auto max-w-xl p-4">
          <Component />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-knowledge-models-source-singlepage-ai-chat-section",
  title: "Modules/Knowledge/Models/Source/Singlepage/ai-chat-section",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
