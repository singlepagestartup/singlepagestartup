import { Component as View } from "./index";
import { useEffect, useState } from "react";
import { aiChatSourceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import { projectKnowledge } from "../../../../../../workspace/utils/products/ai-chat-models";
import {
  attachProjectAsset,
  reviewProjectDocument,
  type IProjectDocument,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
export function Component() {
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
    <View
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
      onReview={() => updateDocument(reviewProjectDocument)}
      onAttach={(file, section, kind) =>
        updateDocument((current) =>
          attachProjectAsset(
            current,
            file,
            section,
            kind,
            `${file.id}:${section}`,
          ),
        )
      }
      onUpload={(files, section, kind) =>
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
                      kind,
                      `${file.id}:${section}`,
                    ),
                  document,
                )
              : document,
          ),
        }))
      }
      onAssetChange={(id, update) =>
        updateDocument((current) => ({
          ...current,
          assets: current.assets?.map((asset) =>
            asset.id === id ? { ...asset, ...update } : asset,
          ),
        }))
      }
      onAssetRemove={(id) =>
        updateDocument((current) => ({
          ...current,
          assets: current.assets?.filter((asset) => asset.id !== id),
        }))
      }
    />
  );
}
