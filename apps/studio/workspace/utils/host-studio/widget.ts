import type { IHostRecord } from "./interface";
export interface IModel extends IHostRecord {
  adminTitle: string;
  title: Record<string, string> | null;
  subtitle: Record<string, string> | null;
  description: Record<string, string> | null;
  slug: string;
  className: string | null;
}
