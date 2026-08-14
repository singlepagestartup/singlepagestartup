export interface ILayeredComponentModule<TComponent> {
  default?: TComponent;
}

export interface ILayeredComponentResolution<TComponent> {
  basePath: string;
  modules: Record<string, ILayeredComponentModule<TComponent>>;
  overridePath: string;
}

export function resolveLayeredComponent<TComponent>({
  basePath,
  modules,
  overridePath,
}: ILayeredComponentResolution<TComponent>): TComponent {
  const resolved = modules[overridePath]?.default ?? modules[basePath]?.default;
  if (!resolved) {
    throw new Error(`Layered component base is missing: ${basePath}`);
  }
  return resolved;
}
