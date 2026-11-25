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
      throw new Error(`Unsupported external import in coverflow check: ${specifier}`);
    });
    moduleCache.set(resolved, mod.exports);
    return mod.exports;
  }

  const { getFeaturedProducts, getAllProducts } = loadTsModule(
    path.join(rootDir, 'src', 'data', 'products.ts')
  );
  const { formatVND } = loadTsModule(
    path.join(rootDir, 'src', 'utils', 'currency.ts')
  );
  const geo = loadTsModule(
    path.join(rootDir, 'src', 'components', 'FeaturedProducts', 'coverflowGeometry.ts')
  );

  // 1. Actual catalog featured products contract
  const featured = getFeaturedProducts();
  const allProducts = getAllProducts();
  assert.equal(featured.length, 4, 'Expected 4 featured products in catalog');
  assert.equal(allProducts.length, 51, 'Expected 51 total products in catalog');

  // 2. Single-source geometry contract: TS must not duplicate breakpoint geometry tables
  assert.equal(
    'getCoverflowMetrics' in geo,
    false,
    'Hardcoded TS breakpoint table getCoverflowMetrics must not exist; CSS tokens own visual geometry'
  );

  // 3. CSS token parser helpers (angle units, positive numbers, opacity unit interval)
  assert.equal(geo.parseCssAngleDeg('28deg', 20), 28);
  assert.equal(geo.parseCssAngleDeg(' 16deg ', 20), 16);
  assert.equal(geo.parseCssAngleDeg('0.25turn', 20), 90);
  assert.ok(Math.abs(geo.parseCssAngleDeg(`${Math.PI / 6}rad`, 20) - 30) < 0.001);
  assert.equal(geo.parseCssAngleDeg('100grad', 20), 90);
  assert.equal(geo.parseCssAngleDeg('', 20), 20);
  assert.equal(geo.parseCssAngleDeg('auto', 20), 20);

  assert.equal(geo.parseCssPositiveNumber('312px', 272), 312);
  assert.equal(geo.parseCssPositiveNumber('0.82', 0.8), 0.82);
  assert.equal(geo.parseCssPositiveNumber('0', 272), 272);
  assert.equal(geo.parseCssPositiveNumber('-12px', 272), 272);

  assert.equal(geo.parseCssUnitInterval('0.78', 0.7), 0.78);
  assert.equal(geo.parseCssUnitInterval('0', 0.7), 0);
  assert.equal(geo.parseCssUnitInterval('1', 0.7), 1);
  assert.equal(geo.parseCssUnitInterval('1.5', 0.7), 0.7);
  assert.equal(geo.parseCssUnitInterval('-0.2', 0.7), 0.7);

  // 4. Deterministic initial index & clamping across empty / 1 / 2 / 3 / 4 / 7 items
  assert.equal(geo.getInitialCoverflowIndex(0), 0);
  assert.equal(geo.getInitialCoverflowIndex(1), 0);
  assert.equal(geo.getInitialCoverflowIndex(2), 0);
  assert.equal(geo.getInitialCoverflowIndex(3), 1);
  assert.equal(geo.getInitialCoverflowIndex(4), 1);
  assert.equal(geo.getInitialCoverflowIndex(7), 3);

  assert.equal(geo.clampCoverflowIndex(-3, 4), 0);
  assert.equal(geo.clampCoverflowIndex(0, 4), 0);
  assert.equal(geo.clampCoverflowIndex(9, 4), 3);
  assert.equal(geo.clampCoverflowIndex(2, 1), 0);
  assert.equal(geo.clampCoverflowIndex(2, 0), 0);

  // 5. Slot assignment for 4 featured items starting at index 1
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => geo.getCoverflowSlot(i, 1)),
    ['prev', 'center', 'next', 'far-next']
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => geo.getCoverflowSlot(i, 0)),
    ['center', 'next', 'far-next', 'far-next']
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => geo.getCoverflowSlot(i, 3)),
    ['far-prev', 'far-prev', 'prev', 'center']
  );

  // 6. Slide pose math using measured visual metrics passed in from CSS
  const measuredWide = {
    stepX: 312,
    farStepX: 500,
    sideRotateY: 28,
    farRotateY: 38,
    sideScale: 0.82,
    farScale: 0.68,
    sideOpacity: 0.8,
  };
  const measuredMobile = {
    stepX: 173,
    farStepX: 269,
    sideRotateY: 16,
    farRotateY: 24,
    sideScale: 0.84,
    farScale: 0.68,
    sideOpacity: 0.7,
  };

  const centerPose = geo.getSlidePose(0, measuredWide, false);
  const leftPose = geo.getSlidePose(-1, measuredWide, false);
  const rightPose = geo.getSlidePose(1, measuredWide, false);
  const farPose = geo.getSlidePose(2, measuredWide, false);

  assert.deepEqual(centerPose, {
    x: 0,
    rotateY: 0,
    scale: 1,
    opacity: 1,
    layer: 'front',
  });
  assert.equal(leftPose.x, -312);
  assert.equal(rightPose.x, 312);
  assert.equal(leftPose.rotateY, 28);
  assert.equal(rightPose.rotateY, -28);
  assert.equal(leftPose.scale, 0.82);
  assert.equal(leftPose.opacity, 0.8);
  assert.equal(leftPose.layer, 'side');
  assert.equal(rightPose.layer, 'side');
  assert.equal(farPose.x, 500);
  assert.equal(farPose.rotateY, -38);
  assert.equal(farPose.opacity, 0);
  assert.equal(farPose.layer, 'back');

  const mobileRight = geo.getSlidePose(1, measuredMobile, false);
  assert.equal(mobileRight.x, 173);
  assert.equal(mobileRight.rotateY, -16);
  assert.ok(Math.abs(mobileRight.rotateY) < Math.abs(rightPose.rotateY));

  // Continuous drag midpoint crossing flips front layer cleanly
  assert.equal(geo.getSlidePose(0.4, measuredWide, false).layer, 'front');
  assert.equal(geo.getSlidePose(0.6, measuredWide, false).layer, 'side');
  assert.equal(geo.getSlidePose(1.6, measuredWide, false).layer, 'back');

  // Reduced motion removes all 3D rotation at every offset
  for (const offset of [-2, -1, -0.45, 0, 0.45, 1, 2]) {
    const reducedPose = geo.getSlidePose(offset, measuredWide, true);
    assert.equal(reducedPose.rotateY, 0, `Expected rotateY=0 under reduced motion at offset ${offset}`);
  }

  // 7. Drag snap math & finite boundary resistance
  assert.equal(
    geo.resolveSnapIndex({ activeIndex: 1, count: 4, deltaX: -20, velocityX: -50, stepX: 280 }),
    1,
    'Small slow drag below threshold must snap back'
  );
  assert.equal(
    geo.resolveSnapIndex({ activeIndex: 1, count: 4, deltaX: -80, velocityX: -120, stepX: 280 }),
    2,
    'Drag past 22% threshold to the left advances to next slide'
  );
  assert.equal(
    geo.resolveSnapIndex({ activeIndex: 1, count: 4, deltaX: 80, velocityX: 120, stepX: 280 }),
    0,
    'Drag past 22% threshold to the right goes to previous slide'
  );
  assert.equal(
    geo.resolveSnapIndex({ activeIndex: 1, count: 4, deltaX: -28, velocityX: -500, stepX: 280 }),
    2,
    'Brisk short horizontal flick advances slide'
  );
  assert.equal(
    geo.resolveSnapIndex({ activeIndex: 0, count: 4, deltaX: 200, velocityX: 600, stepX: 280 }),
    0,
    'Finite list clamps at index 0 (no wrap-around)'
  );
  assert.equal(
    geo.resolveSnapIndex({ activeIndex: 3, count: 4, deltaX: -200, velocityX: -600, stepX: 280 }),
    3,
    'Finite list clamps at last index (no wrap-around)'
  );
  assert.equal(
    geo.resolveSnapIndex({ activeIndex: 0, count: 1, deltaX: -150, velocityX: -600, stepX: 280 }),
    0,
    'Single item stays at index 0'
  );

  // Boundary rubber-band dampens out-of-range drag smoothly
  const overStart = geo.applyBoundaryResistance(-1, 4);
  const overEnd = geo.applyBoundaryResistance(4, 4);
  assert.ok(overStart < 0 && overStart > -0.5, 'Start boundary applies rubber-band resistance');
  assert.ok(overEnd > 3 && overEnd < 3.5, 'End boundary applies rubber-band resistance');
  assert.equal(geo.applyBoundaryResistance(1.5, 4), 1.5, 'In-range drag passes through 1:1');

  // 8. Keyboard navigation contract (ArrowLeft, ArrowRight, Home, End)
  assert.equal(geo.resolveKeyboardIndex({ key: 'ArrowLeft', activeIndex: 1, count: 4 }), 0);
  assert.equal(geo.resolveKeyboardIndex({ key: 'ArrowLeft', activeIndex: 0, count: 4 }), 0);
  assert.equal(geo.resolveKeyboardIndex({ key: 'ArrowRight', activeIndex: 1, count: 4 }), 2);
  assert.equal(geo.resolveKeyboardIndex({ key: 'ArrowRight', activeIndex: 3, count: 4 }), 3);
  assert.equal(geo.resolveKeyboardIndex({ key: 'Home', activeIndex: 3, count: 4 }), 0);
  assert.equal(geo.resolveKeyboardIndex({ key: 'End', activeIndex: 0, count: 4 }), 3);
  assert.equal(geo.resolveKeyboardIndex({ key: 'Tab', activeIndex: 1, count: 4 }), null);
  assert.equal(geo.resolveKeyboardIndex({ key: 'Enter', activeIndex: 1, count: 4 }), null);

  // 9. Live region Vietnamese announcement formatting
  const inStockMsg = geo.formatSelectionAnnouncement(
    featured[1],
    1,
    featured.length,
    formatVND(featured[1].price)
  );
  assert.ok(inStockMsg.includes('Mẫu 2 trên 4:'));
  assert.ok(inStockMsg.includes(featured[1].name));
  assert.ok(inStockMsg.includes('còn 4 sản phẩm'));

  const outOfStockMsg = geo.formatSelectionAnnouncement(
    { name: 'Nhẫn bạc thử nghiệm', price: 480000, stock: 0 },
    0,
    2,
    formatVND(480000)
  );
  assert.ok(outOfStockMsg.includes('tạm hết hàng'));

  // 10. Engineering guardrails: no JSX style={{}}, no backdrop-filter, single-source tokens, 44x44 dots
  const tsxFiles = [
    path.join(rootDir, 'src', 'components', 'FeaturedProducts', 'FeaturedCoverflow.tsx'),
    path.join(rootDir, 'src', 'components', 'FeaturedProducts', 'FeaturedProducts.tsx'),
    path.join(rootDir, 'src', 'app', 'page.tsx'),
  ];
  for (const filePath of tsxFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.equal(
      /\bstyle\s*=\s*\{/.test(content),
      false,
      `Forbidden JSX style={{}} prop found in ${path.basename(filePath)}`
    );
  }

  const cssContent = fs.readFileSync(
    path.join(rootDir, 'src', 'components', 'FeaturedProducts', 'FeaturedProducts.module.css'),
    'utf8'
  );
  const pageCssContent = fs.readFileSync(
    path.join(rootDir, 'src', 'app', 'page.module.css'),
    'utf8'
  );
  const tokensContent = fs.readFileSync(
    path.join(rootDir, 'src', 'styles', 'tokens.css'),
    'utf8'
  );

  assert.equal(
    /backdrop-filter/.test(cssContent),
    false,
    'Heavy per-card backdrop-filter must not be used on 3D Coverflow cards'
  );
  assert.ok(
    cssContent.includes('.geometryProbe') &&
      cssContent.includes('width: var(--coverflow-offset-x-current)') &&
      cssContent.includes('height: var(--coverflow-far-offset-x-current)'),
    'CSS measurement probe must bind directly to --coverflow-offset-x-current and --coverflow-far-offset-x-current'
  );
  assert.ok(
    /\.dotButton\s*\{[^}]*min-width:\s*var\(--tap-target\)[^}]*min-height:\s*var\(--tap-target\)/s.test(
      cssContent
    ),
    'Every dot selector button must declare 44x44 minimum hit target via var(--tap-target)'
  );

  // Every --coverflow-* token defined in tokens.css must be consumed in module CSS
  const definedCoverflowTokens = Array.from(
    tokensContent.matchAll(/(--coverflow-[a-z0-9-]+)\s*:/g),
    (m) => m[1]
  );
  assert.ok(definedCoverflowTokens.length > 0, 'Expected --coverflow-* tokens in tokens.css');
  const combinedConsumerCss = `${cssContent}\n${pageCssContent}`;
  for (const token of definedCoverflowTokens) {
    assert.ok(
      combinedConsumerCss.includes(`var(${token})`) ||
        fs.readFileSync(
          path.join(rootDir, 'src', 'components', 'FeaturedProducts', 'FeaturedCoverflow.tsx'),
          'utf8'
        ).includes(token),
      `Unused --coverflow token in tokens.css: ${token}`
    );
  }

  assert.equal(
    fs.existsSync(path.join(rootDir, 'src', 'components', 'FeaturedProducts', 'FeaturedRail.tsx')),
    false,
    'Obsolete FeaturedRail.tsx should be removed after rename to FeaturedCoverflow.tsx'
  );

  console.log(
    'OK: featured coverflow single-source CSS geometry contract, token parsers, 44x44 dot target, drag snap, keyboard, reduced-motion, and JSX/CSS guardrails verified.'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
