const { readFileSync } = require("node:fs");
const { Octokit } = require("octokit");

async function deleteSecret({
  token,
  ownerWithRepository,
  secretName,
  secretScope = "actions",
}) {
  const octokit = new Octokit({
    auth: token,
  });

  const owner = ownerWithRepository.split("/")[0];
  const repo = ownerWithRepository.split("/")[1];

  const secret = await octokit.request(
    "DELETE /repos/{owner}/{repo}/{secretScope}/secrets/{secretName}",
    {
      owner,
      repo,
      secretName,
      secretScope,
    },
  );

  return secret;
}

(async () => {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    const token = input.GITHUB_TOKEN;
    const ownerWithRepository = input.GITHUB_REPOSITORY;
    const secretName = input.SECRET_NAME;
    const secretScope = input.SECRET_SCOPE;

    await deleteSecret({
      token,
      ownerWithRepository,
      secretName,
      secretScope,
    });
  } catch (err) {
    if (err.status !== 404) {
      throw err;
    }
  }
})().catch((error) => {
  console.error("GitHub request failed", error.status ?? "");
  process.exitCode = 1;
});
