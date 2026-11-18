# UI Aesthetics for NFA

- Use the agreed visual direction of an off-white background, charcoal text, and silver-gray accents. Give silver jewelry photographs a consistent crop and enough space for the product to read clearly.
- Establish a clear hierarchy with `--font-display` for headings and `--font-sans` for body copy and controls. Use `font-variant-numeric: tabular-nums` for aligned prices, quantities, and totals.
- Keep spacing on the 4pt or 8pt grid using semantic spacing tokens. Prefer CSS Grid for page layouts and Flexbox with `gap` for small groups of controls.
- Write micro-interactions in `*.module.css` using `transition`, `:hover`, and `:active`. Preserve visible keyboard focus and respect `prefers-reduced-motion`.
- On product cards, make the name, VND price, and available quantity easy to scan. Keep secondary details visually quieter and give the primary action clear contrast.
- Design for narrow mobile screens first. Keep cart quantity controls easy to tap and check that longer Vietnamese labels wrap without hiding actions or prices.
- Use Vietnamese interface text, preserve diacritics, and show feedback from actual contributors. Use meaningful alternative text for product photographs.
