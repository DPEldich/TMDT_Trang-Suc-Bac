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
      throw new Error(`Unsupported external import in category showcase check: ${specifier}`);
    });
    moduleCache.set(resolved, mod.exports);
    return mod.exports;
  }

  const { CATEGORIES } = loadTsModule(path.join(rootDir, 'src', 'types', 'product.ts'));
  const { getAllProducts } = loadTsModule(path.join(rootDir, 'src', 'data', 'products.ts'));
  const dataMod = loadTsModule(
    path.join(rootDir, 'src', 'components', 'CategoryShowcase', 'categoryShowcaseData.ts')
  );

  const allProducts = getAllProducts();
  const items = dataMod.buildCategoryShowcaseItems(allProducts);

  // 1. Canonical 5-category order, verified preview IDs, category associations, and existing image files
  const EXPECTED_ORDER = ['nhan', 'day-chuyen', 'lac-tay', 'bong-tai', 'lac-chan'];
  const EXPECTED_PREVIEW_IDS = {
    nhan: 'prod-01',
    'day-chuyen': 'prod-04',
    'lac-tay': 'prod-06',
    'bong-tai': 'prod-08',
    'lac-chan': 'prod-51',
  };

  assert.equal(items.length, 5, 'Expected exactly 5 category showcase items');
  assert.deepEqual(
    items.map((item) => item.id),
    EXPECTED_ORDER,
    'Category showcase order must preserve canonical CATEGORIES order'
  );
  assert.deepEqual(
    items.map((item) => item.label),
    CATEGORIES.map((category) => category.name),
    'Category labels must come from canonical CATEGORIES'
  );

  for (const item of items) {
    assert.equal(
      item.previewProductId,
      EXPECTED_PREVIEW_IDS[item.id],
      `Unexpected preview product ID for ${item.id}`
    );
    const matchedProduct = allProducts.find((product) => product.id === item.previewProductId);
    assert.ok(matchedProduct, `Preview product ${item.previewProductId} must exist in catalog`);
    assert.equal(
      matchedProduct.category,
      item.id,
      `Preview product ${item.previewProductId} must belong to category ${item.id}`
    );
    assert.equal(item.href, `/san-pham?category=${item.id}`);
    assert.equal(item.previewImage, matchedProduct.image);
    assert.equal(item.previewImageAlt, matchedProduct.imageAlt);

    const diskPath = path.join(rootDir, 'public', item.previewImage.replace(/^\//, ''));
    assert.equal(
      fs.existsSync(diskPath),
      true,
      `Preview image file must exist on disk: ${diskPath}`
    );
  }

  // Only Nhẫn is marked as the desktop feature card
  assert.deepEqual(
    items.map((item) => item.featured),
    [true, false, false, false, false],
    'Only the first Nhẫn card should be marked featured'
  );

  // 2. Exact approved editorial Vietnamese copy & separation note contract
  const EXPECTED_COPY = {
    nhan: {
      headline: 'Một điểm sáng, một dấu ấn riêng.',
      description:
        'Đai nhẫn trơn giữ vẻ gọn gàng; những thiết kế điểm đá mang thêm nét nổi bật. Chọn một chiếc làm điểm nhấn hoặc phối cùng những dáng nhẫn thanh mảnh.',
      note: null,
      ctaLabel: 'Khám phá nhẫn',
    },
    'day-chuyen': {
      headline: 'Đường nét thanh mảnh, điểm nhìn cuốn hút.',
      description:
        'Dây chuyền trơn, dây cổ liền mặt và mặt dây độc lập mang đến nhiều cách phối. Một thiết kế vừa vặn có thể tạo điểm nhấn cho áo sơ mi, cổ áo mở hoặc chiếc váy tối giản.',
      note: 'Dây chuyền và mặt dây được bán riêng, trừ thiết kế dây cổ liền mặt.',
      ctaLabel: 'Khám phá dây chuyền & mặt dây',
    },
    'lac-tay': {
      headline: 'Theo từng chuyển động của bạn.',
      description:
        'Từ mắt xích gọn gàng đến những chi tiết điểm đá, trang sức cổ tay thêm nét mềm mại cho mỗi cử chỉ. Đeo riêng để giữ sự nhẹ nhàng hoặc phối cùng đồng hồ theo phong cách của bạn.',
      note: null,
      ctaLabel: 'Khám phá lắc & vòng tay',
    },
    'bong-tai': {
      headline: 'Một điểm nhấn, sáng cả gương mặt.',
      description:
        'Dáng nụ nhỏ gọn, khoen thanh lịch hay thiết kế dáng thả tạo những sắc thái khác nhau. Chọn theo kiểu tóc, đường nét gương mặt và dịp bạn muốn diện.',
      note: null,
      ctaLabel: 'Khám phá bông tai',
    },
    'lac-chan': {
      headline: 'Nét duyên trong từng bước chân.',
      description:
        'Sợi lắc mảnh tạo điểm nhấn quanh cổ chân, dễ kết hợp cùng sandal hoặc trang phục có độ dài trên mắt cá. Một chi tiết nhỏ cho những ngày bạn muốn chăm chút thêm cho diện mạo.',
      note: null,
      ctaLabel: 'Khám phá lắc chân',
    },
  };

  for (const item of items) {
    const expected = EXPECTED_COPY[item.id];
    assert.equal(item.headline, expected.headline);
    assert.equal(item.paragraphs.join(' '), expected.description);
    assert.equal(item.note, expected.note);
    assert.equal(item.ctaLabel, expected.ctaLabel);
  }

  // 3. Minimal plain JSON-serializable RSC -> Client display model (no price/stock/catalog leak)
  assert.deepEqual(
    JSON.parse(JSON.stringify(items)),
    items,
    'CategoryShowcaseItem[] must be strictly JSON-serializable across RSC boundary'
  );
  for (const item of items) {
    assert.equal('price' in item, false, 'Category display model must not leak product price');
    assert.equal('stock' in item, false, 'Category display model must not leak product stock');
    assert.equal('sku' in item, false, 'Category display model must not leak product SKU');
  }

  // 4. Category-safe preview product fallback when preferred ID is absent or mismatched
  const mismatchedCatalog = [
    { ...allProducts[0], id: 'prod-01', category: 'bong-tai' },
    { ...allProducts[1], id: 'prod-02', category: 'nhan' },
  ];
  const fallbackRing = dataMod.resolveCategoryPreviewProduct('nhan', mismatchedCatalog);
  assert.equal(
    fallbackRing?.id,
    'prod-02',
    'Fallback must reject mismatched category on preferred ID and pick verified category item'
  );

  // 5. Progressive-enhancement anchor click modifier detection
  const plainClick = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
  };
  assert.equal(dataMod.isModifiedAnchorActivation(plainClick), false);
  assert.equal(dataMod.isModifiedAnchorActivation({ ...plainClick, ctrlKey: true }), true);
  assert.equal(dataMod.isModifiedAnchorActivation({ ...plainClick, metaKey: true }), true);
  assert.equal(dataMod.isModifiedAnchorActivation({ ...plainClick, shiftKey: true }), true);
  assert.equal(dataMod.isModifiedAnchorActivation({ ...plainClick, altKey: true }), true);
  assert.equal(dataMod.isModifiedAnchorActivation({ ...plainClick, button: 1 }), true);
  assert.equal(dataMod.isModifiedAnchorActivation({ ...plainClick, defaultPrevented: true }), true);

  // 6. Bidirectional Tab / Shift+Tab focus trap math
  assert.equal(
    dataMod.resolveFocusTrapTarget({ focusableCount: 2, activeIndex: 0, shiftKey: true }),
    1,
    'Shift+Tab on first focusable wraps to last'
  );
  assert.equal(
    dataMod.resolveFocusTrapTarget({ focusableCount: 2, activeIndex: 1, shiftKey: false }),
    0,
    'Tab on last focusable wraps to first'
  );
  assert.equal(
    dataMod.resolveFocusTrapTarget({ focusableCount: 2, activeIndex: 0, shiftKey: false }),
    null,
    'Tab from first to second lets native focus proceed'
  );
  assert.equal(
    dataMod.resolveFocusTrapTarget({ focusableCount: 2, activeIndex: 1, shiftKey: true }),
    null,
    'Shift+Tab from second to first lets native focus proceed'
  );
  assert.equal(
    dataMod.resolveFocusTrapTarget({ focusableCount: 2, activeIndex: -1, shiftKey: false }),
    0
  );
  assert.equal(
    dataMod.resolveFocusTrapTarget({ focusableCount: 2, activeIndex: -1, shiftKey: true }),
    1
  );
  assert.equal(
    dataMod.resolveFocusTrapTarget({ focusableCount: 1, activeIndex: 0, shiftKey: false }),
    0
  );
  assert.equal(
    dataMod.resolveFocusTrapTarget({ focusableCount: 0, activeIndex: -1, shiftKey: false }),
    null
  );

  // 7. Scrollbar gutter compensation calculation
  assert.equal(dataMod.resolveScrollLockCompensation(1440, 1425), 15);
  assert.equal(dataMod.resolveScrollLockCompensation(390, 390), 0);
  assert.equal(dataMod.resolveScrollLockCompensation(390, 400), 0);
  assert.equal(dataMod.resolveScrollLockCompensation(Number.NaN, 1425), 0);

  // 8. Motion config: spring morph vs reduced-motion opacity/direct transition
  const normalMotion = dataMod.resolveCategoryMotionConfig(false);
  const reducedMotion = dataMod.resolveCategoryMotionConfig(true);
  assert.equal(normalMotion.enableSharedLayout, true);
  assert.equal(normalMotion.shellTransition.type, 'spring');
  assert.equal(normalMotion.shellTransition.visualDuration, 0.45);
  assert.ok(
    normalMotion.shellTransition.bounce >= 0 && normalMotion.shellTransition.bounce <= 0.2,
    'Spring bounce must remain restrained'
  );
  assert.ok(
    normalMotion.bodyEnterTransition.delay > 0,
    'Modal body copy should enter after main card opening'
  );

  assert.equal(reducedMotion.enableSharedLayout, false);
  assert.equal('type' in reducedMotion.shellTransition, false);
  assert.ok(
    reducedMotion.shellTransition.duration <= 0.2,
    'Reduced motion transition must be short and direct'
  );
  assert.equal(reducedMotion.bodyEnterTransition.delay, 0);

  // 9. RSC boundaries, no JSX style={{}}, preserved heading, and token hygiene
  const pageSrc = fs.readFileSync(path.join(rootDir, 'src', 'app', 'page.tsx'), 'utf8');
  const showcaseSrc = fs.readFileSync(
    path.join(rootDir, 'src', 'components', 'CategoryShowcase', 'CategoryShowcase.tsx'),
    'utf8'
  );
  const modalSrc = fs.readFileSync(
    path.join(rootDir, 'src', 'components', 'CategoryShowcase', 'CategoryModal.tsx'),
    'utf8'
  );
  const showcaseCss = fs.readFileSync(
    path.join(rootDir, 'src', 'components', 'CategoryShowcase', 'CategoryShowcase.module.css'),
    'utf8'
  );
  const tokensCss = fs.readFileSync(path.join(rootDir, 'src', 'styles', 'tokens.css'), 'utf8');

  assert.equal(/['"]use client['"]/.test(pageSrc), false, 'src/app/page.tsx must stay a Server Component');
  assert.ok(pageSrc.includes('id="categories-heading"'), 'Must preserve categories-heading h2 id');
  assert.ok(pageSrc.includes('Danh mục.'), 'Must preserve section heading accent');
  assert.ok(pageSrc.includes('Năm dòng trang sức chủ đạo.'), 'Must preserve section heading companion');
  assert.ok(/['"]use client['"]/.test(showcaseSrc), 'CategoryShowcase.tsx must be a Client Component');
  assert.ok(/['"]use client['"]/.test(modalSrc), 'CategoryModal.tsx must be a Client Component');

  for (const [label, src] of [
    ['page.tsx', pageSrc],
    ['CategoryShowcase.tsx', showcaseSrc],
    ['CategoryModal.tsx', modalSrc],
  ]) {
    assert.equal(/\bstyle\s*=\s*\{/.test(src), false, `Forbidden JSX style={{}} found in ${label}`);
  }

  // Every additive --category-* and --z-category-* token defined in tokens.css must be consumed
  const definedCategoryTokens = Array.from(
    tokensCss.matchAll(/(--(?:category|z-category)-[a-z0-9-]+)\s*:/g),
    (match) => match[1]
  );
  assert.ok(definedCategoryTokens.length > 0, 'Expected additive --category-* tokens in tokens.css');
  for (const token of definedCategoryTokens) {
    assert.ok(
      showcaseCss.includes(`var(${token})`),
      `Unused category token in tokens.css: ${token}`
    );
  }

  // Proven-unused old bento tokens should be cleaned up
  for (const removedToken of [
    '--category-tall-min-height',
    '--category-wide-min-height',
    '--category-compact-min-height',
    '--text-category-tall',
    '--text-category-wide',
    '--cue-circle-size',
  ]) {
    assert.equal(
      tokensCss.includes(removedToken),
      false,
      `Obsolete bento token should be removed from tokens.css: ${removedToken}`
    );
  }

  console.log(
    'OK: category showcase mapping, exact approved copy, RSC serializability, anchor modifiers, focus trap, scroll compensation, motion configs, and token/RSC guardrails verified.'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
