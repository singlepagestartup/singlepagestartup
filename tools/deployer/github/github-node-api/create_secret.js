const { readFileSync } = require("node:fs");
const { Octokit } = require("octokit");
const sodium = require("libsodium-wrappers");

async function createSecret({
  token,
  ownerWithRepository,
  secretName,
  secretContent,
  secretScope = "actions",
}) {
  const octokit = new Octokit({
    auth: token,
  });

  if (secretContent === undefined || secretContent === "") {
    return;
  }

  const owner = ownerWithRepository.split("/")[0];
  const repo = ownerWithRepository.split("/")[1];

  const repositoryPublicKey = await octokit.request(
    "GET /repos/{owner}/{repo}/{secretScope}/secrets/public-key",
    {
      owner,
      repo,
      secretScope,
    },
  );

  const publicKey = repositoryPublicKey.data.key;
  const publicKeyId = repositoryPublicKey.data.key_id;

  // Convert the secret and key to a Uint8Array.
  const binkey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const binsec = sodium.from_string(secretContent);

  // Encrypt the secret using libsodium
  const encBytes = sodium.crypto_box_seal(binsec, binkey);

  // Convert the encrypted Uint8Array to Base64
  const encryptedValue = sodium.to_base64(
    encBytes,
    sodium.base64_variants.ORIGINAL,
  );

  const secret = await octokit.request(
    "PUT /repos/{owner}/{repo}/{secretScope}/secrets/{secret_name}",
    {
      owner,
      repo,
      secret_name: secretName,
      key_id: publicKeyId,
      encrypted_value: encryptedValue,
      secretScope,
    },
  );

  console.log(`Successfully created/updated secret: ${secretName}`);
  return secret;
}

(async () => {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const token = input.GITHUB_TOKEN;
  const ownerWithRepository = input.GITHUB_REPOSITORY;
  const secretName = input.SECRET_NAME;
  const secretContent = input.SECRET_CONTENT;
  const secretScope = input.SECRET_SCOPE;

  // Initialize sodium library
  await sodium.ready;

  await createSecret({
    token,
    ownerWithRepository,
    secretName,
    secretContent,
    secretScope,
  });
})().catch((error) => {
  console.error("GitHub request failed", error.status ?? "");
  process.exitCode = 1;
});
