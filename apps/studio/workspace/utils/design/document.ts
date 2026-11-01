import { parseDocument } from "../../../../../tools/studio/workspace/document";

export const designDocumentStructure = {
  "Общие правила дизайна": ["Идея и характер бренда"],
  "Применение фирменных элементов": ["Названия и логотипные блоки"],
  "Визуальная система": ["Цвета по назначению", "Типографика"],
  Иконки: [],
  "Интерфейс и поверхности продуктов": [
    "Назначение и границы доказательств",
    "Поверхности, плотность и форма",
    "Элементы управления, состояния и действия",
    "Формы, коллекции и связанные записи",
    "Приёмы из референсов",
    "Применение компонентов",
  ],
  Фотография: [
    "Назначение и границы доказательств",
    "Основной промпт стиля",
    "Требования к производству",
    "Примеры генерации",
  ],
  "Иллюстрации и схемы": [
    "Назначение и границы доказательств",
    "Основной промпт стиля",
    "Требования к производству",
    "Примеры генерации",
  ],
} as const;

function range(source: string, heading: string) {
  const lines = source.split("\n");
  const start = lines.findIndex(
    (line) =>
      /^#{2,3} /.test(line) && line.replace(/^#+ /, "").trim() === heading,
  );
  if (start < 0) return { lines, start: -1, end: -1 };
  const level = lines[start].match(/^#+/)![0].length;
  let end = start + 1;
  while (end < lines.length) {
    const nextLevel = lines[end].match(/^(#{2,3}) /)?.[1].length;
    if (nextLevel !== undefined && nextLevel <= level) break;
    end++;
  }
  return { lines, start, end };
}
function section(source: string, heading: string) {
  const { lines, start, end } = range(source, heading);
  return start < 0
    ? ""
    : lines
        .slice(start + 1, end)
        .join("\n")
        .trim();
}
function withoutSection(source: string, heading: string) {
  const { lines, start, end } = range(source, heading);
  return start < 0
    ? source
    : [...lines.slice(0, start), ...lines.slice(end)].join("\n").trim();
}
/** Swatches and font specimens display the first table; surrounding prose stays beside them. */
function withoutFirstTable(source: string) {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.trim().startsWith("|"));
  if (start < 0) return source;
  let end = start;
  while (end < lines.length && lines[end].trim().startsWith("|")) end++;
  return [...lines.slice(0, start), ...lines.slice(end)].join("\n").trim();
}
export function designDocumentNotes(source: string) {
  const body = parseDocument(source).body;
  return {
    overview: withoutSection(
      section(body, "Общие правила дизайна"),
      "Идея и характер бренда",
    ),
    logos: section(body, "Названия и логотипные блоки"),
    colors: withoutFirstTable(section(body, "Цвета по назначению")),
    typography: withoutFirstTable(section(body, "Типографика")),
    icons: section(body, "Иконки"),
    interface: withoutSection(
      section(body, "Интерфейс и поверхности продуктов"),
      "Приёмы из референсов",
    ),
    photography: section(
      section(body, "Фотография"),
      "Требования к производству",
    ),
    illustration: section(
      section(body, "Иллюстрации и схемы"),
      "Требования к производству",
    ),
  };
}
export type IDesignDocumentNotes = ReturnType<typeof designDocumentNotes>;
/** Fail on structural drift instead of silently hiding prose from the visual page. */
export function validateDesignDocument(source: string) {
  const body = parseDocument(source).body.replace(/<!--[\s\S]*?-->/g, "");
  const actual = [...body.matchAll(/^(#{2,}) (.+)$/gm)].map(
    (match) => `${match[1]} ${match[2].trim()}`,
  );
  const expected = Object.entries(designDocumentStructure).flatMap(
    ([title, children]) => [
      `## ${title}`,
      ...children.map((child) => `### ${child}`),
    ],
  );
  if (actual.join("\n") !== expected.join("\n"))
    throw new Error(
      "Структура Дизайна отличается от .agents/templates/design.md. Сохраните заголовки и порядок: каждый раздел показан рядом со своим образцом.",
    );
}
