import { pathToFileURL } from "node:url";

/** Wait on the service identified by the existing deployment webhook. */
export async function waitForService({
  portainerURL,
  webhookURL,
  username,
  password,
  tag,
  timeoutMs = 35 * 60_000,
  intervalMs = 5_000,
  log = console.log,
}) {
  const base = new URL(portainerURL);
  const webhook = new URL(webhookURL);
  if (base.origin !== webhook.origin || !tag)
    throw new Error("A matching Portainer webhook and image tag are required");
  const deadline = Date.now() + timeoutMs;
  let authorization;
  async function json(path, body) {
    const response = await fetch(new URL(path, base), {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(`Portainer request failed (HTTP ${response.status})`);
    return response.json();
  }
  const session = await json("/api/auth", {
    Username: username,
    Password: password,
  });
  if (!session.jwt) throw new Error("Portainer authentication failed");
  authorization = `Bearer ${session.jwt}`;
  const token = webhook.pathname.split("/").filter(Boolean).at(-1);
  const hooks = await json("/api/webhooks");
  const hook = hooks.find((item) => item.Token === token);
  if (!hook?.ResourceId || !hook.EndpointId || hook.Type !== 1)
    throw new Error("Deployment webhook does not identify a Swarm service");
  const docker = `/api/endpoints/${hook.EndpointId}/docker`;
  const filters = new URLSearchParams({
    filters: JSON.stringify({
      service: [hook.ResourceId],
      "desired-state": ["running"],
    }),
  });
  const hasTag = (image = "") => image.split("@")[0].endsWith(`:${tag}`);
  while (Date.now() < deadline) {
    const service = await json(`${docker}/services/${hook.ResourceId}`);
    const update = service.UpdateStatus?.State;
    if (update === "paused" || update?.startsWith("rollback"))
      throw new Error(`Service rollout stopped: ${update}`);
    const container = service.Spec.TaskTemplate.ContainerSpec;
    if (hasTag(container.Image)) {
      if (
        !container.Healthcheck?.Test?.length ||
        container.Healthcheck.Test[0] === "NONE"
      )
        throw new Error(
          "API readiness health check is required before rollout",
        );
      const tasks = await json(`${docker}/tasks?${filters}`);
      const replicas = service.Spec.Mode.Replicated?.Replicas;
      if (
        update === "completed" &&
        replicas > 0 &&
        tasks.length === replicas &&
        tasks.every(
          (task) =>
            task.Status.State === "running" &&
            task.Spec.ContainerSpec.Image === container.Image,
        )
      ) {
        log(`API ${tag} rollout is complete and all tasks are ready`);
        return;
      }
    }
    log(`Waiting for API ${tag} readiness (${update || "pending"})`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    "API readiness timed out; dependent services must stay unchanged",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const required = (key) => {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
    return process.env[key];
  };
  try {
    await waitForService({
      portainerURL: `https://${required("PORTAINER_SERVICE_SUBDOMAIN")}.${required("DOMAIN")}`,
      webhookURL: required("SERVICE_UPDATE_URL"),
      username: required("PORTAINER_USERNAME"),
      password: required("PORTAINER_PASSWORD"),
      tag: required("IMAGE_TAG"),
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
