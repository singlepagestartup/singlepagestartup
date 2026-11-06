const { readFileSync } = require("node:fs");
const { Octokit } = require("octokit");
const sodium = require("libsodium-wrappers");

async function createBranch({ token, ownerWithRepository, branchName }) {
  const owner = ownerWithRepository.split("/")[0];
  const repo = ownerWithRepository.split("/")[1];

  const octokit = new Octokit({
    auth: token,
  });

  const mainRef = await octokit.request(
    "GET /repos/{owner}/{repo}/git/ref/{ref}",
    {
      owner,
      repo,
      ref: "heads/main",
    },
  );

  const branch = await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: mainRef.data.object.sha,
  });

  return branch;
}

(async () => {
  try {
    const input = JSON.parse(readFileSync(0, "utf8"));
    const token = input.GITHUB_TOKEN;
    const ownerWithRepository = input.GITHUB_REPOSITORY;
    const branchName = input.BRANCH_NAME;

    await createBranch({
      token,
      ownerWithRepository,
      branchName,
    });
  } catch (error) {
    if (error.status !== 422) {
      throw error;
    }
  }
})().catch((error) => {
  console.error("GitHub request failed", error.status ?? "");
  process.exitCode = 1;
});
