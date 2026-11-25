import { normalizeStr } from './strings';
import { stripProvinceType } from './ward-text';

interface Candidate {
  newWard: { ward_code: string; province_name: string };
}

/** Only the article's text is supplied here, never navigation or related stories. */
export class WardArticleContext {
  private readonly pairs = new Map<string, Set<string>>();
  private readonly words: string[];

  constructor(blocks: string[]) {
    // Keep block/punctuation boundaries so unrelated adjacent words don't form a province.
    this.words = blocks.map((block) => ` ${contextWords(block)} `);
  }

  record(wardName: string, wardCode: string): void {
    const codes = this.pairs.get(wardName) ?? new Set<string>();
    codes.add(wardCode);
    this.pairs.set(wardName, codes);
  }

  pick<T extends Candidate>(
    wardName: string,
    candidates: T[],
    aliases: ReadonlyMap<string, string>,
  ): T | undefined {
    const codes = this.pairs.get(wardName);
    if (codes) {
      if (codes.size !== 1) return undefined;
      return candidates.find(({ newWard }) => codes.has(newWard.ward_code));
    }

    const provinces = new Set(
      candidates.map(({ newWard }) => stripProvinceType(newWard.province_name)),
    );
    const labels = new Map([...provinces].map((province) => [province, new Set([province])]));
    for (const [alias, official] of aliases) {
      const names = labels.get(stripProvinceType(official));
      const words = contextWords(alias);
      // Short aliases such as HN are too noisy without an explicit ward–province pair.
      if (words.replace(/\W/g, '').length >= 4) names?.add(words);
    }
    const supported = candidates.filter(({ newWard }) =>
      [...labels.get(stripProvinceType(newWard.province_name))!].some((label) =>
        this.words.some((block) => block.includes(` ${label} `)),
      ),
    );
    return supported.length === 1 ? supported[0] : undefined;
  }
}

function contextWords(text: string): string {
  return normalizeStr(text)
    .replace(/[^\p{L}\p{N}\s]+/gu, ' | ')
    .replace(/\s+/g, ' ')
    .trim();
}
