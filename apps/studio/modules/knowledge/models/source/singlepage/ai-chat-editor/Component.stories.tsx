import { Component } from "./index";
import { useEffect, useState } from "react";
import { aiChatSourceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import { projectKnowledge } from "../../../../../../workspace/utils/products/ai-chat-models";
import {
  attachProjectAsset,
  detachProjectFile,
  type IProjectDocument,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  const [project, setProject] = useState(aiChatSourceFixture);
  useEffect(() => {
    const files = aiChatSourceFixture().sources.map((file) => ({
      ...file,
      fileUrl: URL.createObjectURL(
        new Blob([file.text], { type: file.mimeType }),
      ),
    }));
    const records = new Map(files.map((file) => [file.id, file]));
    setProject((current) => ({
      ...current,
      sources: files,
      documents: current.documents.map((document) => ({
        ...document,
        assets: document.assets?.map((asset) => ({
          ...asset,
          file: records.get(asset.file.id) ?? asset.file,
        })),
      })),
    }));
    return () => files.forEach((file) => URL.revokeObjectURL(file.fileUrl!));
  }, []);

  const document = project.documents[0];
  const [section, setSection] = useState(document.sections[0].title);
  const graph = projectKnowledge(project);
  function updateDocument(
    update: (document: IProjectDocument) => IProjectDocument,
  ) {
    setProject((current) => ({
      ...current,
      documents: current.documents.map((document, index) =>
        index === 0 ? update(document) : document,
      ),
    }));
  }
  return (
    <Component
      document={document}
      data={graph.sources.filter((source) =>
        graph.bundles[0].sourceIds.includes(source.id),
      )}
      files={graph.files}
      fileRelations={graph.sourceFiles}
      attachmentViews={graph.attachmentViews}
      sections={[section]}
      sources={project.sources}
      onSection={setSection}
      onEdit={(key, value) =>
        updateDocument((current) => ({
          ...current,
          values: { ...current.values, [key]: value },
        }))
      }
      onAttach={(file, section) =>
        updateDocument((current) =>
          attachProjectAsset(current, file, section, `${file.id}:${section}`),
        )
      }
      onUpload={(files, section) =>
        setProject((current) => ({
          ...current,
          sources: [...current.sources, ...files],
          documents: current.documents.map((document, index) =>
            index === 0
              ? files.reduce(
                  (document, file) =>
                    attachProjectAsset(
                      document,
                      file,
                      section,
                      `${file.id}:${section}`,
                    ),
                  document,
                )
              : document,
          ),
        }))
      }
      onAssetRemove={(fileId, section) =>
        updateDocument((document) =>
          detachProjectFile(document, fileId, section),
        )
      }
    />
  );
}

const meta = {
  id: "modules-knowledge-models-source-singlepage-ai-chat-editor",
  title: "Modules/Knowledge/Models/Source/Singlepage/ai-chat-editor",
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
