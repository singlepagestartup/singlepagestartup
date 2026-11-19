export const variant = "overview-customer-work";

export interface IStoreOffer {
  id: string;
  store: string;
  title: string;
  description: string;
  deliverables: readonly string[];
  price: number;
  kind: "service" | "physical";
}

export interface IComponentProps {
  variant?: typeof variant;
  offer: IStoreOffer;
  orderId?: string;
  orderStatus?: "cart" | "paid" | "closed";
  consulting?: boolean;
  pendingAction?: "add" | "ask";
  feedback?: string;
  onAsk: () => void;
  onAdd: () => void;
  onOpenOrder: () => void;
  onOpenDiscussion: () => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
