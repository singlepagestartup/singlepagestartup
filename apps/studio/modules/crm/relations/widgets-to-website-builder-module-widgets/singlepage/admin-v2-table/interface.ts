export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface IRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderIndex: number;
  variant: string;
  className: string | null;
  widgetId: string;
  websiteBuilderModuleWidgetId: string;
}
