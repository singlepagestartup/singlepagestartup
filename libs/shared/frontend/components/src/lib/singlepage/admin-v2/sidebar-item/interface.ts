import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";

/**
 * Contract for admin-v2 sidebar items.
 *
 * @template M Entity type used for optional data typing.
 * @template V Variant string type (usually `admin-v2-sidebar-item`).
 */
export interface IComponentProps<M extends { id?: string }, V>
  extends ISpsComponentBase {
  /** Sidebar-item render variant. */
  variant: V;
  /** Optional API `find` params/options for item-level counters/metrics. */
  apiProps?: {
    /** Query params. */
    params?: IFindProps["params"];
    /** Additional transport options. */
    options?: IFindProps["options"];
  };
  /** Additional class names for sidebar item styling. */
  className?: string;
  /** Entity type used for semantic data attributes. */
  type?: "model" | "relation";
  /** Module name used to build admin route links. */
  module?: string;
  /** Model/relation name used in labels and links. */
  name?: string;
  /** Whether the item is currently active. */
  isActive?: boolean;
}

/**
 * Extended sidebar-item props with optional loaded data.
 *
 * @template M Entity type.
 * @template V Variant string type.
 * @template IComponentProps Base sidebar-item prop contract.
 */
export type IComponentPropsExtended<
  M extends { id?: string },
  V,
  IComponentProps,
> = IComponentProps & {
  /** Optional loaded entities used by specialized sidebar variants. */
  data?: M[];
};
