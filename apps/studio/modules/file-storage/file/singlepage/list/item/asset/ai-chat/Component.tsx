import type { IProjectAsset } from "../../../../../../../../workspace/utils/products/ai-chat-workspace";
import { Component as FilePreview } from "../../../../overview/ai-chat/index";
export interface IAssetPreviewProps {
  asset: IProjectAsset;
}
export function Component({ asset }: IAssetPreviewProps) {
  return (
    <div
      data-ds-block="file-storage.file.list-item-asset-ai-chat"
      className="space-y-2"
    >
      <FilePreview file={asset.file} />
      {asset.delivery && <FilePreview file={asset.delivery} />}
    </div>
  );
}
