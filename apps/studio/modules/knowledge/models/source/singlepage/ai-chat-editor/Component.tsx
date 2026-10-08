import { Component as View } from "./index";
import { useState } from "react";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import { reviewProjectDocument } from "../../../../../../workspace/utils/products/ai-chat-workspace";
export function Component() {
  const [document, setDocument] = useState(aiChatProjectFixture().documents[0]);
  const [section, setSection] = useState(document.sections[0].title);
  return (
    <View
      document={document}
      sections={[section]}
      sources={[]}
      onSection={setSection}
      onEdit={(key, value) =>
        setDocument((current) => ({
          ...current,
          values: { ...current.values, [key]: value },
        }))
      }
      onReview={() => setDocument((current) => reviewProjectDocument(current))}
      onAttach={() => {}}
      onUpload={() => {}}
      onAssetChange={() => {}}
      onAssetRemove={() => {}}
    />
  );
}
