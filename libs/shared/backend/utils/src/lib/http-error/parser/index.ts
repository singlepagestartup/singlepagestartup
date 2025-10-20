import { ErrorCategory } from "../type";

export function parseCategoryFromMessage(
  message: string,
): ErrorCategory | undefined {
  const match = message.match(/^\[([^\]]+)\]/);
  if (match) {
    // Возвращаем только если есть в допустимых категориях
    const category = match[1] as ErrorCategory;
    // Можно сверять со списком реальных категорий по enum/array
    return category;
  }
  return undefined;
}
