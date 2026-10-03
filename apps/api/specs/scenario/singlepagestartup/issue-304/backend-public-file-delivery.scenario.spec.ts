/**
 * BDD Suite: public delivery of uploaded files.
 *
 * Given: a running API storing uploads with the local file-storage provider.
 * When: an SVG carrying a script is uploaded through the file-storage create
 *       route and read back from its /public URL.
 * Then: GET and HEAD answer with the SVG type, X-Content-Type-Options: nosniff
 *       and Content-Security-Policy: sandbox, and the file stops being served
 *       once its record is deleted.
 */

import { getApiUrl, getRequiredEnv } from "../issue-152/test-utils/env";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">' +
  '<script>document.title = "script ran"</script></svg>';

function operatorHeaders() {
  return { "X-RBAC-SECRET-KEY": getRequiredEnv("RBAC_SECRET_KEY") };
}

async function deleteFile(id: string) {
  return fetch(`${getApiUrl()}/api/file-storage/files/${id}`, {
    method: "DELETE",
    headers: operatorHeaders(),
  });
}

describe("public delivery of uploaded files", () => {
  let fileId: string | undefined;
  let publicUrl = "";

  beforeAll(async () => {
    const formData = new FormData();

    formData.append(
      "data",
      JSON.stringify({ adminTitle: "issue-304 scenario fixture" }),
    );
    formData.append(
      "file",
      new File([svg], "issue-304-fixture.svg", { type: "image/svg+xml" }),
    );

    const response = await fetch(`${getApiUrl()}/api/file-storage/files`, {
      method: "POST",
      headers: operatorHeaders(),
      body: formData,
    });
    const payload = await response.json();

    expect(response.status).toBe(201);

    fileId = payload.data.id;
    publicUrl = `${getApiUrl()}/public${payload.data.file}`;
  });

  afterAll(async () => {
    if (fileId) {
      await deleteFile(fileId);
    }
  });

  /**
   * BDD Scenario
   * Given: an SVG with a script, uploaded through the create route.
   * When: its /public URL is read with GET.
   * Then: the file is served as SVG with nosniff and a sandbox policy, so a
   *       browser that opens it as a document runs no script in the API origin.
   */
  it("When: the uploaded SVG is read Then: it carries nosniff and a sandbox policy", async () => {
    const response = await fetch(publicUrl);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/svg+xml");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toBe("sandbox");
    expect(await response.text()).toBe(svg);
  });

  /**
   * BDD Scenario
   * Given: the same uploaded SVG.
   * When: its /public URL is read with HEAD.
   * Then: the response carries the same type and delivery headers without a body.
   */
  it("When: the uploaded SVG is read with HEAD Then: it carries the same headers", async () => {
    const response = await fetch(publicUrl, { method: "HEAD" });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/svg+xml");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toBe("sandbox");
  });

  /**
   * BDD Scenario
   * Given: the uploaded SVG and its record.
   * When: the record is deleted through the file-storage delete route.
   * Then: the /public URL no longer serves the file.
   */
  it("When: the record is deleted Then: the file is no longer served", async () => {
    const deleted = await deleteFile(fileId as string);

    expect(deleted.status).toBe(200);

    fileId = undefined;

    const response = await fetch(publicUrl);

    expect(response.status).toBe(404);
  });
});
