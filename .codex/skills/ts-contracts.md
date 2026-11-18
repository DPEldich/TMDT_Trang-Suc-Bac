# TypeScript Component Contracts

- Define typed props with required fields for values a component needs. Make fields optional only when the component has clear behavior for their absence.
- Inherit native element props with `React.ComponentPropsWithoutRef<'tag'>`, substituting the actual HTML tag. Forward the native props the component supports.
- Avoid explicit `any` and unchecked type assertions. Narrow external values from `unknown`.
- Use the shared catalog and cart types across components. Represent prices as integer VND values and format them for display at the UI boundary.
- Use discriminated unions when variants change which props are required or allowed. Type callbacks with the values callers actually receive.
- Give icon-only buttons an `aria-label`. Set `aria-expanded` to reflect the state of controls that expand or collapse content. Provide a visible `:focus-visible` style for keyboard interaction.
- Treat stored cart data and other external inputs as untrusted values. Narrow or validate them before use and keep TypeScript strict mode enabled.
