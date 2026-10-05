/**
 * Whether a subject token was revoked by the subject's `tokensValidAfter`
 * mark. JWT `iat` has one-second resolution, so the mark covers the whole
 * second in which it was written: a token signed earlier in that second is
 * revoked, and so is one signed later in it. A token without `iat` cannot be
 * placed before or after the mark and counts as revoked once a mark exists,
 * as does a mark that cannot be read as a date.
 */
export function isRbacSubjectTokenRevoked(props: {
  subject: {
    tokensValidAfter?: Date | string | null;
  };
  issuedAt?: number;
}): boolean {
  if (!props.subject.tokensValidAfter) {
    return false;
  }

  const validAfter = new Date(props.subject.tokensValidAfter).getTime();

  if (Number.isNaN(validAfter) || typeof props.issuedAt !== "number") {
    return true;
  }

  return props.issuedAt * 1000 <= validAfter;
}
