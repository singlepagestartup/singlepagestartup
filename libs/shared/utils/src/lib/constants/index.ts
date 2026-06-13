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
