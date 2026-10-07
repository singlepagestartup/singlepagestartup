const USER_BLOCK =
  /^## Контекст пользователя\n<!-- knowledge:user -->\n([\s\S]*?)\n<!-- \/knowledge:user -->/;

export function readKnowledgeUserContext(content: string) {
  const match = content.match(USER_BLOCK);
  return match ? match[1] : content;
}

export function readKnowledgeMaterials(content: string) {
  const match = content.match(USER_BLOCK);
  return match ? content.slice(match[0].length).trim() : "";
}

export function replaceKnowledgeUserContext(content: string, context: string) {
  const match = content.match(USER_BLOCK);
  if (!match) return context;
  return `## Контекст пользователя\n<!-- knowledge:user -->\n${context}\n<!-- /knowledge:user -->${content.slice(match[0].length)}`;
}

export function assembleKnowledgeContent(
  context: string,
  materials = "",
  overview = "",
) {
  if (!materials && !overview) return context;
  return [
    `## Контекст пользователя\n<!-- knowledge:user -->\n${context}\n<!-- /knowledge:user -->`,
    `## Сведения из материалов\n${materials}`,
    overview ? `## Общее описание\n${overview}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
