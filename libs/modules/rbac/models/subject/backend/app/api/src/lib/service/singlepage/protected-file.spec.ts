import { ProtectedFile } from "./protected-file";

function fixture(owner: boolean) {
  const ownedBy = jest.fn().mockResolvedValue(owner);
  const findById = jest.fn().mockResolvedValue({ id: "file", name: "proof" });
  const permission = jest.fn().mockResolvedValue([{ id: "permission" }]);
  const roles = jest.fn().mockResolvedValue([{ roleId: "member" }]);
  const links = jest.fn().mockResolvedValue([{ roleId: "reader" }]);
  const service = new ProtectedFile({
    modules: {
      fileStorage: { file: { privateContent: { ownedBy, findById } } },
    },
    module: {
      role: {
        module: {
          permission: { find: permission },
          rolesToPermissions: { find: links },
        },
      },
      subjectsToRoles: { find: roles },
    },
  } as unknown as ConstructorParameters<typeof ProtectedFile>[0]);
  return { service, findById, ownedBy, permission, roles };
}

it("reads the owner's file after checking its identity", async () => {
  const f = fixture(true);
  await expect(
    f.service.content("owner", "file", "GET"),
  ).resolves.toMatchObject({ id: "file" });
  expect(f.ownedBy).toHaveBeenCalledWith("file", "owner");
  expect(f.permission).not.toHaveBeenCalled();
});

it.each(["admin", "agent"])(
  "requires the %s subject's exact method and file grant",
  async (subjectId) => {
    const f = fixture(false);
    await expect(f.service.content(subjectId, "file", "HEAD")).rejects.toThrow(
      "Not Found",
    );
    expect(f.findById).not.toHaveBeenCalled();
    expect(f.permission).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            { column: "type", method: "eq", value: "HTTP" },
            { column: "method", method: "eq", value: "HEAD" },
            {
              column: "path",
              method: "eq",
              value: `/api/rbac/subjects/${subjectId}/file-storage-module/files/file/content`,
            },
          ],
        },
      },
    });
    f.roles.mockResolvedValue([{ roleId: "reader" }]);
    await expect(
      f.service.content(subjectId, "file", "HEAD"),
    ).resolves.toMatchObject({ id: "file" });
  },
);
