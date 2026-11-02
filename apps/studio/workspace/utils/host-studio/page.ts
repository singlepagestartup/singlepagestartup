import type { IHostRecord } from "./interface";
export interface IModel extends IHostRecord {
  adminTitle: string;
  title: string;
  url: string;
  description: string | null;
  language: string;
  className: string | null;
}
