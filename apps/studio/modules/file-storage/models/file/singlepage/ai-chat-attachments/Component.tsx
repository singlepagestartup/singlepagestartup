import { Component as View } from "@sps/file-storage/models/file/frontend/component/src/lib/singlepage/ai-chat-attachments";
import { useState } from "react";
import { aiChatProjectFixture } from "./../../../../../../../../tools/studio/products/fixtures/ai-chat-workspace";
export function Component() {
  const [assets, setAssets] = useState(
    aiChatProjectFixture().documents[0].assets ?? [],
  );
  return (
    <View
      section="Supplied material"
      assets={assets}
      sources={[]}
      onAttach={() => {}}
      onUpload={() => {}}
      onChange={(id, update) =>
        setAssets((current) =>
          current.map((asset) =>
            asset.id === id ? { ...asset, ...update } : asset,
          ),
        )
      }
      onRemove={(id) =>
        setAssets((current) => current.filter((asset) => asset.id !== id))
      }
    />
  );
}
