import { expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { globSync } from "tinyglobby";
import ts from "typescript";
import { syncProductStories } from "../products/stories";
import {
  pureStudioUtility,
  pureStudioUtilities,
  isPureStudioUtilityFile,
  isPureStudioExternal,
} from "./isolation";

const root = path.resolve(import.meta.dir, "../../..");
const studio = path.join(root, "apps/studio");

test.each([
  ["design", "components"],
  ["products", "componentModules"],
])(
  "%s imports workspace views without executing tests or stories",
  (kind, variable) => {
    const loader = path.join(studio, "workspace/utils", kind, "source.ts");
    const tree = ts.createSourceFile(
      loader,
      readFileSync(loader, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    let patterns: string[] = [];
    function visit(node: ts.Node) {
      if (
        ts.isVariableDeclaration(node) &&
        node.name.getText(tree) === variable
      ) {
        const initializer = node.initializer;
        if (!initializer || !ts.isCallExpression(initializer))
          throw new Error("Missing workspace component glob");
        const argument = initializer.arguments[0];
        const entries = ts.isArrayLiteralExpression(argument)
          ? argument.elements
          : [argument];
        patterns = entries.map((entry) => {
          if (!ts.isStringLiteral(entry))
            throw new Error("Workspace glob patterns must be static strings");
          return entry.text;
        });
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
    expect(patterns.length).toBeGreaterThan(0);

    const fixture = mkdtempSync(path.join(tmpdir(), "sps-workspace-imports-"));
    const cwd = path.join(fixture, "workspace/utils", kind);
    try {
      mkdirSync(cwd, { recursive: true });
      for (const layer of ["singlepage", "startup"]) {
        const directory = path.join(
          fixture,
          "workspace",
          kind,
          layer,
          "nested",
        );
        mkdirSync(path.join(directory, "__tests__"), { recursive: true });
        for (const filename of [
          "View.tsx",
          "Preview.jsx",
          "View.test.tsx",
          "View.spec.tsx",
          "View.stories.tsx",
          "Preview.test.jsx",
          "Preview.spec.jsx",
          "Preview.stories.jsx",
          "__tests__/Browser.tsx",
        ])
          writeFileSync(
            path.join(directory, filename),
            "export default () => null;",
          );
      }
      const imports = globSync(patterns, { cwd })
        .map((file) => file.split(path.sep).join("/"))
        .sort();
      expect(imports).toEqual([
        `../../${kind}/singlepage/nested/Preview.jsx`,
        `../../${kind}/singlepage/nested/View.tsx`,
        `../../${kind}/startup/nested/Preview.jsx`,
        `../../${kind}/startup/nested/View.tsx`,
      ]);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  },
);

interface IReference {
  specifier: string;
  kind: "module" | "glob" | "asset" | "scan";
  group?: number;
}
interface IIsolationOptions {
  root: string;
  studio: string;
  aliases?: Record<string, string[]>;
}
const projectAliases = ts.readConfigFile(
  path.join(root, "tsconfig.base.json"),
  ts.sys.readFile,
).config.compilerOptions.paths as Record<string, string[]>;
const isolationOptions: IIsolationOptions = {
  root,
  studio,
  aliases: projectAliases,
};
const codeExtension = /\.(?:[cm]?[jt]sx?|css|html|json)$/;

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (
      ["node_modules", ".generated", "output", "storybook-static"].includes(
        entry.name,
      )
    )
      return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
function within(file: string, directory: string): boolean {
  return file === directory || file.startsWith(directory + path.sep);
}
function staticText(node: ts.Node | undefined): string | undefined {
  return node &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : undefined;
}
function references(file: string): IReference[] {
  const source = readFileSync(file, "utf8");
  const references: IReference[] = [];
  let globGroup = 0;
  const add = (
    specifier: string | undefined,
    kind: IReference["kind"],
    group?: number,
  ) => {
    if (specifier)
      references.push({
        specifier,
        kind,
        ...(group === undefined ? {} : { group }),
      });
  };
  if (/\.(?:css|html)$/.test(file)) {
    for (const match of source.matchAll(
      /@import\s+(?:url\(\s*)?["']([^"']+)["']/g,
    ))
      add(match[1], "module");
    for (const match of source.matchAll(/@source\s+["']([^"']+)["']/g))
      add(match[1], "scan");
    for (const match of source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g))
      add(match[1], "asset");
    for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g))
      add(match[1], "asset");
  } else if (/\.[cm]?[jt]sx?$/.test(file)) {
    const tree = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier
      )
        add(staticText(node.moduleSpecifier), "module");
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
        add(staticText(node.argument.literal), "module");
      if (ts.isCallExpression(node)) {
        const expression = node.expression.getText(tree);
        if (
          node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          expression === "require"
        ) {
          const specifier = staticText(node.arguments[0]);
          if (!specifier)
            throw new Error(
              `${file}: dependency import must have a static specifier`,
            );
          add(specifier, "module");
        }
        if (
          expression === "import.meta.glob" ||
          expression === "import.meta.globEager"
        ) {
          const argument = node.arguments[0];
          const patterns =
            argument && ts.isArrayLiteralExpression(argument)
              ? argument.elements
              : [argument];
          const group = globGroup++;
          for (const pattern of patterns) {
            const specifier = staticText(pattern);
            if (!specifier)
              throw new Error(
                `${file}: dependency glob must have static patterns`,
              );
            add(specifier, "glob", group);
          }
        }
      }
      if (
        ts.isNewExpression(node) &&
        node.expression.getText(tree) === "URL" &&
        node.arguments?.[1]?.getText(tree) === "import.meta.url"
      )
        add(staticText(node.arguments[0]), "asset");
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  // Public asset URLs carry ownership even when no module import is present.
  for (const match of source.matchAll(
    /["'`(]((?:\/module-assets\/|\/workspace-(?:assets|design|products)\/)[^\s"'`)]+)["'`)]/g,
  ))
    add(match[1], "asset");
  return references;
}
function target(
  file: string,
  specifier: string,
  options: IIsolationOptions,
  glob = false,
): string | undefined {
  const name = glob ? specifier : specifier.split(/[?#]/)[0];
  const pureUtility = pureStudioUtility(options.root, name);
  if (pureUtility) return pureUtility;
  if (/^(?:https?:|data:|blob:|node:|#)/.test(name)) return undefined;
  if (name.startsWith("/module-assets/"))
    return path.join(
      options.studio,
      "runtime/assets",
      name.slice("/module-assets/".length),
    );
  const workspaceAsset = name.match(
    /^\/workspace-(assets|design|products)\/(.*)$/,
  );
  if (workspaceAsset)
    return path.join(
      options.studio,
      "workspace",
      workspaceAsset[1],
      workspaceAsset[2],
    );
  if (name.startsWith(".")) return path.resolve(path.dirname(file), name);
  if (path.isAbsolute(name))
    return within(name, options.root) ? name : path.join(options.studio, name);
  for (const [alias, destinations] of Object.entries(options.aliases ?? {})) {
    const [prefix, suffix] = alias.split("*");
    const matches = alias.includes("*")
      ? name.startsWith(prefix) && name.endsWith(suffix)
      : name === alias;
    if (matches)
      return path.resolve(
        options.root,
        destinations[0].replace(
          "*",
          name.slice(prefix.length, suffix ? -suffix.length : undefined),
        ),
      );
  }
  return undefined; // Installed dependencies are outside the repository graph.
}
function resolveFile(target: string): string | undefined {
  return [
    target,
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".json"].map(
      (extension) => target + extension,
    ),
    ...["index.ts", "index.tsx", "index.js", "index.jsx"].map((file) =>
      path.join(target, file),
    ),
  ].find((file) => ts.sys.fileExists(file));
}
function forbidden(file: string, specifier: string): boolean {
  if (pureStudioUtility(root, specifier)) return false;
  const resolved = target(file, specifier, isolationOptions);
  return (
    specifier.startsWith("@sps/") ||
    Boolean(
      resolved &&
        (within(resolved, path.join(root, "libs")) ||
          within(resolved, path.join(root, "apps/host"))),
    )
  );
}
function isolationViolations(
  entries: string[],
  owner: "workspace" | "modules",
  options: IIsolationOptions,
): string[] {
  const violations = new Set<string>();
  const visited = new Set<string>();
  const workspace = path.join(options.studio, "workspace");
  const modules = path.join(options.studio, "modules");
  function visit(file: string, chain: string[]) {
    if (visited.has(file) || !codeExtension.test(file)) return;
    visited.add(file);
    if (
      owner === "modules" &&
      /(?:--workspace-brand-|data-workspace-projection)/.test(
        readFileSync(file, "utf8"),
      )
    ) {
      violations.add(
        [
          ...chain,
          path.relative(options.root, file),
          "Workspace visual tokens",
        ].join(" → "),
      );
    }
    const refs = references(file);
    const globs = new Map<number, string[]>();
    for (const reference of refs.filter(({ kind }) => kind === "glob")) {
      const excluded = reference.specifier.startsWith("!");
      const pattern = excluded
        ? reference.specifier.slice(1)
        : reference.specifier;
      const resolved = target(file, pattern, options, true) ?? pattern;
      const group = globs.get(reference.group!) ?? [];
      group.push(excluded ? `!${resolved}` : resolved);
      globs.set(reference.group!, group);
    }
    const dependencies = [
      ...refs.filter(({ kind }) => kind !== "glob" && kind !== "scan"),
      ...[...globs.values()]
        .flatMap((patterns) =>
          globSync(patterns, { cwd: path.dirname(file), absolute: true }),
        )
        .map((specifier) => ({ specifier, kind: "module" as const })),
    ];
    for (const reference of dependencies) {
      let dependency = target(file, reference.specifier, options);
      const wrongOwner =
        dependency &&
        (owner === "workspace"
          ? within(dependency, modules) ||
            reference.specifier.startsWith("/module-assets/")
          : within(dependency, workspace));
      const production =
        reference.specifier.startsWith("@sps/") ||
        (dependency &&
          (within(dependency, path.join(options.root, "libs")) ||
            within(dependency, path.join(options.root, "apps/host"))));
      const pureSource = isPureStudioUtilityFile(options.root, file);
      const pureDependency =
        Boolean(pureStudioUtility(options.root, reference.specifier)) ||
        Boolean(
          pureSource &&
            reference.specifier.startsWith(".") &&
            dependency &&
            isPureStudioUtilityFile(
              options.root,
              resolveFile(dependency) ?? dependency,
            ),
        );
      if (
        wrongOwner ||
        (production && !pureDependency) ||
        (pureSource &&
          !pureDependency &&
          !isPureStudioExternal(reference.specifier))
      ) {
        violations.add(
          [
            ...chain,
            path.relative(options.root, file),
            reference.specifier,
          ].join(" → "),
        );
        continue;
      }
      if (
        !dependency ||
        !within(dependency, options.root) ||
        dependency.includes(`${path.sep}node_modules${path.sep}`)
      )
        continue;
      dependency = resolveFile(dependency);
      if (dependency)
        visit(dependency, [...chain, path.relative(options.root, file)]);
    }
  }
  entries.forEach((file) => visit(file, []));
  return [...violations].sort();
}

test("detects production aliases and relative imports, including type dependencies", () => {
  expect(
    forbidden(
      path.join(studio, "runtime/view.ts"),
      "@sps/host/models/page/sdk/model",
    ),
  ).toBe(true);
  expect(
    forbidden(
      path.join(studio, "runtime/view.ts"),
      "../../../libs/shared/example",
    ),
  ).toBe(true);
  expect(
    forbidden(
      path.join(studio, "runtime/styles.css"),
      "../../host/styles/fonts.css",
    ),
  ).toBe(true);
  expect(
    forbidden(
      path.join(studio, "runtime/view.ts"),
      "../modules/host/page/interface",
    ),
  ).toBe(false);
});

test("shared UI entries have a transitive UI-only graph without SDK or app imports", () => {
  const visited = new Set<string>();
  function visit(file: string) {
    if (visited.has(file)) return;
    visited.add(file);
    expect(isPureStudioUtilityFile(root, file)).toBe(true);
    for (const { specifier } of references(file)) {
      if (isPureStudioExternal(specifier)) continue;
      const dependency = target(file, specifier, isolationOptions);
      const resolved = dependency && resolveFile(dependency);
      expect(resolved).toBeDefined();
      if (resolved) visit(resolved);
    }
  }
  pureStudioUtilities(root).forEach(visit);
  for (const specifier of [
    "@sps/shared-frontend-client-utils",
    "@sps/ui-adapter",
  ])
    expect(forbidden(path.join(studio, "view.ts"), specifier)).toBe(true);
});

test.each([
  [
    "@sps/shared-frontend-client-utils/chat-scroll",
    "@sps/social/models/message/sdk/client",
  ],
  ["@sps/ui-adapter/toast", "@sps/rbac/models/subject/sdk/client"],
  ["@sps/ui-adapter/toast", "@sps/ui-adapter"],
  ["@sps/ui-adapter/toast", "next/navigation"],
])(
  "approved entry %s rejects transitive dependency %s",
  (specifier, dependency) => {
    const fixture = mkdtempSync(path.join(tmpdir(), "sps-studio-pure-"));
    try {
      const studio = path.join(fixture, "apps/studio");
      const entry = path.join(studio, "modules/view.ts");
      const utility = pureStudioUtility(fixture, specifier)!;
      mkdirSync(path.dirname(entry), { recursive: true });
      mkdirSync(path.dirname(utility), { recursive: true });
      writeFileSync(entry, `import "${specifier}";`);
      writeFileSync(utility, `import "${dependency}";`);
      const violations = isolationViolations([entry], "modules", {
        root: fixture,
        studio,
      });
      expect(violations).toHaveLength(1);
      expect(violations[0]).toContain(dependency);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  },
);

test("Studio code, styles and Storybook configuration do not import production", () => {
  const violations = files(studio)
    .filter((file) => codeExtension.test(file))
    .flatMap((file) =>
      references(file)
        .filter(
          ({ kind, specifier }) =>
            kind !== "scan" && forbidden(file, specifier),
        )
        .map(({ specifier }) => `${path.relative(root, file)} → ${specifier}`),
    );
  expect(violations).toEqual([]);
});

test("content generation writes only local Studio derivatives", () => {
  const generator = readFileSync(
    path.join(root, "tools/studio/products/publish-ai-chat.ts"),
    "utf8",
  );
  expect(generator).not.toContain("libs/");
  expect(generator).not.toContain("apps/host/");
  expect(generator).toContain("apps/studio/modules/");
});

test("Modules and Workspace own independent presentation code and fixtures, including tests", () => {
  for (const owner of ["workspace", "modules"] as const) {
    const entries = files(path.join(studio, owner)).filter((file) =>
      codeExtension.test(file),
    );
    expect(isolationViolations(entries, owner, isolationOptions)).toEqual([]);
  }
});

test("Module decorators and fonts do not inherit Workspace styling", () => {
  const preview = readFileSync(
    path.join(studio, ".storybook/preview.ts"),
    "utf8",
  );
  expect(preview).not.toContain("data-workspace-projection");
  expect(preview).not.toContain("--workspace-brand-");
  const theme = readFileSync(path.join(studio, "runtime/theme.css"), "utf8");
  expect(theme).toContain('"Default"');
  expect(theme).not.toContain("workspace-assets");
});

test("the editable website prototype uses Workspace visual tokens", () => {
  const prototype = path.join(
    studio,
    "workspace/products/singlepage/ai-chat/website/Preview",
  );
  const violations = files(prototype).filter((file) => {
    if (!/\.tsx?$/.test(file)) return false;
    return /(?:--(?:color|font)-sps|\b(?:bg|text|border|ring|outline|font)-sps)/.test(
      readFileSync(file, "utf8"),
    );
  });
  expect(violations).toEqual([]);
});

test.each([
  [
    "test file",
    "view.test.tsx",
    'import { Component } from "../modules/model";',
  ],
  ["type import", "view.ts", 'import type { IProps } from "../modules/model";'],
  [
    "import type expression",
    "view.ts",
    'type Props = import("../modules/model").IProps;',
  ],
  ["reexport", "view.ts", 'export { Component } from "../modules/model";'],
  ["dynamic import", "view.ts", 'const view = import("../modules/model");'],
  ["require", "view.ts", 'const view = require("../modules/model");'],
  [
    "Vite root import",
    "view.ts",
    'import { Component } from "/modules/model";',
  ],
  [
    "alias glob",
    "view.ts",
    'const views = import.meta.glob("@studio-modules/**/*.tsx");',
  ],
  ["alias", "view.ts", 'import { Component } from "@studio-modules/model";'],
  [
    "URL asset",
    "view.ts",
    'const view = new URL("../modules/model.svg", import.meta.url);',
  ],
  ["CSS import", "view.css", '@import "../modules/model.css";'],
  ["CSS URL", "view.css", 'div { background: url("../modules/model.svg"); }'],
  ["public asset URL", "view.tsx", 'const image = "/module-assets/model.png";'],
  ["glob", "view.ts", 'const views = import.meta.glob("../modules/**/*.tsx");'],
  [
    "independent glob exclusions",
    "view.ts",
    'const unsafe = import.meta.glob("../modules/**/*.tsx"); const safe = import.meta.glob(["../**/*.tsx", "!../modules/**"]);',
  ],
  [
    "transitive helper",
    "view.ts",
    'export { Component } from "../../../tools/helper";',
  ],
])("Workspace gate finds %s dependencies", (_kind, filename, source) => {
  const fixture = mkdtempSync(path.join(tmpdir(), "sps-studio-isolation-"));
  const studio = path.join(fixture, "apps/studio");
  const write = (file: string, content: string) => {
    const target = path.join(fixture, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
    return target;
  };
  try {
    const entry = write(`apps/studio/workspace/${filename}`, source);
    write(
      "apps/studio/modules/model.tsx",
      "export const Component = () => null; export interface IProps {}",
    );
    write(
      "tools/helper.ts",
      'export { Component } from "../apps/studio/modules/model";',
    );
    const violations = isolationViolations([entry], "workspace", {
      root: fixture,
      studio,
      aliases: { "@studio-modules/*": ["apps/studio/modules/*"] },
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain(filename);
    if (_kind === "transitive helper")
      expect(violations[0]).toContain("tools/helper.ts");
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("Workspace globs honor exclusions and shared Tailwind source scans do not execute Module code", () => {
  const fixture = mkdtempSync(path.join(tmpdir(), "sps-studio-isolation-"));
  const studio = path.join(fixture, "apps/studio");
  const write = (file: string, content: string) => {
    const target = path.join(studio, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
    return target;
  };
  try {
    const entry = write(
      "workspace/view.tsx",
      'import "../runtime/styles.css"; const views = import.meta.glob(["../**/*.tsx", "!../modules/**"]);',
    );
    write(
      "runtime/styles.css",
      '@source "../modules/**/*.tsx"; @import "./theme.css";',
    );
    write("runtime/theme.css", ":root { --primary: 100 100% 50%; }");
    write("modules/model.tsx", "export const Component = () => null;");
    expect(references(path.join(studio, "runtime/styles.css"))).toContainEqual({
      specifier: "../modules/**/*.tsx",
      kind: "scan",
    });
    expect(
      isolationViolations([entry], "workspace", { root: fixture, studio }),
    ).toEqual([]);
    rmSync(path.join(studio, "modules"), { recursive: true });
    expect(
      isolationViolations([entry], "workspace", { root: fixture, studio }),
    ).toEqual([]);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("actual Workspace Storybook roots, generated products, decorators and transitive globs are independent of Modules", () => {
  const storybook = path.join(studio, ".storybook");
  syncProductStories(
    path.join(studio, "workspace"),
    path.join(storybook, ".generated/products"),
  );
  const main = path.join(storybook, "main.ts");
  const tree = ts.createSourceFile(
    main,
    readFileSync(main, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  let patterns: string[] = [];
  function visit(node: ts.Node) {
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(tree) === "stories" &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      patterns = node.initializer.elements.map((element) => {
        const value = staticText(element);
        if (!value) throw new Error("Storybook roots must be static patterns");
        return value;
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  expect(patterns.length).toBeGreaterThan(0);
  const roots = globSync(patterns, { cwd: storybook, absolute: true }).filter(
    (file) =>
      within(file, path.join(studio, "workspace")) ||
      within(file, path.join(storybook, ".generated/products")),
  );
  expect(roots.some((file) => file.includes("/.generated/products/"))).toBe(
    true,
  );
  expect(roots.some((file) => file.includes("/workspace/utils/stories/"))).toBe(
    true,
  );
  expect(
    isolationViolations(
      [...roots, path.join(storybook, "preview.ts")],
      "workspace",
      isolationOptions,
    ),
  ).toEqual([]);
});

test("Workspace registry imports describe their selected renderer", () => {
  const violations = files(path.join(studio, "workspace"))
    .filter((file) => /\.[jt]sx?$/.test(file))
    .filter((file) =>
      /\b(?:Variant|IdentityAction|SubjectAction)\d+\b/.test(
        readFileSync(file, "utf8"),
      ),
    );
  expect(violations).toEqual([]);
});
