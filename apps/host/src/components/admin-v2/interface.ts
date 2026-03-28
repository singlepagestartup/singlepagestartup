export interface IComponentProps {
  isServer: boolean;
  className?: string;
  language: string;
  url: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
