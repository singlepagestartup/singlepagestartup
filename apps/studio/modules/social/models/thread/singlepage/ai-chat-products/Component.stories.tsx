import { Component } from "./index";
import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { ProductsThreadProvider } from "./Thread";
import { SourceProvider } from "../../../../../knowledge/models/source/singlepage/ai-chat-document/Source";

function Example() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <div className="@container/workspace @container/chat flex h-160 flex-col overflow-hidden bg-sps-white">
          <ProductsThreadProvider profileId="pottery">
            <Component />
          </ProductsThreadProvider>
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-ai-chat-products",
  title: "Modules/Social/Models/Thread/Singlepage/ai-chat-products",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
