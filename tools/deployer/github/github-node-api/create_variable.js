const { readFileSync } = require("node:fs");
const { Octokit } = require("octokit");

async function createVariable(
  input,
  octokit = new Octokit({ auth: input.GITHUB_TOKEN }),
) {
  const name = input.VARIABLE_NAME;
  const value = input.VARIABLE_CONTENT;
  if (value === undefined || value === "") {
    return;
  }

  const [owner, repo] = input.GITHUB_REPOSITORY.split("/");
  let exists = false;
  try {
    await octokit.request(
      "GET /repos/{owner}/{repo}/actions/variables/{name}",
      {
        owner,
        repo,
        name,
      },
    );
    exists = true;
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  if (exists) {
    await octokit.request(
      "PATCH /repos/{owner}/{repo}/actions/variables/{name}",
      {
        owner,
        repo,
        name,
        value,
      },
    );
  } else {
    await octokit.request("POST /repos/{owner}/{repo}/actions/variables", {
      owner,
      repo,
      name,
      value,
    });
  }

  // Callers explicitly classify this name as non-sensitive. Free its old
  // secret slot only after GitHub has accepted the replacement variable.
  try {
    await octokit.request(
      "DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}",
      {
        owner,
        repo,
        secret_name: name,
      },
    );
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }
  console.log(`Successfully created/updated variable: ${name}`);
}

if (require.main === module) {
  Promise.resolve()
    .then(async () => {
      const input = JSON.parse(readFileSync(0, "utf8"));
      await createVariable(input);
    })
    .catch((error) => {
      console.error("GitHub variable request failed", error.status ?? "");
      process.exitCode = 1;
    });
}

module.exports = { createVariable };
