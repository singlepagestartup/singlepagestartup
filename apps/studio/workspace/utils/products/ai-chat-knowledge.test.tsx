import { expect, test } from "bun:test";
import {
  editSourceUserContext,
  sourceMaterials,
  sourceUserContext,
} from "./ai-chat-knowledge";

test("user-context edits preserve file-derived content exactly", () => {
  const original =
    "## Контекст пользователя\n<!-- knowledge:user -->\nПервые занятия.\n<!-- /knowledge:user -->\n\n## Сведения из материалов\nШесть мест.\n\n## Общее описание\nКерамика.";
  const changed = editSourceUserContext(original, "Новые заметки 🙂");
  expect(sourceUserContext(changed)).toBe("Новые заметки 🙂");
  expect(sourceMaterials(changed)).toBe(sourceMaterials(original));
  expect(changed.slice(changed.indexOf("<!-- /knowledge:user -->"))).toBe(
    original.slice(original.indexOf("<!-- /knowledge:user -->")),
  );
  expect(editSourceUserContext("Plain notes", "Revised notes")).toBe(
    "Revised notes",
  );
  expect(sourceUserContext("Plain notes")).toBe("Plain notes");
  expect(sourceMaterials("Plain notes")).toBe("");
});
