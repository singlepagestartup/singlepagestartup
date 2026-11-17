/** Format an authoritative decimal amount without rounding or losing digits. */
export function formatCurrencyAmount(
  amount: string | number,
  language: string,
): string {
  const value = String(amount);
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) {
    return typeof amount === "number"
      ? new Intl.NumberFormat(language, { maximumFractionDigits: 20 }).format(
          amount,
        )
      : value;
  }

  const fraction = (match[3] ?? "").replace(/0+$/, "");
  const integer = BigInt(`${match[1]}${match[2]}`);
  const formatter = new Intl.NumberFormat(language, {
    maximumFractionDigits: 0,
  });
  const whole = formatter.format(
    match[1] && integer === 0n && fraction ? -0 : integer,
  );
  if (!fraction) return whole;

  const decimal = new Intl.NumberFormat(language)
    .formatToParts(1.1)
    .find((part) => part.type === "decimal")?.value;
  const digits = [...fraction]
    .map((digit) => formatter.format(Number(digit)))
    .join("");
  return `${whole}${decimal ?? "."}${digits}`;
}
