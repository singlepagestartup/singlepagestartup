import { MaterialService } from "./materials";
import { assembleContent, hashContent, readUserContext } from "./utils";

function setup() {
  let source = {
    id: "source",
    content: assembleContent(
      "Пользователь: отчёт предварительный.",
      "Удалённый отчёт: 90",
      "Старый вывод",
    ),
    contentHash: "initial",
  };
  let files = [
    {
      relation: {
        id: "relation",
        fileStorageModuleFileId: "remaining",
        orderIndex: 0,
      },
      file: {
        id: "remaining",
        adminTitle: "Оставшийся отчёт",
        updatedAt: "2026-10-07",
      },
    },
  ];
  const repository = {
    findSourceById: jest.fn(async () => source),
    invalidateFileContent: jest.fn(
      async (_id, content) =>
        (source = { ...source, content, contentHash: hashContent(content) }),
    ),
    sourceFiles: jest.fn(async () => files),
    saveAnalyzedContent: jest.fn(
      async (props) =>
        (source = {
          ...source,
          content: props.content,
          contentHash: hashContent(props.content),
        }),
    ),
  };
  const media = {
    analyze: jest.fn(async () => "Актуальная таблица: 120"),
    synthesize: jest.fn(async () => "Актуальный вывод"),
  };
  const service = new MaterialService({
    repository: repository as any,
    media: media as any,
  });
  return {
    service,
    repository,
    media,
    current: () => source,
    clearFiles: () => {
      files = [];
    },
  };
}

describe("Knowledge material rebuilding", () => {
  it("uses every current file and keeps human context without detached information", async () => {
    const state = setup();
    await state.service.rebuild("source");
    expect(state.current().content).toContain("Актуальная таблица: 120");
    expect(state.current().content).not.toContain("Удалённый отчёт");
    expect(readUserContext(state.current().content)).toBe(
      "Пользователь: отчёт предварительный.",
    );
    expect(state.media.analyze).toHaveBeenCalledWith(
      expect.objectContaining({ id: "remaining" }),
      "Пользователь: отчёт предварительный.",
    );
  });
  it("keeps user text and publishes no partial description when a file cannot be analyzed", async () => {
    const state = setup();
    state.media.analyze.mockRejectedValueOnce(new Error("vision unavailable"));
    await expect(state.service.rebuild("source")).rejects.toThrow(
      "vision unavailable",
    );
    expect(state.current().content).toBe(
      "Пользователь: отчёт предварительный.",
    );
    expect(state.repository.saveAnalyzedContent).not.toHaveBeenCalled();
  });
  it("removes file-derived descriptions when the last file is detached", async () => {
    const state = setup();
    state.clearFiles();
    await state.service.rebuild("source");
    expect(state.current().content).toBe(
      "Пользователь: отчёт предварительный.",
    );
    expect(state.media.analyze).not.toHaveBeenCalled();
    expect(state.media.synthesize).not.toHaveBeenCalled();
  });
  it("restarts analysis when the publication guard rejects a stale snapshot", async () => {
    const state = setup();
    state.repository.saveAnalyzedContent.mockResolvedValueOnce(null as any);
    await state.service.rebuild("source");
    expect(state.media.analyze).toHaveBeenCalledTimes(2);
    expect(state.current().content).toContain("Актуальная таблица: 120");
  });
});
