import { assembleContent, hashContent, readUserContext } from "./utils";

describe("Knowledge user context", () => {
  it("preserves human text through repeated file assembly and last-file removal", () => {
    const user =
      "Выручка изменилась после продажи подразделения.\nНовость: отчёт предварительный.";
    const initial = assembleContent(
      user,
      "Таблица из старого файла",
      "Первый вывод",
    );
    const next = assembleContent(
      readUserContext(initial),
      "Сведения оставшегося файла",
      "Новый вывод",
    );
    expect(readUserContext(next)).toBe(user);
    expect(next).not.toContain("старого файла");
    expect(assembleContent(readUserContext(next))).toBe(user);
  });
  it("treats unstructured initial text as human context", () => {
    expect(readUserContext("Моё пояснение")).toBe("Моё пояснение");
  });
  it("normalizes line endings and outer whitespace consistently", () => {
    expect(hashContent(" A\r\nB ")).toBe(hashContent("A\nB"));
    expect(hashContent("A\nC")).not.toBe(hashContent("A\nB"));
  });
});
