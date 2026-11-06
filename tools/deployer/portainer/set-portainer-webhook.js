const fs = require("node:fs");
const path = require("node:path");

function saveWebhook(name, webhook) {
  const staging = fs.mkdtempSync(path.join(__dirname, ".portainer-webhook-"));
  const json = `${name}.json`;
  const token = `${name}_token`;
  try {
    fs.writeFileSync(path.join(staging, json), JSON.stringify(webhook), {
      mode: 0o600,
    });
    fs.writeFileSync(path.join(staging, token), webhook.Token, { mode: 0o600 });
    fs.renameSync(path.join(staging, json), path.join(__dirname, json));
    fs.renameSync(path.join(staging, token), path.join(__dirname, token));
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

async function createWebhook(input) {
  const { url, service_id, registry_id, file_name } = input;
  const registryId = Number(registry_id);
  if (
    !service_id ||
    !/^[\w-]+$/.test(file_name ?? "") ||
    registry_id == null ||
    registry_id === "" ||
    !Number.isSafeInteger(registryId) ||
    registryId < 0
  ) {
    throw new Error("Invalid Portainer service, registry or output name");
  }

  const base = `https://${url}/api`;
  const auth = await fetch(`${base}/auth`, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Username: input.portainer_username,
      Password: input.portainer_password,
    }),
  });
  if (!auth.ok) throw new Error(`Portainer login failed (HTTP ${auth.status})`);
  const { jwt } = await auth.json();
  if (!jwt) throw new Error("Portainer login returned no token");

  const headers = {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };
  const target = { ResourceID: service_id, EndpointID: 1 };
  const response = await fetch(`${base}/webhooks`, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    headers,
    body: JSON.stringify({ ...target, WebhookType: 1, RegistryID: registryId }),
  });

  let webhook;
  if (response.status === 409) {
    // Portainer keeps one webhook per service. Recover its token on redeploy.
    const query = new URLSearchParams({ filters: JSON.stringify(target) });
    const existing = await fetch(`${base}/webhooks?${query}`, {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!existing.ok)
      throw new Error(
        `Portainer webhook lookup failed (HTTP ${existing.status})`,
      );
    const hooks = await existing.json();
    webhook = hooks.find((item) => item.ResourceId === service_id);
  } else {
    if (!response.ok)
      throw new Error(
        `Portainer webhook creation failed (HTTP ${response.status})`,
      );
    webhook = await response.json();
  }
  if (
    !webhook?.Token ||
    webhook.ResourceId !== service_id ||
    webhook.EndpointId !== target.EndpointID ||
    webhook.Type !== 1 ||
    webhook.RegistryId !== registryId
  ) {
    throw new Error("Portainer returned no matching service webhook");
  }

  saveWebhook(file_name, webhook);
}

async function main() {
  const input = JSON.parse(fs.readFileSync(0, "utf8"));
  await createWebhook(input);
}

main().catch((error) => {
  if (error instanceof SyntaxError) {
    console.error("Invalid JSON in the Portainer input or response");
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});
