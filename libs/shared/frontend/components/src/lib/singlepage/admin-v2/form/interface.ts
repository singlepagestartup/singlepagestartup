import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindByIdProps } from "@sps/shared-frontend-api";
import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";

/**
 * Interactive submit mode for client-rendered forms.
 * In this mode `onSubmit` is required and `isServer` must be `false`.
 */
type IClientSubmitMode = {
  /** This form runs in the client runtime. */
  isServer: false;
  /** Submit callback invoked via `form.handleSubmit`. */
  onSubmit: (data: any) => void;
};

/**
 * Passive mode without a submit callback.
 * Used for read-only or externally controlled flows.
 */
type IAnySubmitMode = {
  /** Can be either runtime, because no client submit callback is passed. */
  isServer: boolean;
  /** Submit handler is intentionally omitted in this mode. */
  onSubmit?: undefined;
};

/**
 * Base contract for admin-v2 form components.
 *
 * @template M Entity type edited/displayed by the form.
 * @template V Variant string type (usually `admin-v2-form`).
 */
type IComponentBaseProps<
  M extends { id?: string } = { id?: string },
  V = string,
> = Omit<ISpsComponentBase, "isServer"> & {
  /** Render variant of the form component. */
  variant: V;
  /** Entity data (optional for create mode). */
  data?: M;
  /** API options used by `findById` loaders. */
  apiProps?: {
    /** Query params for loading the entity. */
    params?: IFindByIdProps["params"];
    /** Additional transport options. */
    options?: IFindByIdProps["options"];
  };
  /** Additional container class names. */
  className?: string;
  /** Explicit entity id for title/meta rendering. */
  id?: string;
  /** Module name for data attributes. */
  module?: string;
  /** Model or relation name for title/meta rendering. */
  name?: string;
  /** Entity type used for semantic data attributes. */
  type?: "model" | "relation";
  /** Visual submit status of the form action button. */
  status?: "idle" | "pending" | "success" | "error";
  /** react-hook-form instance used by the form. */
  form?: UseFormReturn<any>;
  /** Optional depth marker for nested panel stacks. */
  panelDepth?: number;
  /** Optional top-level marker for nested panel stacks. */
  isTop?: boolean;
  /** Form body content (fields, relation sections, etc.). */
  children?: ReactNode;
};

/**
 * Public form contract.
 * Discriminated union enforces: if `onSubmit` exists, `isServer` must be `false`.
 */
export type IComponentProps<
  M extends { id?: string } = { id?: string },
  V = string,
> = IComponentBaseProps<M, V> & (IClientSubmitMode | IAnySubmitMode);

/**
 * Extended form props used after optional data hydration.
 *
 * @template M Entity type.
 * @template V Variant string type.
 * @template T Base form prop contract.
 */
export type IComponentPropsExtended<
  M extends { id?: string } = { id?: string },
  V = string,
  T extends IComponentProps<M, V> = IComponentProps<M, V>,
> = T & {
  /** Hydrated entity data. */
  data?: M;
};
