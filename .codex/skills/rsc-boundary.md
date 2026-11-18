# React Server Component Boundaries

- Keep App Router pages and layouts as Server Components by default. Read the catalog and render product and About content on the server during the build where applicable.
- Place `'use client'` at the smallest interactive leaf boundary that needs state, events, or browser APIs. For NFA, this covers interactive cart controls, cart persistence, and checkout navigation. Keep `layout.tsx` and `page.tsx` as Server Components.
- Compose server-rendered content inside interactive wrappers by passing a Server Component through the Client Component's `children` prop from a Server Component parent.
- Cover each async data path with a route-level `loading.tsx` or a local `<Suspense>` fallback. Match skeleton dimensions and spacing to the loaded content to limit layout shifts.
- Pass React-serializable values across Server-to-Client boundaries. Keep browser APIs such as `localStorage` out of the initial render and read them after mounting or in browser event handlers.
- For a static export, generate known product routes at build time with `generateStaticParams` when using a dynamic product slug. Keep checkout compatible with static hosting by constructing the public Google Form link from the current cart in the browser.
