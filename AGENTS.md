# NFA Frontend Engineering Guidelines

## Stack and styling

- Use Next.js App Router, React, and TypeScript with `strict: true`.
- Style pages and components with CSS Modules (`*.module.css`) only. Use `src/styles/tokens.css` for shared CSS custom properties and reference them with `var(...)` in modules. Load the tokens once in the root layout.
- Do not use Tailwind CSS, styled-components, or JSX `style={{}}` attributes.

## UI libraries

Reuse the installed libraries when their roles apply.

- `lucide-react` for icons.
- `clsx` for conditional CSS Module classes.
- `@radix-ui/colors` for light and dark color scales.
- `open-props` for spacing, radii, shadows, and motion primitives.

## Routing rules

Before creating or editing UI, read the guides for every matching task.

| Task | Read |
| --- | --- |
| Create, edit, or style a UI component | `.codex/skills/css-modules.md` and `.codex/skills/ui-aesthetics.md` |
| Structure pages, set client boundaries, or fetch data | `.codex/skills/rsc-boundary.md` |
| Define or change a component API or props | `.codex/skills/ts-contracts.md` |

## Verification

Before finishing a UI task, run `npm run typecheck` (or `npx tsc --noEmit`) and `npm run lint`. Resolve TypeScript and lint errors before finishing.
