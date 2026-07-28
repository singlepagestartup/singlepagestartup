export function util(current: number, total: number): (number | string)[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 2) {
    return [1, 2, 3, "...", total];
  }
  if (current === 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current > 3 && current < total - 2) {
    return [1, "...", current - 1, current, current + 1, "...", total];
  }
  if (current === total - 2) {
    return [1, "...", current - 1, current, current + 1, total];
  }
  // current >= total - 1
  return [1, "...", total - 2, total - 1, total];
}
