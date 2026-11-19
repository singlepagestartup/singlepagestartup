import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

function addServiceMember(file: string, member: string) {
  const source = readFileSync(file, "utf8");
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest);
  const service = parsed.statements.find(
    (statement): statement is ts.ClassDeclaration =>
      ts.isClassDeclaration(statement) && statement.name?.text === "Service",
  );

  if (!service) {
    throw new Error(`Expected the exported Service class in ${file}`);
  }

  const position = service.members.pos;
  return source.slice(0, position) + member + source.slice(position);
}

it("infers startup methods and limits module access inside service operations", () => {
  const root = process.cwd();
  const agentStartup = resolve(
    root,
    "libs/modules/agent/models/agent/backend/app/api/src/lib/service/startup/index.ts",
  );
  const orderStartup = resolve(
    root,
    "libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/startup/index.ts",
  );
  const cartOrderCreate = resolve(
    root,
    "libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/create.ts",
  );
  const formStartup = resolve(
    root,
    "libs/modules/crm/models/form/backend/app/api/src/lib/service/startup/index.ts",
  );
  const productStartup = resolve(
    root,
    "libs/modules/ecommerce/models/product/backend/app/api/src/lib/service/startup/index.ts",
  );
  const currencyStartup = resolve(
    root,
    "libs/modules/billing/models/currency/backend/app/api/src/lib/service/startup/index.ts",
  );
  const notify = resolve(
    root,
    "libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts",
  );
  const agentSource = addServiceMember(
    agentStartup,
    `
  callOrderStartupMethod() {
    const result = this.modules.ecommerce.order.startupContractProbe({ units: 3 });
    const exactResult: (
      (<T>() => T extends typeof result ? 1 : 2) extends
      (<T>() => T extends { readonly source: "startup"; readonly units: number } ? 1 : 2)
        ? true : false
    ) = true;
    this.modules.ecommerce.order.startupContractProbe("wrong argument");
    // @ts-expect-error Agent cannot depend on its own module.
    this.modules.agent;
    // @ts-expect-error The old group would expose a second service contract.
    this.ecommerceModule.order;
    return { result, exactResult };
  }
`,
  );
  const orderSource = addServiceMember(
    orderStartup,
    `
  startupContractProbe(props: { units: number }) {
    return { source: "startup", units: props.units } as const;
  }

  callLocalProduct() {
    const result = this.module.product.localProductProbe({ sku: "chair" });
    this.module.product.localProductProbe("wrong product argument");
    // @ts-expect-error Order cannot depend on itself.
    this.module.order;
    // @ts-expect-error The foreign registry cannot reopen Ecommerce.
    this.modules.ecommerce;
    return result;
  }
`,
  );
  const productSource = addServiceMember(
    productStartup,
    `
  localProductProbe(props: { sku: string }) {
    // @ts-expect-error Product cannot call its parent Order.
    this.module.order;
    return props.sku;
  }
`,
  );
  const cartOrderSource = `${readFileSync(cartOrderCreate, "utf8")}
export function probeOrderRegistry(service: ConstructorParameters<typeof Service>[0]["service"]) {
  type Request = (typeof import("@sps/crm/models/request/backend/repository/database").Table)["$inferSelect"];
  const form = service.modules.crm.form.startupContractProbe({ formId: "form" });
  const request = service.modules.crm.request.findSubmission({ key: "key", digest: "digest" });
  const exactResults: (
    (<T>() => T extends [typeof form, typeof request] ? 1 : 2) extends
    (<T>() => T extends [{ readonly formId: string }, Promise<Request | undefined>] ? 1 : 2)
      ? true : false
  ) = true;
  service.modules.crm.form.startupContractProbe("wrong form argument");
  service.modules.crm.request.findSubmission("wrong request argument");
  service.module.identity.findById({ id: "identity" });
  // @ts-expect-error Subject cannot reach a higher module.
  service.modules.agent;
  // @ts-expect-error Subject cannot reopen RBAC through the foreign registry.
  service.modules.rbac;
  return { form, request, exactResults };
}
`;
  const formSource = addServiceMember(
    formStartup,
    `
  startupContractProbe(props: { formId: string }) {
    return { formId: props.formId } as const;
  }
`,
  );
  const currencySource = addServiceMember(
    currencyStartup,
    `
  currencyProbe(decimalPlaces: number) {
    return decimalPlaces;
  }
`,
  );
  const notifySource = `${readFileSync(notify, "utf8")}
export function probeController(handler: Handler) {
  // @ts-expect-error The controller uses the service owner's registries.
  handler.service.billingModule;
  return handler.service.modules.billing.currency.currencyProbe(2);
}
`;
  const files = new Map([
    [agentStartup, agentSource],
    [orderStartup, orderSource],
    [productStartup, productSource],
    [cartOrderCreate, cartOrderSource],
    [formStartup, formSource],
    [currencyStartup, currencySource],
    [notify, notifySource],
  ]);
  const configFile = resolve(root, "tsconfig.base.json");
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  expect(config.error).toBeUndefined();
  const project = ts.parseJsonConfigFileContent(
    { ...config.config, files: [...files.keys()], include: [] },
    ts.sys,
    root,
    { noEmit: true },
    configFile,
  );
  expect(project.errors).toEqual([]);

  const languageService = ts.createLanguageService({
    getCompilationSettings: () => project.options,
    getScriptFileNames: () => project.fileNames,
    getScriptVersion: () => "0",
    getScriptSnapshot(file) {
      const source = files.get(file) ?? ts.sys.readFile(file);
      if (source === undefined) {
        return undefined;
      }

      return ts.ScriptSnapshot.fromString(source);
    },
    getCurrentDirectory: () => root,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    realpath: ts.sys.realpath,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
  });

  try {
    const diagnostics = [...files.keys()].flatMap((file) => [
      ...languageService.getSyntacticDiagnostics(file),
      ...languageService.getSemanticDiagnostics(file),
    ]);
    expect(
      diagnostics.map(({ code, file, start, messageText }) => ({
        code,
        file: file?.fileName,
        start,
        message: ts.flattenDiagnosticMessageText(messageText, "\n"),
      })),
    ).toEqual([
      expect.objectContaining({
        code: 2345,
        file: agentStartup,
        start: agentSource.indexOf('"wrong argument"'),
      }),
      expect.objectContaining({
        code: 2345,
        file: orderStartup,
        start: orderSource.indexOf('"wrong product argument"'),
      }),
      expect.objectContaining({
        code: 2345,
        file: cartOrderCreate,
        start: cartOrderSource.indexOf('"wrong form argument"'),
      }),
      expect.objectContaining({
        code: 2345,
        file: cartOrderCreate,
        start: cartOrderSource.indexOf('"wrong request argument"'),
      }),
    ]);

    for (const [caller, reference, owner, member] of [
      [
        agentStartup,
        "order.startupContractProbe",
        orderStartup,
        "startupContractProbe",
      ],
      [
        orderStartup,
        "product.localProductProbe",
        productStartup,
        "localProductProbe",
      ],
      [
        cartOrderCreate,
        "form.startupContractProbe",
        formStartup,
        "startupContractProbe",
      ],
      [notify, "currency.currencyProbe", currencyStartup, "currencyProbe"],
    ]) {
      const callerSource = files.get(caller)!;
      const ownerSource = files.get(owner)!;
      const use = callerSource.indexOf(reference);
      expect(use).toBeGreaterThanOrEqual(0);
      const definitions = languageService.getDefinitionAtPosition(
        caller,
        use + reference.lastIndexOf(".") + 1,
      );
      expect(definitions).toEqual([
        expect.objectContaining({
          fileName: owner,
          textSpan: {
            start: ownerSource.indexOf(`${member}(`),
            length: member.length,
          },
        }),
      ]);
    }
  } finally {
    languageService.dispose();
  }
}, 30_000);
