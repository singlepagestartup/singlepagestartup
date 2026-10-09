import { useState } from "react";
import { Component } from "./index";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import { projectKnowledge } from "../../../../../../workspace/utils/products/ai-chat-models";
import { projectThreadGraph } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { documentAgent } from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
import {
  sendProjectMessage,
  reviewProjectDocument,
} from "../../../../../../workspace/utils/products/ai-chat-workspace";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  const [project, setProject] = useState(aiChatProjectFixture);
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pane, setPane] = useState<"chat" | "document">("chat");
  const graph = projectThreadGraph(project);
  const knowledge = projectKnowledge(project);
  const document = project.documents[0];
  const bundle = knowledge.bundles.find((bundle) => bundle.id === document.id)!;
  return (
    <div className="@container/workspace p-4">
      <div className="@container/chat flex h-160 min-h-0 flex-col overflow-hidden rounded-xl border border-sps-line bg-sps-white">
        <Component
          data={graph.threads[0]}
          messages={graph.messages}
          relations={graph.threadMessages}
          agent={documentAgent(document.id)}
          knowledge={knowledge.sources}
          sourceSlugs={bundle.sourceSlugs}
          pane={pane}
          onPane={setPane}
          workingSourceIds={selected}
          onWorkingSources={setSelected}
          proposal={document.proposal}
          onDismissProposal={() =>
            setProject((current) => ({
              ...current,
              documents: current.documents.map((item) =>
                item.id === document.id
                  ? { ...item, proposal: undefined }
                  : item,
              ),
            }))
          }
          onApplyProposal={() => {
            if (!document.proposal) return;
            const proposal = document.proposal;
            setProject((current) => ({
              ...current,
              documents: current.documents.map((item) =>
                item.id === document.id
                  ? {
                      ...item,
                      values: {
                        ...item.values,
                        [proposal.section]: proposal.text,
                      },
                      proposal: undefined,
                    }
                  : item,
              ),
            }));
            setPane("document");
          }}
          composer={{
            value,
            onChange: setValue,
            onSend: () => {
              setProject((current) =>
                sendProjectMessage(current, document.id, {
                  userId: crypto.randomUUID(),
                  assistantId: crypto.randomUUID(),
                  text: value,
                  sections: knowledge.sources
                    .filter((source) => selected.includes(source.id))
                    .map((source) => source.title),
                  reply:
                    "Review the proposed update before saving the document.",
                }),
              );
              setValue("");
            },
            label: "Message the AI agent",
            placeholder: "Discuss this document or request a change.",
            files: [],
            onFiles: () => {},
            onRemoveFile: () => {},
          }}
          editor={{
            document,
            files: knowledge.files,
            fileRelations: knowledge.sourceFiles,
            attachmentViews: knowledge.attachmentViews,
            sources: project.sources,
            onEdit: (title, text) =>
              setProject((current) => ({
                ...current,
                documents: current.documents.map((item) =>
                  item.id === document.id
                    ? { ...item, values: { ...item.values, [title]: text } }
                    : item,
                ),
              })),
            onReview: () =>
              setProject((current) => ({
                ...current,
                documents: current.documents.map((item) =>
                  item.id === document.id ? reviewProjectDocument(item) : item,
                ),
              })),
            onAttach: () => {},
            onUpload: () => {},
            onAssetChange: () => {},
            onAssetRemove: () => {},
          }}
        />
      </div>
    </div>
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
