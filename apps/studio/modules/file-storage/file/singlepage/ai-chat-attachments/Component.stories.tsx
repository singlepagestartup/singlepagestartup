import { Component as FileStorageModuleFile } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FilesProvider } from "./Files";
import { aiChatProductsSourceFixture } from "../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import { AccountProvider } from "../../../../rbac/subject/singlepage/account/Account";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";
function Example() {
  const { files } = aiChatProductsSourceFixture();
  const [ids, setIds] = useState(files.map((file) => file.id));
  return (
    <FilesProvider initialFiles={files}>
      <FileStorageModuleFile
        variant="ai-chat-attachments"
        section="Products"
        fileIds={ids}
        onAttach={(next) =>
          setIds((current) => [...new Set([...current, ...next])])
        }
        onRemove={(id) =>
          setIds((current) => current.filter((value) => value !== id))
        }
      />
    </FilesProvider>
  );
}

const meta = {
  id: "modules-file-storage-models-file-singlepage-ai-chat-attachments",
  title: "Modules/File-Storage/Models/File/Singlepage/ai-chat-attachments",
  component: Example,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <Story />
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
