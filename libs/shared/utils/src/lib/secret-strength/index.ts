/**
 * Assessment of a configured secret's strength (issue #273).
 *
 * The removed bootstrap generator hashed the shell's `$RANDOM`, so its whole
 * output space was 32768 strings. These predicates recognise a value of that
 * shape, and the API, MCP and Telegram services refuse to start on one. The
 * setting that decides whether a finding refuses or only reports lives with the
 * other environment values of each service (`envs/api.ts`, `envs/telegram.ts`,
 * `MCP_SECRET_STRENGTH` in `apps/mcp/http.ts`).
 */

export type ISecretVerdict = "ok" | "missing" | "short" | "legacy";

export interface ISecretAssessment {
  name: string;
  verdict: ISecretVerdict;
}

/** The values the API's boot check looks at, in report order. */
export const CHECKED_SECRET_NAMES = [
  "RBAC_SECRET_KEY",
  "RBAC_JWT_SECRET",
  "MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET",
  "RBAC_COOKIE_SESSION_SECRET",
  "KV_PASSWORD",
  "DATABASE_PASSWORD",
];

/**
 * The full authorization bypass and the token signing key. A legacy or absent
 * value in either one stops the process under `enforce`. Every other finding is
 * reported only.
 */
export const FATAL_SECRET_NAMES = ["RBAC_SECRET_KEY", "RBAC_JWT_SECRET"];

export const FATAL_SECRET_VERDICTS: ISecretVerdict[] = ["legacy", "missing"];

/**
 * The secrets the MCP service can hold. `RBAC_SECRET_KEY` is there only when an
 * operator enabled the header fallback, `MCP_SERVICE_OAUTH_JWT_SECRET` only when
 * a dedicated signing key is configured.
 */
export const MCP_CHECKED_SECRET_NAMES = [
  "RBAC_SECRET_KEY",
  "RBAC_JWT_SECRET",
  "MCP_SERVICE_OAUTH_JWT_SECRET",
  "MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET",
  "KV_PASSWORD",
];

/** The secrets the Telegram service holds, in report order. */
export const TELEGRAM_CHECKED_SECRET_NAMES = [
  "RBAC_SECRET_KEY",
  "RBAC_JWT_SECRET",
  "TELEGRAM_SERVICE_WEBHOOK_SECRET",
];

export const MINIMUM_SECRET_LENGTH = 32;

/** `$RANDOM` in bash is an integer in 0..32767, so the old generator had 32768
 * possible outputs. Each one was piped through `md5sum` and truncated to the
 * 32-character digest. */
const LEGACY_RANDOM_MAXIMUM = 32767;
const LEGACY_SECRET_LENGTH = 32;

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
  9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

const MD5_SINES = Array.from({ length: 64 }, (_unused, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 4294967296),
);

function toLittleEndianHex(word: number): string {
  let hex = "";

  for (let index = 0; index < 4; index += 1) {
    hex += ((word >>> (index * 8)) & 0xff).toString(16).padStart(2, "0");
  }

  return hex;
}

/**
 * MD5 of an ASCII string. The algorithm is here only to reproduce the removed
 * generator's output set exactly; `@sps/shared-utils` is imported by client
 * components, so this file stays free of node built-ins. Never use it to hash
 * anything that needs to stay secret.
 */
function md5Hex(input: string): string {
  const bytes: number[] = [];

  for (let index = 0; index < input.length; index += 1) {
    bytes.push(input.charCodeAt(index) & 0xff);
  }

  const bitLength = bytes.length * 8;

  bytes.push(0x80);

  while (bytes.length % 64 !== 56) {
    bytes.push(0);
  }

  for (let index = 0; index < 8; index += 1) {
    bytes.push(index < 4 ? (bitLength >>> (index * 8)) & 0xff : 0);
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const words: number[] = [];

    for (let index = 0; index < 16; index += 1) {
      const at = offset + index * 4;

      words.push(
        (bytes[at] |
          (bytes[at + 1] << 8) |
          (bytes[at + 2] << 16) |
          (bytes[at + 3] << 24)) >>>
          0,
      );
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let step = 0; step < 64; step += 1) {
      let mixed: number;
      let wordIndex: number;

      if (step < 16) {
        mixed = (b & c) | (~b & d);
        wordIndex = step;
      } else if (step < 32) {
        mixed = (d & b) | (~d & c);
        wordIndex = (5 * step + 1) % 16;
      } else if (step < 48) {
        mixed = b ^ c ^ d;
        wordIndex = (3 * step + 5) % 16;
      } else {
        mixed = c ^ (b | ~d);
        wordIndex = (7 * step) % 16;
      }

      const sum =
        (a + (mixed >>> 0) + MD5_SINES[step] + words[wordIndex]) >>> 0;
      const shift = MD5_SHIFTS[step];
      const rotated = ((sum << shift) | (sum >>> (32 - shift))) >>> 0;

      a = d;
      d = c;
      c = b;
      b = (b + rotated) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return (
    toLittleEndianHex(a0) +
    toLittleEndianHex(b0) +
    toLittleEndianHex(c0) +
    toLittleEndianHex(d0)
  );
}

let legacyRandomSecrets: Set<string> | undefined;

function getLegacyRandomSecrets(): Set<string> {
  if (!legacyRandomSecrets) {
    const digests = new Set<string>();

    for (let seed = 0; seed <= LEGACY_RANDOM_MAXIMUM; seed += 1) {
      // `echo $RANDOM | md5sum` hashes the newline `echo` appends. A project
      // copy that used `printf` instead drew from the same 15 bits, so both
      // forms count as legacy.
      digests.add(md5Hex(`${seed}\n`));
      digests.add(md5Hex(`${seed}`));
    }

    legacyRandomSecrets = digests;
  }

  return legacyRandomSecrets;
}

/**
 * True when the value is one of the outputs the removed `$RANDOM` generator
 * could produce. The length and alphabet are checked first, so a rotated
 * 64-character secret never pays for building the candidate set.
 */
export function isLegacyRandomSecret(value?: string): boolean {
  if (!value || value.length !== LEGACY_SECRET_LENGTH) {
    return false;
  }

  if (!/^[0-9a-f]+$/.test(value)) {
    return false;
  }

  return getLegacyRandomSecrets().has(value);
}

export function assessSecret(name: string, value?: string): ISecretAssessment {
  if (!value) {
    return { name, verdict: "missing" };
  }

  if (isLegacyRandomSecret(value)) {
    return { name, verdict: "legacy" };
  }

  if (value.length < MINIMUM_SECRET_LENGTH) {
    return { name, verdict: "short" };
  }

  return { name, verdict: "ok" };
}

export function assessSecrets(
  env: Record<string, string | undefined>,
  names: readonly string[] = CHECKED_SECRET_NAMES,
): ISecretAssessment[] {
  return names.map((name) => assessSecret(name, env[name]));
}

/**
 * The boot check of the MCP and Telegram services. Each holds some of its
 * secrets only in some setups and refuses the operation that needs an absent
 * one, so only the values that are set are judged.
 */
export function assessConfiguredSecrets(
  env: Record<string, string | undefined>,
  names: readonly string[],
): ISecretAssessment[] {
  return assessSecrets(env, names).filter(
    (assessment) => assessment.verdict !== "missing",
  );
}

export function isFatalSecretAssessment(
  assessment: ISecretAssessment,
): boolean {
  return (
    FATAL_SECRET_NAMES.includes(assessment.name) &&
    FATAL_SECRET_VERDICTS.includes(assessment.verdict)
  );
}

/**
 * A report line for one finding. It carries the key name and the verdict and
 * never the value, a prefix of it, or its length.
 */
export function formatSecretAssessment(assessment: ISecretAssessment): string {
  switch (assessment.verdict) {
    case "missing":
      return `${assessment.name}: missing, no value is set.`;
    case "legacy":
      return `${assessment.name}: legacy, this value is one the removed $RANDOM generator could produce and can be found offline. Rotate it.`;
    case "short":
      return `${assessment.name}: short, fewer than ${MINIMUM_SECRET_LENGTH} characters. Rotate it.`;
    default:
      return `${assessment.name}: ok.`;
  }
}
