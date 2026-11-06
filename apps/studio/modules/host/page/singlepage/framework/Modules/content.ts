import sourceText from "./page.md?raw";

export interface IFrameworkModule {
  id: string;
  name: string;
  responsibility: string;
  group: string;
  description: string;
  keywords: string;
}

export interface IModuleScene {
  label: string;
  title: string;
  description: string;
  rows: string[];
}

export interface IBusinessModuleGuide {
  article: IModuleCopySection;
  example: IModuleCopySection;
  scenes: IModuleScene[];
  related: IModuleCopySection;
  technical: IModuleCopySection;
  task: IModuleCopySection;
}

export interface IModuleCopySection {
  title: string;
  paragraphs: string[];
  items: { title: string; text: string }[];
}

export interface IModulesPageContent {
  introduction: IModuleCopySection;
  composition: IModuleCopySection;
  preparation: IModuleCopySection;
  guide: IModuleCopySection;
  labels: Record<string, string>;
  articles: Record<string, IModuleCopySection>;
  social: Record<string, IModuleCopySection>;
  guides: Record<string, IBusinessModuleGuide>;
}

function readRows(text: string): string[][] {
  return text
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .slice(2)
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
}

function readCopy(text: string): IModuleCopySection {
  const rows = text.split("\n").filter((line) => line.startsWith("|"));
  return {
    title: text.match(/^#{1,6} (.+)$/m)?.[1] ?? "",
    paragraphs: text
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter((part) => part && !/^(#|\|)/.test(part))
      .map((part) => part.replace(/\n/g, " ")),
    items: rows.slice(2).map((line) => {
      const [title, value] = line
        .split("|")
        .slice(1, -1)
        .map((part) => part.trim());
      return { title, text: value };
    }),
  };
}

export function parseModulesPage(text = sourceText): IModulesPageContent {
  const body = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
  const parts = body.split(/<!--\s*section:\s*([\w-]+)\s*-->/);
  const section: Record<string, IModuleCopySection> = {
    introduction: readCopy(parts[0]),
  };
  const raw: Record<string, string> = {};
  for (let index = 1; index < parts.length; index += 2) {
    raw[parts[index]] = parts[index + 1] ?? "";
    section[parts[index]] = readCopy(parts[index + 1] ?? "");
  }
  const empty = readCopy("");
  return {
    introduction: section.introduction,
    composition: section.composition,
    preparation: section.preparation,
    guide: section.guide,
    guides: Object.fromEntries(
      parseModules(text).map(({ id }) => [
        id,
        {
          article: section[`article-${id}`] ?? empty,
          example: section[`example-${id}`] ?? empty,
          scenes: readRows(raw[`scenes-${id}`] ?? "").map(
            ([label, title, description, rows]) => ({
              label,
              title,
              description,
              rows: (rows ?? "")
                .split(";")
                .map((row) => row.trim())
                .filter(Boolean),
            }),
          ),
          related: section[`related-${id}`] ?? empty,
          technical: section[`technical-${id}`] ?? empty,
          task: section[`task-${id}`] ?? empty,
        },
      ]),
    ),
    social: Object.fromEntries(
      Object.entries(section)
        .filter(([key]) => key.startsWith("social-"))
        .map(([key, value]) => [key.slice(7), value]),
    ),
    articles: Object.fromEntries(
      Object.entries(section)
        .filter(([key]) => key.startsWith("article-"))
        .map(([key, value]) => [key.slice(8), value]),
    ),
    labels: Object.fromEntries(
      section.controls.items.map(({ title, text }) => [title, text]),
    ),
  };
}

export function parseModules(text = sourceText): IFrameworkModule[] {
  return text
    .split(/<!--\s*section:/)[0]
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .slice(2)
    .map((line) => {
      const [id, name, responsibility, group, description = "", keywords = ""] =
        line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());
      return { id, name, responsibility, group, description, keywords };
    })
    .filter(
      (item) =>
        /^[a-z][a-z-]*$/.test(item.id) &&
        Boolean(item.name && item.responsibility && item.group),
    );
}

export function filterModules(
  modules: IFrameworkModule[],
  group: string,
  query: string,
): IFrameworkModule[] {
  const terms = query
    .toLocaleLowerCase("ru")
    .replaceAll("ё", "е")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return modules.filter((item) => {
    const searchable = [
      item.id,
      item.name,
      item.responsibility,
      item.description,
      item.keywords,
    ]
      .join(" ")
      .toLocaleLowerCase("ru")
      .replaceAll("ё", "е");
    return (
      (!group || item.group === group) &&
      terms.every((term) => searchable.includes(term))
    );
  });
}

export const frameworkModules = parseModules();

export function readModuleSlug(href?: string): string | undefined {
  if (!href) return;
  try {
    const match = new URL(href, "https://preview.invalid").pathname.match(
      /^\/framework\/modules\/([^/]+)\/?$/,
    );
    return match ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return "invalid-module-route";
  }
}
