import { categoryStatus, type ErrorCategory } from "../type";

const aliases = new Map<string, ErrorCategory>([
  ["authorization error", "Authentication error"],
  ["forbidden error", "Permission error"],
  ["data integrity error", "Internal error"],
  ["internal server error", "Internal error"],
]);

export function parseCategoryFromMessage(message: string) {
  const prefix = message.match(
    /^(?:\[([^\]]+)\]|([a-z ]+ error|other)(?:[.:]|$))\s*/i,
  );
  if (!prefix) return;
  const name = (prefix[1] ?? prefix[2]).toLowerCase();
  const category =
    aliases.get(name) ??
    (Object.keys(categoryStatus) as ErrorCategory[]).find(
      (candidate) => candidate.toLowerCase() === name,
    );
  if (!category) return;
  const description = message.slice(prefix[0].length);
  return {
    category,
    message: description ? `${category}. ${description}` : category + ".",
  };
}
