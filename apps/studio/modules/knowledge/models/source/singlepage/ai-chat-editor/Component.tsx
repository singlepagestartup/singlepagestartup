import { Component as View } from "@sps/knowledge/models/source/frontend/component/src/lib/singlepage/ai-chat-editor";
import { useState } from "react";
import { aiChatProjectFixture } from "./../../../../../../../../tools/studio/products/fixtures/ai-chat-workspace";
import { reviewProjectDocument } from "@sps/shared-frontend-client-utils/ai-chat/workspace";
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
