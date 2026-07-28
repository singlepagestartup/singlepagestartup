/**
 * BDD Suite: subject-scoped AI profile avatar updates.
 *
 * Given: an authorized operator manages an AI profile avatar.
 * When: an image replacement or default reset is submitted.
 * Then: the canonical avatar route keeps exactly one active File Storage relation.
 */

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
      create: mockRelationCreate,
      delete: mockRelationDelete,
      find: mockRelationFind,
    },
  }),
);
jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "rbac-secret",
}));

import { Handler } from "./update";

function createContext(formData: FormData) {
  return {
    req: {
      param: jest.fn((name: string) =>
        name === "targetSocialModuleProfileId" ? "profile-1" : undefined,
      ),
      formData: jest.fn().mockResolvedValue(formData),
    },
    json: jest.fn((body: unknown) => body),
  } as any;
}

function createService(defaultFiles: Array<Record<string, unknown>> = []) {
  return {
    fileStorageModule: {
      file: {
        find: jest.fn().mockResolvedValue(defaultFiles),
      },
    },
  } as any;
}

describe("AI profile avatar update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileCreate.mockResolvedValue({
      id: "new-file",
      file: "/new-avatar.jpg",
      mimeType: "image/jpeg",
    });
    mockRelationFind.mockResolvedValue([]);
    mockRelationCreate.mockResolvedValue({
      id: "new-relation",
      profileId: "profile-1",
      fileStorageModuleFileId: "new-file",
      orderIndex: 0,
    });
    mockRelationDelete.mockResolvedValue({});
  });

  /**
   * BDD Scenario: replace a custom avatar.
   *
   * Given: the profile has an existing avatar relation.
   * When: an image is uploaded.
   * Then: a new File Storage relation replaces the previous relation.
   */
  test("When: an image is uploaded Then: the previous relation is replaced", async () => {
    mockRelationFind.mockResolvedValue([
      {
        id: "old-relation",
        profileId: "profile-1",
        fileStorageModuleFileId: "old-file",
      },
    ]);
    const formData = new FormData();
    const image = new File(["avatar"], "avatar.jpg", {
      type: "image/jpeg",
    });
    formData.set("data", JSON.stringify({}));
    formData.set("file", image);

    await new Handler(createService()).execute(
      createContext(formData),
      jest.fn(),
    );

    expect(mockFileCreate).toHaveBeenCalledWith({
      data: {
        adminTitle: "Social Module Profile Avatar: profile-1",
        alt: "avatar.jpg",
        file: image,
      },
      options: {
        headers: { "X-RBAC-SECRET-KEY": "rbac-secret" },
      },
    });
    expect(mockRelationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          profileId: "profile-1",
          fileStorageModuleFileId: "new-file",
          orderIndex: 0,
        },
      }),
    );
    expect(mockRelationDelete).toHaveBeenCalledWith({
      id: "old-relation",
      options: {
        headers: { "X-RBAC-SECRET-KEY": "rbac-secret" },
      },
    });
  });

  /**
   * BDD Scenario: reset to the configured default avatar.
   *
   * Given: File Storage contains the personal-assistant default and the profile has custom relations.
   * When: reset is submitted.
   * Then: no file is duplicated and the profile is related only to the default image.
   */
  test("When: reset is submitted Then: the default File Storage image is selected", async () => {
    const defaultFile = {
      id: "default-file",
      variant: "default-social-module-personal-assistant",
      file: "/default-avatar.webp",
      mimeType: "image/webp",
    };
    mockRelationFind.mockResolvedValue([
      {
        id: "custom-relation",
        profileId: "profile-1",
        fileStorageModuleFileId: "custom-file",
      },
    ]);
    mockRelationCreate.mockResolvedValue({
      id: "default-relation",
      profileId: "profile-1",
      fileStorageModuleFileId: "default-file",
      orderIndex: 0,
    });
    const formData = new FormData();
    formData.set("data", JSON.stringify({ reset: true }));
    const service = createService([defaultFile]);

    const result = await new Handler(service).execute(
      createContext(formData),
      jest.fn(),
    );

    expect(service.fileStorageModule.file.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "variant",
              method: "eq",
              value: "default-social-module-personal-assistant",
            },
          ],
        },
        orderBy: {
          and: [
            { column: "updatedAt", method: "desc" },
            { column: "createdAt", method: "desc" },
          ],
        },
        limit: 1,
      },
    });
    expect(mockFileCreate).not.toHaveBeenCalled();
    expect(mockRelationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          profileId: "profile-1",
          fileStorageModuleFileId: "default-file",
          orderIndex: 0,
        },
      }),
    );
    expect(mockRelationDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "custom-relation" }),
    );
    expect(result).toEqual({
      data: {
        file: defaultFile,
        relation: expect.objectContaining({ id: "default-relation" }),
      },
    });
  });
});
