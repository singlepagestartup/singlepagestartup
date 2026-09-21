import { Context } from "hono";
import { RBAC_PRIVILEGED_CONTEXT_KEY } from "@sps/shared-utils";
import { type IService } from "../service";

/**
 * Applies a model's `repository.outputSchema` to what a route is about to
 * answer with (issue #270), dropping every column the schema leaves out.
 *
 * This is a serialisation helper, not a route handler: the REST handlers call
 * it on their way out, and a module's hand-written handler calls it too when it
 * builds a response itself.
 *
 * `selectSchema` is both the internal read shape and the wire shape, so a
 * model holding credentials — today only the RBAC identity, with its password
 * hash, salt and reset code — puts them in every response. Stripping has to
 * happen here rather than in the repository, because login, OAuth linking and
 * wallet login read exactly those columns back out of repository results.
 *
 * A model without `repository.outputSchema` is returned verbatim, so every
 * other model's payload is unchanged.
 */
export function applyOutputSchema<DTO>(props: {
  c: Context;
  service: Pick<IService<Record<string, unknown>>, "repository">;
  data: DTO;
}): DTO {
  const outputSchema =
    props.service.repository?.configuration?.repository.outputSchema;

  if (!outputSchema || props.c.get(RBAC_PRIVILEGED_CONTEXT_KEY)) {
    return props.data;
  }

  if (Array.isArray(props.data)) {
    return props.data.map((item) => outputSchema.parse(item)) as DTO;
  }

  if (!props.data || typeof props.data !== "object") {
    return props.data;
  }

  return outputSchema.parse(props.data) as DTO;
}
