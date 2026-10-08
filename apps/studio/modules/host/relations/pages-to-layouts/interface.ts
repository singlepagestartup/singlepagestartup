import type { IHostRecord } from "../../../../workspace/utils/host-studio/interface";
export interface IModel extends IHostRecord {
  pageId: string;
  layoutId: string;
  orderIndex: number;
  className: string | null;
}
