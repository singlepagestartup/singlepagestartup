export type MoneyAmount = string | number;

export function moneyMinorUnits(value: MoneyAmount, precision = 8): bigint {
  if (!Number.isInteger(precision) || precision < 0 || precision > 8) {
    throw new Error("Validation error. Invalid monetary precision");
  }
  let text = String(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Validation error. Invalid monetary amount");
    }
    text = value.toFixed(8);
    if (Number(text) !== value) {
      throw new Error(
        "Validation error. Monetary amount has unsupported precision",
      );
    }
  }
  if (!/^\d+(?:\.\d+)?$/.test(text)) {
    throw new Error("Validation error. Invalid monetary amount");
  }
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > precision && /[1-9]/.test(fraction.slice(precision))) {
    throw new Error(
      "Validation error. Payment provider cannot represent this amount",
    );
  }
  const scale = 10n ** BigInt(precision);
  const fractional = fraction.slice(0, precision).padEnd(precision, "0");
  return BigInt(whole) * scale + BigInt(fractional || "0");
}

export function moneyFromMinorUnits(value: bigint, precision = 8): number {
  if (value < 0n) {
    throw new Error("Validation error. Monetary amount cannot be negative");
  }
  const scale = 10n ** BigInt(precision);
  const text = `${value / scale}.${String(value % scale).padStart(precision, "0")}`;
  const amount = Number(text);
  if (
    !Number.isFinite(amount) ||
    moneyMinorUnits(amount, precision) !== value
  ) {
    throw new Error(
      "Validation error. Monetary amount exceeds the supported exact range",
    );
  }
  return amount;
}

export function moneyNumber(value: MoneyAmount): number {
  return moneyFromMinorUnits(moneyMinorUnits(value));
}

export function providerMinorUnits(value: MoneyAmount, precision = 2): number {
  const minor = moneyMinorUnits(value, precision);
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      "Validation error. Payment provider amount exceeds the supported range",
    );
  }
  return Number(minor);
}

export function addMoney(left: MoneyAmount, right: MoneyAmount): number {
  return moneyFromMinorUnits(moneyMinorUnits(left) + moneyMinorUnits(right));
}
