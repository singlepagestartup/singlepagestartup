import type { IHostRecord } from "../../../../workspace/utils/host-studio/interface";
export interface IModel extends IHostRecord {
  widgetId: string;
  externalWidgetId: string;
  externalModule: string;
  orderIndex: number;
  className: string | null;
}
