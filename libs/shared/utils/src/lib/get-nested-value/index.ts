export function util(obj: any, path: string): any {
  return path
    .split(/[\.\[\]\'\"]/)
    .filter(Boolean)
    .reduce((acc, key) => (acc && acc[key] ? acc[key] : undefined), obj);
}
