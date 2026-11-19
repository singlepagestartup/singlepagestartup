import type { Tree } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import ts from "typescript";
import { modelGenerator } from "../../generators/model/generator";
import { moduleGenerator } from "../../generators/module/generator";
import { relationGenerator } from "../../generators/relation/generator";
import { moduleDependencyContract, synchronizeServiceRegistries } from ".";

const salesRelation = {
  module: "sales",
  relation_name: "receipts-to-details",
  left_module_name: "sales",
  left_model_name: "receipt",
  right_module_name: "sales",
  right_model_name: "detail",
};
const servicePath = "backend/app/api/src/lib/service";
const registryPath = "backend/app/api/src/lib";

function read(tree: Tree, path: string) {
  const source = tree.read(path, "utf8");
  if (source === null) {
    throw new Error(`Missing generated file ${path}`);
  }
  return source;
}

function compile(tree: Tree, entry: string) {
  const root = process.cwd();
  const config = ts.parseConfigFileTextToJson(
    "tsconfig.base.json",
    read(tree, "tsconfig.base.json"),
  );
  const { options, errors } = ts.convertCompilerOptionsFromJson(
    { ...config.config.compilerOptions, noEmit: true },
    root,
  );
  const host = ts.createCompilerHost(options);
  const filesystemRead = host.readFile;
  const filesystemExists = host.fileExists;
  const filesystemDirectoryExists = host.directoryExists;
  function treePath(file: string) {
    const candidate = relative(root, file);
    if (!candidate.startsWith("..") && !isAbsolute(candidate)) {
      return candidate;
    }
  }
  host.readFile = (file) => {
    const local = treePath(file);
    return (local && tree.read(local, "utf8")) || filesystemRead(file);
  };
  host.fileExists = (file) => {
    const local = treePath(file);
    return Boolean(local && tree.isFile(local)) || filesystemExists(file);
  };
  host.directoryExists = (directory) => {
    const local = treePath(directory);
    return (
      Boolean(local && tree.children(local).length) ||
      Boolean(filesystemDirectoryExists?.(directory))
    );
  };
  const program = ts.createProgram([resolve(root, entry)], options, host);
  return ts.formatDiagnosticsWithColorAndContext(
    [...errors, ...ts.getPreEmitDiagnostics(program)],
    host,
  );
}

it("generates scoped, typed registries and refreshes them when entities change", async () => {
  const tree = createTreeWithEmptyWorkspace();
  tree.write("tsconfig.base.json", readFileSync("tsconfig.base.json"));
  tree.write(
    "apps/api/app.ts",
    "export const app = {};\nconst apiModules = {};\n",
  );
  tree.write(
    moduleDependencyContract,
    "1. `observer`\n2. `sales`\n3. `ledger`\n",
  );
  const previousNxDryRun = process.env.NX_DRY_RUN;
  process.env.NX_DRY_RUN = "true";
  try {
    for (const module of ["observer", "sales", "ledger"]) {
      await moduleGenerator(tree, { module, action: "create" });
    }
    for (const [module, name] of [
      ["observer", "worker"],
      ["sales", "receipt"],
      ["sales", "detail"],
      ["ledger", "order"],
    ]) {
      await modelGenerator(tree, { module, name, action: "create" });
    }
    await relationGenerator(tree, { ...salesRelation, action: "create" });

    const order = `libs/modules/ledger/models/order/${servicePath}/startup/index.ts`;
    const detail = `libs/modules/sales/models/detail/${servicePath}/startup/index.ts`;
    tree.write(
      order,
      read(tree, order).replace(
        "extends ParentService {}",
        'extends ParentService { quote(cents: number) { return { cents, currency: "USD" as const }; } }',
      ),
    );
    tree.write(
      detail,
      read(tree, detail).replace(
        "extends ParentService {}",
        "extends ParentService { check(id: number) { return { id, ready: true as const }; } }",
      ),
    );
    const entry = "compiler-probe.ts";
    tree.write(
      entry,
      `
      import { Service as Worker } from "@sps/observer/models/worker/${servicePath}";
      import { Service as Receipt } from "@sps/sales/models/receipt/${servicePath}";
      import { Service as Detail } from "@sps/sales/models/detail/${servicePath}";
      import { Service as ReceiptsToDetails } from "@sps/sales/relations/receipts-to-details/${servicePath}";
      type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
        (<T>() => T extends B ? 1 : 2) ? true : false;
      type Assert<T extends true> = T;
      class ObserverWorker extends Worker {
        quote() {
          const result = this.modules.ledger.order.quote(42);
          type Exact = Assert<Equal<typeof result, { cents: number; currency: "USD" }>>;
          this.modules.sales.receiptsToDetails;
          // @ts-expect-error the Order startup method requires a number
          this.modules.ledger.order.quote("42");
          // @ts-expect-error the worker does not receive its own module
          this.modules.observer.worker;
          return result;
        }
      }
      class SalesReceipt extends Receipt {
        check() {
          this.module.receiptsToDetails;
          const result = this.module.detail.check(42);
          type Exact = Assert<Equal<typeof result, { id: number; ready: true }>>;
          // @ts-expect-error the Detail startup method requires a number
          this.module.detail.check("42");
          this.modules.ledger.order.quote(42);
          // @ts-expect-error Sales is below Observer
          this.modules.observer.worker;
          // @ts-expect-error same-module access has a separate flat view
          this.modules.sales.detail;
          // @ts-expect-error a parent does not receive itself
          this.module.receipt;
        }
      }
      class SalesDetail extends Detail {
        verify() {
          // @ts-expect-error a leaf needs no same-module registry
          this.module;
          // @ts-expect-error the child cannot access its incoming relation through modules
          this.modules.sales.receiptsToDetails;
        }
      }
      class SalesReceiptDetail extends ReceiptsToDetails {
        check() {
          this.module.detail;
          // @ts-expect-error the relation cannot assemble its parent
          this.module.receipt;
        }
      }
    `,
    );
    expect(compile(tree, entry)).toBe("");

    const ownerServices = `libs/modules/sales/${registryPath}/services.ts`;
    const receiptService = `libs/modules/sales/models/receipt/${servicePath}`;
    const receiptView = `${receiptService}/module.ts`;
    const receiptClass = `${receiptService}/singlepage/index.ts`;
    const legacy = `${receiptService}/modules.ts`;
    const initial = read(tree, ownerServices);
    const relationFactory =
      'import { createService as createReceiptsToDetailsService } from "@sps/sales/relations/receipts-to-details/backend/app/api/src/lib/bootstrap";';
    expect(initial).toContain(relationFactory);
    expect(read(tree, receiptView)).toContain(relationFactory);
    expect(read(tree, receiptView)).not.toContain("createModules");
    expect(read(tree, receiptView)).toContain("export function createModule(");
    const expectedService = read(tree, receiptClass);
    const generatedLocalView = read(tree, receiptView);
    const customizedView = "export const handmade = true;\n";
    tree.write(receiptView, customizedView);
    expect(() => synchronizeServiceRegistries(tree)).toThrow(
      `Cannot overwrite a manually maintained registry in ${receiptView}`,
    );
    expect(read(tree, receiptView)).toBe(customizedView);
    expect(read(tree, receiptClass)).toBe(expectedService);
    tree.write(receiptView, generatedLocalView);
    const conflicting = expectedService.replace(
      'from "@sps/sales/backend/app/api/src/lib/modules";',
      'from "./custom";',
    );
    tree.write(receiptClass, conflicting);
    expect(() => synchronizeServiceRegistries(tree)).toThrow(
      `Conflicting createModules import in ${receiptClass}`,
    );
    expect(read(tree, receiptClass)).toBe(conflicting);
    expect(read(tree, receiptView)).toBe(generatedLocalView);
    tree.write(legacy, generatedLocalView);
    tree.delete(receiptView);
    tree.write(
      receiptClass,
      expectedService
        .replace('import { createModule } from "../module";\n', "")
        .replace(
          'import { createModules } from "@sps/sales/backend/app/api/src/lib/modules";',
          "import {\n  createModules,\n} from '../modules';",
        )
        .replace(/\n\n  get module\(\) \{[^}]+\}/, ""),
    );
    await relationGenerator(tree, { ...salesRelation, action: "create" });
    expect(tree.isFile(legacy)).toBe(false);
    expect(read(tree, receiptView)).toBe(generatedLocalView);
    expect(read(tree, receiptClass)).toContain(
      'from "@sps/sales/backend/app/api/src/lib/modules"',
    );
    expect(read(tree, receiptClass)).toContain("get module()");
    expect(compile(tree, entry)).toBe("");
    const before = tree.listChanges();
    synchronizeServiceRegistries(tree);
    expect(tree.listChanges()).toEqual(before);
    await relationGenerator(tree, { ...salesRelation, action: "create" });
    expect(read(tree, ownerServices)).toBe(initial);
    expect(initial.match(/get receiptsToDetails\(/g)).toHaveLength(1);

    await relationGenerator(tree, { ...salesRelation, action: "remove" });
    expect(read(tree, ownerServices)).not.toContain("receiptsToDetails");
    expect(tree.isFile(receiptView)).toBe(false);
    expect(read(tree, receiptClass)).not.toContain("get module()");
    expect(read(tree, receiptClass)).not.toContain('"../module"');
    await modelGenerator(tree, {
      module: "sales",
      name: "detail",
      action: "remove",
    });
    expect(read(tree, ownerServices)).not.toContain("get detail()");
    await moduleGenerator(tree, { module: "ledger", action: "remove" });
    expect(
      read(tree, `libs/modules/sales/${registryPath}/modules.ts`),
    ).not.toContain("ledger");
  } finally {
    if (previousNxDryRun === undefined) {
      delete process.env.NX_DRY_RUN;
    } else {
      process.env.NX_DRY_RUN = previousNxDryRun;
    }
  }
}, 45_000);

it("registers every existing entity once and exposes only modules below its owner", () => {
  const order = Array.from(
    readFileSync(moduleDependencyContract, "utf8").matchAll(
      /^\d+\. `([\w-]+)`$/gm,
    ),
    ([, name]) => name,
  );
  const propertyName = (name: string) =>
    name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
  const getters = (path: string) =>
    Array.from(
      readFileSync(path, "utf8").matchAll(/\bget (\w+)\(/g),
      ([, name]) => name,
    );
  const moduleDirectory = "libs/modules";
  const inventories: Record<string, string[]> = {};
  const registries: Record<string, string[]> = {};
  const lowerModules: Record<string, string[]> = {};
  const moduleViews: Record<string, string[]> = {};
  const missingGetters: string[] = [];
  const missingOwners: string[] = [];
  for (const [rank, module] of order.entries()) {
    const directory = `${moduleDirectory}/${module}`;
    const inventory: string[] = [];
    for (const kind of ["models", "relations"]) {
      const collection = `${directory}/${kind}`;
      if (!existsSync(collection)) {
        continue;
      }
      for (const entry of readdirSync(collection, { withFileTypes: true })) {
        const entity = `${collection}/${entry.name}`;
        const bootstrap = `${entity}/${registryPath}/bootstrap.ts`;
        if (!entry.isDirectory() || !existsSync(bootstrap)) {
          continue;
        }
        inventory.push(propertyName(entry.name));
        const owner = readFileSync(bootstrap, "utf8");
        if (
          !/export (const serviceBootstrap\b|\{[^}]+\bas serviceBootstrap\b)/.test(
            owner,
          )
        ) {
          missingOwners.push(`${module}/${kind}/${entry.name}`);
        }
        const service = readFileSync(
          `${entity}/${servicePath}/singlepage/index.ts`,
          "utf8",
        );
        if (!/\bget modules\(/.test(service)) {
          missingGetters.push(`${module}/${kind}/${entry.name}`);
        }
      }
    }
    inventories[module] = inventory.sort();
    registries[module] = getters(
      `${directory}/${registryPath}/services.ts`,
    ).sort();
    lowerModules[module] = order.slice(rank + 1).map(propertyName);
    moduleViews[module] = getters(`${directory}/${registryPath}/modules.ts`);
  }
  expect(registries).toEqual(inventories);
  expect(moduleViews).toEqual(lowerModules);
  expect(missingGetters).toEqual([]);
  expect(missingOwners).toEqual([]);
});
