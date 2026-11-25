'use strict';

async function main() {
  const assert = (await import('node:assert/strict')).default;
  const fs = await import('node:fs');
  const path = await import('node:path');
  const vm = await import('node:vm');
  const ts = (await import('typescript')).default;

  const rootDir = path.resolve(__dirname, '..');
  const targetFile = path.join(rootDir, 'src', 'components', 'Header', 'homeNavigation.ts');
  const source = fs.readFileSync(targetFile, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: targetFile,
  });

  const mod = { exports: {} };
  const wrapper = vm.runInThisContext(
    `(function (exports, module) {\n${transpiled.outputText}\n})`,
    { filename: targetFile }
  );
  wrapper(mod.exports, mod);

  const nav = mod.exports;

  // 1. Canonical home section links contract
  assert.deepEqual(
    nav.HOME_SECTION_LINKS.map((item) => ({
      id: item.id,
      href: item.href,
      label: item.label,
    })),
    [
      {
        id: 'featured-heading',
        href: '/#featured-heading',
        label: 'Mẫu nổi bật',
      },
      {
        id: 'categories-heading',
        href: '/#categories-heading',
        label: 'Danh mục',
      },
      {
        id: 'feedback-heading',
        href: '/#feedback-heading',
        label: 'Đánh giá khách hàng',
      },
    ]
  );

  // 2. Hash section extraction for same-path scrolling
  assert.equal(nav.extractHomeSectionId('/#featured-heading'), 'featured-heading');
  assert.equal(nav.extractHomeSectionId('/#categories-heading'), 'categories-heading');
  assert.equal(nav.extractHomeSectionId('/#feedback-heading'), 'feedback-heading');
  assert.equal(nav.extractHomeSectionId('#featured-heading'), 'featured-heading');
  assert.equal(nav.extractHomeSectionId('/san-pham#featured-heading'), null);
  assert.equal(nav.extractHomeSectionId('/#unknown-heading'), null);
  assert.equal(nav.extractHomeSectionId('/'), null);

  // 3. Active menu resolution against pathname changes
  const homePinnedOnRoot = { menuId: 'home', path: '/', pinned: true };
  assert.equal(nav.resolveActiveMegaMenu(homePinnedOnRoot, '/'), 'home');
  assert.equal(nav.resolveActiveMegaMenu(homePinnedOnRoot, '/san-pham'), null);
  assert.equal(nav.resolveActiveMegaMenu(null, '/'), null);

  // 4. Pointer hover switching & hover-to-click pinning without stuck pinned state
  const hoveredHome = nav.resolvePointerEnterMegaMenu({
    openMenu: null,
    pathname: '/',
    menuId: 'home',
    canHover: true,
  });
  assert.deepEqual(hoveredHome, { menuId: 'home', path: '/', pinned: false });

  // Touch / non-hover pointer enter does not open menu
  assert.equal(
    nav.resolvePointerEnterMegaMenu({
      openMenu: null,
      pathname: '/',
      menuId: 'home',
      canHover: false,
    }),
    null
  );

  // Clicking hover-opened trigger pins it instead of closing it
  const pinnedHome = nav.resolveClickMegaMenu({
    openMenu: hoveredHome,
    pathname: '/',
    menuId: 'home',
  });
  assert.deepEqual(pinnedHome, { menuId: 'home', path: '/', pinned: true });

  // Re-entering already-pinned active trigger preserves its pinned state
  assert.deepEqual(
    nav.resolvePointerEnterMegaMenu({
      openMenu: pinnedHome,
      pathname: '/',
      menuId: 'home',
      canHover: true,
    }),
    pinnedHome
  );

  // Hovering the other trigger replaces the active panel and clears pinned state
  const switchedToCollectionByHover = nav.resolvePointerEnterMegaMenu({
    openMenu: pinnedHome,
    pathname: '/',
    menuId: 'collection',
    canHover: true,
  });
  assert.deepEqual(switchedToCollectionByHover, {
    menuId: 'collection',
    path: '/',
    pinned: false,
  });

  // Clicking the other trigger switches and pins immediately
  const switchedToHomeByClick = nav.resolveClickMegaMenu({
    openMenu: switchedToCollectionByHover,
    pathname: '/',
    menuId: 'home',
  });
  assert.deepEqual(switchedToHomeByClick, {
    menuId: 'home',
    path: '/',
    pinned: true,
  });

  // Clicking an already-pinned active trigger closes it
  assert.equal(
    nav.resolveClickMegaMenu({
      openMenu: switchedToHomeByClick,
      pathname: '/',
      menuId: 'home',
    }),
    null
  );

  // 5. Delayed close timer safety (no stale timer closes a newly switched or pinned menu)
  assert.deepEqual(
    nav.resolveScheduledCloseMegaMenu({
      openMenu: switchedToCollectionByHover,
      pathname: '/',
      scheduledForMenuId: 'home',
    }),
    switchedToCollectionByHover,
    'Stale timer from home trigger must not close newly hovered collection menu'
  );

  assert.deepEqual(
    nav.resolveScheduledCloseMegaMenu({
      openMenu: pinnedHome,
      pathname: '/',
      scheduledForMenuId: 'home',
    }),
    pinnedHome,
    'Delayed close timer must not close a pinned menu'
  );

  assert.equal(
    nav.resolveScheduledCloseMegaMenu({
      openMenu: switchedToCollectionByHover,
      pathname: '/',
      scheduledForMenuId: 'collection',
    }),
    null,
    'Matching unpinned menu closes when its scheduled close timer fires'
  );

  console.log('OK: homeNavigation links, hash extraction, and dual mega-menu state transitions verified.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
