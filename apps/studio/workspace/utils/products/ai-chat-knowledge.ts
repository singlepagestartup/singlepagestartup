// Mirrors Knowledge content markers; Studio has no dependency on the production helper.
const USER_BLOCK =
  /^## Контекст пользователя\n<!-- knowledge:user -->\n([\s\S]*?)\n<!-- \/knowledge:user -->/;

export function sourceUserContext(content: string): string {
  return content.match(USER_BLOCK)?.[1] ?? content;
}
export function sourceMaterials(content: string): string {
  const block = content.match(USER_BLOCK);
  return block ? content.slice(block[0].length).trim() : "";
}
export function editSourceUserContext(
  content: string,
  context: string,
): string {
  const block = content.match(USER_BLOCK);
  return block
    ? `## Контекст пользователя\n<!-- knowledge:user -->\n${context}\n<!-- /knowledge:user -->${content.slice(block[0].length)}`
    : context;
}
