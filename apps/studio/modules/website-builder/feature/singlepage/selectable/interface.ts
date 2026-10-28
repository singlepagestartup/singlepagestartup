export const variant = "selectable" as const;
export interface IComponentProps {
  variant?: typeof variant;
  id: string;
  title: string;
  description: string;
  selected: boolean;
  controls: string;
  recordId?: string;
  onSelect: (id: string) => void;
}
export interface IComponentPropsExtended extends IComponentProps {}
