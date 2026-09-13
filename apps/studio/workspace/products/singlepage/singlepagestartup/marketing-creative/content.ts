export interface ICreativeTextProps {
  text?: string;
}
export interface ICreativeCoverContent {
  title: string;
  description: string;
  action: string;
  image: { src: string; alt: string };
}
export interface IStoryboardScene {
  time: string;
  visual: string;
  screen: string;
  voiceover: string;
}
export interface IStoryboardContent {
  title: string;
  description: string;
  scenes: IStoryboardScene[];
  labels: string[];
  closing: string;
}
export const creativeAssets = {
  logo: "/workspace-assets/singlepage/generated/measured-space/singlepagestartup-primary-lockup.svg",
  conversation:
    "/workspace-assets/singlepage/generated/measured-space/singlepagestartup-photography-business-conversation.png",
  modules:
    "/workspace-assets/singlepage/generated/measured-space/singlepagestartup-illustration-module-hierarchy-v2.png",
  agents:
    "/workspace-assets/singlepage/generated/measured-space/singlepagestartup-illustration-coordinated-agents-v2.png",
  motion:
    "/workspace-assets/singlepage/generated/measured-space/singlepagestartup-photography-work-in-motion.png",
};
export const creativeTypography = {
  body: "[font-family:var(--workspace-brand-font-body)]",
  display: "[font-family:var(--workspace-brand-font-display)]",
};
export function creativeBody(text: string): string {
  return text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "").trim();
}
/** The Markdown owns every headline, supporting line, action and image caption. */
export function parseCreativeCover(text: string): ICreativeCoverContent {
  const body = creativeBody(text);
  const image = body.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  const action =
    body.match(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/)?.[1] ??
    body.match(/^>\s+(.+)$/m)?.[1] ??
    "";
  return {
    title: body.match(/^#\s+(.+)$/m)?.[1] ?? "",
    description:
      body
        .split(/\n\s*\n/)
        .find((block) => !/^(#|!|\[|>)/.test(block.trim()))
        ?.trim() ?? "",
    action,
    image: { src: image?.[2] ?? "", alt: image?.[1] ?? "" },
  };
}
/** Table columns remain the canonical scene order; prose after it stays visible. */
export function parseStoryboard(text: string): IStoryboardContent {
  const body = creativeBody(text);
  const lines = body.split("\n");
  const tableStart = lines.findIndex((line) => line.trim().startsWith("|"));
  const tableEnd = lines.findIndex(
    (line, index) => index > tableStart && !line.trim().startsWith("|"),
  );
  const end = tableEnd < 0 ? lines.length : tableEnd;
  const cells = (line: string) =>
    line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
  return {
    title: body.match(/^#\s+(.+)$/m)?.[1] ?? "",
    description: lines
      .slice(0, tableStart)
      .filter((line) => !line.startsWith("#"))
      .join(" ")
      .trim(),
    labels: tableStart < 0 ? [] : cells(lines[tableStart]),
    scenes:
      tableStart < 0
        ? []
        : lines.slice(tableStart + 2, end).map((line) => {
            const [time = "", visual = "", screen = "", voiceover = ""] =
              cells(line);
            return { time, visual, screen, voiceover };
          }),
    closing: tableStart < 0 ? "" : lines.slice(end).join("\n").trim(),
  };
}
