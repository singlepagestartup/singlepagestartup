import { ReactNode } from "react";
import { ControllerRenderProps, UseFormReturn } from "react-hook-form";

type TRenderComponent = ReactNode | ((props: any) => ReactNode);

type IUniversalProps = {
  field: ControllerRenderProps<any, string>;
  placeholder?: string;
  label?: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
  className?: string;
};

export type TTypedProps = {
  type: "select-with-search";
  options: [value: string, title: string | TRenderComponent][];
  selectContentClassName?: string;
  selectItemClassName?: string;
};

export type IComponentProps = IUniversalProps & TTypedProps;
