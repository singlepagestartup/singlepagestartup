export function getOAuthAuthenticationPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SPS MCP OAuth authentication</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
      main { max-width: 960px; margin: 40px auto; padding: 0 20px 48px; }
      section { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 16px 0; }
      h1 { font-size: 28px; margin: 0 0 8px; }
      h2 { font-size: 18px; margin: 0 0 12px; }
      p { color: #475569; line-height: 1.5; }
      code, textarea, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      code { background: #f1f5f9; border-radius: 4px; padding: 2px 4px; }
      button { appearance: none; border: 0; background: #0f172a; color: white; border-radius: 6px; padding: 10px 14px; font: inherit; font-weight: 600; cursor: pointer; }
      button.secondary { background: #e2e8f0; color: #0f172a; }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
      label { display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px; }
      input, textarea { box-sizing: border-box; width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; font: inherit; background: white; }
      textarea { min-height: 120px; resize: vertical; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #0f172a; color: #e2e8f0; border-radius: 8px; padding: 14px; min-height: 80px; }
      .ok { color: #047857; font-weight: 700; }
      .error { color: #b91c1c; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <h1>SPS MCP OAuth authentication</h1>
      <p>This page runs the same OAuth steps a remote MCP client performs, but in your browser for local authentication checks.</p>

      <section>
        <h2>1. Start login</h2>
        <div class="grid">
          <div>
            <label for="mcpUrl">MCP resource URL</label>
            <input id="mcpUrl" readonly />
          </div>
          <div>
            <label for="redirectUri">Redirect URI</label>
            <input id="redirectUri" readonly />
          </div>
        </div>
        <p>Click start, then sign in on the SPS login page using an existing SPS email/password.</p>
        <div class="row">
          <button id="startButton" type="button">Start OAuth authentication</button>
          <button id="resetButton" type="button" class="secondary">Reset local state</button>
        </div>
      </section>

      <section>
        <h2>2. Token</h2>
        <p id="tokenStatus">No token yet.</p>
        <label for="accessToken">MCP access token</label>
        <textarea id="accessToken" readonly></textarea>
        <div class="row">
          <button id="copyHeaderButton" type="button" class="secondary" disabled>Copy Authorization header</button>
        </div>
      </section>

      <section>
        <h2>3. Smoke test</h2>
        <p>Runs MCP <code>initialize</code> with <code>Authorization: Bearer ...</code>, then closes the session with <code>DELETE /mcp</code>.</p>
        <button id="testButton" type="button" disabled>Test MCP initialize</button>
        <pre id="output"></pre>
      </section>
    </main>

    <script>
      const storagePrefix = "sps-mcp-authentication-oauth:";
      const origin = window.location.origin;
      const redirectUri = origin + "/authentication/oauth";
      const mcpUrl = origin + "/mcp";
      const oauthState = new URLSearchParams(window.location.search);

      const els = {
        mcpUrl: document.getElementById("mcpUrl"),
        redirectUri: document.getElementById("redirectUri"),
        startButton: document.getElementById("startButton"),
        resetButton: document.getElementById("resetButton"),
        accessToken: document.getElementById("accessToken"),
        tokenStatus: document.getElementById("tokenStatus"),
        copyHeaderButton: document.getElementById("copyHeaderButton"),
        testButton: document.getElementById("testButton"),
        output: document.getElementById("output"),
      };

      els.mcpUrl.value = mcpUrl;
      els.redirectUri.value = redirectUri;

      els.startButton.addEventListener("click", () => {
        startOAuthLogin().catch(showError);
      });
      els.resetButton.addEventListener("click", resetState);
      els.copyHeaderButton.addEventListener("click", () => {
        copyAuthorizationHeader().catch(showError);
      });
      els.testButton.addEventListener("click", () => {
        testMcpInitialize().catch(showError);
      });

      hydrateToken();
      handleRedirectCode().catch(showError);

      async function startOAuthLogin() {
        setOutput("Registering OAuth client...");
        const verifier = randomBase64Url(32);
        const challenge = await createPkceChallenge(verifier);
        const state = randomBase64Url(16);
        const registerResponse = await fetch("/oauth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_name: "SPS MCP browser authentication",
            redirect_uris: [redirectUri],
          }),
        });
        const client = await registerResponse.json();

        if (!registerResponse.ok) {
          throw new Error(JSON.stringify(client, null, 2));
        }

        sessionStorage.setItem(storagePrefix + "clientId", client.client_id);
        sessionStorage.setItem(storagePrefix + "clientSecret", client.client_secret || "");
        sessionStorage.setItem(storagePrefix + "verifier", verifier);
        sessionStorage.setItem(storagePrefix + "state", state);

        const authorizeUrl = new URL("/oauth/authorize", origin);
        authorizeUrl.searchParams.set("response_type", "code");
        authorizeUrl.searchParams.set("client_id", client.client_id);
        authorizeUrl.searchParams.set("redirect_uri", redirectUri);
        authorizeUrl.searchParams.set("scope", "mcp:content");
        authorizeUrl.searchParams.set("state", state);
        authorizeUrl.searchParams.set("code_challenge", challenge);
        authorizeUrl.searchParams.set("code_challenge_method", "S256");
        authorizeUrl.searchParams.set("resource", mcpUrl);

        window.location.href = authorizeUrl.toString();
      }

      async function handleRedirectCode() {
        const code = oauthState.get("code");

        if (!code) {
          return;
        }

        const expectedState = sessionStorage.getItem(storagePrefix + "state");

        if (oauthState.get("state") !== expectedState) {
          setTokenStatus("State mismatch. Reset local state and retry.", true);
          return;
        }

        window.history.replaceState({}, document.title, "/authentication/oauth");
        await exchangeCode(code);
      }

      async function exchangeCode(code) {
        setOutput("Exchanging authorization code for MCP access token...");
        const clientId = sessionStorage.getItem(storagePrefix + "clientId");
        const clientSecret = sessionStorage.getItem(storagePrefix + "clientSecret");
        const verifier = sessionStorage.getItem(storagePrefix + "verifier");
        const body = new URLSearchParams();
        body.set("grant_type", "authorization_code");
        body.set("client_id", clientId);
        body.set("client_secret", clientSecret);
        body.set("redirect_uri", redirectUri);
        body.set("code", code);
        body.set("code_verifier", verifier);

        const response = await fetch("/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const token = await response.json();

        if (!response.ok) {
          throw new Error(JSON.stringify(token, null, 2));
        }

        sessionStorage.setItem(storagePrefix + "accessToken", token.access_token);
        sessionStorage.setItem(storagePrefix + "refreshToken", token.refresh_token || "");
        hydrateToken();
        setOutput(JSON.stringify(token, null, 2));
      }

      async function testMcpInitialize() {
        const accessToken = sessionStorage.getItem(storagePrefix + "accessToken");

        if (!accessToken) {
          return;
        }

        setOutput("Calling MCP initialize...");
        const response = await fetch("/mcp", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2025-06-18",
              capabilities: {},
              clientInfo: {
                name: "authentication-oauth",
                version: "1.0.0",
              },
            },
          }),
        });
        const sessionId = response.headers.get("mcp-session-id");
        const text = await response.text();

        if (sessionId) {
          await fetch("/mcp", {
            method: "DELETE",
            headers: {
              "Authorization": "Bearer " + accessToken,
              "Mcp-Session-Id": sessionId,
            },
          });
        }

        setOutput("Status: " + response.status + "\\nSession: " + (sessionId || "none") + "\\n\\n" + text);
      }

      function hydrateToken() {
        const accessToken = sessionStorage.getItem(storagePrefix + "accessToken") || "";
        els.accessToken.value = accessToken;
        els.copyHeaderButton.disabled = !accessToken;
        els.testButton.disabled = !accessToken;
        setTokenStatus(accessToken ? "Token is available." : "No token yet.", false);
      }

      async function copyAuthorizationHeader() {
        const accessToken = sessionStorage.getItem(storagePrefix + "accessToken");

        if (!accessToken) {
          return;
        }

        await navigator.clipboard.writeText("Authorization: Bearer " + accessToken);
        setOutput("Authorization header copied.");
      }

      function resetState() {
        for (const key of Object.keys(sessionStorage)) {
          if (key.startsWith(storagePrefix)) {
            sessionStorage.removeItem(key);
          }
        }

        window.location.href = "/authentication/oauth";
      }

      async function createPkceChallenge(verifier) {
        const bytes = new TextEncoder().encode(verifier);
        const digest = await crypto.subtle.digest("SHA-256", bytes);

        return base64Url(new Uint8Array(digest));
      }

      function randomBase64Url(length) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);

        return base64Url(bytes);
      }

      function base64Url(bytes) {
        let binary = "";

        for (const byte of bytes) {
          binary += String.fromCharCode(byte);
        }

        return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
      }

      function setTokenStatus(message, isError) {
        els.tokenStatus.textContent = message;
        els.tokenStatus.className = isError ? "error" : "ok";
      }

      function setOutput(message) {
        els.output.textContent = message;
      }

      function showError(error) {
        const message = error instanceof Error ? error.message : String(error);
        setTokenStatus("Authentication failed.", true);
        setOutput(message);
      }
    </script>
  </body>
</html>`;
}
