import Decimal from "decimal.js";

const TariffDecimal = Decimal.clone({ precision: 128 });

interface ITariffInputBounds {
  min: string;
  max?: string;
}

export interface ITariffFormula {
  variables: string[];
  isLinearIn: (variable: string) => boolean;
  evaluate: (inputs: Record<string, string>) => Decimal;
  evaluateRange: (
    inputs: Record<string, ITariffInputBounds>,
  ) => { min: Decimal; max?: Decimal } | undefined;
}

type Operand =
  { literal: string } | { variable: string } | { operator: string };

interface IDecimalRange {
  min: Decimal;
  max: Decimal;
}

function isInput(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 100 &&
    /^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)
  );
}

function rangeOperation(
  operator: string,
  left: IDecimalRange,
  right: IDecimalRange,
): IDecimalRange | undefined {
  if (operator === "+") {
    return { min: left.min.plus(right.min), max: left.max.plus(right.max) };
  }
  if (operator === "-") {
    return { min: left.min.minus(right.max), max: left.max.minus(right.min) };
  }
  if (operator === "/" && right.min.lte(0) && right.max.gte(0)) {
    return undefined;
  }
  const endpoints: Decimal[] = [];
  for (const a of [left.min, left.max]) {
    for (const b of [right.min, right.max]) {
      if (operator === "/") {
        endpoints.push(a.div(b));
      } else if (a.isZero() || b.isZero()) {
        // Infinity denotes an open bound. A known zero times any finite input is zero.
        endpoints.push(new TariffDecimal(0));
      } else {
        endpoints.push(a.times(b));
      }
    }
  }
  if (endpoints.some((value) => value.isNaN())) {
    return undefined;
  }
  return {
    min: TariffDecimal.min(...endpoints),
    max: TariffDecimal.max(...endpoints),
  };
}

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
  const formula: ITariffFormula = {
    variables: [...variables],
    isLinearIn(variable) {
      const dependent: boolean[] = [];
      for (const item of output) {
        if (!("operator" in item)) {
          dependent.push("variable" in item && item.variable === variable);
        } else if (item.operator !== "neg") {
          const right = dependent.pop()!;
          const left = dependent.pop()!;
          if (
            (item.operator === "*" && left && right) ||
            (item.operator === "/" && right)
          ) {
            return false;
          }
          dependent.push(left || right);
        }
      }
      return dependent[0] === true;
    },
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
          if (!isInput(raw)) {
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

    evaluateRange(inputs) {
      const lows: Record<string, string> = {};
      const highs: Record<string, string> = {};
      const values: IDecimalRange[] = [];
      for (const item of output) {
        if ("literal" in item) {
          const value = new TariffDecimal(item.literal);
          values.push({ min: value, max: value });
        } else if ("variable" in item) {
          const bounds =
            Object.hasOwn(inputs, item.variable) && inputs[item.variable];
          if (
            !bounds ||
            !isInput(bounds.min) ||
            (bounds.max !== undefined && !isInput(bounds.max))
          ) {
            return undefined;
          }
          const min = new TariffDecimal(bounds.min);
          const max = new TariffDecimal(bounds.max ?? Infinity);
          if (max.lt(min)) {
            return undefined;
          }
          values.push({ min, max });
          lows[item.variable] = bounds.min;
          if (bounds.max !== undefined) {
            highs[item.variable] = bounds.max;
          }
        } else {
          const right = values.pop()!;
          if (item.operator === "neg") {
            values.push({ min: right.max.neg(), max: right.min.neg() });
            continue;
          }
          const result = rangeOperation(item.operator, values.pop()!, right);
          if (!result) {
            return undefined;
          }
          values.push(result);
        }
      }
      const bound = values[0];
      if (
        !bound.min.isFinite() ||
        bound.min.isNegative() ||
        bound.min.gt("9007199254740991")
      ) {
        return undefined;
      }

      // A conservative interval can include impossible prices, e.g. q / q for
      // q in [1, 2]. Advertise a minimum only if actual inputs attain it.
      for (const candidate of [lows, highs]) {
        if (variables.size !== Object.keys(candidate).length) {
          continue;
        }
        try {
          if (formula.evaluate(candidate).eq(bound.min)) {
            return {
              min: bound.min,
              max: bound.max.isFinite() ? bound.max : undefined,
            };
          }
        } catch {
          // An endpoint can be outside the formula's valid charge domain.
        }
      }
      return undefined;
    },
  };
  return formula;
}
