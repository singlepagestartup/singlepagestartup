const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

function loadScript(name) {
  const exported = { exports: {} };
  const logs = [];
  vm.runInNewContext(readFileSync(path.join(__dirname, name), "utf8"), {
    module: exported,
    require: (name) => {
      if (name === "octokit") {
        return { Octokit: class {} };
      }
      return require(name);
    },
    console: { log: (line) => logs.push(line) },
  });
  return { ...exported.exports, logs };
}

const input = {
  GITHUB_TOKEN: "fixture-private-token",
  GITHUB_REPOSITORY: "fixture/project",
  VARIABLE_NAME: "PREVIEW_DOMAIN",
  VARIABLE_CONTENT: "preview.example.test",
};

function githubStub({
  exists = false,
  failWrite = false,
  failRead = false,
} = {}) {
  const requests = [];
  const octokit = {
    request: async (route, data) => {
      requests.push({ route, data });
      if (route.startsWith("GET") && (failRead || !exists)) {
        throw { status: failRead ? 403 : 404 };
      }
      if (failWrite && /^(PATCH|POST)/.test(route)) {
        throw { status: 422 };
      }
      return { status: 204 };
    },
  };
  return { requests, octokit };
}

for (const exists of [false, true]) {
  test(`replaces a secret only after ${exists ? "updating" : "creating"} the variable`, async () => {
    const { createVariable, logs } = loadScript("create_variable.js");
    const { requests, octokit } = githubStub({ exists });
    await createVariable(input, octokit);
    assert.deepEqual(
      requests.map(({ route }) => route.split(" ")[0]),
      ["GET", exists ? "PATCH" : "POST", "DELETE"],
    );
    assert.equal(requests[1].data.value, input.VARIABLE_CONTENT);
    assert.equal(requests[2].data.secret_name, input.VARIABLE_NAME);
    assert.equal(logs.join().includes(input.GITHUB_TOKEN), false);
    assert.equal(logs.join().includes(input.VARIABLE_CONTENT), false);
  });
}

test("a rejected variable write preserves the old secret", async () => {
  const { createVariable } = loadScript("create_variable.js");
  const { requests, octokit } = githubStub({ failWrite: true });
  await assert.rejects(createVariable(input, octokit), { status: 422 });
  assert.equal(
    requests.some(({ route }) => route.startsWith("DELETE")),
    false,
  );
});

test("permission errors do not trigger a create or delete", async () => {
  const { createVariable } = loadScript("create_variable.js");
  const { requests, octokit } = githubStub({ failRead: true });
  await assert.rejects(createVariable(input, octokit), { status: 403 });
  assert.equal(requests.length, 1);
});

test("an unset value leaves remote configuration intact", async () => {
  const { createVariable } = loadScript("create_variable.js");
  const { requests, octokit } = githubStub();
  await createVariable({ ...input, VARIABLE_CONTENT: "" }, octokit);
  assert.equal(requests.length, 0);
});

test("cleanup treats an absent variable and old secret as success", async () => {
  const { deleteVariable } = loadScript("delete_variable.js");
  const requests = [];
  await deleteVariable(input, {
    request: async (route) => {
      requests.push(route);
      throw { status: 404 };
    },
  });
  assert.equal(requests.length, 2);
  assert.match(requests[0], /actions\/variables/);
  assert.match(requests[1], /actions\/secrets/);
});

test("cleanup stops on permission errors", async () => {
  const { deleteVariable } = loadScript("delete_variable.js");
  let requests = 0;
  await assert.rejects(
    deleteVariable(input, {
      request: async () => {
        requests += 1;
        throw { status: 403 };
      },
    }),
    { status: 403 },
  );
  assert.equal(requests, 1);
});
