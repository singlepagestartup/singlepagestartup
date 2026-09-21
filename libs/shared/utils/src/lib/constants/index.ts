export const TIPTAP_EMPTY_DOC =
  '{"type":"doc","content":[{"type":"paragraph"}]}';

export const UUID_PATH_SUFFIX_REGEX =
  /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\/?$|\?.*$)/;

export const UUID_PATH_SEGMENT_REGEX =
  /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\/|$)/g;

/**
 * Captures a path up to and including its FIRST UUID segment (group 1) —
 * i.e. the entity base of a nested route. Single source of truth for the UUID
 * shape used by the http-cache version-bump prefix logic (issue #195 cleanup),
 * so the shape is not duplicated as an inline literal.
 */
export const UUID_PATH_PREFIX_REGEX =
  /(.*\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;

/**
 * Providers whose email the framework treats as proven, because the address
 * arrives from the provider over a server-to-server channel rather than from
 * the person signing up (issue #280).
 *
 * `telegram` and the legacy `email` provider are deliberately absent: both can
 * carry an address without establishing ownership of it.
 *
 * Used by the interim registration guard, which refuses a password
 * registration for an address one of these already holds. That guard goes away
 * once registration confirms an address of its own, and this list then decides
 * which identities may be linked rather than which block a registration.
 */
export const ADDRESS_VERIFYING_PROVIDERS = Object.freeze([
  "oauth_google",
] as const);
