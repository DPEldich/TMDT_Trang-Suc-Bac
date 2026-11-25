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
      throw new Error(`Unsupported external import in search check: ${specifier}`);
    });
    moduleCache.set(resolved, mod.exports);
    return mod.exports;
  }

  const { PRODUCTS } = loadTsModule(path.join(rootDir, 'src', 'data', 'products.ts'));
  const catalog = loadTsModule(path.join(rootDir, 'src', 'utils', 'catalog.ts'));

  const {
    CATALOG_PATH,
    CATALOG_PAGE_SIZE,
    CATALOG_QUERY_MAX_LENGTH,
    normalizeSearchQuery,
    normalizeSearchText,
    parseQueryParam,
    parsePriceParam,
    parseCatalogPriceRange,
    parsePriceInput,
    validatePriceRangeInputs,
    parseInStockParam,
    parseSortParam,
    parsePageParam,
    buildCatalogHref,
    getCatalogStateHref,
    getCategoryFilterHref,
    getMaterialFilterHref,
    getPaginationHref,
    matchesProductSearch,
    filterCatalogByCriteria,
    getCategoryCountsForCriteria,
    sortCatalogProducts,
    resolveCatalogState,
  } = catalog;

  assert.equal(CATALOG_PATH, '/san-pham');
  assert.equal(CATALOG_PAGE_SIZE, 12);
  assert.equal(CATALOG_QUERY_MAX_LENGTH, 100);
  assert.equal(PRODUCTS.length, 51);

  // 1. Vietnamese accent, đ/Đ->d, case, whitespace, multi-word AND matching, SKU, and no-description search
  assert.equal(normalizeSearchText('Nhẫn Bạc Đính Đá'), 'nhan bac dinh da');
  assert.equal(normalizeSearchText('  ĐÂY   chuyền   đan  '), 'day chuyen dan');

  const asciiNhanBac = resolveCatalogState(PRODUCTS, '?q=nhan+bac');
  const accentedNhanBac = resolveCatalogState(PRODUCTS, '?q=Nh%E1%BA%ABn+b%E1%BA%A1c');
  const upperWhitespaceNhanBac = resolveCatalogState(PRODUCTS, '?q=++NH%E1%BA%AAN+++B%E1%BA%A0C++');
  const nfdQuery = 'nha\u0302\u0303n ba\u0323c';
  const nfdNhanBac = resolveCatalogState(PRODUCTS, `?q=${encodeURIComponent(nfdQuery)}`);

  assert.ok(asciiNhanBac.pagination.totalItems > 0, 'Expected hits for "nhan bac"');
  assert.equal(accentedNhanBac.q, 'Nhẫn bạc', 'Human display query must preserve accents');
  assert.equal(nfdNhanBac.q, 'nhẫn bạc', 'NFD query must normalize to NFC');
  assert.equal(nfdNhanBac.needsNormalization, true, 'NFD URL should trigger normalization');
  assert.equal(upperWhitespaceNhanBac.q, 'NHẪN BẠC');
  assert.equal(upperWhitespaceNhanBac.needsNormalization, true);

  const expectedNhanBacIds = asciiNhanBac.filteredProducts.map((p) => p.id);
  assert.deepEqual(
    accentedNhanBac.filteredProducts.map((p) => p.id),
    expectedNhanBacIds,
    '"Nhẫn bạc" must match the exact same products as "nhan bac"'
  );
  assert.deepEqual(
    upperWhitespaceNhanBac.filteredProducts.map((p) => p.id),
    expectedNhanBacIds,
    'Uppercase and extra whitespace must match identically'
  );
  assert.deepEqual(
    nfdNhanBac.filteredProducts.map((p) => p.id),
    expectedNhanBacIds,
    'NFD decomposed query must match identically'
  );
  assert.ok(
    asciiNhanBac.filteredProducts.every((p) => p.category === 'nhan' && p.material === 'silver'),
    'Every "nhan bac" match in real catalog should be a silver ring'
  );

  // đ / Đ -> d equivalence
  const asciiDinhDa = filterCatalogByCriteria(PRODUCTS, { q: 'dinh da' }).map((p) => p.id);
  const accentedDinhDa = filterCatalogByCriteria(PRODUCTS, { q: 'đính đá' }).map((p) => p.id);
  const upperDinhDa = filterCatalogByCriteria(PRODUCTS, { q: 'ĐÍNH ĐÁ' }).map((p) => p.id);
  assert.ok(asciiDinhDa.length > 0, 'Expected matches for "dinh da"');
  assert.deepEqual(accentedDinhDa, asciiDinhDa);
  assert.deepEqual(upperDinhDa, asciiDinhDa);

  // Multi-word AND narrowing
  const nhanBacDinhDa = filterCatalogByCriteria(PRODUCTS, { q: 'nhan bac dinh da' }).map((p) => p.id);
  assert.ok(nhanBacDinhDa.length > 0);
  assert.ok(nhanBacDinhDa.length <= expectedNhanBacIds.length);
  for (const id of nhanBacDinhDa) {
    assert.ok(expectedNhanBacIds.includes(id));
    assert.ok(asciiDinhDa.includes(id));
  }

  // SKU search (exact, lowercase, partial)
  const skuExact = resolveCatalogState(PRODUCTS, '?q=NFA-RNG-XM0088');
  assert.equal(skuExact.pagination.totalItems, 1);
  assert.equal(skuExact.pagination.items[0].id, 'prod-01');
  assert.equal(skuExact.pagination.items[0].sku, 'NFA-RNG-XM0088');

  const skuLower = resolveCatalogState(PRODUCTS, '?q=xm0088');
  assert.equal(skuLower.pagination.totalItems, 1);
  assert.equal(skuLower.pagination.items[0].id, 'prod-01');

  const platinumSku = resolveCatalogState(PRODUCTS, '?q=nfa-chn-pd60000');
  assert.equal(platinumSku.pagination.totalItems, 1);
  assert.equal(platinumSku.pagination.items[0].material, 'platinum');

  // Long/short descriptions must NOT be searched (e.g., "không kèm mặt dây" appears in prod-03 description)
  const prod03 = PRODUCTS.find((p) => p.id === 'prod-03');
  assert.ok(prod03 && prod03.shortDescription.includes('không kèm mặt dây'));
  const descPhraseResult = resolveCatalogState(PRODUCTS, '?q=khong+kem+mat+day');
  assert.equal(
    descPhraseResult.pagination.totalItems,
    0,
    'Search must NOT match description text like "không kèm mặt dây"'
  );

  // Regex metacharacters in query must match safely as plain strings without throwing
  for (const trickyQuery of ['[a-z]+', '(nhan)*', 'bac?.*^$', 'a\\b']) {
    const res = resolveCatalogState(PRODUCTS, { q: trickyQuery });
    assert.equal(res.pagination.totalItems, 0);
  }

  // Blank query means no search; query bounded to 100 chars
  assert.equal(normalizeSearchQuery('   \t \n  '), '');
  assert.equal(parseQueryParam(''), '');
  const overlong = `${'a'.repeat(95)}   ${'b'.repeat(20)}`;
  const bounded = normalizeSearchQuery(overlong);
  assert.equal(Array.from(bounded).length, 100);
  assert.equal(bounded, `${'a'.repeat(95)} bbbb`);

  const blankState = resolveCatalogState(PRODUCTS, '?q=+++');
  assert.equal(blankState.q, '');
  assert.equal(blankState.pagination.totalItems, 51);
  assert.equal(blankState.normalizedHref, '/san-pham');
  assert.equal(blankState.needsNormalization, true);

  // 2. Inclusive min/max price bounds & 0 semantics
  const prod08 = PRODUCTS.find((p) => p.id === 'prod-08');
  assert.ok(prod08 && prod08.price === 350000);
  const exact350 = resolveCatalogState(PRODUCTS, '?minPrice=350000&maxPrice=350000');
  assert.ok(exact350.pagination.totalItems >= 1);
  assert.ok(exact350.filteredProducts.every((p) => p.price === 350000));
  assert.ok(exact350.filteredProducts.some((p) => p.id === 'prod-08'));
  assert.equal(exact350.needsNormalization, false);

  const above350 = resolveCatalogState(PRODUCTS, '?minPrice=350001');
  assert.ok(!above350.filteredProducts.some((p) => p.id === 'prod-08'));

  const below350 = resolveCatalogState(PRODUCTS, '?maxPrice=349999');
  assert.equal(below350.pagination.totalItems, 0);

  // minPrice=0 is default (omitted); maxPrice=0 is valid and active
  const minZero = resolveCatalogState(PRODUCTS, '?minPrice=0');
  assert.equal(minZero.minPrice, null);
  assert.equal(minZero.pagination.totalItems, 51);
  assert.equal(minZero.canonicalHref, '/san-pham');
  assert.equal(minZero.needsNormalization, true);

  const maxZero = resolveCatalogState(PRODUCTS, '?maxPrice=0');
  assert.equal(maxZero.minPrice, null);
  assert.equal(maxZero.maxPrice, 0);
  assert.equal(maxZero.pagination.totalItems, 0);
  assert.equal(maxZero.canonicalHref, '/san-pham?maxPrice=0');
  assert.equal(maxZero.needsNormalization, false);

  const bothZero = resolveCatalogState(PRODUCTS, '?minPrice=0&maxPrice=0');
  assert.equal(bothZero.minPrice, null);
  assert.equal(bothZero.maxPrice, 0);
  assert.equal(bothZero.canonicalHref, '/san-pham?maxPrice=0');
  assert.equal(bothZero.needsNormalization, true);

  // 3. Invalid, reversed, and unsafe URL price query parameters
  const invalidUrlPriceInputs = [
    undefined,
    null,
    '',
    ' ',
    '00',
    '0500',
    '-1',
    '-0',
    '+500',
    ' 500 ',
    '1.5',
    '500.000',
    '500,000',
    '1e5',
    '1E5',
    '0x10',
    '0b10',
    '0o10',
    'abc',
    'NaN',
    'Infinity',
    '9007199254740992',
    '999999999999999999999999',
  ];
  for (const invalid of invalidUrlPriceInputs) {
    assert.equal(
      parsePriceParam(invalid),
      null,
      `Expected URL price "${String(invalid)}" to parse as null`
    );
  }
  assert.equal(parsePriceParam('0'), 0);
  assert.equal(parsePriceParam('300000'), 300000);
  assert.equal(
    parsePriceParam(String(Number.MAX_SAFE_INTEGER)),
    Number.MAX_SAFE_INTEGER
  );

  // Invalid bound removed individually; valid sibling preserved
  assert.deepEqual(parseCatalogPriceRange('abc', '1000000'), {
    minPrice: null,
    maxPrice: 1000000,
  });
  assert.deepEqual(parseCatalogPriceRange('300000', '-500'), {
    minPrice: 300000,
    maxPrice: null,
  });
  assert.deepEqual(parseCatalogPriceRange('500.000', '1000000'), {
    minPrice: null,
    maxPrice: 1000000,
  });

  // Reversed valid pair removed together
  assert.deepEqual(parseCatalogPriceRange('1000000', '300000'), {
    minPrice: null,
    maxPrice: null,
  });
  assert.deepEqual(parseCatalogPriceRange('500000', '0'), {
    minPrice: null,
    maxPrice: null,
  });

  const reversedUrl = resolveCatalogState(
    PRODUCTS,
    '?q=nhan&material=silver&minPrice=1000000&maxPrice=300000'
  );
  assert.equal(reversedUrl.minPrice, null);
  assert.equal(reversedUrl.maxPrice, null);
  assert.equal(reversedUrl.canonicalHref, '/san-pham?q=nhan&material=silver');
  assert.equal(reversedUrl.needsNormalization, true);

  // 4. UI price input validator (accepts plain digits & Vietnamese thousands; rejects malformed)
  const validUiInputs = [
    ['', null],
    ['   ', null],
    ['0', 0],
    ['300000', 300000],
    ['500.000', 500000],
    ['1.000', 1000],
    ['1.250.000', 1250000],
    ['  18.500.000  ', 18500000],
    [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
    ['9.007.199.254.740.991', Number.MAX_SAFE_INTEGER],
  ];
  for (const [raw, expected] of validUiInputs) {
    const res = parsePriceInput(raw);
    assert.equal(res.valid, true, `Expected UI price "${raw}" to be valid`);
    assert.equal(res.value, expected, `Unexpected parsed value for "${raw}"`);
    assert.equal(res.error, null);
  }

  const invalidUiInputs = [
    '1.5',
    '0.500',
    '0.000',
    '1.50',
    '1.5000',
    '1000.000',
    '500.',
    '.500',
    '500..000',
    '500,000',
    '1,5',
    '-1',
    '-500.000',
    '-0',
    '+500',
    '00',
    '0500',
    '1e5',
    '1E5',
    '0x10',
    '0b10',
    '0o10',
    '500 000',
    '500đ',
    'abc',
    'NaN',
    'Infinity',
    '9007199254740992',
    '9.007.199.254.740.992',
  ];
  for (const raw of invalidUiInputs) {
    const res = parsePriceInput(raw);
    assert.equal(res.valid, false, `Expected UI price "${raw}" to be rejected`);
    assert.equal(res.value, null);
    assert.ok(res.error && res.error.length > 0);
  }

  const uiReversed = validatePriceRangeInputs('1.000.000', '300.000');
  assert.equal(uiReversed.valid, false);
  assert.equal(uiReversed.firstInvalidField, 'minPrice');
  assert.ok(uiReversed.minError);

  const uiReversedZero = validatePriceRangeInputs('100', '0');
  assert.equal(uiReversedZero.valid, false);
  assert.equal(uiReversedZero.firstInvalidField, 'minPrice');

  const uiBadMax = validatePriceRangeInputs('300.000', '1.5');
  assert.equal(uiBadMax.valid, false);
  assert.equal(uiBadMax.minError, null);
  assert.ok(uiBadMax.maxError);
  assert.equal(uiBadMax.firstInvalidField, 'maxPrice');

  const uiZeroMin = validatePriceRangeInputs('0', '500.000');
  assert.equal(uiZeroMin.valid, true);
  assert.equal(uiZeroMin.minPrice, null, 'minPrice=0 normalizes to unrestricted null');
  assert.equal(uiZeroMin.maxPrice, 500000);

  const uiZeroBoth = validatePriceRangeInputs('0', '0');
  assert.equal(uiZeroBoth.valid, true);
  assert.equal(uiZeroBoth.minPrice, null);
  assert.equal(uiZeroBoth.maxPrice, 0, 'maxPrice=0 stays active');

  // 5. Stock-0 and price-0 fixture (without touching real data)
  const stockFixture = Object.freeze([
    {
      id: 'fix-1',
      sku: 'FIX-001',
      name: 'Nhẫn bạc mẫu A',
      category: 'nhan',
      itemType: 'ring',
      material: 'silver',
      price: 500000,
      stock: 0,
    },
    {
      id: 'fix-2',
      sku: 'FIX-002',
      name: 'Nhẫn bạc mẫu B',
      category: 'nhan',
      itemType: 'ring',
      material: 'silver',
      price: 500000,
      stock: 3,
    },
    {
      id: 'fix-3',
      sku: 'FIX-003',
      name: 'Bông tai bạc mẫu C',
      category: 'bong-tai',
      itemType: 'earring',
      material: 'silver',
      price: 0,
      stock: 2,
    },
    {
      id: 'fix-4',
      sku: 'FIX-004',
      name: 'Bông tai vàng mẫu D',
      category: 'bong-tai',
      itemType: 'earring',
      material: 'gold',
      price: 900000,
      stock: 0,
    },
  ]);

  const fixtureAll = resolveCatalogState(stockFixture, '');
  assert.equal(fixtureAll.pagination.totalItems, 4);
  assert.equal(fixtureAll.categoryCounts.nhan, 2);
  assert.equal(fixtureAll.categoryCounts['bong-tai'], 2);

  const fixtureInStock = resolveCatalogState(stockFixture, '?inStock=1');
  assert.equal(fixtureInStock.inStock, true);
  assert.equal(fixtureInStock.pagination.totalItems, 2);
  assert.deepEqual(
    fixtureInStock.filteredProducts.map((p) => p.id),
    ['fix-2', 'fix-3']
  );
  assert.equal(fixtureInStock.categoryCounts.all, 2);
  assert.equal(fixtureInStock.categoryCounts.nhan, 1);
  assert.equal(fixtureInStock.categoryCounts['bong-tai'], 1);

  const fixtureMaxZero = resolveCatalogState(stockFixture, '?maxPrice=0');
  assert.equal(fixtureMaxZero.pagination.totalItems, 1);
  assert.equal(fixtureMaxZero.filteredProducts[0].id, 'fix-3');

  assert.equal(parseInStockParam('1'), true);
  for (const nonActive of [undefined, null, '', '0', 'true', 'yes', ' 1 ', '2']) {
    assert.equal(parseInStockParam(nonActive), false);
  }

  // 6. All criteria combined + coherent category facet counts ignoring current category
  const combinedNoCat = resolveCatalogState(
    PRODUCTS,
    '?q=bac&material=silver&minPrice=350000&maxPrice=700000&inStock=1&sort=price-asc'
  );
  const combinedNhan = resolveCatalogState(
    PRODUCTS,
    '?q=bac&category=nhan&material=silver&minPrice=350000&maxPrice=700000&inStock=1&sort=price-asc'
  );
  const combinedBongTai = resolveCatalogState(
    PRODUCTS,
    '?q=bac&category=bong-tai&material=silver&minPrice=350000&maxPrice=700000&inStock=1&sort=price-asc'
  );

  assert.deepEqual(
    combinedNhan.categoryCounts,
    combinedNoCat.categoryCounts,
    'Category counts must ignore selected category'
  );
  assert.deepEqual(combinedBongTai.categoryCounts, combinedNoCat.categoryCounts);

  const facetSum =
    combinedNoCat.categoryCounts.nhan +
    combinedNoCat.categoryCounts['day-chuyen'] +
    combinedNoCat.categoryCounts['lac-tay'] +
    combinedNoCat.categoryCounts['bong-tai'] +
    combinedNoCat.categoryCounts['lac-chan'];
  assert.equal(facetSum, combinedNoCat.categoryCounts.all);
  assert.equal(combinedNoCat.pagination.totalItems, combinedNoCat.categoryCounts.all);
  assert.equal(combinedNhan.pagination.totalItems, combinedNhan.categoryCounts.nhan);
  assert.equal(
    combinedBongTai.pagination.totalItems,
    combinedBongTai.categoryCounts['bong-tai']
  );
  assert.ok(combinedNhan.pagination.totalItems > 0);
  assert.ok(
    combinedNhan.filteredProducts.every(
      (p) =>
        p.category === 'nhan' &&
        p.material === 'silver' &&
        p.price >= 350000 &&
        p.price <= 700000 &&
        p.stock > 0 &&
        matchesProductSearch(p, 'bac')
    )
  );
  assert.deepEqual(
    getCategoryCountsForCriteria(PRODUCTS, {
      q: 'bac',
      material: 'silver',
      minPrice: 350000,
      maxPrice: 700000,
      inStock: true,
    }),
    combinedNoCat.categoryCounts
  );

  // 7. Stable non-mutating sorting, Vietnamese locale ordering, ties, and sort-before-pagination
  const originalProductIds = PRODUCTS.map((p) => p.id);
  const frozenProducts = Object.freeze([...PRODUCTS]);

  const priceAscPage1 = resolveCatalogState(frozenProducts, '?sort=price-asc&page=1');
  const priceAscPage2 = resolveCatalogState(frozenProducts, '?sort=price-asc&page=2');
  const priceAscPage5 = resolveCatalogState(frozenProducts, '?sort=price-asc&page=5');
  assert.equal(priceAscPage1.pagination.items.length, 12);
  assert.equal(priceAscPage2.pagination.items.length, 12);
  assert.equal(priceAscPage5.pagination.items.length, 3);
  assert.ok(
    priceAscPage1.pagination.items[11].price <= priceAscPage2.pagination.items[0].price,
    'Sort must happen BEFORE pagination (page 1 max <= page 2 min)'
  );
  for (let i = 1; i < priceAscPage1.filteredProducts.length; i += 1) {
    assert.ok(
      priceAscPage1.filteredProducts[i - 1].price <=
        priceAscPage1.filteredProducts[i].price
    );
  }

  const priceDesc = resolveCatalogState(frozenProducts, '?sort=price-desc');
  for (let i = 1; i < priceDesc.filteredProducts.length; i += 1) {
    assert.ok(
      priceDesc.filteredProducts[i - 1].price >=
        priceDesc.filteredProducts[i].price
    );
  }
  assert.equal(
    priceDesc.pagination.items[0].price,
    Math.max(...PRODUCTS.map((p) => p.price))
  );

  // Source array must NEVER be mutated
  assert.deepEqual(
    PRODUCTS.map((p) => p.id),
    originalProductIds,
    'PRODUCTS array must never be mutated'
  );

  // Deterministic tie-breaking & Vietnamese collation (D before Đ)
  const sortFixture = Object.freeze([
    { id: 't1', name: 'Đá quý B', price: 500000 },
    { id: 't2', name: 'Dây chuyền A', price: 500000 },
    { id: 't3', name: 'Bông tai C', price: 500000 },
    { id: 't4', name: 'Bông tai C', price: 300000 },
  ]);

  assert.deepEqual(
    sortCatalogProducts(sortFixture, 'price-asc').map((x) => x.id),
    ['t4', 't1', 't2', 't3'],
    'Equal prices must keep deterministic source order under price-asc'
  );
  assert.deepEqual(
    sortCatalogProducts(sortFixture, 'price-desc').map((x) => x.id),
    ['t1', 't2', 't3', 't4'],
    'Equal prices must keep deterministic source order under price-desc'
  );
  assert.deepEqual(
    sortCatalogProducts(sortFixture, 'name-asc').map((x) => x.id),
    ['t3', 't4', 't2', 't1'],
    'Vietnamese name-asc must sort B < D < Đ and preserve source order for identical names'
  );

  assert.equal(parseSortParam('price-asc'), 'price-asc');
  assert.equal(parseSortParam('PRICE-DESC'), 'price-desc');
  assert.equal(parseSortParam('name-asc'), 'name-asc');
  for (const invalidSort of [undefined, null, '', 'default', 'newest', 'rating', 'popular']) {
    assert.equal(parseSortParam(invalidSort), 'default');
  }

  // 8. URL contract round-trip, state transitions, chip removal, reset, compatibility & idempotence
  const fullStateHref = buildCatalogHref({
    q: 'nhan bac',
    category: 'nhan',
    material: 'silver',
    minPrice: 300000,
    maxPrice: 1000000,
    inStock: true,
    sort: 'price-asc',
    page: 2,
  });
  assert.equal(
    fullStateHref,
    '/san-pham?q=nhan+bac&category=nhan&material=silver&minPrice=300000&maxPrice=1000000&inStock=1&sort=price-asc&page=2'
  );

  // Round-trip with pageSize=2 so page=2 is valid for silver rings in 300k..1M
  const roundTrip = resolveCatalogState(PRODUCTS, fullStateHref, 2);
  assert.equal(roundTrip.canonicalHref, fullStateHref);
  assert.equal(roundTrip.normalizedHref, fullStateHref);
  assert.equal(roundTrip.needsNormalization, false);
  assert.equal(roundTrip.q, 'nhan bac');
  assert.equal(roundTrip.category, 'nhan');
  assert.equal(roundTrip.material, 'silver');
  assert.equal(roundTrip.minPrice, 300000);
  assert.equal(roundTrip.maxPrice, 1000000);
  assert.equal(roundTrip.inStock, true);
  assert.equal(roundTrip.sort, 'price-asc');
  assert.equal(roundTrip.pagination.currentPage, 2);

  // Partial chip removals reset page to 1 and preserve every other active criterion + sort
  assert.equal(
    getCatalogStateHref(roundTrip.queryState, { q: '' }, { resetPage: true }),
    '/san-pham?category=nhan&material=silver&minPrice=300000&maxPrice=1000000&inStock=1&sort=price-asc'
  );
  assert.equal(
    getCatalogStateHref(roundTrip.queryState, { category: 'all' }, { resetPage: true }),
    '/san-pham?q=nhan+bac&material=silver&minPrice=300000&maxPrice=1000000&inStock=1&sort=price-asc'
  );
  assert.equal(
    getCatalogStateHref(roundTrip.queryState, { material: 'all' }, { resetPage: true }),
    '/san-pham?q=nhan+bac&category=nhan&minPrice=300000&maxPrice=1000000&inStock=1&sort=price-asc'
  );
  assert.equal(
    getCatalogStateHref(roundTrip.queryState, { minPrice: null }, { resetPage: true }),
    '/san-pham?q=nhan+bac&category=nhan&material=silver&maxPrice=1000000&inStock=1&sort=price-asc'
  );
  assert.equal(
    getCatalogStateHref(roundTrip.queryState, { maxPrice: null }, { resetPage: true }),
    '/san-pham?q=nhan+bac&category=nhan&material=silver&minPrice=300000&inStock=1&sort=price-asc'
  );
  assert.equal(
    getCatalogStateHref(roundTrip.queryState, { inStock: false }, { resetPage: true }),
    '/san-pham?q=nhan+bac&category=nhan&material=silver&minPrice=300000&maxPrice=1000000&sort=price-asc'
  );

  // Pagination preserves ALL active criteria and sort
  assert.equal(
    getCatalogStateHref(roundTrip.queryState, { page: 3 }, { resetPage: false }),
    '/san-pham?q=nhan+bac&category=nhan&material=silver&minPrice=300000&maxPrice=1000000&inStock=1&sort=price-asc&page=3'
  );

  // Legacy helper compatibility + extended optional state preservation
  assert.equal(getCategoryFilterHref('nhan', 'silver'), '/san-pham?category=nhan&material=silver');
  assert.equal(
    getCategoryFilterHref('nhan', 'silver', { q: 'bac', sort: 'price-asc' }),
    '/san-pham?q=bac&category=nhan&material=silver&sort=price-asc'
  );
  assert.equal(
    getMaterialFilterHref('nhan', 'gold', { minPrice: 500000 }),
    '/san-pham?category=nhan&material=gold&minPrice=500000'
  );
  assert.equal(
    getPaginationHref('all', 'silver', 2, { sort: 'name-asc', inStock: true }),
    '/san-pham?material=silver&inStock=1&sort=name-asc&page=2'
  );

  // Normalization idempotence across dirty, duplicate, invalid, reversed, and extra-param URLs
  const normalizationCases = [
    ['/san-pham', '/san-pham', false],
    ['/san-pham?q=', '/san-pham', true],
    ['/san-pham?q=%20%20%20', '/san-pham', true],
    ['/san-pham?q=nhan%20%20bac', '/san-pham?q=nhan+bac', true],
    ['/san-pham?q=nhan+bac&q=bong+tai', '/san-pham?q=nhan+bac', true],
    ['/san-pham?minPrice=0', '/san-pham', true],
    ['/san-pham?maxPrice=0', '/san-pham?maxPrice=0', false],
    ['/san-pham?minPrice=0&maxPrice=0', '/san-pham?maxPrice=0', true],
    ['/san-pham?minPrice=0&maxPrice=500000', '/san-pham?maxPrice=500000', true],
    ['/san-pham?minPrice=abc&maxPrice=500000', '/san-pham?maxPrice=500000', true],
    ['/san-pham?minPrice=300000&maxPrice=1.5', '/san-pham?minPrice=300000', true],
    ['/san-pham?minPrice=1000000&maxPrice=300000', '/san-pham', true],
    ['/san-pham?minPrice=500000&maxPrice=0', '/san-pham', true],
    ['/san-pham?minPrice=9007199254740992&maxPrice=500000', '/san-pham?maxPrice=500000', true],
    ['/san-pham?minPrice=300000&minPrice=500000', '/san-pham?minPrice=300000', true],
    ['/san-pham?inStock=1', '/san-pham?inStock=1', false],
    ['/san-pham?inStock=0', '/san-pham', true],
    ['/san-pham?inStock=true', '/san-pham', true],
    ['/san-pham?inStock=1&inStock=0', '/san-pham?inStock=1', true],
    ['/san-pham?sort=default', '/san-pham', true],
    ['/san-pham?sort=newest', '/san-pham', true],
    ['/san-pham?sort=PRICE-ASC', '/san-pham?sort=price-asc', true],
    ['/san-pham?sort=price-desc&sort=name-asc', '/san-pham?sort=price-desc', true],
    ['/san-pham?sort=price-asc&page=2', '/san-pham?sort=price-asc&page=2', false],
    ['/san-pham?sort=price-asc&page=99', '/san-pham?sort=price-asc&page=5', true],
    ['/san-pham?sort=price-asc&page=1e2', '/san-pham?sort=price-asc', true],
    [
      '/san-pham?utm_source=demo&q=++bac++&minPrice=1000000&maxPrice=300000&inStock=true&sort=newest&page=99',
      '/san-pham?q=bac&page=2&utm_source=demo',
      true,
    ],
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

    const secondPass = resolveCatalogState(PRODUCTS, firstPass.normalizedHref);
    assert.equal(
      secondPass.needsNormalization,
      false,
      `Normalization not idempotent for ${rawUrl} -> ${firstPass.normalizedHref}`
    );
    assert.equal(secondPass.normalizedHref, firstPass.normalizedHref);
    assert.equal(secondPass.canonicalHref, firstPass.canonicalHref);
    assert.deepEqual(secondPass.queryState, firstPass.queryState);
  }

  // Verify existing strict page parsing still intact
  assert.equal(parsePageParam('1e2'), 1);
  assert.equal(parsePageParam('9007199254740992'), 1);
  assert.equal(parsePageParam('2'), 2);

  console.log(
    'OK: catalog advanced search verified (Vietnamese accent/đ/case/whitespace AND + SKU matching, no description hits, inclusive prices & 0 rules, strict URL & UI price validators, stock-0 fixture, coherent facet counts, stable non-mutating sorts before pagination, canonical URLs & idempotent normalization).'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
