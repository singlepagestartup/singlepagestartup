import { parse } from "yaml";

export type PortfolioLayer = "singlepage" | "startup";
export type PortfolioDirectionRole =
  | "audience-program"
  | "internal-operation"
  | "product";
export type PortfolioDirectionLifecycle = "active" | "deferred" | "future";

export interface IPortfolioDirection {
  id: string;
  lifecycle: PortfolioDirectionLifecycle;
  name: string;
  research: string;
  role: PortfolioDirectionRole;
  sales?: string;
  summary: string;
}

export interface IPortfolioCatalog {
  directions: IPortfolioDirection[];
  layer: PortfolioLayer;
  schema: "singlepagestartup.portfolio.v1";
}

function safeRelativePath(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.startsWith("/") ||
    value.split(/[\\/]/).includes("..")
  ) {
    throw new Error(`${field} must be a safe layer-relative path`);
  }
  return value.replaceAll("\\", "/");
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function parsePortfolioCatalog(
  source: string,
  layer: PortfolioLayer,
): IPortfolioCatalog {
  const value = parse(source) as Record<string, unknown> | null;
  if (value?.schema !== "singlepagestartup.portfolio.v1") {
    throw new Error(`${layer} portfolio uses an unsupported schema`);
  }
  if (!Array.isArray(value.directions)) {
    throw new Error(`${layer} portfolio directions must be an array`);
  }

  const ids = new Set<string>();
  const directions = value.directions.map((raw, index) => {
    const direction = raw as Record<string, unknown>;
    const id = requiredString(direction.id, `${layer}.directions[${index}].id`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`${layer} direction ${id} must use kebab-case`);
    }
    if (ids.has(id)) throw new Error(`${layer} repeats direction ${id}`);
    ids.add(id);

    const role = direction.role;
    if (
      !["product", "audience-program", "internal-operation"].includes(
        String(role),
      )
    ) {
      throw new Error(`${layer} direction ${id} has an unsupported role`);
    }
    const lifecycle = direction.lifecycle;
    if (!["active", "future", "deferred"].includes(String(lifecycle))) {
      throw new Error(`${layer} direction ${id} has an unsupported lifecycle`);
    }
    const sales =
      direction.sales == null
        ? undefined
        : safeRelativePath(direction.sales, `${layer}.${id}.sales`);
    if (role === "product" && lifecycle === "active" && !sales) {
      throw new Error(`${layer} active product ${id} needs a sales process`);
    }
    if ((role !== "product" || lifecycle !== "active") && sales) {
      throw new Error(
        `${layer} direction ${id} may define sales only as an active product`,
      );
    }
    return {
      id,
      lifecycle: lifecycle as PortfolioDirectionLifecycle,
      name: requiredString(direction.name, `${layer}.${id}.name`),
      research: safeRelativePath(direction.research, `${layer}.${id}.research`),
      role: role as PortfolioDirectionRole,
      sales,
      summary: requiredString(direction.summary, `${layer}.${id}.summary`),
    };
  });

  return {
    directions,
    layer,
    schema: "singlepagestartup.portfolio.v1",
  };
}

export function resolvePortfolioCatalog(
  singlepage: IPortfolioCatalog,
  startup: IPortfolioCatalog,
): { catalog: IPortfolioCatalog; inherited: boolean } {
  return startup.directions.length > 0
    ? { catalog: startup, inherited: false }
    : { catalog: singlepage, inherited: true };
}

export function activeProductDirection(
  catalog: IPortfolioCatalog,
  productId: string,
): IPortfolioDirection {
  const direction = catalog.directions.find(({ id }) => id === productId);
  if (
    !direction ||
    direction.role !== "product" ||
    direction.lifecycle !== "active" ||
    !direction.sales
  ) {
    throw new Error(
      `${catalog.layer} product ${productId} must match one active portfolio product with research and sales`,
    );
  }
  return direction;
}
