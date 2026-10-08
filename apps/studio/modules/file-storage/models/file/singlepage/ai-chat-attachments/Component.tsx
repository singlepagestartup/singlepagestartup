import { Component as View } from "./index";
import { useState } from "react";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
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
