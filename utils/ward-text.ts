import { normalizeStr } from './strings';

/**
 * Ward names are proper nouns, so in running text they start with an uppercase letter
 * ("phường An Nhơn nằm ở..."). The ward regex is greedy and also captures trailing
 * common words, some of which collide with real ward names once diacritics are removed
 * ("nằm" -> "nam" -> "Phường An Nhơn Nam").
 *
 * If the name starts with an uppercase letter or digit, stop at the first lowercase-initial
 * token. If it starts lowercase (e.g. all-lowercase user input), keep all tokens.
 */
export function trimToProperNouns(tokens: string[]): string[] {
  if (tokens.length === 0 || /^\p{Ll}/u.test(tokens[0])) return tokens;
  const end = tokens.findIndex((t, i) => i > 0 && /^\p{Ll}/u.test(t));
  return end === -1 ? tokens : tokens.slice(0, end);
}

/**
 * Candidate province strings that follow a ward name in free text, e.g.
 *   ", TP.HCM" / " tỉnh Gia Lai" / ", thuộc thành phố Hồ Chí Minh" / " Gia Lai".
 * Returned longest first (up to 4 words). Callers must only accept exact province
 * alias matches, so ordinary words never resolve to a province.
 */
export function provinceHintCandidates(textAfter: string): string[] {
  const m = textAfter.match(
    /^[\s,;:–—-]*(?:(?:thuộc|của|tại|ở)\s+)?(?:(?:thành phố|tỉnh|tp\.?|t\.p\.?)\s+)?([\p{L}\p{N}][\p{L}\p{N}.]*(?:\s+[\p{L}\p{N}][\p{L}\p{N}.]*){0,3})/iu,
  );
  if (!m) return [];
  const words = m[1].split(/\s+/);
  const out: string[] = [];
  for (let len = words.length; len >= 1; len--) {
    const candidate = words
      .slice(0, len)
      .join(' ')
      .replace(/[.,;:]+$/, '');
    if (candidate) out.push(candidate);
  }
  return out;
}

/** Normalized province name without its type prefix ("tinh", "thanh pho"). */
export function stripProvinceType(name: string): string {
  return normalizeStr(name)
    .replace(/^(tinh|thanh pho|tp\.?)\s+/, '')
    .trim();
}

/** Keys to try when looking a user-written province up in the alias map (normalized). */
export function provinceAliasKeys(hint: string): string[] {
  const h = normalizeStr(hint.trim());
  const bare = stripProvinceType(hint);
  return Array.from(new Set([h, bare, `tinh ${bare}`, `thanh pho ${bare}`]));
}
