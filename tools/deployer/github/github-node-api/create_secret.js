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

  try {
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
  } catch (error) {
    console.error(
      `Failed to create/update secret ${secretName}:`,
      error.message,
    );
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

(async () => {
  var args = process.argv.slice(2);
  const token = args[0];
  const ownerWithRepository = args[1];
  const secretName = args[2];
  const secretContent = args[3];
  const secretScope = args[4];

  // Initialize sodium library
  await sodium.ready;

  await createSecret({
    token,
    ownerWithRepository,
    secretName,
    secretContent,
    secretScope,
  });
})();
