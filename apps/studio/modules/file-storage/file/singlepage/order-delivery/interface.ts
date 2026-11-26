export const variant = "order-delivery";

export interface IOrderDownload {
  id: string;
  kind: "result" | "receipt";
  filename: string;
}

export interface IComponentProps {
  variant?: typeof variant;
  state: "pending" | "available" | "denied";
  files?: readonly IOrderDownload[];
  onDownload: (id: string) => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
