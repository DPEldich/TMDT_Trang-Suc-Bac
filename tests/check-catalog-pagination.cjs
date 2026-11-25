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
      throw new Error(`Unsupported external import in pagination check: ${specifier}`);
    });
    moduleCache.set(resolved, mod.exports);
    return mod.exports;
  }

  const { PRODUCTS } = loadTsModule(path.join(rootDir, 'src', 'data', 'products.ts'));
  const catalog = loadTsModule(path.join(rootDir, 'src', 'utils', 'catalog.ts'));

  const {
    CATALOG_PATH,
    CATALOG_PAGE_SIZE,
    parseCategoryParam,
    parseMaterialParam,
    parsePageParam,
    buildCatalogHref,
    getCategoryFilterHref,
    getMaterialFilterHref,
    getPaginationHref,
    filterCatalogProducts,
    getCategoryCountsForMaterial,
    paginateItems,
    formatCatalogRangeSummary,
    resolveCatalogState,
  } = catalog;

  assert.equal(CATALOG_PATH, '/san-pham');
  assert.equal(CATALOG_PAGE_SIZE, 12);
  assert.equal(PRODUCTS.length, 51, 'Expected 51 products in catalog data');

  // 1. Complete 51-item coverage across 5 pages (12/12/12/12/3), stable order, no duplicates/gaps
  const seenIds = [];
  const expectedPageCounts = [12, 12, 12, 12, 3];
  const expectedRanges = [
    [1, 12, '1\u201312 / 51 sản phẩm'],
    [13, 24, '13\u201324 / 51 sản phẩm'],
    [25, 36, '25\u201336 / 51 sản phẩm'],
    [37, 48, '37\u201348 / 51 sản phẩm'],
    [49, 51, '49\u201351 / 51 sản phẩm'],
  ];

  for (let page = 1; page <= 5; page += 1) {
    const result = paginateItems(PRODUCTS, page, CATALOG_PAGE_SIZE);
    assert.equal(result.totalItems, 51);
    assert.equal(result.totalPages, 5);
    assert.equal(result.currentPage, page);
    assert.equal(result.items.length, expectedPageCounts[page - 1]);
    assert.equal(result.startItem, expectedRanges[page - 1][0]);
    assert.equal(result.endItem, expectedRanges[page - 1][1]);
    assert.equal(formatCatalogRangeSummary(result), expectedRanges[page - 1][2]);
    seenIds.push(...result.items.map((item) => item.id));
  }

  assert.equal(seenIds.length, 51);
  assert.equal(new Set(seenIds).size, 51, 'No duplicate product IDs across pages');
  assert.deepEqual(
    seenIds,
    PRODUCTS.map((item) => item.id),
    'Pagination must preserve exact stable source ordering across all 51 items'
  );

  // 2. Category counts coherent under every material filter
  assert.deepEqual(getCategoryCountsForMaterial(PRODUCTS, 'all'), {
    all: 51,
    nhan: 11,
    'day-chuyen': 15,
    'lac-tay': 13,
    'bong-tai': 11,
    'lac-chan': 1,
  });
  assert.deepEqual(getCategoryCountsForMaterial(PRODUCTS, 'silver'), {
    all: 20,
    nhan: 5,
    'day-chuyen': 4,
    'lac-tay': 4,
    'bong-tai': 6,
    'lac-chan': 1,
  });
  assert.deepEqual(getCategoryCountsForMaterial(PRODUCTS, 'gold'), {
    all: 30,
    nhan: 6,
    'day-chuyen': 10,
    'lac-tay': 9,
    'bong-tai': 5,
    'lac-chan': 0,
  });
  assert.deepEqual(getCategoryCountsForMaterial(PRODUCTS, 'platinum'), {
    all: 1,
    nhan: 0,
    'day-chuyen': 1,
    'lac-tay': 0,
    'bong-tai': 0,
    'lac-chan': 0,
  });

  // 3. Category & material intersection before pagination
  const goldPage2 = resolveCatalogState(PRODUCTS, '?material=gold&page=2');
  assert.equal(goldPage2.pagination.totalItems, 30);
  assert.equal(goldPage2.pagination.totalPages, 3);
  assert.equal(goldPage2.pagination.currentPage, 2);
  assert.equal(goldPage2.pagination.items.length, 12);
  assert.equal(formatCatalogRangeSummary(goldPage2.pagination), '13\u201324 / 30 sản phẩm');
  assert.ok(goldPage2.pagination.items.every((p) => p.material === 'gold'));
  assert.equal(goldPage2.canonicalHref, '/san-pham?material=gold&page=2');
  assert.equal(goldPage2.needsNormalization, false);

  const goldPage3 = resolveCatalogState(PRODUCTS, '?material=gold&page=3');
  assert.equal(goldPage3.pagination.items.length, 6);
  assert.equal(formatCatalogRangeSummary(goldPage3.pagination), '25\u201330 / 30 sản phẩm');

  const silverPage2 = resolveCatalogState(PRODUCTS, '?material=silver&page=2');
  assert.equal(silverPage2.pagination.totalItems, 20);
  assert.equal(silverPage2.pagination.totalPages, 2);
  assert.equal(silverPage2.pagination.items.length, 8);
  assert.ok(silverPage2.pagination.items.every((p) => p.material === 'silver'));

  const dayChuyenPage2 = resolveCatalogState(PRODUCTS, '?category=day-chuyen&page=2');
  assert.equal(dayChuyenPage2.pagination.totalItems, 15);
  assert.equal(dayChuyenPage2.pagination.totalPages, 2);
  assert.equal(dayChuyenPage2.pagination.items.length, 3);
  assert.equal(formatCatalogRangeSummary(dayChuyenPage2.pagination), '13\u201315 / 15 sản phẩm');
  assert.ok(dayChuyenPage2.pagination.items.every((p) => p.category === 'day-chuyen'));

  const lacTayPage2 = resolveCatalogState(PRODUCTS, '?category=lac-tay&page=2');
  assert.equal(lacTayPage2.pagination.totalItems, 13);
  assert.equal(lacTayPage2.pagination.totalPages, 2);
  assert.equal(lacTayPage2.pagination.items.length, 1);
  assert.equal(formatCatalogRangeSummary(lacTayPage2.pagination), '13 / 13 sản phẩm');

  const dayChuyenGold = filterCatalogProducts(PRODUCTS, 'day-chuyen', 'gold');
  assert.equal(dayChuyenGold.length, 10);
  assert.ok(dayChuyenGold.every((p) => p.category === 'day-chuyen' && p.material === 'gold'));

  const singlePageNhan = resolveCatalogState(PRODUCTS, '?category=nhan');
  assert.equal(singlePageNhan.pagination.totalItems, 11);
  assert.equal(singlePageNhan.pagination.totalPages, 1);
  assert.equal(formatCatalogRangeSummary(singlePageNhan.pagination), '11 sản phẩm');

  const platinumOnly = resolveCatalogState(PRODUCTS, '?material=platinum');
  assert.equal(platinumOnly.pagination.totalItems, 1);
  assert.equal(platinumOnly.pagination.totalPages, 1);
  assert.equal(platinumOnly.pagination.items[0].category, 'day-chuyen');
  assert.equal(formatCatalogRangeSummary(platinumOnly.pagination), '1 sản phẩm');

  // 4. Filter changes reset page to 1 while preserving the other valid filter; page changes preserve both
  assert.equal(getCategoryFilterHref('day-chuyen', 'gold'), '/san-pham?category=day-chuyen&material=gold');
  assert.equal(getCategoryFilterHref('all', 'gold'), '/san-pham?material=gold');
  assert.equal(getCategoryFilterHref('all', 'all'), '/san-pham');
  assert.equal(getMaterialFilterHref('day-chuyen', 'silver'), '/san-pham?category=day-chuyen&material=silver');
  assert.equal(getMaterialFilterHref('day-chuyen', 'all'), '/san-pham?category=day-chuyen');
  assert.equal(getMaterialFilterHref('all', 'all'), '/san-pham');
  assert.equal(getPaginationHref('all', 'all', 1), '/san-pham');
  assert.equal(getPaginationHref('all', 'all', 2), '/san-pham?page=2');
  assert.equal(getPaginationHref('all', 'gold', 2), '/san-pham?material=gold&page=2');
  assert.equal(getPaginationHref('day-chuyen', 'all', 2), '/san-pham?category=day-chuyen&page=2');
  assert.equal(
    getPaginationHref('day-chuyen', 'gold', 2),
    '/san-pham?category=day-chuyen&material=gold&page=2'
  );
  assert.equal(
    buildCatalogHref({ category: 'nhan', material: 'silver', page: 1 }),
    '/san-pham?category=nhan&material=silver'
  );

  // 5. Empty intersection (e.g. lac-chan + gold, nhan + platinum)
  const emptyLacChanGold = resolveCatalogState(PRODUCTS, '?category=lac-chan&material=gold');
  assert.equal(emptyLacChanGold.pagination.totalItems, 0);
  assert.equal(emptyLacChanGold.pagination.totalPages, 0);
  assert.equal(emptyLacChanGold.pagination.currentPage, 1);
  assert.equal(emptyLacChanGold.pagination.items.length, 0);
  assert.equal(emptyLacChanGold.pagination.startItem, 0);
  assert.equal(emptyLacChanGold.pagination.endItem, 0);
  assert.equal(formatCatalogRangeSummary(emptyLacChanGold.pagination), '0 sản phẩm');
  assert.equal(emptyLacChanGold.canonicalHref, '/san-pham?category=lac-chan&material=gold');
  assert.equal(emptyLacChanGold.needsNormalization, false);

  const emptyWithPage = resolveCatalogState(PRODUCTS, '?category=lac-chan&material=gold&page=4');
  assert.equal(emptyWithPage.pagination.totalItems, 0);
  assert.equal(emptyWithPage.pagination.totalPages, 0);
  assert.equal(emptyWithPage.pagination.currentPage, 1);
  assert.equal(emptyWithPage.canonicalHref, '/san-pham?category=lac-chan&material=gold');
  assert.equal(emptyWithPage.needsNormalization, true);

  const emptyNhanPlatinum = resolveCatalogState(PRODUCTS, '?category=nhan&material=platinum');
  assert.equal(emptyNhanPlatinum.pagination.totalItems, 0);
  assert.equal(emptyNhanPlatinum.pagination.totalPages, 0);

  // 6. Strict page validation: invalid syntax, non-positive, decimals, exp/hex, unsafe integers -> 1
  const invalidPageInputs = [
    undefined,
    null,
    '',
    ' ',
    '0',
    '00',
    '01',
    '02',
    '-1',
    '-0',
    '+1',
    '+2',
    ' 2 ',
    '1.5',
    '2.0',
    '1e2',
    '1E2',
    '0x2',
    '0X10',
    '0b10',
    '0o10',
    'abc',
    '2px',
    'NaN',
    'Infinity',
    '-Infinity',
    '9007199254740992', // Number.MAX_SAFE_INTEGER + 1 (unsafe)
    '999999999999999999999999999', // far beyond MAX_SAFE_INTEGER
  ];

  for (const invalid of invalidPageInputs) {
    assert.equal(
      parsePageParam(invalid),
      1,
      `Expected invalid page "${String(invalid)}" to parse as 1`
    );
  }

  // Valid positive safe integers parse accurately; out-of-range clamps to last page
  assert.equal(parsePageParam('1'), 1);
  assert.equal(parsePageParam('2'), 2);
  assert.equal(parsePageParam('99'), 99);
  assert.equal(parsePageParam(String(Number.MAX_SAFE_INTEGER)), Number.MAX_SAFE_INTEGER);

  const clampedAll = resolveCatalogState(PRODUCTS, '?page=99');
  assert.equal(clampedAll.pagination.currentPage, 5);
  assert.equal(clampedAll.pagination.items.length, 3);
  assert.equal(clampedAll.canonicalHref, '/san-pham?page=5');
  assert.equal(clampedAll.needsNormalization, true);

  const clampedMaxSafe = resolveCatalogState(
    PRODUCTS,
    `?material=gold&page=${Number.MAX_SAFE_INTEGER}`
  );
  assert.equal(clampedMaxSafe.pagination.currentPage, 3);
  assert.equal(clampedMaxSafe.pagination.items.length, 6);
  assert.equal(clampedMaxSafe.canonicalHref, '/san-pham?material=gold&page=3');
  assert.equal(clampedMaxSafe.needsNormalization, true);

  const unsafePage = resolveCatalogState(PRODUCTS, '?page=9007199254740992');
  assert.equal(unsafePage.requestedPage, 1);
  assert.equal(unsafePage.pagination.currentPage, 1);
  assert.equal(unsafePage.canonicalHref, '/san-pham');
  assert.equal(unsafePage.needsNormalization, true);

  // Unknown category/material fall back to 'all' safely
  assert.equal(parseCategoryParam('unknown-cat'), 'all');
  assert.equal(parseCategoryParam('  NHAN '), 'nhan');
  assert.equal(parseMaterialParam('diamond'), 'all');
  assert.equal(parseMaterialParam(' Gold '), 'gold');

  // 7. URL normalization stability & idempotence across valid, dirty, duplicate, and edge URLs
  const normalizationCases = [
    ['/san-pham', '/san-pham', false],
    ['/san-pham?page=1', '/san-pham', true],
    ['/san-pham?page=0', '/san-pham', true],
    ['/san-pham?page=-3', '/san-pham', true],
    ['/san-pham?page=abc', '/san-pham', true],
    ['/san-pham?page=1.5', '/san-pham', true],
    ['/san-pham?page=1e2', '/san-pham', true],
    ['/san-pham?page=0x2', '/san-pham', true],
    ['/san-pham?page=02', '/san-pham', true],
    ['/san-pham?page=9007199254740992', '/san-pham', true],
    ['/san-pham?page=9007199254740991', '/san-pham?page=5', true],
    ['/san-pham?page=99', '/san-pham?page=5', true],
    ['/san-pham?category=all&material=all&page=1', '/san-pham', true],
    ['/san-pham?category=unknown&material=plastic&page=2', '/san-pham?page=2', true],
    ['/san-pham?category=NHAN&material=Gold', '/san-pham?category=nhan&material=gold', true],
    ['/san-pham?category=day-chuyen&page=9', '/san-pham?category=day-chuyen&page=2', true],
    ['/san-pham?category=nhan&page=2', '/san-pham?category=nhan', true],
    ['/san-pham?category=lac-chan&material=gold&page=5', '/san-pham?category=lac-chan&material=gold', true],
    ['/san-pham?category=nhan&category=lac-tay&page=2&page=3', '/san-pham?category=nhan', true],
    ['/san-pham?page=2', '/san-pham?page=2', false],
    ['/san-pham?material=gold&page=2', '/san-pham?material=gold&page=2', false],
    ['/san-pham?category=day-chuyen&page=2', '/san-pham?category=day-chuyen&page=2', false],
    ['/san-pham?category=day-chuyen&material=gold', '/san-pham?category=day-chuyen&material=gold', false],
    ['/san-pham?utm_source=demo&page=99', '/san-pham?page=5&utm_source=demo', true],
    ['/san-pham?utm_source=demo', '/san-pham?utm_source=demo', false],
  ];

  for (const [rawUrl, expectedNormalized, expectedNeedsNorm] of normalizationCases) {
    const firstPass = resolveCatalogState(PRODUCTS, rawUrl);
    assert.equal(
      firstPass.normalizedHref,
      expectedNormalized,
      `Normalized URL mismatch for ${rawUrl}`
    );
    assert.equal(
      firstPass.needsNormalization,
      expectedNeedsNorm,
      `needsNormalization mismatch for ${rawUrl}`
    );

    // Second pass on normalized URL must be strictly stable & idempotent
    const secondPass = resolveCatalogState(PRODUCTS, firstPass.normalizedHref);
    assert.equal(
      secondPass.needsNormalization,
      false,
      `Normalization not idempotent for ${rawUrl} -> ${firstPass.normalizedHref}`
    );
    assert.equal(secondPass.normalizedHref, firstPass.normalizedHref);
    assert.equal(secondPass.canonicalHref, firstPass.canonicalHref);
    assert.equal(secondPass.category, firstPass.category);
    assert.equal(secondPass.material, firstPass.material);
    assert.equal(secondPass.pagination.currentPage, firstPass.pagination.currentPage);
  }

  console.log(
    'OK: catalog filter & pagination verified (51/12 -> 5 pages [12,12,12,12,3], coherent category counts per material, intersections, empty states, strict page validation, canonical URLs & idempotent normalization).'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
