/**
 * BDD Suite: Telegram assistant current avatar projection
 * Given: an AI profile with zero or more File Storage relations.
 * When: Agent renders the Telegram assistant home.
 * Then: it resolves only the latest image relation into a public avatar link.
 */
import { Service } from "./index";

function createService(props: {
  relations?: Array<{ fileStorageModuleFileId?: string }>;
  file?: Record<string, unknown>;
}) {
  const service = Object.create(Service.prototype) as Service;
  const relationsFind = jest.fn().mockResolvedValue(props.relations || []);
  const fileFindById = jest.fn().mockResolvedValue(props.file);

  (service as any).socialModule = {
    profilesToFileStorageModuleFiles: { find: relationsFind },
  };
  (service as any).fileStorageModule = {
    file: { findById: fileFindById },
  };

  return { service, relationsFind, fileFindById };
}

describe("Telegram assistant current avatar projection", () => {
  /**
   * BDD Scenario
   * Given: a latest profile relation pointing to an image.
   * When: Agent resolves the home avatar.
   * Then: it follows the same relation order as the web sidebar and returns a public URL.
   */
  it("When: the latest relation is an image Then: its public link is returned", async () => {
    const { service, relationsFind, fileFindById } = createService({
      relations: [{ fileStorageModuleFileId: "file-1" }],
      file: {
        id: "file-1",
        file: "/avatar.png",
        mimeType: "image/png",
        alt: "Assistant avatar",
      },
    });

    await expect(
      (service as any).resolveTelegramAssistantProfileAvatar("profile-1"),
    ).resolves.toEqual({
      url: expect.stringMatching(/\/public\/avatar\.png$/),
      alt: "Assistant avatar",
    });
    expect(relationsFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [{ column: "profileId", method: "eq", value: "profile-1" }],
        },
        orderBy: {
          and: [
            { column: "orderIndex", method: "desc" },
            { column: "updatedAt", method: "desc" },
            { column: "createdAt", method: "desc" },
          ],
        },
        limit: 1,
      },
    });
    expect(fileFindById).toHaveBeenCalledWith({ id: "file-1" });
  });

  /**
   * BDD Scenario
   * Given: a relation points to a non-image file.
   * When: Agent resolves the home avatar.
   * Then: it does not expose that file as an avatar.
   */
  it("When: the latest file is not an image Then: no avatar is exposed", async () => {
    const { service } = createService({
      relations: [{ fileStorageModuleFileId: "file-1" }],
      file: {
        id: "file-1",
        file: "/document.pdf",
        mimeType: "application/pdf",
      },
    });

    await expect(
      (service as any).resolveTelegramAssistantProfileAvatar("profile-1"),
    ).resolves.toBeUndefined();
  });
});
