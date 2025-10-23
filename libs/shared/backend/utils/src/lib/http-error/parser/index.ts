import { ErrorCategory } from "../type";

export function parseCategoryFromMessage(
  message: string,
): ErrorCategory | undefined {
  const match = message.match(/^\[([^\]]+)\]/);
  if (match) {
    const category = match[1] as ErrorCategory;
    return category;
  }
  return undefined;
}
