import type { ReactNode } from "react";
import type { TRenderAuthor } from "@sps/blog/models/article/frontend/component";

/** Render ports created by a higher consumer in the same client runtime. */
export interface IClientComposition {
  renderAuthor?: TRenderAuthor;
}

export interface IProviderProps extends IClientComposition {
  children: ReactNode;
}
