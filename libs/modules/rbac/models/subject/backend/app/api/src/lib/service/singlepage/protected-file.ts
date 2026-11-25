import type { Service as Subject } from "./index";
import { protectedFileContentPath } from "@sps/rbac/models/subject/sdk/model/src/lib/protected-file";

export class ProtectedFile {
  constructor(private readonly subject: Subject) {}

  async hasGrant(subjectId: string, path: string, method: string) {
    const permission = await this.subject.module.role.module.permission.find({
      params: {
        filters: {
          and: [
            { column: "type", method: "eq", value: "HTTP" },
            { column: "method", method: "eq", value: method },
            { column: "path", method: "eq", value: path },
          ],
        },
      },
    });
    if (!permission.length) {
      return false;
    }

    const [links, grants] = await Promise.all([
      this.subject.module.role.module.rolesToPermissions.find({
        params: {
          filters: {
            and: [
              {
                column: "permissionId",
                method: "inArray",
                value: permission.map((entry) => entry.id),
              },
            ],
          },
        },
      }),
      this.subject.module.subjectsToRoles.find({
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: subjectId }],
          },
        },
      }),
    ]);
    const roles = new Set(grants.map((entry) => entry.roleId));
    return links.some((entry) => roles.has(entry.roleId));
  }

  async content(subjectId: string, id: string, method: string) {
    const storage = this.subject.modules.fileStorage.file.privateContent;
    const owner = await storage.ownedBy(id, subjectId);
    if (
      !owner &&
      !(await this.hasGrant(
        subjectId,
        protectedFileContentPath(subjectId, id),
        method,
      ))
    ) {
      throw new Error("Not Found error. File not found");
    }
    const file = await storage.findById({ id });
    if (!file) {
      throw new Error("Not Found error. File not found");
    }
    return file;
  }
}
