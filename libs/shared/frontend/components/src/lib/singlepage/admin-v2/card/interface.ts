import { ISpsComponentBase } from "@sps/ui-adapter";
import { ICountProps } from "@sps/shared-frontend-api";

/**
 * Contract for admin-v2 overview cards.
 *
 * @template M Entity type used for optional data typing.
 * @template V Variant string type (usually `admin-v2-card`).
 */
export interface IComponentProps<M extends { id?: string }, V>
  extends ISpsComponentBase {
  /** Card render variant. */
  variant: V;
  /** Optional API `count` params/options for card-level counters/metrics. */
  apiProps?: {
    /** Query params. */
    params?: ICountProps["params"];
    /** Additional transport options. */
    options?: ICountProps["options"];
  };
  /** Additional class names for card styling. */
  className?: string;
  /** Entity type used for semantic data attributes. */
  type?: "model" | "relation";
  /** Module name for semantic data attributes. */
  module?: string;
  /** Model/relation name displayed by the card. */
  name?: string;
  /** Displayed API route helper text. */
  apiRoute?: string;
  /** Navigation target for "Open model". */
  href?: string;
}

/**
 * Extended card props with optional loaded data.
 *
 * @template M Entity type.
 * @template V Variant string type.
 * @template IComponentProps Base card prop contract.
 */
export type IComponentPropsExtended<
  M extends { id?: string },
  V,
  IComponentProps,
> = IComponentProps & {
  /** Optional loaded entities used by specialized card variants. */
  data?: M[];
  /** Loaded entity count displayed by the card. */
  count?: number;
};
