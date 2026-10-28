import type { Context } from "hono";
import { RBAC_PRIVILEGED_CONTEXT_KEY, isHiddenRecord } from "@sps/shared-utils";
import type { IService } from "../service";
import type { FindServiceProps } from "../services/interfaces";

/** Public filtering belongs at the HTTP boundary, before count/pagination. */
export function publicReadParams<T extends Record<string, unknown>>(
  c: Context,
  service: IService<T>,
  params?: FindServiceProps["params"],
): FindServiceProps["params"] {
  const table = service.repository?.configuration?.repository.Table;
  if (
    !table ||
    !("variant" in table) ||
    ((c.get?.(RBAC_PRIVILEGED_CONTEXT_KEY) || c.get?.("sps.includeHidden")) &&
      c.req?.query?.("publicOnly") !== "1")
  )
    return params;
  return {
    ...params,
    filters: {
      and: [
        ...(params?.filters?.and || []),
        { column: "variant", method: "ne", value: "hidden" },
      ],
    },
  };
}

export function assertPublicRecord(c: Context, data: unknown): void {
  if (
    !(
      (c.get?.(RBAC_PRIVILEGED_CONTEXT_KEY) || c.get?.("sps.includeHidden")) &&
      c.req?.query?.("publicOnly") !== "1"
    ) &&
    isHiddenRecord(data)
  )
    throw new Error("Not Found error. Entity is not published");
}
