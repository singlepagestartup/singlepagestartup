import { LegacyRef, ReactNode } from "react";
import { ControllerRenderProps, UseFormReturn } from "react-hook-form";

type TRenderComponent = ReactNode | ((props: any) => ReactNode);

type IUniversalProps = {
  field: ControllerRenderProps<any, string>;
  placeholder?: string;
  label?: string | ReactNode;
  ref?: LegacyRef<HTMLInputElement>;
  form: UseFormReturn<any>;
  disabled?: boolean;
  className?: string;
  name: string;
};

type Option =
  | [value: string]
  | [value: string, title: string]
  | [value: string, title: string, renderFunction: TRenderComponent];

export type TTypedProps =
  | {
      type: "text";
    }
  | {
      type: "password";
    }
  | {
      type: "tiptap";
    }
  | {
      type: "textarea";
      rows?: number;
    }
  | {
      type: "file";
    }
  | {
      type: "number";
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      type: "range";
      min: number;
      max: number;
      step?: number;
    }
  | {
      type: "datetime";
    }
  | {
      type: "checkbox";
    }
  | {
      type: "select";
      options: Option[];
      selectContentClassName?: string;
      selectItemClassName?: string;
    }
  | {
      type: "select-with-search";
      options: Option[];
      selectContentClassName?: string;
      selectItemClassName?: string;
    }
  | {
      type: "radio";
      options: Option[];
      radioGroupItemClassName?: string;
      labelClassName?: string;
      itemClassName?: string;
    }
  | {
      type: "toggle-group";
      options: Option[];
      toggleGroupItemClassName?: string;
      labelClassName?: string;
      itemClassName?: string;
    };

export type IComponentProps = IUniversalProps & TTypedProps;
