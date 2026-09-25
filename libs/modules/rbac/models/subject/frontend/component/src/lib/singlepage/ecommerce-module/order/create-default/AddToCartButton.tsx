"use client";

import { memo } from "react";
import { Button } from "@sps/shared-ui-shadcn";

export interface IAddToCartButtonProps {
  /**
   * `undefined` while the product's price currencies are still loading.
   */
  hasPrice?: boolean;
  isPending: boolean;
  onClick: () => void;
}

function Component(props: IAddToCartButtonProps) {
  const label =
    props.hasPrice === false
      ? "No price"
      : props.isPending
        ? "Adding..."
        : "Add to cart";

  return (
    <Button
      onClick={props.onClick}
      variant="secondary"
      className="w-full flex shrink-0"
      disabled={props.isPending || props.hasPrice !== true}
    >
      {label}
    </Button>
  );
}

export const AddToCartButton = memo(Component);
