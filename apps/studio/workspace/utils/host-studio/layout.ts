import type { IHostRecord } from "./interface";
export interface IModel extends IHostRecord {
  adminTitle: string;
  title: string | null;
  slug: string;
  className: string | null;
}
