interface IBalancedGroup {
  content: string;
  endIndex: number;
}

function readBalancedGroup(
  value: string,
  startIndex: number,
): IBalancedGroup | null {
  if (value[startIndex] !== "{") {
    return null;
  }

  let depth = 0;

  for (let index = startIndex; index < value.length; index += 1) {
    if (value[index] === "{") {
      depth += 1;
    } else if (value[index] === "}") {
      depth -= 1;

      if (depth === 0) {
        return {
          content: value.slice(startIndex + 1, index),
          endIndex: index + 1,
        };
      }
    }
  }

  return null;
}

function readBalancedGroupAfterWhitespace(value: string, startIndex: number) {
  let groupStartIndex = startIndex;

  while (/\s/.test(value[groupStartIndex] || "")) {
    groupStartIndex += 1;
  }

  return readBalancedGroup(value, groupStartIndex);
}

function replaceUnaryLatexCommand(value: string, command: string) {
  let result = "";
  let cursor = 0;

  while (cursor < value.length) {
    const commandIndex = value.indexOf(command, cursor);

    if (commandIndex < 0) {
      result += value.slice(cursor);
      break;
    }

    const group = readBalancedGroupAfterWhitespace(
      value,
      commandIndex + command.length,
    );

    if (!group) {
      result += value.slice(cursor, commandIndex + command.length);
      cursor = commandIndex + command.length;
      continue;
    }

    result += value.slice(cursor, commandIndex);
    result += group.content;
    cursor = group.endIndex;
  }

  return result;
}

function replaceLatexFractions(value: string): string {
  let result = "";
  let cursor = 0;

  while (cursor < value.length) {
    const commandIndex = value.indexOf("\\frac", cursor);

    if (commandIndex < 0) {
      result += value.slice(cursor);
      break;
    }

    const numerator = readBalancedGroupAfterWhitespace(
      value,
      commandIndex + "\\frac".length,
    );
    const denominator = numerator
      ? readBalancedGroupAfterWhitespace(value, numerator.endIndex)
      : null;

    if (!numerator || !denominator) {
      result += value.slice(cursor, commandIndex + "\\frac".length);
      cursor = commandIndex + "\\frac".length;
      continue;
    }

    result += value.slice(cursor, commandIndex);
    result += `(${normalizeLatexExpression(numerator.content)}) / (${normalizeLatexExpression(
      denominator.content,
    )})`;
    cursor = denominator.endIndex;
  }

  return result;
}

function normalizeLatexExpression(value: string): string {
  let result = value
    .replace(/\\begin\{(?:aligned|align\*?|equation\*?)\}/g, "")
    .replace(/\\end\{(?:aligned|align\*?|equation\*?)\}/g, "")
    .replace(/\\displaystyle\b/g, "");

  result = replaceLatexFractions(result);

  for (const command of ["\\text", "\\textrm", "\\mathrm", "\\operatorname"]) {
    result = replaceUnaryLatexCommand(result, command);
  }

  return result
    .replace(/\\times\b/g, "×")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\div\b/g, "÷")
    .replace(/\\pm\b/g, "±")
    .replace(/\\(?:leq|le)\b/g, "≤")
    .replace(/\\(?:geq|ge)\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\to\b/g, "→")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\%/g, "%")
    .replace(/\\(?:quad|qquad)\b/g, " ")
    .replace(/\\[,;!]/g, " ")
    .replace(/\\\\/g, " ")
    .replace(/\^\{([^{}]+)\}/g, "^($1)")
    .replace(/_\{([^{}]+)\}/g, "_($1)")
    .replace(/[{}]/g, "")
    .replace(/[ \t\n]+/g, " ")
    .trim();
}

/**
 * Converts model-generated display math into portable Markdown text.
 *
 * SPS stores one canonical message for both the web chat and Telegram. Neither
 * transport has a shared LaTeX renderer, so keeping raw `\\[...\\]` syntax in
 * the message makes the same response unreadable in both clients.
 */
export function normalizeAiResponseText(value?: string | null): string {
  const normalizedValue = (value || "").replace(/\r\n/g, "\n");

  return normalizedValue
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression: string) => {
      return `\n\n${normalizeLatexExpression(expression)}\n\n`;
    })
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, expression: string) => {
      return `\n\n${normalizeLatexExpression(expression)}\n\n`;
    })
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expression: string) => {
      return normalizeLatexExpression(expression);
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
