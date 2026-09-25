const redactionMarker = "<redacted>";

/**
 * Hono's JWT error classes interpolate the token, the header or the payload
 * into their message, so the message reaches logs, error responses and bug
 * notifications unless it is rewritten. Every pattern below is bounded by a
 * character that cannot occur inside the interpolated value, so a message that
 * carries one of these shapes inside a serialized payload stays parseable.
 */
const credentialBearingPatterns: { pattern: RegExp; replacement: string }[] = [
  {
    pattern: /invalid JWT token:\s*[A-Za-z0-9._~+/=-]*/gi,
    replacement: `invalid JWT token: ${redactionMarker}`,
  },
  {
    pattern: /token\s*\([^)]*\)\s*expired/gi,
    replacement: `token ${redactionMarker} expired`,
  },
  {
    pattern: /token\s*\([^)]*\)\s*is being used before it's valid/gi,
    replacement: `token ${redactionMarker} is being used before it's valid`,
  },
  {
    pattern: /token\s*\([^)]*\)\s*signature mismatched/gi,
    replacement: `token ${redactionMarker} signature mismatched`,
  },
  {
    pattern: /jwt header is invalid:\s*\{[^}]*\}/gi,
    replacement: `jwt header is invalid: ${redactionMarker}`,
  },
  {
    pattern: /required "kid" in jwt header:\s*\{[^}]*\}/gi,
    replacement: `required "kid" in jwt header: ${redactionMarker}`,
  },
  {
    pattern: /required "aud" in jwt payload:\s*\{[^}]*\}/gi,
    replacement: `required "aud" in jwt payload: ${redactionMarker}`,
  },
];

const jwtShapedValuePattern =
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;

/**
 * Removes credential material from an error message before it becomes an
 * HTTP response, a log record or a bug notification. Text that carries no
 * credential is returned unchanged.
 */
export function util(message: string): string {
  if (typeof message !== "string" || !message) {
    return message;
  }

  let sanitized = message;

  for (const entry of credentialBearingPatterns) {
    sanitized = sanitized.replace(entry.pattern, entry.replacement);
  }

  return sanitized.replace(jwtShapedValuePattern, redactionMarker);
}
