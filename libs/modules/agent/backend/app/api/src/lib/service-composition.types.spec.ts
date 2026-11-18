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

it("infers the Order startup method in Agent and preserves the Subject constructor port", () => {
  const root = process.cwd();
  const agentStartup = resolve(
    root,
    "libs/modules/agent/models/agent/backend/app/api/src/lib/service/startup/index.ts",
  );
  const orderStartup = resolve(
    root,
    "libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/startup/index.ts",
  );
  const agentSource = addServiceMember(
    agentStartup,
    `
  callOrderStartupMethod() {
    const result = this.modules.ecommerce.order.startupContractProbe({ units: 3 });
    const legacyResult: typeof result = this.ecommerceModule.order.startupContractProbe({ units: 4 });
    const exactResult: (
      (<T>() => T extends typeof result ? 1 : 2) extends
      (<T>() => T extends { readonly source: "startup"; readonly units: number } ? 1 : 2)
        ? true : false
    ) = true;
    this.modules.ecommerce.order.startupContractProbe("wrong argument");
    this.ecommerceModule.order.startupContractProbe("wrong legacy argument");
    return { result, legacyResult, exactResult };
  }

  acceptSubjectOrderDouble(
    order: Pick<
      ReturnType<typeof import("@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap").createService>,
      | "acceptSubscriptionPeriod"
      | "createNextPeriodCart"
      | "configureNextPeriod"
      | "fulfillmentQuoteOptions"
      | "freezeSubscriptionPeriod"
      | "assertSubscriptionPayment"
      | "hasSharedSubscriptionRenewal"
      | "stopSubscriptionRenewal"
      | "lockForLifecycle"
      | "transitionPaymentStatus"
      | "revokeSubscription"
      | "update"
    > & {
      find: (props?: unknown) => Promise<unknown[]>;
      findById: (props: { id: string }) => Promise<unknown>;
      findByIdExtended: (props: { id: string }) => Promise<unknown>;
      findOrCreate: (props: unknown) => Promise<unknown>;
      create: (props: { data: unknown }) => Promise<unknown>;
      delete: (props: { id: string }) => Promise<unknown>;
      findByIdCartDetails: (props: { id: string }) => Promise<
        import("@sps/ecommerce/models/order/sdk/model").ICartDetails
      >;
      findByIdTotal: (props: { id: string }) => Promise<unknown>;
      findByIdQuantity: (props: { id: string }) => Promise<unknown>;
      findByIdCheckoutAttributes: (props: {
        id: string;
        billingModuleCurrencyId?: string;
      }) => Promise<unknown>;
      findByIdCheckoutAttributesByCurrency: (props: {
        id: string;
        billingModuleCurrencyId?: string;
      }) => Promise<unknown>;
    },
  ) {
    type SubjectOrderPort = import("@sps/rbac/models/subject/backend/app/api/src/lib/di").IEcommerceModule["order"];
    const subjectOrder: SubjectOrderPort = order;
    const unchangedSubjectOrderPort: "startupContractProbe" extends keyof SubjectOrderPort ? false : true = true;
    return { subjectOrder, unchangedSubjectOrderPort };
  }
`,
  );
  const orderSource = addServiceMember(
    orderStartup,
    `
  startupContractProbe(props: { units: number }) {
    return { source: "startup", units: props.units } as const;
  }
`,
  );
  const files = new Map([
    [agentStartup, agentSource],
    [orderStartup, orderSource],
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
        file: agentStartup,
        start: agentSource.indexOf('"wrong legacy argument"'),
      }),
    ]);

    const method = "startupContractProbe";
    const definitions = languageService.getDefinitionAtPosition(
      agentStartup,
      agentSource.indexOf(`.${method}(`) + 1,
    );
    expect(definitions).toEqual([
      expect.objectContaining({
        fileName: orderStartup,
        textSpan: {
          start: orderSource.indexOf(`${method}(`),
          length: method.length,
        },
      }),
    ]);
  } finally {
    languageService.dispose();
  }
}, 30_000);
