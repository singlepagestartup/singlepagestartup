import { db } from "@sps/sps-db-provider";
import {
  populate,
  schemaName,
} from "@sps/sps-website-builder-relations-widgets-to-features-section-blocks-backend-schema";

export async function service(params?: { filter?: any }) {
  const result = await db.query[schemaName].findMany({
    with: populate,
    where: params?.filter,
  });

  return result;
}
