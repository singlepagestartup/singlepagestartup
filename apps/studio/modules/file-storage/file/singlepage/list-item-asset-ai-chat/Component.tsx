import type { IComponentProps, IAssetPreviewProps } from "./interface";
export type { IAssetPreviewProps } from "./interface";
import type { IProjectAsset } from "../../../../social/profile/singlepage/scope/ai-chat/project/state";
import { Component as FilePreview } from "../id/ai-chat/index";

export function Component({
  variant = "list-item-asset-ai-chat",
  asset,
}: IComponentProps) {
  return (
    <div
      data-ds-block="file-storage.file.list-item-asset-ai-chat"
      className="space-y-2"
      data-module="file-storage"
      data-model="file"
      data-variant={variant}
    >
      <FilePreview file={asset.file} />
      {asset.delivery && <FilePreview file={asset.delivery} />}
    </div>
  );
}
