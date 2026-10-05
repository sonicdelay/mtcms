# Component props contract (MANDATORY)

Scope: `vp1/src/components/Sd*.tsx` — every component registered in
`vp1/src/components/index.ts`. The reference implementation is
`SdDummy.tsx`.

This rule is enforced mechanically. Run `npm run check:components` from `vp1/`
before you claim a component task is done; it exits non-zero on any violation.

## 1. Every component MUST declare its props by extending `ComponentProps`

Import the base from `vp1/src/models/component-props.ts`. Do NOT declare a
standalone props object from scratch, and do NOT reintroduce a `data` prop — the
base's data prop is named `value`.

```tsx
import type { ComponentProps } from "../models/component-props";

interface SdThingProps extends ComponentProps<ThingValue, ThingConfig> {
  // Component-specific props go here, each optional.
  title?: string;
  // MANDATORY wildcard: lets unknown props reach the root element.
  [key: string]: unknown;
}
```

Narrow the generics to describe what the component accepts. `ComponentProps` is
generic over four parameters, in this order:

| Parameter     | Default       | Purpose                                              |
| ------------- | ------------- | ---------------------------------------------------- |
| `TValue`      | `unknown`     | type of `value`                                       |
| `TConfig`     | `unknown`     | type of `config`                                      |
| `TEvent`      | `ComponentEvent` | type of `onEvent` / `eventIn`                      |
| `TChildren`   | `ReactNode`   | type of `children` — widen only for a render prop     |

## 2. The wildcard MUST be `[key: string]: unknown`, never `any`

`[key: string]: unknown` is what makes `{...rest}` forwardable to a DOM element
without disabling type checking across the whole props object. Under `unknown`,
reading an arbitrary key still yields `unknown`, so any prop you actually *use*
must be declared explicitly (e.g. `className?: string`).

```tsx
// correct
interface SdThingProps extends ComponentProps {
  className?: string;
  [key: string]: unknown;
}

// FORBIDDEN — silently disables checking on every prop
interface SdThingProps {
  [key: string]: any;
}
```

## 3. The four mandatory props, and what they mean

All four come from the base. A component MUST NOT redeclare them with an
incompatible type.

| Prop       | Direction        | Meaning                                                        |
| ---------- | ---------------- | -------------------------------------------------------------- |
| `value`    | inbound          | the data the component renders. Never call it `data`.            |
| `config`   | inbound          | configuration object; merge over your defaults with a spread.    |
| `onEvent`  | **outbound**     | the component **sends** events with `onEvent({ type, payload })`. |
| `eventIn`  | **inbound**      | a `ComponentEvent` the component **receives** and reacts to.     |
| `children` | inbound          | nested content.                                                 |

## 4. Events travel over `eventIn` / `onEvent`

There is no `emit()`. Send with `onEvent`, receive with `eventIn`.

**Sending** — call `onEvent` whenever something happens:

```tsx
onEvent?.({ type: "click", payload: { value } });
```

**Receiving** — handle each distinct `eventIn` exactly once. Guard on identity
with a `useRef`, because React re-renders with the same object and an unguarded
effect fires on every render:

```tsx
const lastEvent = useRef<ComponentEvent | undefined>(undefined);
useEffect(() => {
  if (!eventIn || lastEvent.current === eventIn) return;
  lastEvent.current = eventIn;
  globalThis.sd?.dispatchAction?.({ ...eventIn });
  onEvent?.(eventIn);
}, [eventIn, onEvent]);
```

**Composing** — a component MUST let an existing DOM handler run before it
sends its own event, so the editor can still select and stop propagation:

```tsx
const handleClick = (event: MouseEvent<HTMLDivElement>) => {
  if (typeof rest.onClick === "function") rest.onClick(event);
  onEvent?.({ type: "click", payload: { value } });
};
```

`SdDummyContainerComponent.tsx` shows how to capture nested child events by
re-cloning children that already declare an `onEvent`.

## 5. Forward unknown props to the root element

Destructure the props you consume, spread the remainder, and compose
`className` rather than overwriting it:

```tsx
const { value, config, eventIn, onEvent, children, ...rest } = props;

return (
  <div
    {...rest}
    className={["Thing", rest.className].filter(Boolean).join(" ")}
    onClick={handleClick}
  >
    {children}
  </div>
);
```

## 6. Register new components

Add the component to the `components` record in
`vp1/src/components/index.ts`, and give it a palette entry with `defaultProps`
in `vp1/src/editor/registry.ts` so it can be dropped in the editor.

## Not in scope

Editor chrome is exempt: `SdSplitHandle.tsx`, `components/editor/*`. Those are
internal to the editor shell, are not registered in `components/index.ts`, and
are not droppable content components.