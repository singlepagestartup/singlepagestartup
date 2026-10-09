import { useEffect, useState } from "react";
import { Component } from "./index";
import { projectKnowledge } from "../../../../../../workspace/utils/products/ai-chat-models";
import { aiChatSourceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import { attachProjectAsset } from "../../../../../../workspace/utils/products/ai-chat-workspace";
import type { Meta, StoryObj } from "@storybook/react";

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

  const [discussing, setDiscussing] = useState(false);
  const graph = projectKnowledge(project);
  const source = graph.sources[0];
  return (
    <div className="mx-auto max-w-xl p-4">
      <Component
        data={source}
        discussing={discussing}
        files={graph.files}
        fileRelations={graph.sourceFiles}
        attachmentViews={graph.attachmentViews}
        availableFiles={project.sources}
        onEdit={(_, content) =>
          setProject((current) => ({
            ...current,
            documents: current.documents.map((document, index) =>
              index === 0
                ? {
                    ...document,
                    values: { ...document.values, [source.title]: content },
                  }
                : document,
            ),
          }))
        }
        onDiscuss={() => setDiscussing(true)}
        onAttach={(file, _, kind) =>
          setProject((current) => ({
            ...current,
            documents: current.documents.map((document, index) =>
              index === 0
                ? attachProjectAsset(
                    document,
                    file,
                    source.title,
                    kind,
                    `${file.id}:attachment`,
                  )
                : document,
            ),
          }))
        }
        onUpload={(files, _, kind) =>
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
                        source.title,
                        kind,
                        `${file.id}:attachment`,
                      ),
                    document,
                  )
                : document,
            ),
          }))
        }
        onAssetChange={(id, update) =>
          setProject((current) => ({
            ...current,
            documents: current.documents.map((document) => ({
              ...document,
              assets: document.assets?.map((asset) =>
                asset.id === id ? { ...asset, ...update } : asset,
              ),
            })),
          }))
        }
        onAssetRemove={(id) =>
          setProject((current) => ({
            ...current,
            documents: current.documents.map((document) => ({
              ...document,
              assets: document.assets?.filter((asset) => asset.id !== id),
            })),
          }))
        }
      />
    </div>
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
