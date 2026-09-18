export function creativeBody(text: string): string {
  return text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "").trim();
}

export function creativeTitle(text: string): string {
  return creativeBody(text).match(/^#\s+(.+)$/m)?.[1] ?? "";
}

export function creativeParagraph(text: string): string {
  return (
    creativeBody(text)
      .split(/\n\s*\n/)
      .find((block) => !/^(#|!|\[|>|\|)/.test(block.trim()))
      ?.trim() ?? ""
  );
}

export function creativeAction(text: string): string {
  const body = creativeBody(text);
  return (
    body.match(/(?<!!)\[([^\]]+)\]\([^)]+\)/)?.[1] ??
    body.match(/^>\s+(.+)$/m)?.[1] ??
    ""
  );
}
