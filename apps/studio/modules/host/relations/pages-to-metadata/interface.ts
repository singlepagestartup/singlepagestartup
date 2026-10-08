import type { IHostRecord } from "../../../../workspace/utils/host-studio/interface";
export interface IModel extends IHostRecord {
  pageId: string;
  metadataId: string;
  orderIndex: number;
  className: string | null;
}
