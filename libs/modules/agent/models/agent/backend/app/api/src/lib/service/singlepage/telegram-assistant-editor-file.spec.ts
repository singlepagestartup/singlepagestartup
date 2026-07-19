/**
 * BDD Suite: Telegram assistant persisted editor files
 * Given: Telegram attachments persisted through Social and File Storage.
 * When: Agent resolves an attachment for a conversation editor.
 * Then: it downloads the canonical file without imposing avatar-only MIME rules.
 */
import { Service } from "./index";

describe("Telegram assistant persisted editor files", () => {
  /**
   * BDD Scenario
   * Given: an incoming Social message linked to a UTF-8 TXT file.
   * When: the assistant editor resolves the message attachment.
   * Then: the complete text file is returned to the Agent-owned conversation.
   */
  it("When: a TXT attachment is resolved Then: its content remains available", async () => {
    const service = Object.create(Service.prototype) as Service;
    const relationsFind = jest
      .fn()
      .mockResolvedValue([{ fileStorageModuleFileId: "file-1" }]);
    const fileFindById = jest.fn().mockResolvedValue({
      id: "file-1",
      title: "content",
      extension: "txt",
      mimeType: "text/plain",
      file: "/file-storage/static/content.txt",
    });
    const originalFetch = globalThis.fetch;
    const content = "Содержимое Knowledge-документа";

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob([content], { type: "text/plain" }),
    }) as any;
    (service as any).socialModule = {
      messagesToFileStorageModuleFiles: { find: relationsFind },
    };
    (service as any).fileStorageModule = {
      file: { findById: fileFindById },
    };

    try {
      const file = await (service as any).resolveTelegramAssistantEditorFile({
        id: "message-1",
      });

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("content.txt");
      expect(file.type).toBe("text/plain");
      await expect(file.text()).resolves.toBe(content);
      expect(relationsFind).toHaveBeenCalledWith({
        params: {
          filters: {
            and: [{ column: "messageId", method: "eq", value: "message-1" }],
          },
          orderBy: {
            and: [{ column: "orderIndex", method: "desc" }],
          },
        },
      });
      expect(fileFindById).toHaveBeenCalledWith({ id: "file-1" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
