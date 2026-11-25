'use strict';

const ORIGINAL_EIGHT_SNAPSHOT = [
  {
    id: 'prod-01',
    slug: 'nhan-bac-dinh-da-solitaire-xm0088',
    sku: 'NFA-RNG-XM0088',
    name: 'Nhẫn bạc điểm đá NFA',
    category: 'nhan',
    itemType: 'ring',
    price: 480000,
    stock: 7,
    image: '/products/SP-nhan-bac-dinh-da-pnjsilver-xm00k000088-1.png',
    imageAlt: 'Nhẫn bạc thân trơn đính chìm một viên đá nhỏ',
    shortDescription: 'Nhẫn bạc thân trơn với một viên đá nhỏ đính chìm trên đai nhẫn.',
    description:
      'Nhẫn bạc với đai thân trơn nhẵn, điểm xuyết một viên đá nhỏ được gắn chìm khéo léo trên bề mặt đai nhẫn.',
    featured: true,
  },
  {
    id: 'prod-02',
    slug: 'nhan-bac-dinh-da-luon-song-sn0144',
    sku: 'NFA-RNG-SN0144',
    name: 'Nhẫn bạc đính đá viền NFA',
    category: 'nhan',
    itemType: 'ring',
    price: 520000,
    stock: 5,
    image: '/products/sp-snxmxmk000144-nhan-bac-dinh-da-pnjsilver-1.png',
    imageAlt: 'Nhẫn bạc có một viên đá chủ nổi bật và các viên đá nhỏ đính dọc thân nhẫn',
    shortDescription: 'Nhẫn bạc đính một viên đá chủ nhô cao kết hợp dải đá nhỏ dọc thân nhẫn.',
    description:
      'Nhẫn bạc với một viên đá chủ nổi bật ở giữa và hai bên thân nhẫn được đính các viên đá nhỏ dọc theo đai nhẫn.',
    featured: false,
  },
  {
    id: 'prod-03',
    slug: 'day-chuyen-bac-dan-chu-cong-sd0028',
    sku: 'NFA-CHN-SD0028',
    name: 'Dây chuyền bạc đan chữ công NFA',
    category: 'day-chuyen',
    itemType: 'chain',
    price: 790000,
    stock: 4,
    image: '/products/sp-sd0000k000028-day-chuyen-nam-bac-pnjsilver-day-dan-kieu-chu-cong-1.png',
    imageAlt: 'Sợi dây chuyền bạc đan mắt xích kiểu chữ công',
    shortDescription: 'Sợi dây chuyền bạc mắt xích đan kiểu chữ công, không kèm mặt dây chuyền.',
    description:
      'Sợi dây chuyền bạc dạng đan mắt xích kiểu chữ công trơn, bản dẹp vừa phải với móc khóa tròn. Đây là sợi dây chuyền đơn lẻ, không có mặt dây kèm theo.',
    featured: true,
  },
  {
    id: 'prod-04',
    slug: 'mat-day-chuyen-bac-trai-tim-sm0122',
    sku: 'NFA-PD-SM0122',
    name: 'Mặt dây chuyền bạc đính đá trái tim NFA',
    category: 'day-chuyen',
    itemType: 'pendant',
    price: 390000,
    stock: 9,
    image: '/products/sp-smxmxmk000122-mat-day-chuyen-bac-dinh-da-pnjsilver-hinh-trai-tim-1.png',
    imageAlt: 'Mặt dây chuyền bạc hình trái tim đính đá',
    shortDescription: 'Mặt dây chuyền hình trái tim đính đá viền, không bao gồm sợi dây.',
    description:
      'Mặt dây chuyền bạc tạo hình trái tim với viền đính các hạt đá nhỏ và khoen xỏ phía trên. Đây là mặt dây chuyền độc lập, không kèm sợi dây chuyền.',
    featured: false,
  },
  {
    id: 'prod-05',
    slug: 'lac-tay-bac-dinh-da-thanh-manh-sl0015',
    sku: 'NFA-BR-SL0015',
    name: 'Lắc tay bạc đính đá thanh mảnh NFA',
    category: 'lac-tay',
    itemType: 'bracelet',
    price: 650000,
    stock: 6,
    image: '/products/sp-slxmxmk000015-lac-tay-bac-dinh-da-pnjsilver-1.png',
    imageAlt: 'Lắc tay bạc dạng chuỗi xích mảnh điểm đá tròn',
    shortDescription: 'Lắc tay bạc chuỗi xích mảnh xen kẽ các điểm đá tròn nhỏ.',
    description:
      'Lắc tay bạc dạng chuỗi xích thanh mảnh với các điểm gắn đá tròn nhỏ phân bố dọc theo dây lắc, có đoạn xích phụ điều chỉnh độ dài.',
    featured: true,
  },
  {
    id: 'prod-06',
    slug: 'lac-tay-bac-mat-xich-tron-sl12836',
    sku: 'NFA-BR-SL12836',
    name: 'Lắc tay bạc mắt xích trơn NFA',
    category: 'lac-tay',
    itemType: 'bracelet',
    price: 580000,
    stock: 8,
    image: '/products/slh2ky12836.000-lac-tay-bac-pnjsilver-01.png',
    imageAlt: 'Lắc tay bạc dạng chuỗi mắt xích oval trơn',
    shortDescription: 'Lắc tay bạc dạng các mắt xích oval trơn nối tiếp nhau.',
    description:
      'Lắc tay bạc với các vòng mắt xích oval trơn nối liền nhau tạo thành chuỗi, có móc khóa tròn ở đầu lắc.',
    featured: false,
  },
  {
    id: 'prod-07',
    slug: 'bong-tai-bac-dinh-da-trai-tim-sb0114',
    sku: 'NFA-ER-SB0114',
    name: 'Bông tai bạc đính đá trái tim NFA',
    category: 'bong-tai',
    itemType: 'earring',
    price: 420000,
    stock: 6,
    image: '/products/sp-sbxmxmk000114-bong-tai-bac-dinh-da-pnjsilver-hinh-trai-tim-1.png',
    imageAlt: 'Đôi bông tai bạc hình trái tim đính đá',
    shortDescription: 'Đôi bông tai nụ bạc hình trái tim đính đá nhỏ.',
    description:
      'Đôi bông tai bạc dạng nụ với mặt trước hình trái tim đính đá nhỏ, mặt sau có chốt gài giữ khuyên tai.',
    featured: true,
  },
  {
    id: 'prod-08',
    slug: 'bong-tai-bac-dinh-da-nu-tron-sb0121',
    sku: 'NFA-ER-SB0121',
    name: 'Bông tai nụ bạc đính đá NFA',
    category: 'bong-tai',
    itemType: 'earring',
    price: 350000,
    stock: 10,
    image: '/products/sp-sbxm00k000121-bong-tai-bac-dinh-da-pnjsilver-1.png',
    imageAlt: 'Đôi bông tai nụ bạc đính một viên đá trung tâm',
    shortDescription: 'Đôi bông tai nụ bạc đính một viên đá ở vị trí trung tâm.',
    description:
      'Đôi bông tai bạc dạng nụ với một viên đá đơn đính ở vị trí trung tâm, kèm chốt gài phía sau.',
    featured: false,
  },
];

async function main() {
  const assert = (await import('node:assert/strict')).default;
  const crypto = await import('node:crypto');
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

    const sandbox = {
      exports: mod.exports,
      module: mod,
      require: (specifier) => {
        if (specifier.startsWith('.')) {
          return loadTsModule(path.resolve(path.dirname(resolved), specifier));
        }
        throw new Error(`Unsupported external import in catalog check: ${specifier}`);
      },
    };

    vm.runInNewContext(transpiled.outputText, sandbox, { filename: resolved });
    moduleCache.set(resolved, mod.exports);
    return mod.exports;
  }

  function sha256(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  }

  const productTypes = loadTsModule(path.join(rootDir, 'src', 'types', 'product.ts'));
  const productData = loadTsModule(path.join(rootDir, 'src', 'data', 'products.ts'));

  const { CATEGORIES, MATERIALS, getItemTypeLabel, getSeparationNotice } = productTypes;
  const { PRODUCTS, getFeaturedProducts } = productData;

  // 1. Exact total count & category/material definitions
  assert.equal(PRODUCTS.length, 51, 'Catalog must contain exactly 51 products');
  assert.equal(CATEGORIES.length, 5, 'CATEGORIES must contain 5 groups including lac-chan');
  assert.equal(MATERIALS.length, 3, 'MATERIALS must contain silver, gold, and platinum');

  const nhanCategory = CATEGORIES.find((c) => c.id === 'nhan');
  assert.ok(nhanCategory, 'Missing nhan category');
  assert.equal(nhanCategory.name, 'Nhẫn', 'Category nhan label must be neutral "Nhẫn"');
  assert.ok(
    CATEGORIES.some((c) => c.id === 'lac-chan'),
    'Missing lac-chan category'
  );

  // 2. Generic item-type labels and standalone chain/pendant separation notices
  assert.equal(getItemTypeLabel('ring'), 'Nhẫn');
  assert.equal(getItemTypeLabel('bracelet'), 'Lắc & Vòng tay');
  assert.equal(getItemTypeLabel('earring'), 'Bông tai');
  assert.ok(getSeparationNotice('chain'), 'Standalone chain must retain no-pendant notice');
  assert.ok(getSeparationNotice('pendant'), 'Standalone pendant must retain no-chain notice');
  assert.equal(
    getSeparationNotice('necklace'),
    null,
    'Complete necklace (day-co) must NOT display no-pendant or no-chain notice'
  );

  // 3. Unique IDs, slugs, SKUs, images & valid VND/stock/fields
  const ids = new Set();
  const slugs = new Set();
  const skus = new Set();
  const images = new Set();
  const categoryCounts = {};
  const materialCounts = {};
  const dayChuyenItemTypes = {};

  for (const p of PRODUCTS) {
    assert.ok(p.id && !ids.has(p.id), `Duplicate or missing id: ${p.id}`);
    assert.ok(p.slug && !slugs.has(p.slug), `Duplicate or missing slug: ${p.slug}`);
    assert.ok(p.sku && !skus.has(p.sku), `Duplicate or missing sku: ${p.sku}`);
    assert.ok(p.image && !images.has(p.image), `Duplicate or missing image: ${p.image}`);

    ids.add(p.id);
    slugs.add(p.slug);
    skus.add(p.sku);
    images.add(p.image);

    assert.ok(Number.isSafeInteger(p.price) && p.price > 0, `Invalid VND price on ${p.id}`);
    assert.ok(Number.isSafeInteger(p.stock) && p.stock >= 0, `Invalid stock on ${p.id}`);
    assert.ok(p.name.trim().length > 0, `Empty name on ${p.id}`);
    assert.ok(p.imageAlt.trim().length > 0, `Empty imageAlt on ${p.id}`);
    assert.ok(p.shortDescription.trim().length > 0, `Empty shortDescription on ${p.id}`);
    assert.ok(p.description.trim().length > 0, `Empty description on ${p.id}`);

    categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
    materialCounts[p.material] = (materialCounts[p.material] ?? 0) + 1;
    if (p.category === 'day-chuyen') {
      dayChuyenItemTypes[p.itemType] = (dayChuyenItemTypes[p.itemType] ?? 0) + 1;
    }
  }

  // 4. Expected category, subtype, material, and featured counts
  assert.deepEqual(categoryCounts, {
    nhan: 11,
    'day-chuyen': 15,
    'lac-tay': 13,
    'bong-tai': 11,
    'lac-chan': 1,
  });

  assert.deepEqual(dayChuyenItemTypes, {
    chain: 3,
    necklace: 2,
    pendant: 10,
  });

  assert.deepEqual(materialCounts, {
    silver: 20,
    gold: 30,
    platinum: 1,
  });

  assert.equal(getFeaturedProducts().length, 4, 'Homepage featured items must stay at 4');

  // 5. Key product classification invariants
  const nonWhiteGoldRing = PRODUCTS.find(
    (p) => p.image === '/products/sp-gnddddc001526-nhan-kim-cuong-vang-585-14k-pnj-1.png'
  );
  assert.ok(nonWhiteGoldRing, 'Missing sp-gnddddc001526 ring');
  assert.equal(nonWhiteGoldRing.material, 'gold');
  const combinedRingText = `${nonWhiteGoldRing.name} ${nonWhiteGoldRing.shortDescription} ${nonWhiteGoldRing.description}`.toLowerCase();
  assert.ok(
    !combinedRingText.includes('vàng trắng'),
    'sp-gnddddc001526 must not be mislabeled as white gold'
  );

  const wristBracelet = PRODUCTS.find(
    (p) => p.image === '/products/sp-slxmxmk000022-lac-bac-dinh-da-pnjsilver-1.png'
  );
  assert.ok(wristBracelet, 'Missing sp-slxmxmk000022 bracelet');
  assert.equal(wristBracelet.category, 'lac-tay');
  assert.equal(wristBracelet.itemType, 'bracelet');

  const anklet = PRODUCTS.find(
    (p) => p.image === '/products/slxm00k000028-lac-chan-bac-pnjsilver.png'
  );
  assert.ok(anklet, 'Missing slxm00k000028 anklet');
  assert.equal(anklet.category, 'lac-chan');
  assert.equal(anklet.itemType, 'anklet');

  // 6. Exact case-sensitive file existence & SHA-256 parity between public/products and asset
  const assetDir = path.join(rootDir, 'asset');
  const publicDir = path.join(rootDir, 'public', 'products');
  const assetEntries = new Set(fs.readdirSync(assetDir));
  const publicEntries = new Set(fs.readdirSync(publicDir));

  // asset/ also contains site backgrounds; verify every product source below.
  assert.equal(publicEntries.size, 51, 'public/products/ must contain 51 served images');

  for (const p of PRODUCTS) {
    assert.ok(p.image.startsWith('/products/'), `Unexpected image prefix on ${p.id}: ${p.image}`);
    const fileName = p.image.slice('/products/'.length);
    assert.ok(
      publicEntries.has(fileName),
      `Case-sensitive public/products image missing for ${p.id}: ${fileName}`
    );
    assert.ok(
      assetEntries.has(fileName),
      `Case-sensitive asset image missing for ${p.id}: ${fileName}`
    );
    assert.equal(
      sha256(path.join(publicDir, fileName)),
      sha256(path.join(assetDir, fileName)),
      `SHA-256 mismatch between public/products and asset for ${fileName}`
    );
  }

  // 7. Original 8 records preserved against snapshot (plus material === 'silver')
  const preservedFields = [
    'id',
    'slug',
    'sku',
    'name',
    'category',
    'itemType',
    'price',
    'stock',
    'image',
    'imageAlt',
    'shortDescription',
    'description',
    'featured',
  ];

  for (const expected of ORIGINAL_EIGHT_SNAPSHOT) {
    const actual = PRODUCTS.find((p) => p.id === expected.id);
    assert.ok(actual, `Missing original product ${expected.id}`);
    assert.equal(actual.material, 'silver', `Original product ${expected.id} must be silver`);
    for (const key of preservedFields) {
      assert.equal(
        actual[key],
        expected[key],
        `Original product ${expected.id} field "${key}" changed from snapshot`
      );
    }
  }

  console.log(
    'OK: 51 products verified (categories: nhan=11, day-chuyen=15 [3 chain, 2 necklace, 10 pendant], lac-tay=13, bong-tai=11, lac-chan=1; materials: silver=20, gold=30, platinum=1; 51 exact-case SHA-matched images; original 8 preserved).'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
