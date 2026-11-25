import { normalizeStr } from '@/utils/strings';
import {
  trimToProperNouns,
  provinceHintCandidates,
  stripProvinceType,
  provinceAliasKeys,
} from '@/utils/ward-text';
import { WardArticleContext } from '@/utils/ward-context';
import { getSettings, type Settings } from '@/utils/settings';
import type { NewWard, OldWard } from '@/utils/indexeddb';

let mutationObserver: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let tooltipListeners: {
  type: string;
  handler: EventListener;
  options?: boolean | AddEventListenerOptions;
}[] = [];

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('[Vietnam Wards] Content script loaded on', document.location.href);
    if (
      document.location.protocol === 'chrome-extension:' ||
      document.location.protocol === 'moz-extension:'
    ) {
      return;
    }

    // Listen for setting changes from popup
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'SETTINGS_CHANGED') {
        handleSettingChange(message.settings);
        sendResponse({ success: true });
      }
      return false;
    });

    augmentContent();
  },
});

async function handleSettingChange(settings: Settings): Promise<void> {
  if (!settings.enableAnnotation) {
    // Clean up all annotations
    cleanupAnnotations();
  } else {
    // Re-enable annotations
    await augmentContent();
  }
}

function cleanupAnnotations(): void {
  // Stop observing mutations
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  // Clear any pending debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  // Remove all annotation spans and replace with plain text
  const annotations = document.querySelectorAll(`.${ANNOTATION_CLASS}`);
  annotations.forEach((span) => {
    // Remove [?] hint spans first so they don't end up in the text
    span.querySelectorAll('.vw-hint').forEach((hint) => hint.remove());
    const text = span.textContent;
    if (text) {
      const textNode = document.createTextNode(text);
      span.parentNode?.replaceChild(textNode, span);
    }
  });

  // Remove tooltip event listeners
  for (const { type, handler, options } of tooltipListeners) {
    document.removeEventListener(type, handler, options);
  }
  tooltipListeners = [];

  // Remove tooltip
  const tooltip = document.getElementById(TOOLTIP_ID);
  if (tooltip) {
    tooltip.remove();
  }

  // Remove styles
  const styles = document.getElementById('vw-styles');
  if (styles) {
    styles.remove();
  }

  // Reset province alias map so it's rebuilt on re-enable
  provinceAliasMap = null;

  // Clear badge count
  updateBadgeCount(0);

  console.log('[Vietnam Wards] Cleaned up annotations');
}

async function sendLookupMessage<T>(message: Record<string, unknown>): Promise<T> {
  return browser.runtime.sendMessage(message) as Promise<T>;
}

let provinceAliasMap: Map<string, string> | null = null;

// Ward name part has at most 6 word-tokens (e.g. "Văn Miếu - Quốc Tử Giám").
// Province hints are parsed separately so a parenthesized ward can still be a match.
const WARD_PATTERN =
  /\b(phường|xã|thị trấn)\s+([A-Za-zÀ-ỹ0-9]+(?:['\u2018\u2019\u02bc][A-Za-zÀ-ỹ0-9]+)*(?:[\s-]+[A-Za-zÀ-ỹ0-9]+(?:['\u2018\u2019\u02bc][A-Za-zÀ-ỹ0-9]+)*){0,5})/gi;

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'TEXTAREA',
  'INPUT',
  'CODE',
  'PRE',
  'A',
  'BUTTON',
  'SELECT',
  'OPTION',
]);

const MAX_ANNOTATIONS = 50;
const ANNOTATION_CLASS = 'vw-annotation';
const TOOLTIP_ID = 'vw-tooltip';
const DEBOUNCE_DELAY = 300;

async function augmentContent() {
  try {
    const settings = await getSettings();
    if (!settings.enableAnnotation) {
      console.log('[Vietnam Wards] Annotation disabled, skipping');
      return;
    }

    // Don't re-initialize if already running
    if (mutationObserver) {
      console.log('[Vietnam Wards] Already initialized, skipping');
      return;
    }

    console.log('[Vietnam Wards] Content script starting...');

    injectStyles();
    createTooltip();
    await buildProvinceAliasMap();
    console.log('[Vietnam Wards] Province aliases loaded:', provinceAliasMap?.size || 0);

    await processDocument();
    observeMutations();

    console.log('[Vietnam Wards] Content script initialized');
  } catch (error) {
    console.error('[Vietnam Wards] Error initializing:', error);
  }
}

function injectStyles() {
  if (document.getElementById('vw-styles')) return;
  const style = document.createElement('style');
  style.id = 'vw-styles';
  style.textContent = `
    .${ANNOTATION_CLASS} {
      text-decoration: underline dotted #7c3aed;
      text-underline-offset: 2px;
      cursor: help;
      color: inherit;
    }
    .vw-hint {
      display: inline-block;
      margin-left: 2px;
      font-size: 0.7em;
      font-weight: 600;
      color: #7c3aed;
      vertical-align: super;
      line-height: 1;
      font-family: system-ui, -apple-system, sans-serif;
      font-style: normal;
    }
    @media (prefers-color-scheme: dark) {
      .${ANNOTATION_CLASS} { text-decoration-color: #a78bfa; }
      .vw-hint { color: #a78bfa; }
    }
    #${TOOLTIP_ID} {
      position: fixed;
      z-index: 2147483647;
      background: #1e1040;
      color: #ede9fe;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      pointer-events: none;
      display: none;
      box-shadow: 0 4px 16px rgba(124,58,237,0.35);
      font-family: system-ui, -apple-system, sans-serif;
      max-width: min(320px, calc(100vw - 16px));
      border: 1px solid rgba(167,139,250,0.4);
    }
  `;
  document.head.appendChild(style);
}

function createTooltip() {
  if (document.getElementById(TOOLTIP_ID)) return;
  const tooltip = document.createElement('div');
  tooltip.id = TOOLTIP_ID;
  document.body.appendChild(tooltip);

  // Track whether the tooltip is pinned by a tap (touch/click) so scroll can dismiss it
  let pinnedByTap = false;

  const showTooltip = (target: Element, positionFn: () => void) => {
    const text = target.getAttribute('data-tooltip');
    if (!text) return;
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    positionFn();
  };

  // Desktop: hover-based tooltip
  const onMouseOver = ((e: MouseEvent) => {
    if (pinnedByTap) return;
    const target = (e.target as Element).closest(`.${ANNOTATION_CLASS}`);
    if (!target) return;
    showTooltip(target, () => positionTooltip(tooltip, e));
  }) as EventListener;

  const onMouseMove = ((e: MouseEvent) => {
    if (pinnedByTap) return;
    if (tooltip.style.display === 'block') {
      positionTooltip(tooltip, e);
    }
  }) as EventListener;

  const onMouseOut = ((e: MouseEvent) => {
    if (pinnedByTap) return;
    const target = (e.target as Element).closest(`.${ANNOTATION_CLASS}`);
    if (target) {
      tooltip.style.display = 'none';
    }
  }) as EventListener;

  // Mobile: tap-based toggle
  const onClick = ((e: MouseEvent) => {
    const target = (e.target as Element).closest(`.${ANNOTATION_CLASS}`);
    if (target) {
      if (pinnedByTap && tooltip.style.display === 'block') {
        // Tap again to dismiss
        tooltip.style.display = 'none';
        pinnedByTap = false;
      } else {
        pinnedByTap = true;
        showTooltip(target, () => positionTooltipNearElement(tooltip, target));
      }
    } else if (pinnedByTap) {
      tooltip.style.display = 'none';
      pinnedByTap = false;
    }
  }) as EventListener;

  // Hide tooltip when page is scrolled (fixes tooltip staying fixed on mobile)
  const onScroll = (() => {
    tooltip.style.display = 'none';
    pinnedByTap = false;
  }) as EventListener;

  document.addEventListener('mouseover', onMouseOver);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseout', onMouseOut);
  document.addEventListener('click', onClick);
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });

  tooltipListeners = [
    { type: 'mouseover', handler: onMouseOver },
    { type: 'mousemove', handler: onMouseMove },
    { type: 'mouseout', handler: onMouseOut },
    { type: 'click', handler: onClick },
    { type: 'scroll', handler: onScroll, options: { capture: true, passive: true } },
  ];
}

function positionTooltip(tooltip: HTMLElement, e: MouseEvent) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = e.clientX;
  const y = e.clientY;

  // Use getBoundingClientRect after display:block to get actual rendered dimensions
  const rect = tooltip.getBoundingClientRect();
  const tw = rect.width || 240; // fallback if not yet laid out
  const th = rect.height || 60;

  let left = x + 14;
  let top = y - th - 10;

  if (left + tw > vw - 8) left = x - tw - 14;
  if (left < 8) left = 8;
  if (top < 8) top = y + 22;
  if (top + th > vh - 8) top = vh - th - 8;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

// Position tooltip relative to element rect — used for touch/tap on mobile
function positionTooltipNearElement(tooltip: HTMLElement, element: Element) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const elRect = element.getBoundingClientRect();

  const rect = tooltip.getBoundingClientRect();
  const tw = rect.width || 240;
  const th = rect.height || 60;

  // Prefer above the element, fall back to below
  let top = elRect.top - th - 8;
  if (top < 8) top = elRect.bottom + 8;
  if (top + th > vh - 8) top = Math.max(8, vh - th - 8);

  // Align to element left, clamped to viewport
  let left = elRect.left;
  if (left + tw > vw - 8) left = vw - tw - 8;
  if (left < 8) left = 8;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

async function buildProvinceAliasMap() {
  if (provinceAliasMap) return;

  provinceAliasMap = new Map();

  try {
    const oldProvinces = await sendLookupMessage<Array<{ name: string; alias?: string }>>({
      type: 'LOOKUP_ALL_OLD_PROVINCES',
    });
    const newProvinces = await sendLookupMessage<Array<{ name: string }>>({
      type: 'LOOKUP_ALL_NEW_PROVINCES',
    });

    for (const province of oldProvinces) {
      addProvinceAlias(province.name, province.name);
      if (province.alias) {
        for (const alias of province.alias.split(',').map((a) => a.trim())) {
          addProvinceAlias(alias, province.name);
        }
      }
    }

    for (const province of newProvinces) {
      addProvinceAlias(province.name, province.name);
    }

    addCommonAbbreviations();
  } catch (error) {
    console.error('[Vietnam Wards] Error building province alias map:', error);
  }
}

function addProvinceAlias(alias: string, officialName: string) {
  provinceAliasMap!.set(normalizeStr(alias), officialName);
}

function addCommonAbbreviations() {
  const abbreviations: [string, string][] = [
    ['TP.HCM', 'Thành phố Hồ Chí Minh'],
    ['TP HCM', 'Thành phố Hồ Chí Minh'],
    ['TPHCM', 'Thành phố Hồ Chí Minh'],
    ['Sài Gòn', 'Thành phố Hồ Chí Minh'],
    ['HN', 'Hà Nội'],
    ['TP.HN', 'Thành phố Hà Nội'],
    ['TP HN', 'Thành phố Hà Nội'],
  ];
  for (const [alias, official] of abbreviations) {
    addProvinceAlias(alias, official);
  }
}

// Only exact aliases count as evidence for a province.
function resolveProvinceNameExact(hint: string | undefined): string | null {
  if (!hint || !provinceAliasMap) return null;
  for (const key of provinceAliasKeys(hint)) {
    const official = provinceAliasMap.get(key);
    if (official) return official;
  }
  return null;
}

const ARTICLE_EXCLUSIONS = 'aside, nav, footer, [role="complementary"], [data-no-dvhcvn]';
const ARTICLE_BLOCKS = 'p, h1, h2, h3, h4, h5, h6, li, figcaption, blockquote, div';

interface ArticleTextLocation {
  segment: { text: string };
  offset: number;
}

function articleTextBlocks(): Map<Text, ArticleTextLocation> {
  const main = document.querySelector('main, [role="main"]') ?? document.body;
  const bodies = [...main.querySelectorAll('[itemprop~="articleBody"]')].filter(
    (el) => !el.closest(ARTICLE_EXCLUSIONS),
  );
  const articles = [...main.querySelectorAll('article')].filter(
    (el) => !el.closest(ARTICLE_EXCLUSIONS) && !el.parentElement?.closest('article'),
  );
  const body =
    bodies.length === 1
      ? bodies[0]
      : bodies.length === 0 && articles.length === 1
        ? articles[0]
        : null;
  const result = new Map<Text, ArticleTextLocation>();
  if (!body) return result;

  const owner = body.closest('article') ?? main;
  const roots = [body];
  // Some publishers put the headline and summary alongside the marked-up article body.
  for (const selector of ['[itemprop~="headline"], h1', '[itemprop~="description"]']) {
    const elements = [...owner.querySelectorAll(selector)].filter(
      (el) => !el.closest(ARTICLE_EXCLUSIONS) && (el.closest('article') ?? main) === owner,
    );
    if (elements.length === 1 && !body.contains(elements[0]) && !elements[0].contains(body)) {
      roots.push(elements[0]);
    }
  }

  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let previousBlock: Element | null = null;
    let segment = { text: '' };
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement!;
      if (parent.closest('.vw-hint')) continue;
      if (
        parent.closest(`${ARTICLE_EXCLUSIONS}, script, style, button`) ||
        (parent.closest('article') ?? main) !== owner
      ) {
        previousBlock = null;
        continue;
      }
      const block = parent.closest(ARTICLE_BLOCKS) ?? root;
      if (block !== previousBlock) segment = { text: '' };
      const offset = segment.text.length;
      segment.text += (node as Text).data;
      result.set(node as Text, { segment, offset });
      previousBlock = block;
    }
  }
  return result;
}

async function processDocument() {
  const textNodes = collectTextNodes();
  const blocks = articleTextBlocks();
  const lookup = new WardScan();
  const segments = new Set([...blocks.values()].map(({ segment }) => segment));
  const article = await lookup.collectContext([...segments].map(({ text }) => text));
  console.log('[Vietnam Wards] Scanning', textNodes.length, 'text nodes');

  let annotationCount = 0;
  let foundCount = 0;

  for (const node of textNodes) {
    if (annotationCount >= MAX_ANNOTATIONS) break;

    const block = blocks.get(node);
    const result = await processTextNode(node, lookup, block, block ? article : undefined);
    if (result) {
      foundCount += result.found;
      annotationCount += result.annotated;
    }
  }

  if (foundCount > 0 || annotationCount > 0) {
    console.log(
      `[Vietnam Wards] Found ${foundCount} ward candidates, annotated ${annotationCount}`,
    );
  }

  // Count total annotations on the page for badge
  const totalAnnotations = document.querySelectorAll(`.${ANNOTATION_CLASS}`).length;
  updateBadgeCount(totalAnnotations);
}

function updateBadgeCount(count: number): void {
  try {
    browser.runtime.sendMessage({ type: 'ANNOTATION_COUNT', count }).catch(() => {
      // Ignore errors if background script is not ready
    });
  } catch {
    // Ignore if extension context is invalidated (e.g. after extension reload)
  }
}

function collectTextNodes(): Text[] {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains(ANNOTATION_CLASS)) return NodeFilter.FILTER_REJECT;
      if (parent.closest(`#${TOOLTIP_ID}`)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('[data-no-dvhcvn]')) return NodeFilter.FILTER_REJECT;
      const text = node.textContent?.trim();
      if (!text || text.length < 10) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    nodes.push(node as Text);
  }
  return nodes;
}

interface WardMention {
  wardType: string;
  wardName: string;
  index: number;
  nameStart: number;
}

function findWardMentions(text: string): WardMention[] {
  return [...text.matchAll(WARD_PATTERN)].map((match) => ({
    wardType: match[1],
    wardName: match[2],
    index: match.index!,
    nameStart: text.indexOf(match[2], match.index! + match[1].length),
  }));
}

async function processTextNode(
  textNode: Text,
  lookup: WardScan,
  block: ArticleTextLocation | undefined,
  article: WardArticleContext | undefined,
): Promise<{ found: number; annotated: number } | null> {
  const text = textNode.data;
  const matches = findWardMentions(text);
  if (matches.length === 0) return null;

  const replacements: Array<{ start: number; end: number; html: string }> = [];

  for (const m of matches) {
    const result = await lookup.find(m, block?.segment.text ?? text, block?.offset ?? 0);
    if (!result) continue;
    const picked =
      result.explicit ??
      (result.candidates.length === 1
        ? result.candidates[0]
        : !result.hasHint
          ? article?.pick(result.name, result.candidates, provinceAliasMap ?? new Map())
          : undefined);
    const tooltip = picked
      ? buildTooltip(picked.newWard, picked.oldWards)
      : buildAmbiguousTooltip(result.candidates);
    if (tooltip) {
      replacements.push({
        start: m.index,
        end: result.end,
        html: createAnnotationHTML(text.slice(m.index, result.end), tooltip),
      });
    }
  }

  if (replacements.length === 0) return null;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  replacements.sort((a, b) => a.start - b.start);

  for (const repl of replacements) {
    if (repl.start > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, repl.start)));
    }
    const span = document.createElement('span');
    span.innerHTML = repl.html;
    fragment.appendChild(span.firstChild!);
    lastIndex = repl.end;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  textNode.parentNode?.replaceChild(fragment, textNode);
  return { found: matches.length, annotated: replacements.length };
}

interface WardCandidate {
  newWard: NewWard;
  oldWards: OldWard[];
}

interface WardMatch {
  name: string;
  end: number;
  candidates: WardCandidate[];
  explicit: WardCandidate | undefined;
  hasHint: boolean;
}

function provinceAfter(text: string, end: number): string | null {
  const trailing = text.slice(end, end + 140);
  const parenthetical = trailing.match(/^\s*\(\s*([^)\n]{1,40})\)/)?.[1];
  const hints = parenthetical ? [parenthetical] : provinceHintCandidates(trailing);
  for (const hint of hints) {
    const official = resolveProvinceNameExact(hint);
    if (official) return stripProvinceType(official);
  }
  return null;
}

function* wardPrefixes(mention: WardMention) {
  const words = [...mention.wardName.matchAll(/\S+/g)];
  const tokens = trimToProperNouns(words.map(([word]) => word));
  for (let len = tokens.length; len >= 1; len--) {
    const last = words[len - 1];
    yield {
      name: normalizeStr(`${mention.wardType} ${tokens.slice(0, len).join(' ')}`),
      end: mention.nameStart + last.index! + last[0].length,
    };
  }
}

class WardScan {
  private readonly wards = new Map<string, Promise<NewWard[]>>();
  private readonly oldWards = new Map<string, Promise<OldWard[]>>();

  async collectContext(blocks: string[]): Promise<WardArticleContext | undefined> {
    if (blocks.length === 0) return undefined;
    const context = new WardArticleContext(blocks);
    for (const text of blocks) {
      for (const mention of findWardMentions(text)) {
        // Don't query IndexedDB in the first pass unless a possible explicit hint follows.
        if (![...wardPrefixes(mention)].some(({ end }) => provinceAfter(text, end))) continue;
        const result = await this.find(mention, text);
        if (result?.explicit) context.record(result.name, result.explicit.newWard.ward_code);
      }
    }
    return context;
  }

  async find(mention: WardMention, text: string, offset = 0): Promise<WardMatch | null> {
    try {
      for (const { name, end } of wardPrefixes(mention)) {
        if (!this.wards.has(name)) {
          this.wards.set(
            name,
            sendLookupMessage<NewWard[]>({
              type: 'LOOKUP_NEW_WARDS_BY_NAME',
              wardName: name,
            }),
          );
        }
        const wards = await this.wards.get(name)!;
        if (wards.length === 0) continue;
        const candidates = await Promise.all(
          wards.map(async (newWard) => {
            const code = newWard.ward_code;
            if (!this.oldWards.has(code)) {
              this.oldWards.set(
                code,
                sendLookupMessage<OldWard[]>({
                  type: 'LOOKUP_OLD_WARDS_FROM_NEW',
                  wardCode: code,
                }),
              );
            }
            return { newWard, oldWards: await this.oldWards.get(code)! };
          }),
        );
        const target = provinceAfter(text, offset + end);
        // Prefer an exact current province before considering historical province names.
        const current = target
          ? candidates.filter(({ newWard }) => stripProvinceType(newWard.province_name) === target)
          : [];
        const matched =
          target && current.length === 0
            ? candidates.filter(({ oldWards }) =>
                oldWards.some((ward) => stripProvinceType(ward.province_name) === target),
              )
            : current;
        return {
          name,
          end,
          candidates,
          explicit: matched.length === 1 ? matched[0] : undefined,
          hasHint: target !== null,
        };
      }
    } catch (error) {
      console.error('[Vietnam Wards] Lookup error:', error);
    }
    return null;
  }
}

// "district, province (cũ)" lines, grouped by old province.
function oldWardLines(oldWards: OldWard[]): string[] {
  const byProvince = new Map<string, Set<string>>();
  for (const old of oldWards) {
    if (!old.district_name || !old.province_name) continue;
    if (!byProvince.has(old.province_name)) byProvince.set(old.province_name, new Set());
    byProvince.get(old.province_name)!.add(old.district_name);
  }

  const lines: string[] = [];
  for (const [province, districts] of byProvince) {
    lines.push(`${Array.from(districts).join(', ')}, ${province} (cũ)`);
  }
  return lines;
}

function buildTooltip(_newWard: NewWard, oldWards: OldWard[]): string | null {
  const lines = oldWardLines(oldWards);
  return lines.length > 0 ? lines.join('\n') : null;
}

const MAX_AMBIGUOUS_SHOWN = 6;

// Several wards share this name and the page gives no province: list every possibility.
function buildAmbiguousTooltip(candidates: WardCandidate[]): string | null {
  const shown = candidates.slice(0, MAX_AMBIGUOUS_SHOWN);
  const entries: string[] = [];
  for (const c of shown) {
    const lines = oldWardLines(c.oldWards);
    if (lines.length === 0) continue;
    entries.push(`• ${c.newWard.province_name}: ${lines.join('; ')}`);
  }
  if (entries.length === 0) return null;
  const header = `Có ${candidates.length} nơi trùng tên, chưa rõ là nơi nào:`;
  const more =
    candidates.length > shown.length ? [`… và ${candidates.length - shown.length} nơi khác`] : [];
  return [header, ...entries, ...more].join('\n');
}

function createAnnotationHTML(text: string, tooltip: string): string {
  const escaped = tooltip
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return `<span class="${ANNOTATION_CLASS}" data-tooltip="${escaped}">${text}<span class="vw-hint">[?]</span></span>`;
}

function observeMutations() {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  const tooltipEl = document.getElementById(TOOLTIP_ID);
  mutationObserver = new MutationObserver((mutations) => {
    const hasRelevantChanges = mutations.some((m) => {
      // Ignore mutations inside our own tooltip or annotation spans
      if (tooltipEl && tooltipEl.contains(m.target as Node)) return false;
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        return Array.from(m.addedNodes).some(
          (node) =>
            node.nodeType === Node.TEXT_NODE ||
            (node.nodeType === Node.ELEMENT_NODE &&
              !(node as Element).classList?.contains(ANNOTATION_CLASS)),
        );
      }
      return false;
    });

    if (!hasRelevantChanges) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      await processDocument();
    }, DEBOUNCE_DELAY);
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });
}
