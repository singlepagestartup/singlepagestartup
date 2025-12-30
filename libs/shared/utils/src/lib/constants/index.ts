export const TIPTAP_EMPTY_DOC =
  '{"type":"doc","content":[{"type":"paragraph"}]}';

export const UUID_PATH_SUFFIX_REGEX =
  /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\/?$|\?.*$)/;

export const UUID_PATH_SEGMENT_REGEX =
  /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\/|$)/g;
