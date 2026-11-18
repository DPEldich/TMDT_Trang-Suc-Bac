# CSS Modules

- Colocate `*.module.css` files with their components, for example `Button/Button.tsx`, `Button/Button.module.css`, and `Button/index.ts` when a public entry point is needed.
- Name classes in camelCase and access them through the imported `styles` object.
- Reference semantic variables from `src/styles/tokens.css` for colors, typography, spacing, radii, and shared layout values. Add new shared values to the tokens file when needed.
- Use project tokens and Open Props variables for design values. Do not hardcode hex colors or pixel values, or use inline JSX `style={{}}`.
- Use `clsx` to join conditional module classes. Use `data-variant` and `data-state` for named variants and states, with CSS pseudo-classes for browser interaction states. Keep responsive rules with the styles they affect.
- Give interactive elements a visible `:focus-visible` state and use layout techniques that accommodate long Vietnamese labels and product names.
