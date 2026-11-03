import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Inventory runtime SQL, including calls added outside repository files.
// Migrations/repair scripts are writers and are covered by database capture.
const files = execFileSync(
  "rg",
  [
    "--files",
    "libs/modules",
    "-g",
    "**/backend/app/api/**/*.ts",
    "-g",
    "!*.spec.ts",
    "-g",
    "!*.test.ts",
  ],
  { encoding: "utf8" },
)
  .trim()
  .split("\n");
const findings = [];
let reads = 0,
  fetches = 0,
  trackedInternalFetches = 0;
for (const file of files) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === "fetch"
    ) {
      fetches++;
      const writes = /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/.test(
        node.arguments[1]?.getText(source) || "",
      );
      if (
        !writes &&
        node.arguments[0]?.getText(source).includes("API_SERVICE_URL")
      ) {
        let scope = node.parent;
        while (scope && !ts.isFunctionLike(scope)) scope = scope.parent;
        if (scope?.body?.getText(source).includes("responsePipe"))
          trackedInternalFetches++;
        else
          findings.push(
            `${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: raw API fetch requires the tracked responsePipe transport`,
          );
      }
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const method = node.expression.name.text;
      const argument = node.arguments[0]?.getText(source) || "";
      const rawRead =
        ["select", "selectDistinct", "selectDistinctOn", "unsafe"].includes(
          method,
        ) ||
        (method === "execute" &&
          /^(?:sql|sql\.raw)\b/.test(argument) &&
          !/pg_advisory_/.test(argument));
      if (rawRead) {
        reads++;
        let scope = node.parent;
        while (scope && !ts.isFunctionLike(scope)) scope = scope.parent;
        const body = scope?.body;
        let tracked = false;
        const inspect = (part) => {
          if (
            ts.isCallExpression(part) &&
            part.expression.getText(source) === "trackRepositoryRead"
          )
            tracked = true;
          ts.forEachChild(part, inspect);
        };
        if (body) inspect(body);
        if (!tracked)
          findings.push(
            `${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: SQL read requires trackRepositoryRead in its owning function`,
          );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Consistency inventory: ${reads} SQL reads have adapters; ${fetches} raw fetch calls, ${trackedInternalFetches} explicit API-origin reads use responsePipe. Dynamic/external targets still require caller review.`,
  );
