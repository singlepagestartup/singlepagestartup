import sourceText from "./page.md?raw";

export interface IFrameworkModule {
  id: string;
  name: string;
  responsibility: string;
  group: string;
}

interface IModuleCopySection {
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
  for (let index = 1; index < parts.length; index += 2)
    section[parts[index]] = readCopy(parts[index + 1] ?? "");
  return {
    introduction: section.introduction,
    composition: section.composition,
    preparation: section.preparation,
    guide: section.guide,
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
      const [id, name, responsibility, group] = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      return { id, name, responsibility, group };
    })
    .filter(
      (item) =>
        /^[a-z][a-z-]*$/.test(item.id) &&
        Boolean(item.name && item.responsibility && item.group),
    );
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
