interface IWebsiteItem {
  title: string;
  text: string;
}

interface IWebsiteLink {
  text: string;
  href: string;
}

interface IWebsiteSection {
  title: string;
  paragraphs: string[];
  items: IWebsiteItem[];
  links: IWebsiteLink[];
}

export interface IAIChatWebsiteContent {
  hero: IWebsiteSection;
  foundation: IWebsiteSection;
  workflow: IWebsiteSection;
  publish: IWebsiteSection;
  continue: IWebsiteSection;
  footer: IWebsiteSection;
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
    labels: Object.fromEntries(
      section("controls").items.map(({ title, text }) => [title, text]),
    ),
  };
}
