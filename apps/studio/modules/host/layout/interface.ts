import type { IHostRecord } from "../../../workspace/utils/host-studio/interface";
export interface IModel extends IHostRecord {
  adminTitle: string;
  title: string | null;
  slug: string;
  className: string | null;
}
