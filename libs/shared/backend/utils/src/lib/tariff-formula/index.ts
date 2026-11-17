import Decimal from "decimal.js";

const TariffDecimal = Decimal.clone({ precision: 128 });

export interface ITariffFormula {
  variables: string[];
  evaluate: (inputs: Record<string, string>) => Decimal;
}

type Operand =
  { literal: string } | { variable: string } | { operator: string };

export function compileTariffFormula(source: string): ITariffFormula {
  if (typeof source !== "string" || !source.trim() || source.length > 1024) {
    throw new Error("Missing or oversized price formula");
  }
  const pattern = /\s+|[a-z][a-z0-9_]*|(?:\d+(?:\.\d+)?|\.\d+)|[()+*/-]/gy;
  const output: Operand[] = [];
  const operators: string[] = [];
  const variables = new Set<string>();
  const precedence: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    neg: 3,
  };
  let offset = 0;
  let expectsValue = true;
  while (offset < source.length) {
    const match = pattern.exec(source);
    if (!match) {
      throw new Error("Invalid character in price formula");
    }
    offset = pattern.lastIndex;
    const token = match[0];
    if (!token.trim()) {
      continue;
    }
    if (token === "(" && expectsValue) {
      operators.push(token);
      continue;
    }
    if (token === "-" && expectsValue) {
      operators.push("neg");
      continue;
    }
    if (token === ")" && !expectsValue) {
      while (operators.length && operators.at(-1) !== "(") {
        output.push({ operator: operators.pop()! });
      }
      if (operators.pop() !== "(") {
        throw new Error("Unmatched closing parenthesis");
      }
      continue;
    }
    if (["+", "-", "*", "/"].includes(token) && !expectsValue) {
      while (
        operators.length &&
        precedence[operators.at(-1)!] >= precedence[token]
      ) {
        output.push({ operator: operators.pop()! });
      }
      operators.push(token);
      expectsValue = true;
      continue;
    }
    if (!expectsValue || !/^[a-z.0-9]/.test(token)) {
      throw new Error("Invalid operand in price formula");
    }
    if (/^[a-z]/.test(token)) {
      variables.add(token);
      output.push({ variable: token });
    } else {
      output.push({ literal: token });
    }
    expectsValue = false;
  }
  if (expectsValue || operators.includes("(")) {
    throw new Error("Incomplete price formula");
  }
  for (const operator of operators.reverse()) {
    output.push({ operator });
  }
  return {
    variables: [...variables],
    evaluate(inputs) {
      const values: Decimal[] = [];
      for (const item of output) {
        if ("literal" in item || "variable" in item) {
          let raw: string | undefined;
          if ("literal" in item) {
            raw = item.literal;
          } else if (Object.hasOwn(inputs, item.variable)) {
            raw = inputs[item.variable];
          }
          if (
            typeof raw !== "string" ||
            !/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw) ||
            raw.length > 100
          ) {
            throw new Error(
              "Missing or invalid input: " +
                ("variable" in item ? item.variable : item.literal),
            );
          }
          values.push(new TariffDecimal(raw));
          continue;
        }
        const right = values.pop()!;
        if (item.operator === "neg") {
          values.push(right.neg());
          continue;
        }
        const left = values.pop()!;
        switch (item.operator) {
          case "+":
            values.push(left.plus(right));
            break;
          case "-":
            values.push(left.minus(right));
            break;
          case "*":
            values.push(left.times(right));
            break;
          case "/":
            if (right.isZero()) {
              throw new Error("Division by zero in price formula");
            }
            values.push(left.div(right));
            break;
        }
      }
      const amount = values[0];
      if (
        values.length !== 1 ||
        !amount.isFinite() ||
        amount.isNegative() ||
        amount.gt("9007199254740991")
      ) {
        throw new Error("Invalid charge amount");
      }
      return amount;
    },
  };
}
