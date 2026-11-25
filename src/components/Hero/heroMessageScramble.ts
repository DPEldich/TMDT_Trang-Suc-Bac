export interface HeroMessage {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface HeroMessageTiming {
  readonly intervalMs: number;
  readonly scrambleDurationMs: number;
  readonly scrambleStepMs: number;
}

export type HeroPlaybackStatus = 'playing' | 'paused-hover' | 'paused-auto';

export interface HeroPlaybackInput {
  readonly messageCount: number;
  readonly isHoverPaused: boolean;
  readonly isInView: boolean;
  readonly isDocumentVisible: boolean;
  readonly prefersReducedMotion: boolean;
}

export interface HeroPlaybackState {
  readonly status: HeroPlaybackStatus;
  readonly canRotate: boolean;
  readonly shouldScramble: boolean;
}

export interface GlyphToken {
  readonly grapheme: string;
  readonly scrambleable: boolean;
  readonly slotIndex: number;
}

export type TextRun =
  | { readonly type: 'space'; readonly value: string }
  | { readonly type: 'word'; readonly glyphs: readonly GlyphToken[] };

export interface TokenizedText {
  readonly text: string;
  readonly runs: readonly TextRun[];
  readonly slots: readonly string[];
}

export const FALLBACK_HERO_TIMING: HeroMessageTiming = {
  intervalMs: 3500,
  scrambleDurationMs: 550,
  scrambleStepMs: 40,
};

export const HERO_MESSAGES: readonly HeroMessage[] = [
  {
    id: 'khoanh-khac-nho',
    title: 'Vẻ đẹp ở lại trong từng khoảnh khắc nhỏ',
    description:
      'Những thiết kế bạc thanh mảnh, vừa đủ để tôn lên đường nét riêng của bạn — nhẹ nhàng, hiện đại và tinh tế từ sáng đến tối.',
  },
  {
    id: 'thanh-lich-toi-gian',
    title: 'Thanh lịch không cần phô trương',
    description:
      'Ánh bạc dịu mắt kết hợp phom dáng tối giản từ NFA, dành cho những ai chọn sự chỉn chu và khí chất riêng làm điểm nhấn',
  },
  {
    id: 'cham-nhe-anh-bac',
    title: 'Chạm nhẹ ánh bạc, trọn vẹn khí chất',
    description:
      'Từ chiếc nhẫn đính đá tinh xảo đến sợi dây chuyền thanh mảnh, mỗi thiết kế NFA đều được tạo ra để hòa quyện tự nhiên cùng gu thẩm mỹ của bạn',
  },
  {
    id: 'diem-nhan-nho',
    title: 'Điểm nhấn nhỏ, sức hút riêng',
    description:
      'Mỗi thiết kế NFA là sự cân bằng giữa chất liệu bạc sáng mịn và phom dáng thanh lịch, đồng hành cùng bạn từ công sở đến những buổi tối đáng nhớ',
  },
];

// Restrained editorial letter pools bucketed by case and visual advance width
// so scrambled glyphs feel calm and never collide with neighboring characters.
const LOWER_NARROW_POOL: readonly string[] = ['i', 'l', 'r', 't', 'j', 'í', 'ì', 'ỉ'];
const LOWER_MEDIUM_POOL: readonly string[] = [
  'a',
  'c',
  'e',
  'n',
  'o',
  'r',
  's',
  'u',
  'v',
  'x',
  'h',
  'k',
  'd',
  'g',
  'á',
  'à',
  'ả',
  'â',
  'ê',
  'ô',
  'ơ',
  'ư',
  'é',
  'ó',
];
const LOWER_WIDE_POOL: readonly string[] = ['m', 'n', 'u', 'h', 'd', 'b', 'w', 'ô', 'ơ', 'ư'];

const UPPER_NARROW_POOL: readonly string[] = ['I', 'J', 'L', 'T', 'F', 'Í'];
const UPPER_MEDIUM_POOL: readonly string[] = [
  'A',
  'C',
  'E',
  'H',
  'K',
  'N',
  'P',
  'R',
  'S',
  'T',
  'V',
  'X',
  'Á',
  'Đ',
  'Ê',
  'Ô',
  'Ư',
];
const UPPER_WIDE_POOL: readonly string[] = ['M', 'N', 'H', 'A', 'V', 'Đ', 'W'];

const NARROW_BASES = new Set(['i', 'l', 'j', 't', 'f', 'r']);
const WIDE_BASES = new Set(['m', 'w']);

const LETTER_PATTERN = /\p{L}/u;
const WHITESPACE_PATTERN = /^\s+$/u;
const COMBINING_MARK_PATTERN = /^\p{M}$/u;
const STRIP_COMBINING_PATTERN = /\p{M}+/gu;

let cachedSegmenter: Intl.Segmenter | null | undefined;

function getGraphemeSegmenter(): Intl.Segmenter | null {
  if (cachedSegmenter !== undefined) {
    return cachedSegmenter;
  }
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    cachedSegmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
  } else {
    cachedSegmenter = null;
  }
  return cachedSegmenter;
}

/**
 * Fallback grapheme segmentation when Intl.Segmenter is unavailable.
 * Keeps surrogate pairs (via Array.from) and attaches combining marks / ZWJ sequences
 * onto their preceding base character so Vietnamese diacritics are never split.
 */
export function segmentGraphemesFallback(text: string): string[] {
  const codePoints = Array.from(text);
  const clusters: string[] = [];

  for (let i = 0; i < codePoints.length; i += 1) {
    const cp = codePoints[i];
    if (clusters.length > 0 && (COMBINING_MARK_PATTERN.test(cp) || cp === '\u200D')) {
      clusters[clusters.length - 1] += cp;
      if (cp === '\u200D' && i + 1 < codePoints.length) {
        clusters[clusters.length - 1] += codePoints[i + 1];
        i += 1;
      }
    } else {
      clusters.push(cp);
    }
  }

  return clusters;
}

/**
 * Splits a string into Unicode grapheme clusters using Intl.Segmenter
 * with a combining-mark and surrogate-pair aware fallback.
 */
export function segmentGraphemes(text: string): string[] {
  if (!text) return [];
  const segmenter = getGraphemeSegmenter();
  if (segmenter) {
    const out: string[] = [];
    for (const item of segmenter.segment(text)) {
      out.push(item.segment);
    }
    return out;
  }
  return segmentGraphemesFallback(text);
}

/**
 * Only alphabetic graphemes scramble; whitespace and punctuation stay intact.
 */
export function isScrambleableGrapheme(grapheme: string): boolean {
  return LETTER_PATTERN.test(grapheme);
}

/**
 * Tokenizes text into word runs and space runs while indexing scrambleable glyph slots.
 */
export function tokenizeTextForScramble(text: string): TokenizedText {
  const graphemes = segmentGraphemes(text);
  const runs: TextRun[] = [];
  const slots: string[] = [];

  let currentWord: GlyphToken[] = [];
  let currentSpace = '';

  const flushWord = () => {
    if (currentWord.length > 0) {
      runs.push({ type: 'word', glyphs: currentWord });
      currentWord = [];
    }
  };

  const flushSpace = () => {
    if (currentSpace.length > 0) {
      runs.push({ type: 'space', value: currentSpace });
      currentSpace = '';
    }
  };

  for (const grapheme of graphemes) {
    if (WHITESPACE_PATTERN.test(grapheme)) {
      flushWord();
      currentSpace += grapheme;
      continue;
    }

    flushSpace();
    if (isScrambleableGrapheme(grapheme)) {
      const slotIndex = slots.length;
      slots.push(grapheme);
      currentWord.push({ grapheme, scrambleable: true, slotIndex });
    } else {
      currentWord.push({ grapheme, scrambleable: false, slotIndex: -1 });
    }
  }

  flushWord();
  flushSpace();

  return { text, runs, slots };
}

function selectPoolForGrapheme(grapheme: string): readonly string[] {
  const stripped = grapheme.normalize('NFD').replace(STRIP_COMBINING_PATTERN, '');
  const base = stripped || grapheme;
  const lower = base.toLowerCase();
  const isUpper = base !== lower && base === base.toUpperCase();

  if (NARROW_BASES.has(lower)) {
    return isUpper ? UPPER_NARROW_POOL : LOWER_NARROW_POOL;
  }
  if (WIDE_BASES.has(lower)) {
    return isUpper ? UPPER_WIDE_POOL : LOWER_WIDE_POOL;
  }
  return isUpper ? UPPER_MEDIUM_POOL : LOWER_MEDIUM_POOL;
}

function hashUint(seed: number, slotIndex: number, step: number): number {
  let h = (seed * 374761393 + slotIndex * 668265263 + step * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Computes the reveal threshold in (0, 1) for a given glyph slot:
 * smooth left-to-right editorial wave with subtle organic offset.
 */
export function getSlotRevealThreshold(
  slotIndex: number,
  totalSlots: number,
  seed: number
): number {
  if (totalSlots <= 1) return 0.5;
  const normalized = slotIndex / (totalSlots - 1);
  const jitterUnit = (hashUint(seed, slotIndex, 0) % 1000) / 1000 - 0.5;
  const threshold = 0.14 + normalized * 0.74 + jitterUnit * 0.1;
  return Math.min(0.95, Math.max(0.1, threshold));
}

/**
 * Resolves a single scrambleable glyph slot at animation progress in [0, 1].
 * At progress >= 1 (or past its reveal threshold), returns the exact target grapheme.
 */
export function resolveScrambleGlyph(params: {
  readonly targetGrapheme: string;
  readonly slotIndex: number;
  readonly totalSlots: number;
  readonly progress: number;
  readonly step: number;
  readonly seed: number;
}): { readonly glyph: string; readonly resolved: boolean } {
  const { targetGrapheme, slotIndex, totalSlots, progress, step, seed } = params;

  if (
    progress >= 1 ||
    !isScrambleableGrapheme(targetGrapheme) ||
    progress >= getSlotRevealThreshold(slotIndex, totalSlots, seed)
  ) {
    return { glyph: targetGrapheme, resolved: true };
  }

  const pool = selectPoolForGrapheme(targetGrapheme);
  const index = hashUint(seed, slotIndex, step + 1) % pool.length;
  let candidate = pool[index];
  if (candidate === targetGrapheme && pool.length > 1) {
    candidate = pool[(index + 1) % pool.length];
  }
  return { glyph: candidate, resolved: false };
}

/**
 * Pure string helper computing a full rendered scramble frame for testing and verification.
 */
export function renderScrambleFrame(
  tokenized: TokenizedText,
  progress: number,
  step: number,
  seed: number
): string {
  const totalSlots = tokenized.slots.length;
  let output = '';

  for (const run of tokenized.runs) {
    if (run.type === 'space') {
      output += run.value;
      continue;
    }

    for (const token of run.glyphs) {
      if (!token.scrambleable) {
        output += token.grapheme;
        continue;
      }
      const { glyph } = resolveScrambleGlyph({
        targetGrapheme: token.grapheme,
        slotIndex: token.slotIndex,
        totalSlots,
        progress,
        step,
        seed,
      });
      output += glyph;
    }
  }

  return output;
}

/**
 * Advances message index deterministically in order 0 -> 1 -> 2 -> 3 -> 0.
 */
export function getNextMessageIndex(currentIndex: number, count: number): number {
  if (count <= 1) return 0;
  const safeCurrent = ((Math.trunc(currentIndex) % count) + count) % count;
  return (safeCurrent + 1) % count;
}

export const TOUCH_HOVER_GUARD_MS = 600;

/**
 * Only genuine mouse pointer hover should pause message rotation;
 * touch, pen, and synthetic/empty pointer types are ignored so mobile taps never stick.
 */
export function isHoverPointerType(pointerType: string | null | undefined): boolean {
  return pointerType === 'mouse';
}

/**
 * Evaluates whether a pointerenter event represents genuine mouse hover
 * rather than touch input or a browser-synthesized post-touch compatibility event.
 */
export function shouldPauseForPointerHover(params: {
  readonly pointerType: string | null | undefined;
  readonly timeSinceLastTouchMs: number;
}): boolean {
  if (!isHoverPointerType(params.pointerType)) {
    return false;
  }
  return (
    !Number.isFinite(params.timeSinceLastTouchMs) ||
    params.timeSinceLastTouchMs >= TOUCH_HOVER_GUARD_MS
  );
}

/**
 * Resolves active playback and scramble eligibility.
 * Hover pause takes precedence over playing; reduced motion keeps rotation active
 * (direct exact swap every 3.5s) while disabling scrambling.
 */
export function resolveHeroPlaybackState(input: HeroPlaybackInput): HeroPlaybackState {
  if (input.messageCount <= 1) {
    return {
      status: input.isHoverPaused ? 'paused-hover' : 'paused-auto',
      canRotate: false,
      shouldScramble: false,
    };
  }

  if (input.isHoverPaused) {
    return {
      status: 'paused-hover',
      canRotate: false,
      shouldScramble: false,
    };
  }

  if (!input.isInView || !input.isDocumentVisible) {
    return {
      status: 'paused-auto',
      canRotate: false,
      shouldScramble: false,
    };
  }

  return {
    status: 'playing',
    canRotate: true,
    shouldScramble: !input.prefersReducedMotion,
  };
}

/**
 * Parses a CSS time value ("3500ms", "3.5s") into positive milliseconds.
 */
export function parseCssDurationMs(rawValue: string, fallbackMs: number): number {
  const trimmed = rawValue.trim();
  if (!trimmed) return fallbackMs;

  const match = /^([+-]?(?:\d+\.?\d*|\.\d+))(ms|s)$/i.exec(trimmed);
  if (!match) return fallbackMs;

  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    return fallbackMs;
  }

  const unit = match[2].toLowerCase();
  return unit === 's' ? Math.round(amount * 1000) : Math.round(amount);
}
