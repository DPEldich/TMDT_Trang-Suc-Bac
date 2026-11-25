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
      throw new Error(`Unsupported external import in header check: ${specifier}`);
    });
    moduleCache.set(resolved, mod.exports);
    return mod.exports;
  }

  const geo = loadTsModule(
    path.join(rootDir, 'src', 'components', 'Header', 'headerSurfaceGeometry.ts')
  );

  // 1. Route matching contract
  assert.equal(geo.isHomePathname('/'), true);
  assert.equal(geo.isHomePathname('/san-pham'), false);
  assert.equal(geo.isHomePathname('/san-pham/nhan-bac-dinh-da-luon-song-sn0144'), false);
  assert.equal(geo.isHomePathname('/ve-chung-toi'), false);
  assert.equal(geo.isHomePathname('/gio-hang'), false);
  assert.equal(geo.isHomePathname(''), false);
  assert.equal(geo.isHomePathname(null), false);
  assert.equal(geo.isHomePathname(undefined), false);

  // 2. Measured header lower-edge inset & IntersectionObserver rootMargin
  assert.equal(geo.resolveHeaderInsetTop(56), 56);
  assert.equal(geo.resolveHeaderInsetTop(56.4), 56);
  assert.equal(geo.resolveHeaderInsetTop(56.6), 57);
  assert.equal(geo.resolveHeaderInsetTop(0), 1);
  assert.equal(geo.resolveHeaderInsetTop(-20), 1);
  assert.equal(geo.resolveHeaderInsetTop(Number.NaN), 1);

  assert.equal(geo.buildHeaderIntersectionRootMargin(57), '-57px 0px 0px 0px');
  assert.equal(geo.buildHeaderIntersectionRootMargin(56.4), '-56px 0px 0px 0px');

  // 3. Exact hero-bottom vs header-bottom surface decision
  assert.equal(geo.shouldHeaderSurface(840, 57), false, 'Hero well below header stays transparent');
  assert.equal(geo.shouldHeaderSurface(58, 57), false, 'Hero 1px below header stays transparent');
  assert.equal(geo.shouldHeaderSurface(57, 57), true, 'Hero reaching header bottom surfaces header');
  assert.equal(geo.shouldHeaderSurface(56, 57), true, 'Hero past header bottom surfaces header');
  assert.equal(geo.shouldHeaderSurface(-420, 57), true, 'Deep scroll past hero surfaces header');
  assert.equal(geo.shouldHeaderSurface(Number.NaN, 57), true, 'Non-finite fallback safely surfaces');

  // 4. Route + scroll mode matrix
  assert.equal(geo.resolveHeaderSurfaceMode({ isHome: true, isPastHero: false }), 'transparent');
  assert.equal(geo.resolveHeaderSurfaceMode({ isHome: true, isPastHero: true }), 'solid');
  assert.equal(geo.resolveHeaderSurfaceMode({ isHome: false, isPastHero: false }), 'solid');
  assert.equal(geo.resolveHeaderSurfaceMode({ isHome: false, isPastHero: true }), 'solid');

  // 5. RSC boundary & styling guardrails
  const layoutSrc = fs.readFileSync(path.join(rootDir, 'src', 'app', 'layout.tsx'), 'utf8');
  const pageSrc = fs.readFileSync(path.join(rootDir, 'src', 'app', 'page.tsx'), 'utf8');
  const headerSrc = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Header', 'Header.tsx'), 'utf8');
  const surfaceSrc = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Header', 'HeaderSurface.tsx'), 'utf8');
  const headerCss = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Header', 'Header.module.css'), 'utf8');

  for (const [label, src] of [
    ['layout.tsx', layoutSrc],
    ['page.tsx', pageSrc],
    ['Header.tsx', headerSrc],
  ]) {
    assert.equal(
      /['"]use client['"]/.test(src),
      false,
      `${label} must remain a Server Component`
    );
  }

  assert.ok(/['"]use client['"]/.test(surfaceSrc), 'HeaderSurface.tsx must be a Client Component');
  assert.ok(surfaceSrc.includes('IntersectionObserver'), 'HeaderSurface must use IntersectionObserver');
  assert.ok(surfaceSrc.includes('ResizeObserver'), 'HeaderSurface must use ResizeObserver');
  assert.equal(
    /addEventListener\(\s*['"]scroll['"]/.test(surfaceSrc),
    false,
    'HeaderSurface must not bind per-frame scroll listeners'
  );

  for (const [label, src] of [
    ['Header.tsx', headerSrc],
    ['HeaderSurface.tsx', surfaceSrc],
  ]) {
    assert.equal(/\bstyle\s*=\s*\{/.test(src), false, `Forbidden JSX style={{}} in ${label}`);
  }

  assert.ok(headerCss.includes('position: sticky;'), 'Non-home header keeps sticky positioning');
  assert.ok(
    /\.header\[data-overlay='true'\][^{]*\{[^}]*position:\s*fixed;/s.test(headerCss),
    'Home overlay header uses fixed positioning'
  );
  assert.ok(
    /\.header\[data-overlay='true'\]\[data-surface='transparent'\][^{]*\{[^}]*background-color:\s*transparent;[^}]*border-bottom-color:\s*transparent;[^}]*backdrop-filter:\s*none;/s.test(
      headerCss
    ),
    'Transparent home header clears background, border, and backdrop-filter'
  );
  assert.ok(
    headerCss.includes('var(--transition-header-surface)'),
    'Header surface transition must consume --transition-header-surface token'
  );
  assert.ok(
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[^{]*\{[^}]*transition:\s*none;/s.test(
      headerCss
    ),
    'Header surface transition must disable under prefers-reduced-motion: reduce'
  );

  console.log(
    'OK: header surface geometry, route overlay matrix, observer contract, RSC boundaries, and CSS guardrails verified.'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
