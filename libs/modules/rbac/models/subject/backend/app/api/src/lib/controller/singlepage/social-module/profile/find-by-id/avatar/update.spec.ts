const mockFileCreate = jest.fn();
const mockRelationFind = jest.fn();
const mockRelationCreate = jest.fn();
const mockRelationDelete = jest.fn();

jest.mock("@sps/file-storage/models/file/sdk/server", () => ({
  api: { create: mockFileCreate },
}));
jest.mock(
  "@sps/social/relations/profiles-to-file-storage-module-files/sdk/server",
  () => ({
    api: {
      find: mockRelationFind,
      create: mockRelationCreate,
      delete: mockRelationDelete,
    },
  }),
);
jest.mock("@sps/shared-utils", () => ({ RBAC_SECRET_KEY: "rbac-secret" }));

import { Handler } from "./update";
import { Service as AvatarService } from "../../../../../../service/singlepage/social-module/profile/avatar";

function createService() {
  const service = {
    fileStorageModule: { file: { find: jest.fn() } },
    socialModuleProfileAvatarUpdate: (props: any) =>
      new AvatarService(service).execute(props),
  };
  return service;
}

function createContext(
  formData: FormData,
  profileId: string | undefined = "own-profile",
) {
  return {
    req: {
      param: (name: string) =>
        name === "socialModuleProfileId" ? profileId : "agent-profile",
      formData: jest.fn().mockResolvedValue(formData),
    },
    json: (body: unknown) => body,
  } as any;
}

describe("Own profile avatar update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileCreate.mockResolvedValue({ id: "new-file", mimeType: "image/png" });
    mockRelationFind.mockResolvedValue([]);
    mockRelationCreate.mockImplementation(({ data }) =>
      Promise.resolve({ id: "new-relation", ...data }),
    );
    mockRelationDelete.mockResolvedValue({});
  });

  test("uploads to the own-profile route parameter rather than the chat target", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );

    const result = await new Handler(createService() as any).execute(
      createContext(formData),
      jest.fn(),
    );

    expect(mockRelationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          profileId: "own-profile",
          fileStorageModuleFileId: "new-file",
          orderIndex: 0,
        },
      }),
    );
    expect(result).toEqual({
      data: {
        file: expect.objectContaining({ id: "new-file" }),
        relation: expect.objectContaining({ profileId: "own-profile" }),
      },
    });
  });

  test("removes avatar links without selecting an assistant default or deleting files", async () => {
    mockRelationFind.mockResolvedValue([
      {
        id: "first-link",
        profileId: "own-profile",
        fileStorageModuleFileId: "first-file",
      },
      {
        id: "second-link",
        profileId: "own-profile",
        fileStorageModuleFileId: "second-file",
      },
    ]);
    const formData = new FormData();
    formData.set("data", JSON.stringify({ reset: true }));
    const service = createService();

    const result = await new Handler(service as any).execute(
      createContext(formData),
      jest.fn(),
    );

    expect(mockRelationFind).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: "own-profile" }],
          },
        },
      }),
    );
    expect(mockRelationDelete.mock.calls.map(([props]) => props.id)).toEqual([
      "first-link",
      "second-link",
    ]);
    expect(service.fileStorageModule.file.find).not.toHaveBeenCalled();
    expect(mockFileCreate).not.toHaveBeenCalled();
    expect(mockRelationCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ data: { file: null, relation: null } });
  });

  test.each(["null", "[]", "broken JSON"])(
    "rejects malformed data %s before modifying an avatar",
    async (data) => {
      const formData = new FormData();
      formData.set("data", data);
      await expect(
        new Handler(createService() as any).execute(
          createContext(formData),
          jest.fn(),
        ),
      ).rejects.toMatchObject({ status: 400 });
      expect(mockFileCreate).not.toHaveBeenCalled();
      expect(mockRelationDelete).not.toHaveBeenCalled();
    },
  );

  test("rejects a non-image upload", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["text"], "notes.txt", { type: "text/plain" }),
    );
    await expect(
      new Handler(createService() as any).execute(
        createContext(formData),
        jest.fn(),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(mockFileCreate).not.toHaveBeenCalled();
  });
});
