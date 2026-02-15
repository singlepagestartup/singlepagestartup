import { ReactNode } from "react";
import { ControllerRenderProps, UseFormReturn } from "react-hook-form";

type TRenderComponent = ReactNode | ((props: any) => ReactNode);

type IUniversalProps = {
  field: ControllerRenderProps<any, string>;
  placeholder?: string;
  label?: string | ReactNode;
  form: UseFormReturn<any>;
  disabled?: boolean;
  className?: string;
};

type Option =
  | [value: string]
  | [value: string, title: string]
  | [value: string, title: string, renderFunction: TRenderComponent];

export type TTypedProps = {
  type: "select-with-search";
  options: Option[];
  selectContentClassName?: string;
  selectItemClassName?: string;
  portalContainer?: HTMLElement | null;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  disableClientFilter?: boolean;
  isLoading?: boolean;
};

export type IComponentProps = IUniversalProps & TTypedProps;
