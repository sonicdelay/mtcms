# Guidelines

## Framework

- Deno formatting and linting are used.
- Client holds the React 19 frontend.
- Server holds the Express backend.

## Common

- One concern per file.
- Type definitions, interfaces, enums, and TypeScript declarations live in
  `client/src/models/*`.

## SD components

- Name them with the `Sd` prefix.
- Do not include comments.
- Store them in `client/src/components/Sd*.tsx`.
- Use only the optional props `value`, `config`, `onChange`, `eventIn`,
  `children`, and `className`.
- Use `SdComponentProps` as defined in
  `client/src/models/sd-component-props.ts`.
- Incoming and outgoing events follow the `{ type, payload }` shape.
- Incoming events use the `eventIn` prop; outgoing events use `onChange`.
- `config` holds the component's setup.
- Do not use Tailwind CSS classes inside the component; accept `className`
  instead.
- Component CSS lives in `client/src/stylesheets/components.scss`.

## Actions

`{ type: string, ...rest }`
