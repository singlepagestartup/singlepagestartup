import type { IAppAssembly } from "@sps/shared-backend-api";
import type { IFileRelationMutation } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/service";

export async function mutateSourceAttachment(
  assembly: IAppAssembly,
  operation: IFileRelationMutation,
) {
  // The relation invokes this command after assembly. Source owns the transaction.
  const { createService: createSource } =
    await import("@sps/knowledge/models/source/backend/app/api/src/lib/bootstrap");
  const result = await createSource(assembly).mutateFileRelation(operation);
  return result.relation;
}
