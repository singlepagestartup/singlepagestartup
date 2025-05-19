/**
 * Generates a correct URL considering multilingual context and link type.
 *
 * Used in components to:
 * - Automatically prepend the current language for internal links (e.g., /en/about)
 * - Return external links (with protocol, e.g., https://) as is
 * - Return language switcher links (e.g., /en, /ru) as is
 *
 * @param url        The original URL (can be internal, external, or a language switcher)
 * @param language   The current language code (e.g., 'en', 'ru')
 * @param languages  List of supported languages with codes
 * @returns          The correct URL for use in href
 */
export function util(
  url: string,
  language: string,
  languages: { code: string }[],
): string {
  if (!url) {
    return "/";
  }

  if (url.includes(":")) {
    return url; // external
  }

  if (languages.some((lang) => "/" + lang.code === url)) {
    return url; // language switcher
  }

  return `/${language}${url}`;
}
