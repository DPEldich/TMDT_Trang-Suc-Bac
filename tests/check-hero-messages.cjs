'use strict';

async function main() {
  const assert = (await import('node:assert/strict')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const vm = await import('node:vm');
  const ts = (await import('typescript')).default;

  const rootDir = path.resolve(__dirname, '..');
  const moduleCache = new Map();

  function loadTsModule(absPath) {
    const resolved = absPath.endsWith('.ts') ? absPath : `${absPath}.ts`;
    if (moduleCache.has(resolved)) {
      return moduleCache.get(resolved);
    }

    const source = fs.readFileSync(resolved, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        strict: true,
      },
      fileName: resolved,
    });

    const mod = { exports: {} };
    moduleCache.set(resolved, mod.exports);

    const wrapper = vm.runInThisContext(
      `(function (exports, module, require) {\n${transpiled.outputText}\n})`,
      { filename: resolved }
    );

    wrapper(mod.exports, mod, (specifier) => {
      if (specifier.startsWith('.')) {
        return loadTsModule(path.resolve(path.dirname(resolved), specifier));
      }
      throw new Error(`Unsupported external import in hero messages check: ${specifier}`);
    });
    moduleCache.set(resolved, mod.exports);
    return mod.exports;
  }

  const hm = loadTsModule(
    path.join(rootDir, 'src', 'components', 'Hero', 'heroMessageScramble.ts')
  );

  // 1. Exact approved Vietnamese content & RSC serializability
  const EXPECTED_MESSAGES = [
    {
      title: 'Vẻ đẹp ở lại trong từng khoảnh khắc nhỏ',
      description:
        'Những thiết kế bạc thanh mảnh, vừa đủ để tôn lên đường nét riêng của bạn — nhẹ nhàng, hiện đại và tinh tế từ sáng đến tối.',
    },
    {
      title: 'Thanh lịch không cần phô trương',
      description:
        'Ánh bạc dịu mắt kết hợp phom dáng tối giản từ NFA, dành cho những ai chọn sự chỉn chu và khí chất riêng làm điểm nhấn',
    },
    {
      title: 'Chạm nhẹ ánh bạc, trọn vẹn khí chất',
      description:
        'Từ chiếc nhẫn đính đá tinh xảo đến sợi dây chuyền thanh mảnh, mỗi thiết kế NFA đều được tạo ra để hòa quyện tự nhiên cùng gu thẩm mỹ của bạn',
    },
    {
      title: 'Điểm nhấn nhỏ, sức hút riêng',
      description:
        'Mỗi thiết kế NFA là sự cân bằng giữa chất liệu bạc sáng mịn và phom dáng thanh lịch, đồng hành cùng bạn từ công sở đến những buổi tối đáng nhớ',
    },
  ];

  assert.equal(hm.HERO_MESSAGES.length, 4, 'Expected exactly 4 rotating hero messages');
  for (let i = 0; i < EXPECTED_MESSAGES.length; i += 1) {
    assert.equal(hm.HERO_MESSAGES[i].title, EXPECTED_MESSAGES[i].title);
    assert.equal(hm.HERO_MESSAGES[i].description, EXPECTED_MESSAGES[i].description);
  }
  assert.deepEqual(
    JSON.parse(JSON.stringify(hm.HERO_MESSAGES)),
    hm.HERO_MESSAGES,
    'HERO_MESSAGES must be plain JSON-serializable data for RSC -> Client props'
  );

  // 2. Unicode grapheme segmentation (Vietnamese NFC, NFD combining marks, surrogate pairs)
  const nfcSample = 'Vẻ đẹp tinh tế — đường nét riêng.';
  const nfdSample = nfcSample.normalize('NFD');
  const segNfc = hm.segmentGraphemes(nfcSample);
  const segNfd = hm.segmentGraphemes(nfdSample);
  const fallbackNfd = hm.segmentGraphemesFallback(nfdSample);

  assert.equal(
    segNfd.length,
    segNfc.length,
    'NFD combining diacritics must stay grouped with their base letters'
  );
  assert.equal(
    fallbackNfd.length,
    segNfc.length,
    'Fallback grapheme segmenter must keep NFD combining diacritics intact'
  );
  assert.equal(
    segNfd.join(''),
    nfdSample,
    'Rejoining segmented NFD graphemes must preserve exact code units'
  );
  assert.equal(
    fallbackNfd.join(''),
    nfdSample,
    'Rejoining fallback NFD graphemes must preserve exact code units'
  );

  // Double combining mark cluster (e + circumflex + dot below) & astral surrogate pairs
  const multiAccentNfd = 'ệ'.normalize('NFD');
  assert.deepEqual(hm.segmentGraphemes(multiAccentNfd), [multiAccentNfd]);
  assert.deepEqual(hm.segmentGraphemesFallback(multiAccentNfd), [multiAccentNfd]);

  const surrogateSample = 'NFA 💎 𝐴';
  assert.deepEqual(hm.segmentGraphemes(surrogateSample), ['N', 'F', 'A', ' ', '💎', ' ', '𝐴']);
  assert.deepEqual(hm.segmentGraphemesFallback(surrogateSample), ['N', 'F', 'A', ' ', '💎', ' ', '𝐴']);

  // 3. Scramble frame resolution: punctuation/whitespace preserved, restrained glyphs, exact resolution
  const CYBER_NOISE = /[@#$%^&*_[\]{}<>/\\|~0-9]/;

  for (let i = 0; i < hm.HERO_MESSAGES.length; i += 1) {
    const msg = hm.HERO_MESSAGES[i];
    for (const text of [msg.title, msg.description]) {
      const tokenized = hm.tokenizeTextForScramble(text);
      const targetGraphemes = hm.segmentGraphemes(text);

      const frameStart = hm.renderScrambleFrame(tokenized, 0, 0, i + 11);
      const frameMid = hm.renderScrambleFrame(tokenized, 0.5, 6, i + 11);
      const frameEnd = hm.renderScrambleFrame(tokenized, 1, 14, i + 11);

      assert.notEqual(
        frameStart,
        text,
        `Initial scramble frame must visibly scramble text: ${text}`
      );
      assert.equal(
        frameEnd,
        text,
        `Completed scramble frame must resolve to exact Vietnamese text: ${text}`
      );
      assert.equal(
        CYBER_NOISE.test(frameStart),
        false,
        `Scrambled text must use restrained letters without terminal noise: ${frameStart}`
      );

      for (const frame of [frameStart, frameMid, frameEnd]) {
        const frameGraphemes = hm.segmentGraphemes(frame);
        assert.equal(
          frameGraphemes.length,
          targetGraphemes.length,
          'Scramble frames must preserve exact grapheme count without typing/deletion drift'
        );

        for (let g = 0; g < targetGraphemes.length; g += 1) {
          if (!hm.isScrambleableGrapheme(targetGraphemes[g])) {
            assert.equal(
              frameGraphemes[g],
              targetGraphemes[g],
              `Whitespace/punctuation at index ${g} must never scramble`
            );
          }
        }
      }

      // Monotonic resolution progression across progress samples
      let prevResolved = -1;
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        let resolvedCount = 0;
        for (let s = 0; s < tokenized.slots.length; s += 1) {
          const res = hm.resolveScrambleGlyph({
            targetGrapheme: tokenized.slots[s],
            slotIndex: s,
            totalSlots: tokenized.slots.length,
            progress,
            step: Math.round(progress * 10),
            seed: i + 11,
          });
          if (res.resolved) {
            assert.equal(res.glyph, tokenized.slots[s]);
            resolvedCount += 1;
          }
        }
        assert.ok(
          resolvedCount >= prevResolved,
          `Resolved glyph count must be monotonically non-decreasing (${resolvedCount} < ${prevResolved})`
        );
        prevResolved = resolvedCount;
      }
      assert.equal(prevResolved, tokenized.slots.length);
    }
  }

  // NFD decomposed Vietnamese input also resolves intact without losing diacritics
  const nfdTokenized = hm.tokenizeTextForScramble(nfdSample);
  assert.notEqual(hm.renderScrambleFrame(nfdTokenized, 0, 0, 99), nfdSample);
  assert.equal(hm.renderScrambleFrame(nfdTokenized, 1, 12, 99), nfdSample);

  // 4. Deterministic 1 -> 2 -> 3 -> 4 -> 1 cycling order
  const visited = [0];
  for (let step = 0; step < 4; step += 1) {
    visited.push(hm.getNextMessageIndex(visited[visited.length - 1], 4));
  }
  assert.deepEqual(visited, [0, 1, 2, 3, 0]);
  assert.equal(hm.getNextMessageIndex(0, 1), 0);
  assert.equal(hm.getNextMessageIndex(0, 0), 0);

  // 5. Pointer hover filtering: genuine mouse hover pauses; touch/pen/synthetic post-touch rejected
  assert.equal(hm.isHoverPointerType('mouse'), true);
  assert.equal(hm.isHoverPointerType('touch'), false);
  assert.equal(hm.isHoverPointerType('pen'), false);
  assert.equal(hm.isHoverPointerType(''), false);
  assert.equal(hm.isHoverPointerType(null), false);
  assert.equal(hm.isHoverPointerType(undefined), false);

  assert.equal(
    hm.shouldPauseForPointerHover({ pointerType: 'mouse', timeSinceLastTouchMs: Number.POSITIVE_INFINITY }),
    true,
    'Genuine mouse hover with no prior touch must pause'
  );
  assert.equal(
    hm.shouldPauseForPointerHover({ pointerType: 'mouse', timeSinceLastTouchMs: hm.TOUCH_HOVER_GUARD_MS }),
    true,
    'Mouse hover after touch guard window must pause'
  );
  assert.equal(
    hm.shouldPauseForPointerHover({ pointerType: 'mouse', timeSinceLastTouchMs: 120 }),
    false,
    'Synthetic mouse hover immediately after touch must be rejected'
  );
  assert.equal(
    hm.shouldPauseForPointerHover({ pointerType: 'touch', timeSinceLastTouchMs: 5000 }),
    false,
    'Touch pointer must never pause hover state'
  );
  assert.equal(
    hm.shouldPauseForPointerHover({ pointerType: 'pen', timeSinceLastTouchMs: 5000 }),
    false,
    'Pen pointer must not trigger mouse-only hover pause'
  );

  // 6. Playback state machine: playing, reduced-motion direct swap, hover pause, auto-pause
  assert.deepEqual(
    hm.resolveHeroPlaybackState({
      messageCount: 4,
      isHoverPaused: false,
      isInView: true,
      isDocumentVisible: true,
      prefersReducedMotion: false,
    }),
    { status: 'playing', canRotate: true, shouldScramble: true }
  );

  // Reduced motion keeps rotation active every 3.5s (direct swap) while disabling scrambling
  assert.deepEqual(
    hm.resolveHeroPlaybackState({
      messageCount: 4,
      isHoverPaused: false,
      isInView: true,
      isDocumentVisible: true,
      prefersReducedMotion: true,
    }),
    { status: 'playing', canRotate: true, shouldScramble: false }
  );

  // Offscreen auto-pause
  assert.deepEqual(
    hm.resolveHeroPlaybackState({
      messageCount: 4,
      isHoverPaused: false,
      isInView: false,
      isDocumentVisible: true,
      prefersReducedMotion: false,
    }),
    { status: 'paused-auto', canRotate: false, shouldScramble: false }
  );

  // Hidden document auto-pause
  assert.deepEqual(
    hm.resolveHeroPlaybackState({
      messageCount: 4,
      isHoverPaused: false,
      isInView: true,
      isDocumentVisible: false,
      prefersReducedMotion: false,
    }),
    { status: 'paused-auto', canRotate: false, shouldScramble: false }
  );

  // Hover pause blocks rotation across normal, reduced-motion, offscreen, and hidden states
  for (const isInView of [false, true]) {
    for (const isDocumentVisible of [false, true]) {
      for (const prefersReducedMotion of [false, true]) {
        assert.deepEqual(
          hm.resolveHeroPlaybackState({
            messageCount: 4,
            isHoverPaused: true,
            isInView,
            isDocumentVisible,
            prefersReducedMotion,
          }),
          { status: 'paused-hover', canRotate: false, shouldScramble: false }
        );
      }
    }
  }

  // 7. CSS duration token parsing
  assert.equal(hm.parseCssDurationMs('3500ms', 1000), 3500);
  assert.equal(hm.parseCssDurationMs(' 550ms ', 1000), 550);
  assert.equal(hm.parseCssDurationMs('3.5s', 1000), 3500);
  assert.equal(hm.parseCssDurationMs('0.55s', 1000), 550);
  assert.equal(hm.parseCssDurationMs('', 3500), 3500);
  assert.equal(hm.parseCssDurationMs('0ms', 3500), 3500);
  assert.equal(hm.parseCssDurationMs('-200ms', 3500), 3500);
  assert.equal(hm.parseCssDurationMs('auto', 3500), 3500);

  // 8. RSC boundaries, hover-only contract (no pause button), obsolete removal, and token usage
  const heroSrc = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Hero', 'Hero.tsx'), 'utf8');
  const heroCss = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Hero', 'Hero.module.css'), 'utf8');
  const messagesSrc = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Hero', 'HeroMessages.tsx'), 'utf8');
  const messagesCss = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Hero', 'HeroMessages.module.css'), 'utf8');
  const tokensCss = fs.readFileSync(path.join(rootDir, 'src', 'styles', 'tokens.css'), 'utf8');

  assert.equal(/['"]use client['"]/.test(heroSrc), false, 'Hero.tsx must remain a Server Component');
  assert.ok(/['"]use client['"]/.test(messagesSrc), 'HeroMessages.tsx must be a Client Component');
  assert.equal(heroSrc.includes('formatVND'), false, 'Hero.tsx must remove obsolete formatVND import');
  assert.equal(heroSrc.includes('minPrice'), false, 'Hero.tsx must remove obsolete minPrice calculation');
  assert.ok(heroSrc.includes('getAllProducts'), 'Hero.tsx must keep getAllProducts for heroProduct CTA');
  assert.equal(heroCss.includes('.subtitle'), false, 'Hero.module.css must remove unused .subtitle');
  assert.equal(heroCss.includes('.priceInline'), false, 'Hero.module.css must remove unused .priceInline');
  assert.equal(messagesSrc.includes('ScrambleText'), false, 'Must not import nonexistent paid ScrambleText');
  assert.equal(messagesSrc.includes('lucide-react'), false, 'Pause/Play icon imports must be removed');
  assert.equal(/<button\b/.test(messagesSrc), false, 'No visible pause/resume button control allowed in HeroMessages');
  assert.equal(messagesSrc.includes('onClick'), false, 'Must not introduce a tap/click toggle on HeroMessages');
  assert.ok(messagesSrc.includes('onPointerEnter') && messagesSrc.includes('onPointerLeave'), 'HeroMessages must use Pointer Events for hover pause/resume');
  assert.equal(messagesCss.includes('.toggleButton'), false, 'Obsolete toggle button CSS must be removed');
  assert.equal(tokensCss.includes('--hero-message-control-'), false, 'Unused control tokens must be removed from tokens.css');

  for (const [label, src] of [
    ['Hero.tsx', heroSrc],
    ['HeroMessages.tsx', messagesSrc],
  ]) {
    assert.equal(/\bstyle\s*=\s*\{/.test(src), false, `Forbidden JSX style={{}} in ${label}`);
  }

  const definedHeroMessageTokens = Array.from(
    tokensCss.matchAll(/(--hero-(?:message|scramble)-[a-z0-9-]+)\s*:/g),
    (m) => m[1]
  );
  assert.ok(definedHeroMessageTokens.length > 0, 'Expected additive hero message/scramble tokens');
  const consumerCombined = `${heroCss}\n${messagesCss}\n${messagesSrc}`;
  for (const token of definedHeroMessageTokens) {
    assert.ok(
      consumerCombined.includes(token),
      `Unused hero message/scramble token in tokens.css: ${token}`
    );
  }

  console.log(
    'OK: hero messages content, Unicode grapheme/combining-mark scramble, rotation order, mouse-only hover pause & touch guard, playback precedence, CSS duration parsing, and RSC/CSS guardrails verified.'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
