export const variant = "preview-scroll" as const;
export interface IComponentProps {
  variant?: typeof variant;
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
}
export interface IComponentPropsExtended extends IComponentProps {}
