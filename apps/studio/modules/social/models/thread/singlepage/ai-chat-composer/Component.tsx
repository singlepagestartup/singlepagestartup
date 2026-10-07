import { Component as View } from "@sps/social/models/thread/frontend/component/src/lib/singlepage/ai-chat-composer";
import { useState } from "react";
import { aiChatProjectFixture } from "./../../../../../../../../tools/studio/products/fixtures/ai-chat-workspace";
export function Component() {
  const [value, setValue] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [document] = useState(aiChatProjectFixture().documents[0]);
  const [files, setFiles] = useState<
    import("@sps/shared-frontend-client-utils/ai-chat/workspace").IProjectSource[]
  >([]);
  return (
    <View
      value={value}
      onChange={setValue}
      onSend={() => {
        setValue("");
        setFiles([]);
      }}
      files={files}
      onFiles={(next) => setFiles((current) => [...current, ...next])}
      onRemoveFile={(id) =>
        setFiles((current) => current.filter((file) => file.id !== id))
      }
      label="Message the AI agent"
      document={document}
      workingSections={sections}
      onWorkingSections={setSections}
      placeholder="What would you like to work on?"
    />
  );
}
