import type { IProjectDocumentDefinition } from "./ai-chat-workspace";
export { default as AI_CHAT_DOCUMENT_GUIDES } from "./ai-chat-document-guides.generated.json";

interface IWebsiteItem {
  title: string;
  text: string;
}

interface IWebsiteLink {
  text: string;
  href: string;
}

export interface IWebsiteSection {
  title: string;
  paragraphs: string[];
  items: IWebsiteItem[];
  links: IWebsiteLink[];
}

export interface IAIChatServicePageContent {
  sections: Record<string, IWebsiteSection>;
  labels: Record<string, string>;
}

export interface IProjectDocumentGuide {
  title: string;
  body: string;
  basis?: string;
  sections: Record<string, string>;
}

export function parseProjectDocumentGuides(
  text: string,
): Record<string, IProjectDocumentGuide> {
  const parts = text.split(/<!--\s*document:\s*([\w-]+)\s*-->/);
  const guides: Record<string, IProjectDocumentGuide> = {};
  for (let index = 1; index < parts.length; index += 2) {
    const id = parts[index];
    if (guides[id]) throw new Error(`Duplicate document guide: ${id}`);
    const fields = parts[index + 1].split(/<!--\s*section:\s*([^>]+?)\s*-->/);
    const title = fields[0].match(/^# (.+)$/m)?.[1];
    const body = fields[0].replace(/^# [^\n]+\n/m, "").trim();
    if (!title || !body) throw new Error(`Incomplete document guide: ${id}`);
    const sections: Record<string, string> = {};
    for (let field = 1; field < fields.length; field += 2) {
      const name = fields[field].trim();
      if (sections[name] || !fields[field + 1]?.trim())
        throw new Error(`Invalid section guide: ${id} / ${name}`);
      sections[name] = fields[field + 1].trim();
    }
    guides[id] = {
      title,
      body,
      basis: body.split(/\n## Basis\n/)[1]?.trim(),
      sections,
    };
  }
  return guides;
}

export function projectDocumentGuide(
  guides: Record<string, IProjectDocumentGuide>,
  documentId: string,
): IProjectDocumentGuide | undefined {
  return guides[
    documentId.startsWith("product-") || documentId.includes("-product-")
      ? "product"
      : documentId
  ];
}

export function validateProjectDocumentGuides(
  definitions: Record<string, IProjectDocumentDefinition>,
  guides: Record<string, IProjectDocumentGuide>,
) {
  if (Object.keys(definitions).join("\n") !== Object.keys(guides).join("\n"))
    throw new Error("AI Chat document definitions and guides must match.");
  for (const [id, definition] of Object.entries(definitions)) {
    const sections = definition.sections.map((section) => section.title);
    if (sections.join("\n") !== Object.keys(guides[id].sections).join("\n"))
      throw new Error(`AI Chat section definitions and guides differ: ${id}`);
  }
}

export function parseProjectDocumentDefinitions(
  text: string,
): Record<string, IProjectDocumentDefinition> {
  const parts = text.split(/<!--\s*document:\s*([\w-]+)\s*-->/);
  const definitions: Record<string, IProjectDocumentDefinition> = {};
  for (let index = 1; index < parts.length; index += 2) {
    const section = parseSection(parts[index + 1] ?? "");
    definitions[parts[index]] = {
      id: parts[index],
      title: section.title.replace(/\.md$/, ""),
      sections: section.items.map((item) => ({
        title: item.title,
        prompt: item.text,
      })),
    };
  }
  return definitions;
}

export function parseAIChatServicePage(
  text: string,
): IAIChatServicePageContent {
  const body = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
  const parts = body.split(/<!--\s*section:\s*([\w-]+)\s*-->/);
  const sections: Record<string, IWebsiteSection> = {};
  for (let index = 1; index < parts.length; index += 2) {
    sections[parts[index]] = parseSection(parts[index + 1] ?? "");
  }
  if (!sections.hero || !sections.controls) {
    throw new Error("AI Chat service page needs hero and controls sections.");
  }
  return {
    sections,
    labels: Object.fromEntries(
      sections.controls.items.map(({ title, text }) => [title, text]),
    ),
  };
}

export interface IAIChatWebsiteContent {
  hero: IWebsiteSection;
  foundation: IWebsiteSection;
  workflow: IWebsiteSection;
  publish: IWebsiteSection;
  continue: IWebsiteSection;
  footer: IWebsiteSection;
  terms: IWebsiteSection;
  demoFiles: IWebsiteSection;
  demoDraft: IWebsiteSection;
  demoDocuments: IWebsiteSection;
  demoConversation: IWebsiteSection;
  demoReadyDocument: IWebsiteSection;
  demoThreadPrompts: IWebsiteSection;
  demoThreadInputs: IWebsiteSection;
  labels: Record<string, string>;
}

function parseSection(markdown: string): IWebsiteSection {
  const title = markdown.match(/^#{1,6}\s+(.+)$/m)?.[1] ?? "";
  const paragraphs = markdown
    .trim()
    .split(/\n\s*\n/)
    .filter((block) => !/^(#|\||\[)/.test(block.trim()))
    .map((block) => block.trim().replace(/\n/g, " "));
  const table = markdown
    .split("\n")
    .filter((line) => line.trim().startsWith("|"));
  const items = table.slice(2).map((line) => {
    const [title = "", text = ""] = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    return { title, text };
  });
  const links = [...markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(
    (match) => ({ text: match[1], href: match[2] }),
  );
  return { title, paragraphs, items, links };
}

export function parseAIChatWebsite(text: string): IAIChatWebsiteContent {
  const body = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
  const parts = body.split(/<!--\s*section:\s*([\w-]+)\s*-->/);
  const sections: Record<string, IWebsiteSection> = {};
  for (let index = 1; index < parts.length; index += 2) {
    sections[parts[index]] = parseSection(parts[index + 1] ?? "");
  }
  const section = (id: string) => {
    if (!sections[id])
      throw new Error(`AI Chat landing text is missing its ${id} section.`);
    return sections[id];
  };
  return {
    hero: section("hero"),
    foundation: section("foundation"),
    workflow: section("workflow"),
    publish: section("publish"),
    continue: section("continue"),
    footer: section("footer"),
    terms: sections.terms ?? parseSection(""),
    demoFiles: sections["demo-files"] ?? parseSection(""),
    demoDraft: sections["demo-draft"] ?? parseSection(""),
    demoDocuments: sections["demo-documents"] ?? parseSection(""),
    demoConversation: sections["demo-conversation"] ?? parseSection(""),
    demoReadyDocument: section("demo-ready-document"),
    demoThreadPrompts: section("demo-thread-prompts"),
    demoThreadInputs: section("demo-thread-inputs"),
    labels: Object.fromEntries(
      section("controls").items.map(({ title, text }) => [title, text]),
    ),
  };
}
