import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { hostEnvironment } from "./host.mjs";

test("Host SSR has no browser storage and retains the configured heap limit", () => {
  const environment = hostEnvironment({
    ...process.env,
    NODE_OPTIONS: "--max-old-space-size=256",
    SPS_HOST_DIST_DIR: ".next-preview",
  });
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      'import {getHeapStatistics} from "node:v8"; console.log(JSON.stringify({storage:typeof globalThis.localStorage,heap:getHeapStatistics().heap_size_limit}));',
    ],
    { env: environment, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  const value = JSON.parse(result.stdout);
  assert.equal(value.storage, "undefined");
  assert.ok(value.heap >= 256 * 1024 * 1024);
  assert.ok(value.heap < 1024 * 1024 * 1024);
  assert.equal(environment.SPS_HOST_DIST_DIR, ".next-preview");
});

test("Host starts with SSR-compatible storage when NODE_OPTIONS is absent", () => {
  const environment = hostEnvironment({});
  const result = spawnSync(
    process.execPath,
    ["-e", "console.log(typeof localStorage)"],
    {
      env: environment,
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "undefined");
});
