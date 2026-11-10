const { readFileSync } = require("node:fs");
const { Octokit } = require("octokit");

async function deleteVariable(
  input,
  octokit = new Octokit({ auth: input.GITHUB_TOKEN }),
) {
  const [owner, repo] = input.GITHUB_REPOSITORY.split("/");
  const name = input.VARIABLE_NAME;
  try {
    await octokit.request(
      "DELETE /repos/{owner}/{repo}/actions/variables/{name}",
      {
        owner,
        repo,
        name,
      },
    );
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }
  }

  // Also handle a setting that has not yet been migrated from Secrets.
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
}

if (require.main === module) {
  Promise.resolve()
    .then(async () => {
      const input = JSON.parse(readFileSync(0, "utf8"));
      await deleteVariable(input);
    })
    .catch((error) => {
      console.error("GitHub variable request failed", error.status ?? "");
      process.exitCode = 1;
    });
}

module.exports = { deleteVariable };
